/**
 * 대시보드 API 서비스
 *
 * 엔드포인트:
 * - /api/dgnss/tc/info: 교사 검사 목록
 * - /api/dgnss/tc/detail: 검사 상세
 * - /api/dgnss/tc/stinfolist: 학생 목록 + 신뢰도
 * - /api/dgnss/tc/analysis: 학급 평균 T점수
 * - /api/dgnss/tc/need: 관심 필요 학생
 * - /api/dgnss/st/analysis: 학생 개별 T점수
 */

import { apiRequest } from './apiClient';
import type { SchoolLevel, StudentType } from '@/shared/types';
import type {
  DgnssInfoItem,
  DgnssInfoResponse,
  DgnssDetailResponse,
  StudentInfoItem,
  StudentInfoListResponse,
  NeedStudentsResponse,
  AnalysisSectionItem,
  AnalysisResponse,
} from '@/shared/types/api';
import { classifyStudent, getTypeDeviations } from '@/shared/utils/lpaClassifier';
import { checkAttention } from '@/shared/utils/attentionChecker';
import {
  T_SCORE_LENGTH,
  createDefaultTScores,
  SECTION_ID_TO_INDEX,
  ReliabilityWarningType,
  ReliabilityApiValue,
  FACTOR_DEPTH,
  DEFAULT_PAPER_IDX,
} from '@/shared/constants';

// 타입 re-export (기존 사용처 호환성 유지)
export type {
  DgnssInfoItem,
  DgnssDetailResponse,
  StudentInfoItem,
  NeedStudentsResponse,
  AnalysisSectionItem,
  AnalysisResponse,
};

function convertSectionsToTScores(sections: AnalysisSectionItem[]): number[] {
  const tScores = createDefaultTScores();

  for (const section of sections) {
    if (section.DEPTH !== FACTOR_DEPTH) continue;

    const index = SECTION_ID_TO_INDEX[section.SECTION_ID];
    if (index !== undefined) {
      tScores[index] = Math.round(section.tScore);
    }
  }

  return tScores;
}

function getReliabilityWarnings(info: StudentInfoItem | AnalysisSectionItem): string[] {
  const warnings: string[] = [];

  if ('reaction' in info && info.reaction === ReliabilityApiValue.CAUTION) {
    warnings.push(ReliabilityWarningType.REACTION_CONSISTENCY);
  }
  if ('desirable' in info && info.desirable === ReliabilityApiValue.CAUTION) {
    warnings.push(ReliabilityWarningType.SOCIAL_DESIRABILITY);
  }
  if ('repeatResponse' in info && info.repeatResponse === ReliabilityApiValue.REPEAT_YES) {
    warnings.push(ReliabilityWarningType.REPEAT_RESPONSE);
  }

  return warnings;
}

// ============================================================
// API 함수
// ============================================================

export async function fetchTeacherExams(
  claId: string,
  tcId: string,
  paperIdx?: string
): Promise<DgnssInfoItem[]> {
  let url = `/api/dgnss/tc/info?claId=${claId}&tcId=${tcId}`;
  if (paperIdx) {
    url += `&paperIdx=${paperIdx}`;
  }

  const response = await apiRequest<DgnssInfoResponse>(url);
  return response.resultData.dgnssInfo ?? [];
}

export async function fetchExamDetail(
  dgnssId: number
): Promise<DgnssDetailResponse | null> {
  const response = await apiRequest<DgnssDetailResponse>(
    `/api/dgnss/tc/detail?dgnssId=${dgnssId}`
  );
  return response.resultData;
}

export async function fetchStudentInfoList(
  dgnssId: number,
  paperIdx: string = DEFAULT_PAPER_IDX,
  type: number = 1
): Promise<StudentInfoItem[]> {
  const response = await apiRequest<StudentInfoListResponse>(
    `/api/dgnss/tc/stinfolist?dgnssId=${dgnssId}&paperIdx=${paperIdx}&type=${type}`
  );
  return response.resultData.stInfoList ?? [];
}

export async function fetchNeedAttentionStudents(
  dgnssId: number,
  paperIdx: string = DEFAULT_PAPER_IDX
): Promise<NeedStudentsResponse> {
  const response = await apiRequest<NeedStudentsResponse>(
    `/api/dgnss/tc/need?dgnssId=${dgnssId}&paperIdx=${paperIdx}`
  );
  return response.resultData;
}

export async function fetchClassAnalysis(
  claId: string,
  paperIdx: string = DEFAULT_PAPER_IDX,
  ordNo: number = 1
): Promise<number[]> {
  const response = await apiRequest<AnalysisResponse>(
    `/api/dgnss/tc/analysis?claId=${claId}&paperIdx=${paperIdx}&ordNo=${ordNo}`
  );

  const roundData = response.resultData[String(ordNo)];
  if (!roundData) {
    return createDefaultTScores();
  }

  return convertSectionsToTScores(roundData);
}

