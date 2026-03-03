/**
 * API 데이터 로드 훅
 *
 * API 모드일 때 백엔드에서 데이터를 가져오고,
 * Mock 모드일 때는 DataContext의 데이터를 사용합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { isApiMode, API_CONFIG } from '@/shared/services/apiClient';
import {
  fetchClassAnalysis,
  fetchClassAnalysisRaw,
  fetchTeacherExams,
  buildClassFromAPI,
  fetchL2DashboardData,
  type AnalysisSectionItem,
  type L2DashboardData,
} from '@/shared/services/dashboardService';
import type { SchoolLevel, Student, Class } from '@/shared/types';
import { useData } from '@/shared/contexts/DataContext';
import { useAuth } from '@/features/auth';

// ============================================================
// Credentials 헬퍼 훅
// ============================================================

/**
 * AuthContext에서 credentials를 가져와서 사용할 수 있는 형태로 반환
 */
function useCredentials() {
  const { credentials } = useAuth();

  const tcId = credentials?.teacherId ?? '';
  const claId = credentials?.classId ?? '';
  const gradeLevel = credentials?.gradeLevel ?? 'mi';
  const schoolLevel: SchoolLevel = gradeLevel === 'el' ? '초등' : '중등';

  return { tcId, claId, gradeLevel, schoolLevel, hasCredentials: !!credentials };
}

// ============================================================
// 학생 분석 데이터 훅
// ============================================================

interface UseStudentAnalysisResult {
  /** 현재 학생 데이터 */
  student: Student | undefined;
  /** 같은 학급의 모든 학생 목록 (네비게이션용) */
  classStudents: Student[];
  /** 학급 정보 */
  classInfo: { grade: number; classNumber: number; schoolLevel: SchoolLevel } | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 학생 분석 데이터 조회 (L3용)
 * API 모드: L2와 동일하게 /etc/meta/tc/info → L2 API 호출 → 특정 학생 필터링
 * Mock 모드: DataContext에서 데이터 사용
 */
export function useStudentAnalysis(
  classId: string | undefined,
  studentId: string | undefined
): UseStudentAnalysisResult {
  const { getStudentById, getClassById } = useData();
  const { tcId, claId, schoolLevel: credSchoolLevel, hasCredentials } = useCredentials();
  const [apiStudent, setApiStudent] = useState<Student | undefined>(undefined);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<{ grade: number; classNumber: number; schoolLevel: SchoolLevel } | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!studentId || !classId) return;

    // Mock 모드면 DataContext 사용
    if (!isApiMode()) {
      const classData = getClassById(classId);
      setClassStudents(classData?.students ?? []);
      setClassInfo(classData ? {
        grade: classData.grade,
        classNumber: classData.classNumber,
        schoolLevel: classData.schoolLevel,
      } : undefined);
      setApiStudent(undefined);
      return;
    }

