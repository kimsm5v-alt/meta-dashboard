/**
 * 대시보드 API 서비스
 *
 * 엔드포인트:
 * - /etc/meta/tc/info: 교사 검사 목록
 * - /etc/meta/tc/detail: 검사 상세
 * - /etc/meta/tc/stinfolist: 학생 목록 + 신뢰도
 * - /etc/meta/tc/analysis: 학급 평균 T점수
 * - /etc/meta/tc/need: 관심 필요 학생
 * - /etc/meta/st/total/analysis: 학생 개별 T점수
 */

import { apiRequest } from './apiClient';
import type { SchoolLevel, StudentType } from '@shared/types';
import { classifyStudent, getTypeDeviations } from '@shared/utils/lpaClassifier';
import { checkAttention } from '@shared/utils/attentionChecker';

// ============================================================
// API 응답 타입
// ============================================================

export interface DgnssInfoItem {
  dgnssId: number;
  paperIdx: string;
  ordNo: number;
  claId: string;
  tcId: string;
  dgnssAt: 'Y' | 'N';
  dgnssStDt: string;
  dgnssEdDt: string | null;
  stTotalCnt: number;
  stSubmCnt: number;
  notDgnssStartCnt: number;
  notDgnssStartList: string | null;
}

export interface DgnssInfoResponse {
  dgnssInfo: DgnssInfoItem[];
}

export interface DgnssDetailResponse {
  dgnssId: number;
  paperIdx: string;
  ordNo: number;
  num: number;
  dgnssAt: 'Y' | 'N';
  dgnssStDt: string;
  dgnssEdDt: string | null;
  stTotalCnt: number;
  stSubmCnt: number;
  dgnssText: string | null;
  notSubmStdtId: string | null;
  notSubmStdtName: string | null;
}

export interface StudentInfoItem {
  stdtId: string;
  stdtNm?: string;
  nickname?: string;
  answerIdx: number;
  rowNum: number;
  gender: string;
  reason: string;
  reaction: string;
  repeatResponse: 'Y' | 'N';
  desirable: string;
  styTime: string;
  styPer: string;
  satisPer: string;
  cnsl: string;
}

export interface StudentInfoListResponse {
  type: number;
  stInfoList: StudentInfoItem[];
}

export interface NeedStudentsResponse {
  reaction: Array<{ num: number; stdtId: string }>;
  repeatResponse: Array<{ num: number; stdtId: string }>;
  desirable: Array<{ num: number; stdtId: string }>;
  etcInfo: Record<string, Array<{ num: number; stdtId: string }>>;
}

export interface AnalysisSectionItem {
  ord_no: number;
  SECTION_ID: string;
  SECTION_NM: string;
  DEPTH: number;
  tScore: number;
  id?: number;
  dgnssResultId?: number;
  reaction?: string;
  repeatResponse?: string;
  desirable?: string;
}

export interface LpaTopData {
  lpaClassId?: string | null;
  lpaTypeName?: string | null;
  lpaConfidence?: number | null;
  lpaStatus?: string | null;
}

export type AnalysisResponse = Record<string, AnalysisSectionItem[]>;

// 백엔드 lpaTypeName → 프론트엔드 StudentType 정규화 매핑
// 백엔드는 공백 포함 또는 긴 이름(냉소적 무기력형)으로 반환하므로 정규화 필요
const LPA_TYPE_NAME_MAP: Record<string, string> = {
  // 초등
  자원소진형: '자원소진형',
  '안전 균형형': '안전균형형',
  안전균형형: '안전균형형',
  '몰입자원 풍부형': '몰입자원풍부형',
  몰입자원풍부형: '몰입자원풍부형',
  // 중등
  '냉소적 무기력형': '무기력형',
  무기력형: '무기력형',
  '정서조절 취약형': '정서조절취약형',
  정서조절취약형: '정서조절취약형',
  '자기주도 몰입형': '자기주도몰입형',
  자기주도몰입형: '자기주도몰입형',
};

const normalizeLpaTypeName = (typeName: string | null | undefined): string | null => {
  if (!typeName) return null;
  return LPA_TYPE_NAME_MAP[typeName] ?? null;
};

// ============================================================
// SECTION_ID → 요인 인덱스 매핑
// ============================================================