export async function fetchClassAnalysisRaw(
  claId: string,
  paperIdx: string = DEFAULT_PAPER_IDX,
  ordNo: number = 1
): Promise<AnalysisSectionItem[]> {
  const response = await apiRequest<AnalysisResponse>(
    `/api/dgnss/tc/analysis?claId=${claId}&paperIdx=${paperIdx}&ordNo=${ordNo}`
  );

  return response.resultData[String(ordNo)] ?? [];
}

export async function fetchStudentAnalysis(
  stdtId: string,
  paperIdx: string = DEFAULT_PAPER_IDX,
  ordNo: number = 1
): Promise<{
  tScores: number[];
  reliabilityWarnings: string[];
  sections: AnalysisSectionItem[];
}> {
  const response = await apiRequest<AnalysisResponse>(
    `/api/dgnss/st/analysis?stdtId=${stdtId}&paperIdx=${paperIdx}&ordNo=${ordNo}`
  );

  const roundData = response.resultData[String(ordNo)];
  if (!roundData || roundData.length === 0) {
    return {
      tScores: createDefaultTScores(),
      reliabilityWarnings: [],
      sections: [],
    };
  }

  const tScores = convertSectionsToTScores(roundData);
  const reliabilityWarnings = getReliabilityWarnings(roundData[0]);

  return {
    tScores,
    reliabilityWarnings,
    sections: roundData,
  };
}

export async function fetchStudentFullAnalysis(
  stdtId: string,
  paperIdx: string = DEFAULT_PAPER_IDX
): Promise<{
  round1: { tScores: number[]; reliabilityWarnings: string[] } | null;
  round2: { tScores: number[]; reliabilityWarnings: string[] } | null;
}> {
  const [r1Result, r2Result] = await Promise.allSettled([
    fetchStudentAnalysis(stdtId, paperIdx, 1),
    fetchStudentAnalysis(stdtId, paperIdx, 2),
  ]);

  const hasValidR1 = r1Result.status === 'fulfilled'
    && r1Result.value.tScores
    && Array.isArray(r1Result.value.tScores)
    && r1Result.value.tScores.some(t => t !== 50);

  const hasValidR2 = r2Result.status === 'fulfilled'
    && r2Result.value.tScores
    && Array.isArray(r2Result.value.tScores)
    && r2Result.value.tScores.some(t => t !== 50);

  return {
    round1: hasValidR1 && r1Result.status === 'fulfilled'
      ? { tScores: r1Result.value.tScores, reliabilityWarnings: r1Result.value.reliabilityWarnings }
      : null,
    round2: hasValidR2 && r2Result.status === 'fulfilled'
      ? { tScores: r2Result.value.tScores, reliabilityWarnings: r2Result.value.reliabilityWarnings }
      : null,
  };
}

// ============================================================
// 데이터 변환 유틸리티
// ============================================================

export function convertToAssessment(
  studentId: string,
  round: 1 | 2,
  data: {
    tScores: number[];
    reliabilityWarnings: string[];
  } | null | undefined,
  schoolLevel: SchoolLevel
): import('@/shared/types').Assessment {
  const tScores = data?.tScores;
  const reliabilityWarnings = data?.reliabilityWarnings ?? [];

  const safeTScores = tScores && Array.isArray(tScores) && tScores.length === T_SCORE_LENGTH
    ? tScores
    : createDefaultTScores();

  const classification = classifyStudent(safeTScores, schoolLevel);
  const deviations = getTypeDeviations(safeTScores, classification.predictedType, schoolLevel, 3);
  const attentionResult = checkAttention(safeTScores);

  return {
    id: `${studentId}-r${round}`,
    studentId,
    round,
    assessedAt: new Date(),
    tScores: safeTScores,
    predictedType: classification.predictedType as StudentType,
    typeConfidence: classification.confidence,
    typeProbabilities: classification.allProbabilities,
    deviations,
    reliabilityWarnings,
    attentionResult,
  };
}