    // API 모드인데 credentials가 없으면 fallback
    if (!hasCredentials) {
      const classData = getClassById(classId);
      setClassStudents(classData?.students ?? []);
      setClassInfo(classData ? {
        grade: classData.grade,
        classNumber: classData.classNumber,
        schoolLevel: classData.schoolLevel,
      } : undefined);
      setApiStudent(getStudentById(classId, studentId));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. 먼저 검사 목록에서 dgnssId 조회 (L2와 동일)
      const exams = await fetchTeacherExams(claId, tcId, '1');

      const completedRound1 = exams.find(
        exam => exam.dgnssAt === 'N' && exam.ordNo === 1
      );

      if (!completedRound1) {
        // 종료된 1차 검사가 없으면 DataContext fallback
        const classData = getClassById(classId);
        setClassStudents(classData?.students ?? []);
        setClassInfo(classData ? {
          grade: classData.grade,
          classNumber: classData.classNumber,
          schoolLevel: classData.schoolLevel,
        } : undefined);
        setApiStudent(getStudentById(classId, studentId));
        setIsLoading(false);
        return;
      }

      const dgnssId = completedRound1.dgnssId;

      // classId에서 grade, classNumber 추출
      const parts = classId.split('-');
      const grade = parseInt(parts[0], 10) || 1;
      const classNumber = parseInt(parts[1], 10) || 1;

      // 2. L2 대시보드 데이터 조회 (학급 전체 학생 포함)
      const data = await fetchL2DashboardData(dgnssId, classId, credSchoolLevel, grade);

      setClassStudents(data.students);
      setClassInfo({ grade, classNumber, schoolLevel: credSchoolLevel });

      // 3. studentId에 해당하는 학생 찾기
      const foundStudent = data.students.find(s => s.id === studentId);
      setApiStudent(foundStudent);

    } catch (err) {
      console.error('Failed to fetch student analysis:', err);
      setError(err instanceof Error ? err.message : 'API 호출 실패');
      // 에러 시 DataContext fallback
      const classData = getClassById(classId);
      setClassStudents(classData?.students ?? []);
      setClassInfo(classData ? {
        grade: classData.grade,
        classNumber: classData.classNumber,
        schoolLevel: classData.schoolLevel,
      } : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [classId, studentId, getClassById, getStudentById, tcId, claId, credSchoolLevel, hasCredentials]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // API 모드면 API 데이터 반환, 아니면 DataContext 데이터 반환
  const student = isApiMode()
    ? apiStudent
    : (classId && studentId ? getStudentById(classId, studentId) : undefined);

  // Mock 모드에서는 classStudents와 classInfo가 설정되어 있어야 함
  const effectiveClassStudents = isApiMode() ? classStudents : (getClassById(classId!)?.students ?? []);
  const effectiveClassInfo = isApiMode() ? classInfo : (() => {
    const classData = getClassById(classId!);
    return classData ? {
      grade: classData.grade,
      classNumber: classData.classNumber,
      schoolLevel: classData.schoolLevel,
    } : undefined;
  })();

  return {
    student,
    classStudents: effectiveClassStudents,
    classInfo: effectiveClassInfo,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// ============================================================
// 학급 분석 데이터 훅
// ============================================================

interface UseClassAnalysisResult {
  tScores: number[];
  sections: AnalysisSectionItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 학급 평균 T점수 조회
 * API 모드: /etc/meta/tc/analysis에서 데이터 로드
 * Mock 모드: 학급 학생들의 평균 계산
 */
export function useClassAnalysis(
  classId: string | undefined,
  round: 1 | 2 = 1
): UseClassAnalysisResult {
  const { getClassById } = useData();
  const [tScores, setTScores] = useState<number[]>(new Array(38).fill(50));
  const [sections, setSections] = useState<AnalysisSectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!classId) return;

    // Mock 모드: 학급 학생들의 평균 계산
    if (!isApiMode()) {
      const classData = getClassById(classId);
      if (!classData) {
        setTScores(new Array(38).fill(50));
        return;
      }

      const studentsWithRound = classData.students.filter(
        s => s.assessments.some(a => a.round === round)
      );

      if (studentsWithRound.length === 0) {
        setTScores(new Array(38).fill(50));
        return;
      }

      const sumScores = new Array(38).fill(0);
      for (const student of studentsWithRound) {
        const assessment = student.assessments.find(a => a.round === round);
        if (assessment) {
          for (let i = 0; i < 38; i++) {
            sumScores[i] += assessment.tScores[i];
          }
        }
      }

      setTScores(sumScores.map(sum => Math.round(sum / studentsWithRound.length)));
      return;
    }

    // API 모드
    setIsLoading(true);
    setError(null);

    try {
      const [scores, rawSections] = await Promise.all([
        fetchClassAnalysis(classId, '1', round),
        fetchClassAnalysisRaw(classId, '1', round),
      ]);

      setTScores(scores);
      setSections(rawSections);
    } catch (err) {
      console.error('Failed to fetch class analysis:', err);
      setError(err instanceof Error ? err.message : 'API 호출 실패');
    } finally {
      setIsLoading(false);
    }
  }, [classId, round, getClassById]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    tScores,
    sections,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// ============================================================
// 학급 학생 목록 훅 (L2용)
// ============================================================

interface UseClassStudentsResult {
  /** 학생 목록 (검사 결과 포함) */
  students: import('@/shared/types').Student[];
  /** L2 대시보드 전체 데이터 (API 모드에서만 사용) */
  l2Data: L2DashboardData | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 데이터 새로고침 */
  refetch: () => void;
}

/**
 * 학급 학생 목록 조회 (검사 결과 포함)
 * API 모드: /etc/meta/tc/info로 dgnssId 조회 → L2 API 호출
 * Mock 모드: DataContext의 학생 데이터 사용
 */
export function useClassStudents(
  classId: string | undefined
): UseClassStudentsResult {
  const { getClassById } = useData();
  const { tcId, claId, schoolLevel: credSchoolLevel, hasCredentials } = useCredentials();
  const [students, setStudents] = useState<import('@/shared/types').Student[]>([]);
  const [l2Data, setL2Data] = useState<L2DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!classId) {
      setStudents([]);
      setL2Data(null);
      return;
    }

    // Mock 모드: DataContext 사용
    if (!isApiMode()) {
      const classData = getClassById(classId);
      setStudents(classData?.students ?? []);
      setL2Data(null);
      return;
    }

    // API 모드인데 credentials가 없으면 fallback
    const classData = getClassById(classId);
    if (!hasCredentials) {
      setStudents(classData?.students ?? []);
      setL2Data(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. 먼저 검사 목록에서 dgnssId 조회
      const exams = await fetchTeacherExams(claId, tcId, '1');

      // 종료된 검사 중 1차 검사 찾기
      const completedRound1 = exams.find(
        exam => exam.dgnssAt === 'N' && exam.ordNo === 1
      );

      if (!completedRound1) {
        // 종료된 1차 검사가 없으면 DataContext fallback
        setStudents(classData?.students ?? []);
        setL2Data(null);
        setIsLoading(false);
        return;
      }

      const dgnssId = completedRound1.dgnssId;
      const grade = classData?.grade ?? 1;

      // 2. L2 대시보드 데이터 조회
      const data = await fetchL2DashboardData(
        dgnssId,
        classId,
        credSchoolLevel,
        grade
      );

      setL2Data(data);
      setStudents(data.students);
    } catch (err) {
      console.error('Failed to fetch L2 dashboard data:', err);
      setError(err instanceof Error ? err.message : 'API 호출 실패');
      // 에러 시 DataContext fallback
      setStudents(classData?.students ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [classId, getClassById, tcId, claId, credSchoolLevel, hasCredentials]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    students,
    l2Data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// ============================================================
// 학급 상세 데이터 훅 (L2.5용)
// ============================================================

interface UseClassDetailResult {
  /** API에서 가져온 학급 평균 T점수 (38개) */
  classTScores: number[];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 데이터 새로고침 */
  refetch: () => void;
}

/**
 * 학급 상세 분석용 데이터 조회
 * API 모드: /etc/meta/tc/analysis에서 학급 평균 T점수 로드
 * Mock 모드: DataContext의 학생 데이터에서 계산
 */
export function useClassDetail(
  classId: string | undefined,
  round: 1 | 2 = 1
): UseClassDetailResult {
  const { tScores, isLoading, error, refetch } = useClassAnalysis(classId, round);

  return {
    classTScores: tScores,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================
// 교사 학급 목록 훅 (L1용)
// ============================================================

type ExamStatus = 'completed' | 'in-progress' | 'no-exams';

interface UseTeacherClassesResult {
  /** 학급 목록 */
  classes: Class[];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 검사 상태: completed(종료된 검사 있음), in-progress(모두 진행중), no-exams(검사 없음) */
  examStatus: ExamStatus;
  /** 데이터 새로고침 */
  refetch: () => void;
}

/**
 * 교사 학급 목록 조회
 * API 모드: /etc/meta/tc/info에서 검사 목록 로드 → 학급 데이터 구축
 * - dgnssAt === 'N': 종료된 검사 → 결과 표시
 * - dgnssAt === 'Y': 진행중인 검사 → 안내 메시지
 * Mock 모드: DataContext의 학급 데이터 사용
 */
export function useTeacherClasses(): UseTeacherClassesResult {
  const { classes: mockClasses } = useData();
  const { tcId, claId, schoolLevel: credSchoolLevel, hasCredentials } = useCredentials();
  const [apiClasses, setApiClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examStatus, setExamStatus] = useState<ExamStatus>('no-exams');
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async () => {
    // Mock 모드면 DataContext 사용
    if (!isApiMode()) {
      setApiClasses([]);
      setExamStatus('completed'); // mock 모드는 항상 completed
      return;
    }

    // API 모드인데 credentials가 없으면 mock fallback
    if (!hasCredentials) {
      setApiClasses([]);
      setExamStatus('completed');
      return;
    }

    // 이미 로드 완료된 경우 스킵
    if (hasFetched) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 교사 검사 목록 조회 (paperIdx="1"로 필터링)
      const exams = await fetchTeacherExams(claId, tcId, '1');

      // DEBUG: 검사 목록 확인
      if (process.env.NODE_ENV === 'development') {
        console.log('[useTeacherClasses] exams:', exams);
        console.log('[useTeacherClasses] exams.length:', exams.length);
      }

      if (exams.length === 0) {
        setApiClasses([]);
        setExamStatus('no-exams');
        setHasFetched(true);
        return;
      }

      // 종료된 검사만 필터링 (dgnssAt === 'N')
      const completedExams = exams.filter(exam => exam.dgnssAt === 'N');

      // DEBUG: 종료된 검사 확인
      if (process.env.NODE_ENV === 'development') {
        console.log('[useTeacherClasses] completedExams:', completedExams);
      }

      if (completedExams.length === 0) {
        // 모든 검사가 진행중
        setApiClasses([]);
        setExamStatus('in-progress');
        setHasFetched(true);
        return;
      }

      // 종료된 검사가 있으면 학급 데이터 구축
      setExamStatus('completed');

      // claId별로 회차별 dgnssId 그룹화
      const classExamMap = new Map<string, { round1?: number; round2?: number }>();
      for (const exam of completedExams) {
        if (!classExamMap.has(exam.claId)) {
          classExamMap.set(exam.claId, {});
        }
        const entry = classExamMap.get(exam.claId)!;
        if (exam.ordNo === 1) {
          entry.round1 = exam.dgnssId;
        } else if (exam.ordNo === 2) {
          entry.round2 = exam.dgnssId;
        }
      }

      // 학급 데이터 병렬 구축
      const classPromises = Array.from(classExamMap.entries()).map(async ([examClaId, dgnssIds]) => {
        // grade, classNumber 추출 (claId 형식에 따라 파싱 필요)
        // 예: "6-2" → grade=6, classNumber=2
        const parts = examClaId.split('-');
        const grade = parseInt(parts[0], 10) || 1;
        const classNumber = parseInt(parts[1], 10) || 1;

        // 1차 검사 dgnssId가 있어야 학급 데이터 구축 가능
        const primaryDgnssId = dgnssIds.round1 ?? dgnssIds.round2;
        if (!primaryDgnssId) return null;

        return buildClassFromAPI(
          examClaId,
          grade,
          classNumber,
          credSchoolLevel,
          primaryDgnssId,
          dgnssIds.round2
        );
      });

      const classResults = await Promise.all(classPromises);
      const validClasses = classResults.filter((c): c is Class => c !== null);

      // DEBUG: 구축된 학급 데이터 확인
      if (process.env.NODE_ENV === 'development') {
        console.log('[useTeacherClasses] classResults:', classResults);
        console.log('[useTeacherClasses] validClasses:', validClasses);
      }

      setApiClasses(validClasses);
      setHasFetched(true);
    } catch (err) {
      console.error('Failed to fetch teacher classes:', err);
      setError(err instanceof Error ? err.message : 'API 호출 실패');
    } finally {
      setIsLoading(false);
    }
  }, [hasFetched, tcId, claId, credSchoolLevel, hasCredentials]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // API 모드면 API 데이터 반환, 아니면 DataContext 데이터 반환
  const classes = isApiMode() ? apiClasses : mockClasses;

  return {
    classes,
    isLoading,
    error,
    examStatus,
    refetch: () => {
      setHasFetched(false);
      fetchData();
    },
  };
}

// ============================================================
// API 설정 상태 훅
// ============================================================

interface UseApiConfigResult {
  isApiMode: boolean;
  hasJwtToken: boolean;
  baseUrl: string;
}

/**
 * 현재 API 설정 상태 확인
 */
export function useApiConfig(): UseApiConfigResult {
  return {
    isApiMode: isApiMode(),
    hasJwtToken: !!API_CONFIG.jwtToken,
    baseUrl: API_CONFIG.baseUrl,
  };
}
