/**
 * API 데이터 로드 훅
 *
 * 백엔드 API에서 데이터를 가져오고, credentials가 없을 때는 DataContext를 fallback으로 사용합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG, getAuthTokens } from '@shared/services/apiClient';
import {
  fetchClassAnalysis,
  fetchClassAnalysisRaw,
  buildClassFromAPI,
  fetchL2DashboardData,
  fetchStudentFullAnalysis,
  fetchStudentInfoList,
  fetchTeacherExams,
  convertToAssessment,
  type AnalysisSectionItem,
  type L2DashboardData,
} from '@shared/services/dashboardService';
import { SCHOOL_LEVEL_MAP } from '@shared/types';
import type { SchoolLevel, Student, Class, Assessment, User } from '@shared/types';
import { useData } from '@shared/contexts/DataContext';
import { useAuth } from '@features/auth';
import { groupService } from '@features/groups/api/groupService';
import { dgnssService } from '@features/groups/api/dgnssService';

// ============================================================
// Credentials 헬퍼 훅
// ============================================================

function useCredentials() {
  const { user } = useAuth();
  const tcId = user?.tcId ?? '';
  const claId = user?.classId ?? '';
  const schoolLevel: SchoolLevel = '중등'; // SSO 전환 후 기본값, 추후 user 프로필에서 가져오기

  return { tcId, claId, gradeLevel: 'mi', schoolLevel, hasCredentials: !!user };
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
  const { user } = useAuth();
  const [apiStudent, setApiStudent] = useState<Student | undefined>(undefined);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<UseStudentAnalysisResult['classInfo']>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!studentId || !classId) return;

    const authTokens = getAuthTokens();
    const isApiMode = !!authTokens?.authToken && !!authTokens?.refreshToken;

    if (!isApiMode) {
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
      // 분석 데이터 + 그룹 정보 + 검사 목록 병렬 조회
      const [fullAnalysis, groups, exams] = await Promise.all([
        fetchStudentFullAnalysis(classId, studentId, '1'),
        user ? groupService.getMyGroups(user.id) : Promise.resolve([]),
        fetchTeacherExams(classId, '', '1'),
      ]);

      // 그룹에서 학년/반 정보 조회
      const group = groups.find((g) => g.claId === classId);
      const grade = group?.grade ?? 1;
      const classNumber = group?.classNumber ?? 1;
      const schoolLevel: SchoolLevel = group
        ? (SCHOOL_LEVEL_MAP[group.schoolLevel] ?? credSchoolLevel)
        : credSchoolLevel;

      // 완료된 1차 검사의 stinfolist에서 이름/번호 조회
      let studentName = '학생';
      let studentNumber = 0;
      const completedR1 = exams.find((e) => e.dgnssAt === 'N' && e.ordNo === 1);
      if (completedR1) {
        try {
          const infoList = await fetchStudentInfoList(completedR1.dgnssId, '1', 1);
          const info = infoList.find((s) => s.stdtId === studentId);
          if (info) {
            studentName = info.stdtNm ?? info.nickname ?? `학생${info.rowNum}`;
            studentNumber = info.rowNum;
          }
        } catch {
          // 이름 조회 실패 시 fallback 유지
        }
      }

      // 유효한 분석 데이터가 없으면 DataContext fallback
      if (!fullAnalysis.round1 && !fullAnalysis.round2) {
        const classData = getClassById(classId);
        setClassStudents(classData?.students ?? []);
        setClassInfo({ grade, classNumber, schoolLevel });
        const fallbackStudent = getStudentById(classId, studentId);
        setApiStudent(
          fallbackStudent
            ? { ...fallbackStudent, name: studentName || fallbackStudent.name }
            : undefined,
        );
        setIsLoading(false);
        return;
      }

      const assessments: Assessment[] = [];

      if (fullAnalysis.round1) {
        assessments.push(convertToAssessment(studentId, 1, fullAnalysis.round1, schoolLevel));
      }

      if (fullAnalysis.round2) {
        assessments.push(convertToAssessment(studentId, 2, fullAnalysis.round2, schoolLevel));
      }

      const student: Student = {
        id: studentId,
        classId,
        number: studentNumber,
        name: studentName,
        schoolLevel,
        grade,
        assessments,
      };

      setApiStudent(student);
      setClassInfo({ grade, classNumber, schoolLevel });

      const classData = getClassById(classId);
      setClassStudents(classData?.students ?? []);
    } catch (err) {
      console.error('Failed to fetch student analysis:', err);
      setError(err instanceof Error ? err.message : 'API 호출 실패');
      const classData = getClassById(classId);
      setClassStudents(classData?.students ?? []);
      const group = classData
        ? { grade: classData.grade, classNumber: classData.classNumber, schoolLevel: classData.schoolLevel }
        : undefined;
      setClassInfo(group);
    } finally {
      setIsLoading(false);
    }
  }, [classId, studentId, getClassById, getStudentById, credSchoolLevel, hasCredentials, user]);

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
  classInfo: { grade: number; classNumber: number; schoolLevel: SchoolLevel } | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 학급 학생 목록 조회 (검사 결과 포함)
 */