export async function buildClassFromAPI(
  claId: string,
  grade: number,
  classNumber: number,
  schoolLevel: SchoolLevel,
  dgnssId: number,
  round2DgnssId?: number
): Promise<import('@/shared/types').Class | null> {
  try {
    const studentInfoList = await fetchStudentInfoList(dgnssId, '1', 1);
    if (studentInfoList.length === 0) {
      return null;
    }

    const studentPromises = studentInfoList.map(async (info) => {
      const fullAnalysis = await fetchStudentFullAnalysis(info.stdtId, '1');
      return { info, fullAnalysis };
    });

    const studentResults = await Promise.all(studentPromises);

    const students: import('@/shared/types').Student[] = studentResults
      .filter(({ fullAnalysis }) => {
        const hasValidR1 = fullAnalysis.round1?.tScores && Array.isArray(fullAnalysis.round1.tScores);
        const hasValidR2 = fullAnalysis.round2?.tScores && Array.isArray(fullAnalysis.round2.tScores);
        return hasValidR1 || hasValidR2;
      })
      .map(({ info, fullAnalysis }) => {
        const assessments: import('@/shared/types').Assessment[] = [];

        if (fullAnalysis.round1?.tScores) {
          assessments.push(
            convertToAssessment(info.stdtId, 1, fullAnalysis.round1, schoolLevel)
          );
        }

        if (fullAnalysis.round2?.tScores) {
          assessments.push(
            convertToAssessment(info.stdtId, 2, fullAnalysis.round2, schoolLevel)
          );
        }

        return {
          id: info.stdtId,
          classId: claId,
          number: info.rowNum,
          name: `학생${info.rowNum}`,
          schoolLevel,
          grade,
          assessments,
        };
      });

    const assessedStudents = students.filter(s => s.assessments.length > 0).length;
    const typeDistribution: Record<string, { count: number; percentage: number }> = {};

    for (const student of students) {
      const latestAssessment = student.assessments[student.assessments.length - 1];
      if (latestAssessment) {
        const type = latestAssessment.predictedType;
        if (!typeDistribution[type]) {
          typeDistribution[type] = { count: 0, percentage: 0 };
        }
        typeDistribution[type].count++;
      }
    }

    for (const type of Object.keys(typeDistribution)) {
      typeDistribution[type].percentage = Math.round(
        (typeDistribution[type].count / assessedStudents) * 100
      );
    }

    const needAttentionCount = students.filter(
      s => s.assessments.some(a => a.attentionResult.needsAttention)
    ).length;

    return {
      id: claId,
      schoolLevel,
      grade,
      classNumber,
      teacherId: '',
      students,
      stats: {
        totalStudents: studentInfoList.length,
        assessedStudents,
        typeDistribution,
        needAttentionCount,
        round1Completed: assessedStudents > 0,
        round2Completed: students.some(s => s.assessments.some(a => a.round === 2)),
        examStatus: {
          round1: assessedStudents > 0 ? '종료' : '시작전',
          round2: students.some(s => s.assessments.some(a => a.round === 2)) ? '종료' : '시작전',
        },
        round2SubmittedCount: students.filter(
          s => s.assessments.some(a => a.round === 2)
        ).length,
        dgnssIds: {
          round1: dgnssId,
          round2: round2DgnssId,
        },
      },
    };
  } catch (error) {
    console.error('Failed to build class from API:', error);
    return null;
  }
}

// ============================================================
// L2 대시보드용 API 함수
// ============================================================

export interface L2DashboardData {
  examDetail: DgnssDetailResponse | null;
  studentInfoList: StudentInfoItem[];
  classTScores: number[];
  needAttention: NeedStudentsResponse;
  students: import('@/shared/types').Student[];
}

export async function fetchL2DashboardData(
  dgnssId: number,
  claId: string,
  schoolLevel: SchoolLevel,
  grade: number
): Promise<L2DashboardData> {
  const [examDetail, studentInfoList, classTScores, needAttention] = await Promise.all([
    fetchExamDetail(dgnssId),
    fetchStudentInfoList(dgnssId, '1', 1),
    fetchClassAnalysis(claId, '1', 1),
    fetchNeedAttentionStudents(dgnssId, '1'),
  ]);

  const studentAnalysisPromises = studentInfoList.map(async (info) => {
    const fullAnalysis = await fetchStudentFullAnalysis(info.stdtId, '1');
    return { info, fullAnalysis };
  });

  const studentResults = await Promise.all(studentAnalysisPromises);

  const students: import('@/shared/types').Student[] = studentResults
    .map(({ info, fullAnalysis }) => {
      const assessments: import('@/shared/types').Assessment[] = [];

      if (fullAnalysis.round1?.tScores) {
        assessments.push(
          convertToAssessment(info.stdtId, 1, fullAnalysis.round1, schoolLevel)
        );
      }

      if (fullAnalysis.round2?.tScores) {
        assessments.push(
          convertToAssessment(info.stdtId, 2, fullAnalysis.round2, schoolLevel)
        );
      }

      const infoReliabilityWarnings = getReliabilityWarnings(info);
      for (const assessment of assessments) {
        const merged = new Set([...assessment.reliabilityWarnings, ...infoReliabilityWarnings]);
        assessment.reliabilityWarnings = Array.from(merged);
      }

      return {
        id: info.stdtId,
        classId: claId,
        number: info.rowNum,
        name: `학생${info.rowNum}`,
        schoolLevel,
        grade,
        assessments,
      };
    });

  return {
    examDetail,
    studentInfoList,
    classTScores,
    needAttention,
    students,
  };
}