const SECTION_ID_TO_INDEX: Record<string, number> = {
  // 자아강점 (0-6)
  '10-22-01-01-01-0': 0, // 자아존중감
  '10-22-01-01-02-0': 1, // 자기효능감
  '10-22-01-01-03-0': 2, // 성장마인드셋
  '10-22-01-02-01-0': 3, // 자기정서인식
  '10-22-01-02-02-0': 4, // 자기정서조절
  '10-22-01-02-03-0': 5, // 타인정서인식
  '10-22-01-02-04-0': 6, // 타인공감능력

  // 학습디딤돌 (7-18)
  '10-22-02-01-01-0': 7, // 계획능력
  '10-22-02-01-02-0': 8, // 점검능력
  '10-22-02-01-03-0': 9, // 조절능력
  '10-22-02-02-01-0': 10, // 공부환경
  '10-22-02-02-02-0': 11, // 시간관리
  '10-22-02-02-03-0': 12, // 수업태도
  '10-22-02-02-04-0': 13, // 노트하기
  '10-22-02-02-05-0': 14, // 시험준비
  '10-22-02-03-01-0': 15, // 부모 의사소통
  '10-22-02-03-02-0': 16, // 부모 학업지지
  '10-22-02-03-03-0': 17, // 친구 정서지지
  '10-22-02-03-04-0': 18, // 교사 정서지지

  // 긍정적공부마음 (19-24) — FIX: 활기/몰두/의미감이 19-21, 자율성/유능성/관계성이 22-24
  '10-22-04-01-01-0': 19, // 활기 (학업열의)
  '10-22-04-01-02-0': 20, // 몰두 (학업열의)
  '10-22-04-01-03-0': 21, // 의미감 (학업열의)
  '10-22-04-02-01-0': 22, // 자율성 (성장력)
  '10-22-04-02-02-0': 23, // 유능성 (성장력)
  '10-22-04-02-03-0': 24, // 관계성 (성장력)

  // 학습걸림돌 (25-34) — FIX: 학업스트레스가 25-27, 학습방해물이 28-29, 학업관계스트레스가 30-34
  '10-22-03-01-01-0': 25, // 성적부담 (학업스트레스)
  '10-22-03-01-02-0': 26, // 공부부담 (학업스트레스)
  '10-22-03-01-03-0': 27, // 수업부담 (학업스트레스)
  '10-22-03-03-01-0': 28, // 스마트폰 의존 (학습방해물)
  '10-22-03-03-02-0': 29, // 게임 과몰입 (학습방해물)
  '10-22-03-02-01-0': 30, // 부모 성적압력 (학업관계스트레스)
  '10-22-03-02-02-0': 31, // 부모 공부부담 (학업관계스트레스)
  '10-22-03-02-03-0': 32, // 친구 공부비교 (학업관계스트레스)
  '10-22-03-02-04-0': 33, // 교사 성적압력 (학업관계스트레스)
  '10-22-03-02-05-0': 34, // 교사 수업부담 (학업관계스트레스)

  // 부정적공부마음 (35-37)
  '10-22-05-01-01-0': 35, // 고갈 (학업소진)
  '10-22-05-01-02-0': 36, // 무능감 (학업소진)
  '10-22-05-01-03-0': 37, // 반감-냉소 (학업소진)
};

// ============================================================
// DEPTH=4 (중분류) 데이터 추출
// ============================================================

const MID_CATEGORY_SECTION_ID_MAP: Record<string, string> = {
  '10-22-01-01-0-0': '긍정적자아',
  '10-22-01-02-0-0': '대인관계능력',
  '10-22-02-01-0-0': '메타인지',
  '10-22-02-02-0-0': '학습기술',
  '10-22-02-03-0-0': '지지적관계',
  '10-22-04-01-0-0': '학업열의',
  '10-22-04-02-0-0': '성장력',
  '10-22-03-01-0-0': '학업스트레스',
  '10-22-03-03-0-0': '학습방해물',
  '10-22-03-02-0-0': '학업관계스트레스',
  '10-22-05-01-0-0': '학업소진',
};

function extractMidCategoryScores(sections: AnalysisSectionItem[]): Record<string, number> | null {
  const midScores: Record<string, number> = {};
  let foundAny = false;

  for (const section of sections) {
    if (section.DEPTH !== 4) continue;

    const normalizedKey = MID_CATEGORY_SECTION_ID_MAP[section.SECTION_ID];
    if (normalizedKey) {
      midScores[normalizedKey] = section.tScore;
      foundAny = true;
    }
  }

  return foundAny ? midScores : null;
}

