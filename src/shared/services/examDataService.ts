/**
 * 검사 데이터 통합 서비스
 *
 * VITE_USE_API 환경변수에 따라 Mock 데이터 또는 실제 API를 사용합니다.
 * 기존 mockData.ts와 동일한 인터페이스를 유지하면서 API 연동을 지원합니다.
 */

import type { Class, Student, Assessment, SchoolLevel } from '@/shared/types';
import { MOCK_CLASSES, getClassById as mockGetClassById, getStudentById as mockGetStudentById } from '@/shared/data/mockData';
import { metaApi, isApiMode } from './metaApi';
import {
  transformToAssessments,
  transformToClass,
  resolveSchoolLevel,
} from './apiDataTransformer';

// ============================================================
// 통합 서비스 인터페이스
// ============================================================

export interface ExamDataService {
  /** API 모드 여부 */
  isApiMode: () => boolean;

  /** 전체 학급 목록 조회 */
  getClasses: () => Promise<Class[]>;

  /** 특정 학급 조회 */
  getClassById: (classId: string) => Promise<Class | undefined>;

  /** 특정 학생 조회 */
  getStudentById: (classId: string, studentId: string) => Promise<Student | undefined>;

  /** 학생 Assessment 조회 (API 모드에서 상세 데이터 로드) */
  getStudentAssessments: (
    studentId: string,
    dgnssId: number,
    schoolLevel: SchoolLevel
  ) => Promise<Assessment[]>;

  /** 학급 평균 T점수 조회 */
  getClassAverageTScores: (
    claId: string,
    ordNo: number
  ) => Promise<number[]>;
}

// ============================================================
// Mock 모드 구현
// ============================================================

const mockService: ExamDataService = {
  isApiMode: () => false,

  getClasses: async () => {
    return MOCK_CLASSES;
  },

  getClassById: async (classId: string) => {
    return mockGetClassById(classId);
  },

  getStudentById: async (classId: string, studentId: string) => {
    return mockGetStudentById(classId, studentId);
  },

  getStudentAssessments: async (studentId: string) => {
    // Mock에서는 이미 Student에 Assessment가 포함되어 있음
    for (const cls of MOCK_CLASSES) {
      const student = cls.students.find((s) => s.id === studentId);
      if (student) {
        return student.assessments;
      }
    }
    return [];
  },

  getClassAverageTScores: async (classId: string, _ordNo: number) => {
    const cls = mockGetClassById(classId);
    if (!cls) return [];

    // Mock: 학생들 T점수 평균 계산
    const studentsWithAssessments = cls.students.filter(
      (s) => s.assessments.length > 0
    );
    if (studentsWithAssessments.length === 0) return new Array(38).fill(50);

    const avgScores = new Array(38).fill(0);
    for (const student of studentsWithAssessments) {
      const assessment = student.assessments[0];
      for (let i = 0; i < 38; i++) {
        avgScores[i] += assessment.tScores[i] || 50;
      }
    }

    return avgScores.map((sum) =>
      Math.round((sum / studentsWithAssessments.length) * 10) / 10
    );
  },
};

// ============================================================
// API 모드 구현
// ============================================================

// 캐시 (세션 동안 유지)
const classCache = new Map<string, Class>();
const studentCache = new Map<string, Student>();

const apiService: ExamDataService = {
  isApiMode: () => true,

  getClasses: async () => {
    try {
      const examList = await metaApi.getExamList();

      const classes: Class[] = [];

      for (const exam of examList) {
        // 캐시 확인
        if (classCache.has(exam.claId)) {
          classes.push(classCache.get(exam.claId)!);
          continue;
        }

        // 검사 상세 + 학생 목록 조회
        const [examDetail, studentList] = await Promise.all([
          metaApi.getExamDetail(exam.dgnssId),
          metaApi.getStudentList(exam.dgnssId),
        ]);

        // 학교급/학년 판별 (임시: API에서 제공 안 하면 기본값)
        const grade = 6; // TODO: API에서 학년 정보 필요
        const schoolLevel = resolveSchoolLevel(grade);
        const classNumber = 1; // TODO: API에서 반 번호 필요

        // 학생 기본 정보만 변환 (Assessment는 개별 조회)
        const students: Student[] = studentList.map((item) => ({
          id: item.stdtId,
          classId: exam.claId,
          number: item.rowNum,
          name: `학생${item.rowNum}`,
          schoolLevel,
          grade,
          assessments: [], // 나중에 개별 로드
          round2Submitted: false,
        }));

        const cls = transformToClass(
          examDetail,
          students,
          schoolLevel,
          grade,
          classNumber
        );

        classCache.set(exam.claId, cls);
        classes.push(cls);
      }

      return classes;
    } catch (error) {
      console.error('API getClasses 실패, Mock 데이터 사용:', error);
      return MOCK_CLASSES;
    }
  },

  getClassById: async (classId: string) => {
    // 캐시 확인
    if (classCache.has(classId)) {
      return classCache.get(classId);
    }

    // 전체 목록에서 찾기
    const classes = await apiService.getClasses();
    return classes.find((c) => c.id === classId);
  },

  getStudentById: async (classId: string, studentId: string) => {
    // 캐시 확인
    const cacheKey = `${classId}:${studentId}`;
    if (studentCache.has(cacheKey)) {
      return studentCache.get(cacheKey);
    }

    const cls = await apiService.getClassById(classId);
    if (!cls) return undefined;

    const student = cls.students.find((s) => s.id === studentId);
    if (student) {
      studentCache.set(cacheKey, student);
    }

    return student;
  },

  getStudentAssessments: async (
    studentId: string,
    dgnssId: number,
    schoolLevel: SchoolLevel
  ) => {
    try {
      const analysisData = await metaApi.getStudentAnalysis(
        dgnssId,
        studentId,
        { ordNo: 1 } // 1차/2차 모두 포함된 응답
      );

      return transformToAssessments(analysisData, studentId, schoolLevel);
    } catch (error) {
      console.error('학생 Assessment 조회 실패:', error);
      return [];
    }
  },

  getClassAverageTScores: async (claId: string, ordNo: number) => {
    try {
      const items = await metaApi.getClassAnalysis(claId, { ordNo });

      // DEPTH=5 (38개 소분류)만 추출
      const scores = items
        .filter((item) => item.DEPTH === 5)
        .map((item) => item.tScore);

      return scores.length === 38 ? scores : new Array(38).fill(50);
    } catch (error) {
      console.error('학급 평균 T점수 조회 실패:', error);
      return new Array(38).fill(50);
    }
  },
};

// ============================================================
// 서비스 Export
// ============================================================

/**
 * 환경변수에 따라 적절한 서비스 반환
 */
export const examDataService: ExamDataService = isApiMode()
  ? apiService
  : mockService;

/**
 * 강제로 특정 모드 서비스 가져오기 (테스트용)
 */
export const getMockService = () => mockService;
export const getApiService = () => apiService;

/**
 * 캐시 초기화
 */
export const clearCache = () => {
  classCache.clear();
  studentCache.clear();
};

export default examDataService;
