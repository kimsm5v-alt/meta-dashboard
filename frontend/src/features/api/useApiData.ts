/**
 * API 데이터 로드 훅
 *
 * 백엔드 API에서 데이터를 가져오고, credentials가 없을 때는 DataContext를 fallback으로 사용합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '@shared/services/apiClient';
import {
  fetchClassAnalysis,
  fetchClassAnalysisRaw,
  buildClassFromAPI,
  fetchL2DashboardData,
  fetchStudentFullAnalysis,
  convertToAssessment,
  type AnalysisSectionItem,
  type L2DashboardData,
} from '@shared/services/dashboardService';
import type { SchoolLevel, Student, Class, Assessment } from '@shared/types';
import { useData } from '@shared/contexts/DataContext';
import { useAuth } from '@features/auth';
import { groupService } from '@features/groups/api/groupService';
import { dgnssService } from '@features/groups/api/dgnssService';

// ============================================================
// Credentials 헬퍼 훅
// ============================================================

function useCredentials() {
  const { credentials } = useAuth();

  const tcId = credentials?.teacherId ?? '';
  const claId = credentials?.classId ?? '';
  const gradeLevel = credentials?.gradeLevel ?? 'mi';
  const schoolLevel: SchoolLevel = gradeLevel === 'el' ? '초등' : '중등';

  return { tcId, claId, gradeLevel, schoolLevel, hasCredentials: !!credentials };
}

// ============================================================
// 학생 분석 데이터 훅 (L3용)
// ============================================================

interface UseStudentAnalysisResult {
  student: Student | undefined;
  classStudents: Student[];
  classInfo: { grade: number; classNumber: number; schoolLevel: SchoolLevel } | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 학생 분석 데이터 조회
 * - credentials 있음: API에서 학생 T점수 조회
 * - credentials 없음: DataContext fallback
 */
export function useStudentAnalysis(
  classId: string | undefined,
  studentId: string | undefined,
): UseStudentAnalysisResult {
  const { getStudentById, getClassById } = useData();
  const { schoolLevel: credSchoolLevel, hasCredentials } = useCredentials();
  const [apiStudent, setApiStudent] = useState<Student | undefined>(undefined);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<UseStudentAnalysisResult['classInfo']>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!studentId || !classId) return;

    const parts = classId.split('-');
    const grade = parseInt(parts[0], 10) || 1;
    const classNumber = parseInt(parts[1], 10) || 1;

    // credentials 없으면 DataContext fallback
    if (!hasCredentials) {
      const classData = getClassById(classId);
      setClassStudents(classData?.students ?? []);
      setClassInfo(
        classData
          ? {
              grade: classData.grade,
              classNumber: classData.classNumber,
              schoolLevel: classData.schoolLevel,
            }
          : undefined,
      );
      setApiStudent(getStudentById(classId, studentId));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fullAnalysis = await fetchStudentFullAnalysis(studentId, '1');

      // 유효한 데이터가 없으면 DataContext fallback
      if (!fullAnalysis.round1 && !fullAnalysis.round2) {
        const classData = getClassById(classId);
        setClassStudents(classData?.students ?? []);
        setClassInfo(
          classData
            ? {
                grade: classData.grade,
                classNumber: classData.classNumber,
                schoolLevel: classData.schoolLevel,
              }
            : undefined,
        );
        setApiStudent(getStudentById(classId, studentId));
        setIsLoading(false);
        return;
      }

      const assessments: Assessment[] = [];

      if (fullAnalysis.round1) {
        assessments.push(convertToAssessment(studentId, 1, fullAnalysis.round1, credSchoolLevel));
      }

      if (fullAnalysis.round2) {
        assessments.push(convertToAssessment(studentId, 2, fullAnalysis.round2, credSchoolLevel));
      }

      const student: Student = {
        id: studentId,
        classId,
        number: 0,
        name: '학생',
        schoolLevel: credSchoolLevel,
        grade,
        assessments,
      };

      setApiStudent(student);
      setClassInfo({ grade, classNumber, schoolLevel: credSchoolLevel });

      const classData = getClassById(classId);
      setClassStudents(classData?.students ?? []);
    } catch (err) {
      console.error('Failed to fetch student analysis:', err);
      setError(err instanceof Error ? err.message : 'API 호출 실패');
      const classData = getClassById(classId);
      setClassStudents(classData?.students ?? []);
      setClassInfo(
        classData
          ? {
              grade: classData.grade,
              classNumber: classData.classNumber,
              schoolLevel: classData.schoolLevel,
            }
          : undefined,
      );
    } finally {
      setIsLoading(false);
    }
  }, [classId, studentId, getClassById, getStudentById, credSchoolLevel, hasCredentials]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    student: apiStudent,
    classStudents,
    classInfo,
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
 */
export function useClassAnalysis(
  classId: string | undefined,
  round: 1 | 2 = 1,
): UseClassAnalysisResult {
  const [tScores, setTScores] = useState<number[]>(new Array(38).fill(50));
  const [sections, setSections] = useState<AnalysisSectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!classId) return;

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
  }, [classId, round]);

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
  students: Student[];
  l2Data: L2DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 학급 학생 목록 조회 (검사 결과 포함)
 */