function convertSectionsToTScores(sections: AnalysisSectionItem[]): number[] {
  const tScores: number[] = new Array(38).fill(50);

  for (const section of sections) {
    if (section.DEPTH !== 5) continue;

    const index = SECTION_ID_TO_INDEX[section.SECTION_ID];
    if (index !== undefined) {
      tScores[index] = Math.round(section.tScore);
    }
  }

  return tScores;
}

function getReliabilityWarnings(info: StudentInfoItem | AnalysisSectionItem): string[] {
  const warnings: string[] = [];

  if ('reaction' in info && info.reaction === '주의') {
    warnings.push('반응일관성');
  }
  if ('desirable' in info && info.desirable === '주의') {
    warnings.push('사회적바람직성');
  }
  if ('repeatResponse' in info && info.repeatResponse === 'Y') {
    warnings.push('연속동일반응');
  }

  return warnings;
}

// ============================================================
// API 함수
// ============================================================

export async function fetchTeacherExams(
  claId: string,
  _tcId: string,
  paperIdx?: string,
): Promise<DgnssInfoItem[]> {
  let url = `/api/dgnss/tc/info?claId=${claId}`;
  if (paperIdx) {
    url += `&paperIdx=${paperIdx}`;
  }

  const response = await apiRequest<DgnssInfoResponse>(url);
  // 응답이 배열인 경우와 { dgnssInfo: [...] } 형태 모두 처리
  const data = response.resultData;
  if (Array.isArray(data)) return data;
  return (data as DgnssInfoResponse).dgnssInfo ?? [];
}

export async function fetchExamDetail(dgnssId: number): Promise<DgnssDetailResponse | null> {
  const response = await apiRequest<DgnssDetailResponse>(`/api/dgnss/tc/detail?dgnssId=${dgnssId}`);
  return response.resultData;
}

export async function fetchStudentInfoList(
  dgnssId: number,
  paperIdx: string = '1',
  type: number = 1,
): Promise<StudentInfoItem[]> {
  const response = await apiRequest<StudentInfoListResponse>(
    `/api/dgnss/tc/stinfolist?dgnssId=${dgnssId}&paperIdx=${paperIdx}&type=${type}`,
  );
  const data = response.resultData;
  if (Array.isArray(data)) return data as unknown as StudentInfoItem[];
  return (data as StudentInfoListResponse).stInfoList ?? [];
}

export async function fetchNeedAttentionStudents(
  dgnssId: number,
  paperIdx: string = '1',
): Promise<NeedStudentsResponse> {
  const response = await apiRequest<NeedStudentsResponse>(
    `/api/dgnss/tc/need?dgnssId=${dgnssId}&paperIdx=${paperIdx}`,
  );
  return response.resultData;
}

export async function fetchClassAnalysis(
  claId: string,
  paperIdx: string = '1',
  ordNo: number = 1,
): Promise<number[]> {
  const response = await apiRequest<AnalysisResponse>(
    `/api/dgnss/tc/analysis?claId=${claId}&paperIdx=${paperIdx}&ordNo=${ordNo}`,
  );

  const roundData = response.resultData[String(ordNo)];
  if (!roundData) {
    return new Array(38).fill(50);
  }

  return convertSectionsToTScores(roundData);
}

export async function fetchClassAnalysisRaw(
  claId: string,
  paperIdx: string = '1',
  ordNo: number = 1,
): Promise<AnalysisSectionItem[]> {
  const response = await apiRequest<AnalysisResponse>(
    `/api/dgnss/tc/analysis?claId=${claId}&paperIdx=${paperIdx}&ordNo=${ordNo}`,
  );

  return response.resultData[String(ordNo)] ?? [];
}

