/**
 * 검사 데이터 서비스
 *
 * 실제 API를 통해 검사 데이터를 조회합니다.
 */

import type { Class, Student, Assessment, SchoolLevel } from '@/shared/types';
import { metaApi } from './metaApi';
import {
  transformToAssessments,
  transformToClass,
  resolveSchoolLevel,
} from './apiDataTransformer';

// ============================================================
// 서비스 인터페이스
// ============================================================

export interface ExamDataService {
  /** 전체 학급 목록 조회 */
  getClasses: () => Promise<Class[]>;

  /** 특정 학급 조회 */
  getClassById: (classId: string) => Promise<Class | undefined>;

  /** 특정 학생 조회 */
  getStudentById: (classId: string, studentId: string) => Promise<Student | undefined>;

  /** 학생 Assessment 조회 */
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
// 캐시
// ============================================================

const classCache = new Map<string, Class>();
const studentCache = new Map<string, Student>();

// ============================================================
// API 서비스 구현
// ============================================================

export const examDataService: ExamDataService = {
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
      console.error('API getClasses 실패:', error);
      throw error;
    }
  },

  getClassById: async (classId: string) => {
    // 캐시 확인
    if (classCache.has(classId)) {
      return classCache.get(classId);
    }

    // 전체 목록에서 찾기
    const classes = await examDataService.getClasses();
    return classes.find((c) => c.id === classId);
  },

  getStudentById: async (classId: string, studentId: string) => {
    // 캐시 확인
    const cacheKey = `${classId}:${studentId}`;
    if (studentCache.has(cacheKey)) {
      return studentCache.get(cacheKey);
    }

    const cls = await examDataService.getClassById(classId);
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

/**
 * 캐시 초기화
 */
export const clearCache = () => {
  classCache.clear();
  studentCache.clear();
};

export default examDataService;