export function useClassStudents(classId: string | undefined): UseClassStudentsResult {
  const { getClassById } = useData();
  const { tcId, claId, schoolLevel: credSchoolLevel, hasCredentials } = useCredentials();
  const [students, setStudents] = useState<Student[]>([]);
  const [l2Data, setL2Data] = useState<L2DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!classId) {
      setStudents([]);
      setL2Data(null);
      return;
    }

    const classData = getClassById(classId);

    // credentials 없으면 DataContext fallback
    if (!hasCredentials) {
      setStudents(classData?.students ?? []);
      setL2Data(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const exams = await fetchTeacherExams(claId, tcId, '1');
      const completedRound1 = exams.find((exam) => exam.dgnssAt === 'N' && exam.ordNo === 1);

      if (!completedRound1) {
        setStudents(classData?.students ?? []);
        setL2Data(null);
        setIsLoading(false);
        return;
      }

      const dgnssId = completedRound1.dgnssId;
      const grade = classData?.grade ?? 1;

      const data = await fetchL2DashboardData(dgnssId, classId, credSchoolLevel, grade);

      setL2Data(data);
      setStudents(data.students);
    } catch (err) {
      console.error('Failed to fetch L2 dashboard data:', err);
      setError(err instanceof Error ? err.message : 'API 호출 실패');
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
  classTScores: number[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 학급 상세 분석용 데이터 조회
 */
export function useClassDetail(
  classId: string | undefined,
  round: 1 | 2 = 1,
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
  classes: Class[];
  isLoading: boolean;
  error: string | null;
  examStatus: ExamStatus;
  refetch: () => void;
}

/**
 * 교사 학급 목록 조회
 */
export function useTeacherClasses(): UseTeacherClassesResult {
  const { classes: mockClasses } = useData();
  const { user } = useAuth();
  const { schoolLevel: credSchoolLevel } = useCredentials();
  const [apiClasses, setApiClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examStatus, setExamStatus] = useState<ExamStatus>('no-exams');
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    if (hasFetched) return;

    setIsLoading(true);
    setError(null);

    try {
      // 그룹 목록 조회
      const groups = await groupService.getMyGroups(user.id);

      if (groups.length === 0) {
        setApiClasses([]);
        setExamStatus('no-exams');
        setHasFetched(true);
        return;
      }

      // 각 그룹의 검사 목록 병렬 조회
      const groupDgnssResults = await Promise.all(
        groups.map(async (group) => {
          try {
            const dgnssList = await dgnssService.getDgnssList(group.claId);
            return { group, dgnssList };
          } catch {
            return { group, dgnssList: [] };
          }
        }),
      );

      // 진행 중인 검사 여부 확인
      const hasActive = groupDgnssResults.some((r) => r.dgnssList.some((d) => d.dgnssAt === 'Y'));
      const hasCompleted = groupDgnssResults.some((r) =>
        r.dgnssList.some((d) => d.dgnssAt === 'N'),
      );

      if (hasActive && !hasCompleted) {
        setExamStatus('in-progress');
      } else if (hasCompleted) {
        setExamStatus('completed');
      } else {
        setExamStatus('no-exams');
      }

      // 그룹 → Class 변환 (완료된 검사 기준)
      const classPromises = groupDgnssResults.map(async ({ group, dgnssList }) => {
        const completedExams = dgnssList.filter((d) => d.dgnssAt === 'N');
        const round1 = completedExams.find((d) => d.ordNo === 1);
        const round2 = completedExams.find((d) => d.ordNo === 2);
        const primaryDgnssId = round1?.dgnssId ?? round2?.dgnssId;

        const schoolLevel: SchoolLevel =
          group.schoolLevel === 'elementary'
            ? '초등'
            : group.schoolLevel === 'middle'
              ? '중등'
              : '고등';

        if (primaryDgnssId) {
          // 완료된 검사가 있으면 상세 분석 데이터 구축
          const built = await buildClassFromAPI(
            group.claId,
            group.grade,
            group.classNumber,
            schoolLevel,
            primaryDgnssId,
            round2?.dgnssId,
          );
          return built;
        }

        // 완료된 검사 없으면 기본 Class 구조 반환
        const activeExam = dgnssList.find((d) => d.dgnssAt === 'Y');
        const simpleClass: Class = {
          id: group.claId,
          schoolLevel: schoolLevel ?? (credSchoolLevel as SchoolLevel),
          grade: group.grade,
          classNumber: group.classNumber,
          teacherId: user.id,
          students: [],
          stats: activeExam
            ? {
                totalStudents: activeExam.stTotalCnt,
                assessedStudents: activeExam.stSubmCnt,
                typeDistribution: {},
                needAttentionCount: 0,
                round1Completed: false,
                round2Completed: false,
                examStatus: 'in-progress',
                round2SubmittedCount: 0,
              }
            : undefined,
        };
        return simpleClass;
      });

      const classResults = await Promise.all(classPromises);
      const validClasses = classResults.filter((c): c is Class => c !== null);

      setApiClasses(validClasses);
      setHasFetched(true);
    } catch (err) {
      console.error('Failed to fetch teacher classes:', err);
      setError(err instanceof Error ? err.message : 'API 호출 실패');
    } finally {
      setIsLoading(false);
    }
  }, [hasFetched, user, credSchoolLevel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // JWT 있으면 API 데이터, 없으면 mockClasses fallback
  const hasJwt = !!API_CONFIG.jwtToken;
  const classes = hasJwt && apiClasses.length > 0 ? apiClasses : mockClasses;

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
  hasJwtToken: boolean;
  baseUrl: string;
}

export function useApiConfig(): UseApiConfigResult {
  return {
    hasJwtToken: !!API_CONFIG.jwtToken,
    baseUrl: API_CONFIG.baseUrl,
  };
}