export async function fetchStudentAnalysis(
  classId: string,
  stdtId: string,
  paperIdx: string = '1',
  ordNo: number = 1,
): Promise<{
  tScores: number[];
  reliabilityWarnings: string[];
  sections: AnalysisSectionItem[];
  lpaTypeName: string | null;
  midCategoryScores: Record<string, number> | null;
}> {
  const response = await apiRequest<AnalysisResponse>(
    `/api/dgnss/st/analysis?claId=${classId}&stdtId=${stdtId}&paperIdx=${paperIdx}&ordNo=${ordNo}`,
  );

  // lpaTop에서 백엔드가 계산한 유형명 추출 (타입 우회 필요: lpaTop은 AnalysisSectionItem[]가 아님)
  const rawResultData = response.resultData as Record<string, unknown>;
  const lpaTopMap = rawResultData['lpaTop'] as Record<string, LpaTopData> | undefined;
  const rawLpaTypeName = lpaTopMap?.[String(ordNo)]?.lpaTypeName ?? null;
  // 백엔드 타입명 → 프론트엔드 StudentType 정규화 (공백 제거, 약칭 매핑)
  const lpaTypeName = normalizeLpaTypeName(rawLpaTypeName);

  const roundData = response.resultData[String(ordNo)];
  if (!roundData || roundData.length === 0) {
    return {
      tScores: new Array(38).fill(50),
      reliabilityWarnings: [],
      sections: [],
      lpaTypeName,
      midCategoryScores: null,
    };
  }

  const tScores = convertSectionsToTScores(roundData);
  const reliabilityWarnings = getReliabilityWarnings(roundData[0]);
  const midCategoryScores = extractMidCategoryScores(roundData);

  return {
    tScores,
    reliabilityWarnings,
    sections: roundData,
    lpaTypeName,
    midCategoryScores,
  };
}

export async function fetchStudentFullAnalysis(
  classId: string,
  stdtId: string,
  paperIdx: string = '1',
): Promise<{
  round1: {
    tScores: number[];
    reliabilityWarnings: string[];
    lpaTypeName: string | null;
    midCategoryScores: Record<string, number> | null;
  } | null;
  round2: {
    tScores: number[];
    reliabilityWarnings: string[];
    lpaTypeName: string | null;
    midCategoryScores: Record<string, number> | null;
  } | null;
}> {
  const [r1Result, r2Result] = await Promise.allSettled([
    fetchStudentAnalysis(classId, stdtId, paperIdx, 1),
    fetchStudentAnalysis(classId, stdtId, paperIdx, 2),
  ]);

  const hasValidR1 =
    r1Result.status === 'fulfilled' &&
    r1Result.value.tScores &&
    Array.isArray(r1Result.value.tScores) &&
    r1Result.value.tScores.some((t) => t !== 50);

  const hasValidR2 =
    r2Result.status === 'fulfilled' &&
    r2Result.value.tScores &&
    Array.isArray(r2Result.value.tScores) &&
    r2Result.value.tScores.some((t) => t !== 50);

  return {
    round1:
      hasValidR1 && r1Result.status === 'fulfilled'
        ? {
            tScores: r1Result.value.tScores,
            reliabilityWarnings: r1Result.value.reliabilityWarnings,
            lpaTypeName: r1Result.value.lpaTypeName,
            midCategoryScores: r1Result.value.midCategoryScores,
          }
        : null,
    round2:
      hasValidR2 && r2Result.status === 'fulfilled'
        ? {
            tScores: r2Result.value.tScores,
            reliabilityWarnings: r2Result.value.reliabilityWarnings,
            lpaTypeName: r2Result.value.lpaTypeName,
            midCategoryScores: r2Result.value.midCategoryScores,
          }
        : null,
  };
}

// ============================================================
// 데이터 변환 유틸리티
// ============================================================

export function convertToAssessment(
  studentId: string,
  round: 1 | 2,
  data:
    | {
        tScores: number[];
        reliabilityWarnings: string[];
        lpaTypeName?: string | null;
        midCategoryScores?: Record<string, number> | null;
      }
    | null
    | undefined,
  schoolLevel: SchoolLevel,
): import('@shared/types').Assessment {
  const tScores = data?.tScores;
  const reliabilityWarnings = data?.reliabilityWarnings ?? [];
  const midCategoryScores = data?.midCategoryScores ?? null;

  const safeTScores =
    tScores && Array.isArray(tScores) && tScores.length === 38 ? tScores : new Array(38).fill(50);

  const classification = classifyStudent(safeTScores, schoolLevel);
  // 백엔드가 계산한 유형명이 있으면 우선 사용, 없으면 프론트엔드 재계산 결과 사용
  const predictedType = (data?.lpaTypeName ?? classification.predictedType) as StudentType;
  const deviations = getTypeDeviations(safeTScores, predictedType, schoolLevel, 3);
  const attentionResult = checkAttention(safeTScores);

  return {
    id: `${studentId}-r${round}`,
    studentId,
    round,
    assessedAt: new Date(),
    tScores: safeTScores,
    predictedType,
    typeConfidence: classification.confidence,
    typeProbabilities: classification.allProbabilities,
    deviations,
    reliabilityWarnings,
    attentionResult,
    midCategoryScores,
  };
}