export function useClassStudents(classId: string | undefined): UseClassStudentsResult {
  const { getClassById } = useData();
  const { user } = useAuth();
  const { tcId, claId, schoolLevel: credSchoolLevel, hasCredentials } = useCredentials();
  const [students, setStudents] = useState<Student[]>([]);
  const [l2Data, setL2Data] = useState<L2DashboardData | null>(null);
  const [classInfo, setClassInfo] = useState<UseClassStudentsResult['classInfo']>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!classId) {
      setStudents([]);
      setL2Data(null);
      return;
    }

    const classData = getClassById(classId);

    const authTokens = getAuthTokens();
    const isApiMode = !!authTokens?.authToken && !!authTokens?.refreshToken;

    // API 모드가 아니면 DataContext fallback
    if (!isApiMode) {
      setStudents(classData?.students ?? []);
      setL2Data(null);
      if (classData) {
        setClassInfo({
          grade: classData.grade,
          classNumber: classData.classNumber,
          schoolLevel: classData.schoolLevel,
        });
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const effectiveTcId = tcId || user?.tcId || '';
      const effectiveClaId = classId;

      // 해당 학급의 실제 schoolLevel/grade/classNumber 조회
      let classSchoolLevel: SchoolLevel = credSchoolLevel;
      let grade = classData?.grade ?? 1;
      let classNumber = classData?.classNumber ?? 1;
      try {
        const groups = await groupService.getMyGroups(user?.id ?? '');
        const matchedGroup = groups.find((g) => g.claId === classId);
        if (matchedGroup) {
          classSchoolLevel = SCHOOL_LEVEL_MAP[matchedGroup.schoolLevel] ?? credSchoolLevel;
          grade = matchedGroup.grade;
          classNumber = matchedGroup.classNumber;
        }
      } catch (_err) {
        // 그룹 조회 실패 시 fallback 유지
      }

      setClassInfo({ grade, classNumber, schoolLevel: classSchoolLevel });

      const exams = await fetchTeacherExams(effectiveClaId, effectiveTcId, '1');
      const completedRound1 = exams.find((exam) => exam.dgnssAt === 'N' && exam.ordNo === 1);

      if (!completedRound1) {
        setStudents(classData?.students ?? []);
        setL2Data(null);
        setIsLoading(false);
        return;
      }

      const dgnssId = completedRound1.dgnssId;

      const data = await fetchL2DashboardData(dgnssId, classId, classSchoolLevel, grade);

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
    classInfo,
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
  user: User | null;
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

        const schoolLevel: SchoolLevel = SCHOOL_LEVEL_MAP[group.schoolLevel];

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
                examStatus: { round1: '진행중', round2: '시작전' },
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
    user,
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
