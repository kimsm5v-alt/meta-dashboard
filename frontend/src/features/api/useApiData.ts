/**
 * API 데이터 로드 훅
 *
 * TanStack React Query 기반으로 데이터를 캐싱하여 가져옵니다.
 * 토큰이 없을 때는 DataContext를 fallback으로 사용합니다.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_CONFIG } from '@shared/services/apiClient';
import {
  fetchClassAnalysis,
  fetchClassAnalysisRaw,
  fetchSelfregClassAnalysis,
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
import type { SchoolLevel, Student, Class, Assessment, User, Group } from '@shared/types';
import { useData } from '@shared/contexts/DataContext';
import { useAuth } from '@features/auth';
import { groupService } from '@features/groups/api/groupService';
import { dgnssService } from '@features/groups/api/dgnssService';
import { groupKeys } from '@features/groups/api/queryKeys';
import { useAssessmentSlotsQueries } from '@features/assessment/api/queries';

// ============================================================
// Credentials 헬퍼 훅
// ============================================================

function useCredentials() {
  const { user } = useAuth();
  const tcId = user?.tcId ?? '';
  const claId = user?.classId ?? '';
  const schoolLevel: SchoolLevel = '중등'; // SSO 전환 후 기본값 — user 프로필에서 추후 개선 가능

  return { tcId, claId, gradeLevel: 'mi', schoolLevel, hasCredentials: !!user };
}

// ============================================================
// 학생 분석 데이터 훅 (L3용)
// ============================================================

interface UseStudentAnalysisResult {
  student: Student | undefined;
  classStudents: Student[];
  classInfo: { grade: number; classNumber: number; schoolLevel: SchoolLevel } | undefined;
  dgnssIds: { round1?: number; round2?: number };
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

type StudentAnalysisData = {
  student: Student | undefined;
  classStudents: Student[];
  classInfo: UseStudentAnalysisResult['classInfo'];
  dgnssIds: { round1?: number; round2?: number };
};

export function useStudentAnalysis(
  classId: string | undefined,
  studentId: string | undefined,
): UseStudentAnalysisResult {
  const { getStudentById, getClassById } = useData();
  const { schoolLevel: credSchoolLevel } = useCredentials();
  const { user } = useAuth();

  const query = useQuery<StudentAnalysisData>({
    queryKey: ['student', 'analysis', classId, studentId],
    queryFn: async (): Promise<StudentAnalysisData> => {
      if (!studentId || !classId) {
        return { student: undefined, classStudents: [], classInfo: undefined, dgnssIds: {} };
      }

      const isApiMode = !!user;

      if (!isApiMode) {
        const classData = getClassById(classId);
        return {
          student: getStudentById(classId, studentId),
          classStudents: classData?.students ?? [],
          classInfo: classData
            ? {
                grade: classData.grade,
                classNumber: classData.classNumber,
                schoolLevel: classData.schoolLevel,
              }
            : undefined,
          dgnssIds: {},
        };
      }

      const [fullAnalysis, groups, exams] = await Promise.all([
        fetchStudentFullAnalysis(classId, studentId, '1', 'Y'),
        user ? groupService.getMyGroups(user.id) : Promise.resolve([]),
        fetchTeacherExams(classId, '', '1'),
      ]);

      const matchedGroup = groups.find((g) => g.claId === classId);
      const grade = matchedGroup?.grade ?? 1;
      const classNumber = matchedGroup?.classNumber ?? 1;
      const schoolLevel: SchoolLevel = matchedGroup
        ? (SCHOOL_LEVEL_MAP[matchedGroup.schoolLevel] ?? credSchoolLevel)
        : credSchoolLevel;
      const completedR1 = exams.find((e) => e.dgnssAt === 'N' && e.ordNo === 1);
      const completedR2 = exams.find((e) => e.dgnssAt === 'N' && e.ordNo === 2);
      const dgnssIds = { round1: completedR1?.dgnssId, round2: completedR2?.dgnssId };
      let classStudents: Student[] = [];
      let studentName = '학생';
      let studentNumber = 0;

      if (completedR1) {
        try {
          // 네비게이션용 학생 목록은 기본 정보만 필요 — 분석 API 추가 호출 없음
          const infoList = await fetchStudentInfoList(completedR1.dgnssId, '1', 1);
          classStudents = infoList.map((info) => ({
            id: info.stdtId,
            classId,
            number: info.rowNum,
            name: info.stdtNm ?? info.nickname ?? `학생${info.rowNum}`,
            schoolLevel,
            grade,
            assessments: [],
          }));
          const info = infoList.find((s) => s.stdtId === studentId);
          if (info) {
            studentName = info.stdtNm ?? info.nickname ?? `학생${info.rowNum}`;
            studentNumber = info.rowNum;
          }
        } catch {
          // 조회 실패 시 fallback 유지
        }
      }

      if (!fullAnalysis.round1 && !fullAnalysis.round2) {
        const classData = getClassById(classId);
        const fallbackStudent = getStudentById(classId, studentId);
        return {
          student: fallbackStudent
            ? { ...fallbackStudent, name: studentName || fallbackStudent.name }
            : undefined,
          classStudents: classData?.students ?? [],
          classInfo: { grade, classNumber, schoolLevel },
          dgnssIds,
        };
      }

      const assessments: Assessment[] = [];
      if (fullAnalysis.round1) {
        assessments.push(convertToAssessment(studentId, 1, fullAnalysis.round1, schoolLevel));
      }
      if (fullAnalysis.round2) {
        assessments.push(convertToAssessment(studentId, 2, fullAnalysis.round2, schoolLevel));
      }

      return {
        student: {
          id: studentId,
          classId,
          number: studentNumber,
          name: studentName,
          schoolLevel,
          grade,
          assessments,
        },
        classStudents: classStudents ?? [],
        classInfo: { grade, classNumber, schoolLevel },
        dgnssIds,
      };
    },
    enabled: !!classId && !!studentId,
  });

  return {
    student: query.data?.student,
    classStudents: query.data?.classStudents ?? [],
    classInfo: query.data?.classInfo,
    dgnssIds: query.data?.dgnssIds ?? {},
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: () => {
      void query.refetch();
    },
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

type ClassAnalysisData = {
  tScores: number[];
  sections: AnalysisSectionItem[];
};

export function useClassAnalysis(
  classId: string | undefined,
  round: 1 | 2 = 1,
): UseClassAnalysisResult {
  const query = useQuery<ClassAnalysisData>({
    queryKey: ['class', 'analysis', classId, round],
    queryFn: async (): Promise<ClassAnalysisData> => {
      const [scores, rawSections] = await Promise.all([
        fetchClassAnalysis(classId!, '1', round),
        fetchClassAnalysisRaw(classId!, '1', round),
      ]);
      return { tScores: scores, sections: rawSections };
    },
    enabled: !!classId,
  });

  return {
    tScores: query.data?.tScores ?? new Array(38).fill(50),
    sections: query.data?.sections ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: () => {
      void query.refetch();
    },
  };
}

// ============================================================
// 자기조절학습검사 학급 분석 훅 (20요인 반 평균)
// ============================================================

interface UseSelfregClassAnalysisResult {
  /** 1차 반 평균 20요인 T-score (없으면 null) */
  round1: number[] | null;
  /** 2차 반 평균 20요인 T-score (없으면 null) */
  round2: number[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSelfregClassAnalysis(
  classId: string | undefined,
): UseSelfregClassAnalysisResult {
  const query = useQuery<{ round1: number[] | null; round2: number[] | null }>({
    queryKey: ['class', 'selfreg-analysis', classId],
    queryFn: async () => {
      const [round1, round2] = await Promise.all([
        fetchSelfregClassAnalysis(classId!, 1),
        fetchSelfregClassAnalysis(classId!, 2),
      ]);
      return { round1, round2 };
    },
    enabled: !!classId,
  });

  return {
    round1: query.data?.round1 ?? null,
    round2: query.data?.round2 ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: () => {
      void query.refetch();
    },
  };
}

// ============================================================
// 학급 학생 목록 훅 (L2용)
// ============================================================

interface UseClassStudentsResult {
  students: Student[];
  l2Data: L2DashboardData | null;
  classInfo: { grade: number; classNumber: number; schoolLevel: SchoolLevel } | undefined;
  dgnssIds: { round1?: number; round2?: number };
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

type ClassStudentsData = {
  students: Student[];
  l2Data: L2DashboardData | null;
  classInfo: UseClassStudentsResult['classInfo'];
  dgnssIds: { round1?: number; round2?: number };
};

export function useClassStudents(
  classId: string | undefined,
  paperIdx: '1' | '2' = '1', // '1': 학습심리정서검사, '2': 자기조절학습검사
): UseClassStudentsResult {
  const { getClassById } = useData();
  const { user } = useAuth();
  const { tcId, schoolLevel: credSchoolLevel } = useCredentials();

  const query = useQuery<ClassStudentsData>({
    queryKey: ['class', 'students', classId, paperIdx],
    queryFn: async (): Promise<ClassStudentsData> => {
      const classData = getClassById(classId!);

      const isApiMode = !!user;

      if (!isApiMode) {
        return {
          students: classData?.students ?? [],
          l2Data: null,
          classInfo: classData
            ? {
                grade: classData.grade,
                classNumber: classData.classNumber,
                schoolLevel: classData.schoolLevel,
              }
            : undefined,
          dgnssIds: {},
        };
      }

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
      } catch {
        // 그룹 조회 실패 시 fallback 유지
      }

      const effectiveTcId = tcId || user?.tcId || '';
      const exams = await fetchTeacherExams(classId!, effectiveTcId, paperIdx);
      const completedRound1 = exams.find((exam) => exam.dgnssAt === 'N' && exam.ordNo === 1);
      const completedRound2 = exams.find((exam) => exam.dgnssAt === 'N' && exam.ordNo === 2);
      const classDgnssIds = {
        round1: completedRound1?.dgnssId,
        round2: completedRound2?.dgnssId,
      };

      if (!completedRound1) {
        return {
          students: classData?.students ?? [],
          l2Data: null,
          classInfo: { grade, classNumber, schoolLevel: classSchoolLevel },
          dgnssIds: classDgnssIds,
        };
      }

      const data = await fetchL2DashboardData(
        completedRound1.dgnssId,
        classId!,
        classSchoolLevel,
        grade,
        paperIdx,
      );

      return {
        students: data.students,
        l2Data: data,
        classInfo: { grade, classNumber, schoolLevel: classSchoolLevel },
        dgnssIds: classDgnssIds,
      };
    },
    enabled: !!classId,
  });

  return {
    students: query.data?.students ?? [],
    l2Data: query.data?.l2Data ?? null,
    classInfo: query.data?.classInfo,
    dgnssIds: query.data?.dgnssIds ?? {},
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: () => {
      void query.refetch();
    },
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

export function useClassDetail(
  classId: string | undefined,
  round: 1 | 2 = 1,
): UseClassDetailResult {
  const { tScores, isLoading, error, refetch } = useClassAnalysis(classId, round);
  return { classTScores: tScores, isLoading, error, refetch };
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

type TeacherClassesData = {
  classes: Class[];
  examStatus: ExamStatus;
};

export function useTeacherClasses(): UseTeacherClassesResult {
  const { classes: mockClasses } = useData();
  const { user } = useAuth();
  const { schoolLevel: credSchoolLevel } = useCredentials();

  const query = useQuery<TeacherClassesData>({
    queryKey: ['teacher', 'classes', user?.id],
    queryFn: async (): Promise<TeacherClassesData> => {
      if (!user) return { classes: mockClasses, examStatus: 'no-exams' };

      const groups = await groupService.getMyGroups(user.id);

      if (groups.length === 0) {
        return { classes: [], examStatus: 'no-exams' };
      }

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

      const hasActive = groupDgnssResults.some((r) => r.dgnssList.some((d) => d.dgnssAt === 'Y'));
      const hasCompleted = groupDgnssResults.some((r) =>
        r.dgnssList.some((d) => d.dgnssAt === 'N'),
      );

      let examStatus: ExamStatus = 'no-exams';
      if (hasActive && !hasCompleted) examStatus = 'in-progress';
      else if (hasCompleted) examStatus = 'completed';

      const classPromises = groupDgnssResults.map(async ({ group, dgnssList }) => {
        const completedExams = dgnssList.filter((d) => d.dgnssAt === 'N');
        const round1 = completedExams.find((d) => d.ordNo === 1);
        const round2 = completedExams.find((d) => d.ordNo === 2);
        const primaryDgnssId = round1?.dgnssId ?? round2?.dgnssId;
        const schoolLevel: SchoolLevel = SCHOOL_LEVEL_MAP[group.schoolLevel] ?? credSchoolLevel;

        if (primaryDgnssId) {
          return buildClassFromAPI(
            group.claId,
            group.grade,
            group.classNumber,
            schoolLevel,
            primaryDgnssId,
            round2?.dgnssId,
          );
        }

        const activeExam = dgnssList.find((d) => d.dgnssAt === 'Y');
        const simpleClass: Class = {
          id: group.claId,
          schoolLevel,
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

      return { classes: validClasses, examStatus };
    },
    enabled: !!user,
  });

  const classes =
    !!user && (query.data?.classes.length ?? 0) > 0
      ? (query.data?.classes ?? mockClasses)
      : mockClasses;

  return {
    classes,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    examStatus: query.data?.examStatus ?? 'no-exams',
    user,
    refetch: () => {
      void query.refetch();
    },
  };
}

// ============================================================
// 공유 그룹 목록 훅 (API 과도 호출 방지)
// ============================================================

/**
 * 그룹 목록 쿼리 — groupKeys 캐시 공유 + 사용자별 격리
 * - 사이드바(useTeacherClassList)와 검사하기(AssessmentPage)가 캐시 공유
 * - userId를 queryKey에 포함하여 멀티 사용자 환경에서 캐시 격리 보장
 */
function useMyGroups(userId: string | undefined) {
  return useQuery<Group[]>({
    queryKey: groupKeys.myGroups(userId ?? ''),
    queryFn: () => groupService.getMyGroups(userId!),
    enabled: !!userId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useMyGroupsQuery() {
  const { user } = useAuth();
  return useMyGroups(user?.id);
}

// ============================================================
// 사이드바용 경량 학급 목록 훅 (분석 API 호출 없음)
// ============================================================

interface TeacherClassMeta {
  id: string;
  grade: number;
  classNumber: number;
  schoolLevel: SchoolLevel;
}

interface UseTeacherClassListResult {
  classes: TeacherClassMeta[];
  isLoading: boolean;
  examStatus: ExamStatus;
}

export function useTeacherClassList(): UseTeacherClassListResult {
  const { user } = useAuth();
  const { schoolLevel: credSchoolLevel } = useCredentials();

  // 그룹 목록: groupKeys.myGroups 캐시 공유
  const { data: groups = [], isLoading: groupsLoading } = useMyGroups(user?.id);

  // 검사 상태: 검사 페이지(AssessmentPage)와 동일한 exam-slots 쿼리를 공유해
  // /api/dgnss/tc/info 중복 호출 제거. 같은 queryKey/queryFn → React Query 자동 dedupe.
  const { dataByClaId, isLoading: slotsLoading } = useAssessmentSlotsQueries(groups, user?.id);

  const { classes, examStatus } = useMemo(() => {
    const allSlots = groups.flatMap((g: Group) => dataByClaId.get(g.claId) ?? []);
    const hasActive = allSlots.some((s) => s.status === 'in_progress');
    const hasCompleted = allSlots.some((s) => s.status === 'completed');

    let status: ExamStatus = 'no-exams';
    if (hasActive && !hasCompleted) status = 'in-progress';
    else if (hasCompleted) status = 'completed';

    // 완료된 검사가 있는 그룹만 학급 목록에 노출 (기존 dgnssAt==='N' 필터와 동일)
    const list: TeacherClassMeta[] = groups
      .filter((g: Group) => (dataByClaId.get(g.claId) ?? []).some((s) => s.status === 'completed'))
      .map((g: Group) => ({
        id: g.claId,
        grade: g.grade,
        classNumber: g.classNumber,
        schoolLevel: SCHOOL_LEVEL_MAP[g.schoolLevel] ?? credSchoolLevel,
      }));

    return { classes: list, examStatus: status };
  }, [groups, dataByClaId, credSchoolLevel]);

  return {
    classes,
    isLoading: groupsLoading || slotsLoading,
    examStatus,
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
  const { user } = useAuth();
  return {
    hasJwtToken: !!user,
    baseUrl: API_CONFIG.baseUrl,
  };
}