export async function buildClassFromAPI(
  claId: string,
  grade: number,
  classNumber: number,
  schoolLevel: SchoolLevel,
  dgnssId: number,
  round2DgnssId?: number,
): Promise<import('@shared/types').Class | null> {
  try {
    const studentInfoList = await fetchStudentInfoList(dgnssId, '1', 1);
    if (studentInfoList.length === 0) {
      return null;
    }

    const studentPromises = studentInfoList.map(async (info) => {
      const fullAnalysis = await fetchStudentFullAnalysis(claId, info.stdtId, '1');
      return { info, fullAnalysis };
    });

    const studentResults = await Promise.all(studentPromises);

    const students: import('@shared/types').Student[] = studentResults
      .filter(({ fullAnalysis }) => {
        const hasValidR1 =
          fullAnalysis.round1?.tScores && Array.isArray(fullAnalysis.round1.tScores);
        const hasValidR2 =
          fullAnalysis.round2?.tScores && Array.isArray(fullAnalysis.round2.tScores);
        return hasValidR1 || hasValidR2;
      })
      .map(({ info, fullAnalysis }) => {
        const assessments: import('@shared/types').Assessment[] = [];

        if (fullAnalysis.round1?.tScores) {
          assessments.push(convertToAssessment(info.stdtId, 1, fullAnalysis.round1, schoolLevel));
        }

        if (fullAnalysis.round2?.tScores) {
          assessments.push(convertToAssessment(info.stdtId, 2, fullAnalysis.round2, schoolLevel));
        }

        return {
          id: info.stdtId,
          classId: claId,
          number: info.rowNum,
          name: info.stdtNm ?? info.nickname ?? `학생${info.rowNum}`,
          schoolLevel,
          grade,
          assessments,
        };
      });

    const assessedStudents = students.filter((s) => s.assessments.length > 0).length;
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
        (typeDistribution[type].count / assessedStudents) * 100,
      );
    }

    const needAttentionCount = students.filter((s) =>
      s.assessments.some((a) => a.attentionResult.needsAttention),
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
        round2Completed: students.some((s) => s.assessments.some((a) => a.round === 2)),
        examStatus: {
          round1: assessedStudents > 0 ? '종료' : '시작전',
          round2: students.some((s) => s.assessments.some((a) => a.round === 2))
            ? '종료'
            : '시작전',
        },
        round2SubmittedCount: students.filter((s) => s.assessments.some((a) => a.round === 2))
          .length,
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
  students: import('@shared/types').Student[];
}

export async function fetchL2DashboardData(
  dgnssId: number,
  claId: string,
  schoolLevel: SchoolLevel,
  grade: number,
): Promise<L2DashboardData> {
  const [examDetail, studentInfoList, classTScores, needAttention] = await Promise.all([
    fetchExamDetail(dgnssId),
    fetchStudentInfoList(dgnssId, '1', 1),
    fetchClassAnalysis(claId, '1', 1),
    fetchNeedAttentionStudents(dgnssId, '1'),
  ]);

  const studentAnalysisPromises = studentInfoList.map(async (info) => {
    const fullAnalysis = await fetchStudentFullAnalysis(claId, info.stdtId, '1');
    return { info, fullAnalysis };
  });

  const studentResults = await Promise.all(studentAnalysisPromises);

  const students: import('@shared/types').Student[] = studentResults.map(
    ({ info, fullAnalysis }) => {
      const assessments: import('@shared/types').Assessment[] = [];

      if (fullAnalysis.round1?.tScores) {
        assessments.push(convertToAssessment(info.stdtId, 1, fullAnalysis.round1, schoolLevel));
      }

      if (fullAnalysis.round2?.tScores) {
        assessments.push(convertToAssessment(info.stdtId, 2, fullAnalysis.round2, schoolLevel));
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
        name: info.stdtNm ?? info.nickname ?? `학생${info.rowNum}`,
        schoolLevel,
        grade,
        assessments,
      };
    },
  );

  return {
    examDetail,
    studentInfoList,
    classTScores,
    needAttention,
    students,
  };
}
