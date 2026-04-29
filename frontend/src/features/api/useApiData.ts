/**
 * API 데이터 로드 훅
 *
 * TanStack React Query 기반으로 데이터를 캐싱하여 가져옵니다.
 * 토큰이 없을 때는 DataContext를 fallback으로 사용합니다.
 */

import { useQuery } from '@tanstack/react-query';
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
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

type StudentAnalysisData = {
  student: Student | undefined;
  classStudents: Student[];
  classInfo: UseStudentAnalysisResult['classInfo'];
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
        return { student: undefined, classStudents: [], classInfo: undefined };
      }

      const authTokens = getAuthTokens();
      const isApiMode = !!authTokens?.authToken && !!authTokens?.refreshToken;

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
        };
      }

      const [fullAnalysis, groups, exams] = await Promise.all([
        fetchStudentFullAnalysis(classId, studentId, '1'),
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
      let classStudents: Student[] = [];

      if (completedR1) {
        // L2 대시보드 데이터를 가져와서 학생 목록을 추출합니다.
        const l2Data = await fetchL2DashboardData(completedR1.dgnssId, classId, schoolLevel, grade);
        classStudents = l2Data.students; // 서버에서 받아온 실제 학생 목록
      }

      let studentName = '학생';
      let studentNumber = 0;
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

      if (!fullAnalysis.round1 && !fullAnalysis.round2) {
        const classData = getClassById(classId);
        const fallbackStudent = getStudentById(classId, studentId);
        return {
          student: fallbackStudent
            ? { ...fallbackStudent, name: studentName || fallbackStudent.name }
            : undefined,
          classStudents: classData?.students ?? [],
          classInfo: { grade, classNumber, schoolLevel },
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
      };
    },
    enabled: !!classId && !!studentId,
  });

  return {
    student: query.data?.student,
    classStudents: query.data?.classStudents ?? [],
    classInfo: query.data?.classInfo,
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

type ClassStudentsData = {
  students: Student[];
  l2Data: L2DashboardData | null;
  classInfo: UseClassStudentsResult['classInfo'];
};

export function useClassStudents(classId: string | undefined): UseClassStudentsResult {
  const { getClassById } = useData();
  const { user } = useAuth();
  const { tcId, schoolLevel: credSchoolLevel } = useCredentials();

  const query = useQuery<ClassStudentsData>({
    queryKey: ['class', 'students', classId],
    queryFn: async (): Promise<ClassStudentsData> => {
      const classData = getClassById(classId!);

      const authTokens = getAuthTokens();
      const isApiMode = !!authTokens?.authToken && !!authTokens?.refreshToken;

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
      const exams = await fetchTeacherExams(classId!, effectiveTcId, '1');
      const completedRound1 = exams.find((exam) => exam.dgnssAt === 'N' && exam.ordNo === 1);

      if (!completedRound1) {
        return {
          students: classData?.students ?? [],
          l2Data: null,
          classInfo: { grade, classNumber, schoolLevel: classSchoolLevel },
        };
      }

      const data = await fetchL2DashboardData(
        completedRound1.dgnssId,
        classId!,
        classSchoolLevel,
        grade,
      );

      return {
        students: data.students,
        l2Data: data,
        classInfo: { grade, classNumber, schoolLevel: classSchoolLevel },
      };
    },
    enabled: !!classId,
  });

  return {
    students: query.data?.students ?? [],
    l2Data: query.data?.l2Data ?? null,
    classInfo: query.data?.classInfo,
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

  const hasJwt = !!API_CONFIG.jwtToken;
  const classes =
    hasJwt && (query.data?.classes.length ?? 0) > 0
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
