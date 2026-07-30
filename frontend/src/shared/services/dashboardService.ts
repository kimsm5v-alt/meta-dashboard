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
import type {
  Assessment,
  Class,
  SchoolLevel,
  SchoolLevelCode,
  Student,
  StudentType,
} from '@shared/types';
import { classifyStudent, getTypeDeviations } from '@shared/utils/lpaClassifier';
import { checkAttention } from '@shared/utils/attentionChecker';
import { createSubmittedStudentIdSet, hasSubmittedRound } from './roundSubmissions';

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
  lpaTop1TypeName?: string | null;
  lpaTop1Probability?: number | null;
  lpaTop2TypeName?: string | null;
  lpaTop2Probability?: number | null;
  lpaTop3TypeName?: string | null;
  lpaTop3Probability?: number | null;
  answerIdx?: number | null;
}

export type AnalysisResponse = Record<string, AnalysisSectionItem[]>;

// ============================================================
// Neo4j 지식그래프 추천 타입 (2026-04-27 추가)
// ============================================================

export interface ModerationPath {
  id: string;
  pathType: string;
  x: string;
  z: string;
  y?: string;
  strategy: string;
  keywordInterp?: string;
  keywordStrat?: string;
  interpretation?: string;
  pathColor?: string;
  className?: string;
  schoolLevel?: string;
  classDescription?: string;
  category?: string; // '강점' | '보완점'
  zFactorType?: 'positive' | 'negative'; // Z 요인 성질
}

export interface Weakness {
  factorName: string;
  factorType: 'positive' | 'negative';
  individualT: number;
  groupT: number;
  deviation: number;
  direction: 'positive' | 'negative';
}

export interface Strength {
  factorName: string;
  factorType: 'positive' | 'negative';
  individualT: number;
  groupT: number;
  deviation: number;
  direction: 'positive' | 'negative';
}

export interface GraphRecommendation {
  answerIdx: number;
  lpa: {
    answerIdx?: number;
    dgnssResultId?: number;
    schoolLevel: string;
    classId?: string;
    typeName: string;
    confidence?: number;
    probabilitiesJson?: string;
    status?: string;
  };
  recommendationCount: number;
  moderationPaths: ModerationPath[];
  strengths?: Strength[];
  weaknesses?: Weakness[];
}

export type RecommendationByOrd = Record<string, GraphRecommendation>;

// 백엔드 lpaTypeName → 프론트엔드 StudentType 정규화 매핑
// 붙여쓰기/긴 이름 등 다양한 형식 → 표준 띄어쓰기 형식으로 통일
const LPA_TYPE_NAME_MAP: Record<string, string> = {
  // 초등
  자원소진형: '자원소진형',
  '안전 균형형': '안전 균형형',
  안전균형형: '안전 균형형',
  '몰입자원 풍부형': '몰입자원 풍부형',
  몰입자원풍부형: '몰입자원 풍부형',
  // 중등
  '냉소적 무기력형': '냉소적 무기력형',
  무기력형: '냉소적 무기력형',
  '정서조절 취약형': '정서조절 취약형',
  정서조절취약형: '정서조절 취약형',
  '자기주도 몰입형': '자기주도 몰입형',
  자기주도몰입형: '자기주도 몰입형',
};

const normalizeLpaTypeName = (typeName: string | null | undefined): string | null => {
  if (!typeName) return null;
  return LPA_TYPE_NAME_MAP[typeName] ?? null;
};

// API lpaTop1/2/3 확률을 { 유형명: 확률 } 형태로 변환
function buildApiTypeProbabilities(lpaTopData: LpaTopData): Record<string, number> | null {
  const entries: [string | null | undefined, number | null | undefined][] = [
    [lpaTopData.lpaTop1TypeName, lpaTopData.lpaTop1Probability],
    [lpaTopData.lpaTop2TypeName, lpaTopData.lpaTop2Probability],
    [lpaTopData.lpaTop3TypeName, lpaTopData.lpaTop3Probability],
  ];
  const result: Record<string, number> = {};
  for (const [typeName, prob] of entries) {
    if (!typeName || prob == null) continue;
    const normalized = normalizeLpaTypeName(typeName) ?? typeName;
    result[normalized] = Math.round(prob * 10) / 10;
  }
  return Object.keys(result).length > 0 ? result : null;
}

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

// ============================================================
// 자기조절학습검사(paperIdx='2') SECTION_ID → 요인 인덱스 매핑 (20개)
// shared/data/selfregFactors.ts의 index 순서와 일치
// ============================================================

const SELFREG_SECTION_ID_TO_INDEX: Record<string, number> = {
  // 동기전략
  '20-22-01-01-01-0': 0, // 성장마인드셋
  '20-22-01-01-02-0': 1, // 학업효능감
  '20-22-01-01-03-0': 2, // 학습동기
  '20-22-01-02-01-0': 3, // 성적부담조절
  '20-22-01-02-02-0': 4, // 공부부담조절
  '20-22-01-02-03-0': 5, // 실패부담조절
  // 인지전략
  '20-22-02-01-01-0': 6, // 계획능력
  '20-22-02-01-02-0': 7, // 점검능력
  '20-22-02-01-03-0': 8, // 조절능력
  '20-22-02-02-01-0': 9, // 이해기술
  '20-22-02-02-02-0': 10, // 기억기술
  '20-22-02-02-03-0': 11, // 집중기술
  // 행동전략
  '20-22-03-01-01-0': 12, // 자기칭찬
  '20-22-03-01-02-0': 13, // 도움구하기
  '20-22-03-01-03-0': 14, // 학습지속성
  '20-22-03-02-01-0': 15, // 공부환경
  '20-22-03-02-02-0': 16, // 시간관리
  '20-22-03-02-03-0': 17, // 수업태도
  '20-22-03-02-04-0': 18, // 노트하기
  '20-22-03-02-05-0': 19, // 시험준비
};

function convertSelfregSectionsToTScores(sections: AnalysisSectionItem[]): number[] {
  const tScores: number[] = new Array(20).fill(50);

  for (const section of sections) {
    if (section.DEPTH !== 5) continue;

    const index = SELFREG_SECTION_ID_TO_INDEX[section.SECTION_ID];
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

/**
 * 자기조절 반 집계 응답의 명명 키 → 요인 인덱스 (0~19)
 * 교사 tc/analysis 는 학생 st/analysis(SECTION_ID 배열)와 달리 명명 키 객체를 반환한다.
 * selfregFactors.ts의 index 순서와 일치.
 */
const SELFREG_CLASS_KEYS: string[] = [
  // 동기전략
  'mindSet', // 0 성장마인드셋
  'efficacy', // 1 학업효능감
  'motivation', // 2 학습동기
  'gradeLvl', // 3 성적부담조절
  'styLvl', // 4 공부부담조절
  'failLvl', // 5 실패부담조절
  // 인지전략
  'planAbil', // 6 계획능력
  'inspecAbil', // 7 점검능력
  'contrlAbil', // 8 조절능력
  'compreSkil', // 9 이해기술
  'memrySkil', // 10 기억기술
  'intenSkil', // 11 집중기술
  // 행동전략
  'selfPraise', // 12 자기칭찬
  'help', // 13 도움구하기
  'lrnConti', // 14 학습지속성
  'styEnvi', // 15 공부환경
  'timeCtrl', // 16 시간관리
  'styAtti', // 17 수업태도
  'note', // 18 노트하기
  'test', // 19 시험준비
];

/**
 * 자기조절학습검사(paperIdx='2') 반 평균 분석
 * 20개 요인 class-average T-score 반환 (값이 없으면 null)
 */
export async function fetchSelfregClassAnalysis(
  claId: string,
  ordNo: number = 1,
): Promise<number[] | null> {
  const response = await apiRequest<AnalysisResponse>(
    `/api/dgnss/tc/analysis?claId=${claId}&paperIdx=2&ordNo=${ordNo}`,
  );

  // 반 집계는 명명 키 객체 형태 (배열 아님)
  const roundData = response.resultData[String(ordNo)] as unknown as
    | Record<string, number>
    | undefined;
  if (!roundData || typeof roundData !== 'object') return null;

  const tScores = SELFREG_CLASS_KEYS.map((key) => {
    const v = roundData[key];
    return typeof v === 'number' ? Math.round(v) : 50;
  });

  // 전부 기본값(50)이면 데이터 없음으로 간주
  if (!tScores.some((t) => t !== 50)) return null;
  return tScores;
}

export async function fetchStudentAnalysis(
  classId: string,
  stdtId: string,
  paperIdx: string = '1',
  ordNo: number = 1,
  graphYn: 'Y' | 'N' = 'N',
): Promise<{
  tScores: number[];
  reliabilityWarnings: string[];
  sections: AnalysisSectionItem[];
  lpaTypeName: string | null;
  midCategoryScores: Record<string, number> | null;
  recommendations?: RecommendationByOrd;
}> {
  const response = await apiRequest<AnalysisResponse>(
    `/api/dgnss/st/analysis?claId=${classId}&stdtId=${stdtId}&paperIdx=${paperIdx}&ordNo=${ordNo}&graphYn=${graphYn}`,
  );

  // lpaTop에서 백엔드가 계산한 유형명 추출 (타입 우회 필요: lpaTop은 AnalysisSectionItem[]가 아님)
  const rawResultData = response.resultData as Record<string, unknown>;
  const lpaTopMap = rawResultData['lpaTop'] as Record<string, LpaTopData> | undefined;
  const rawLpaTypeName = lpaTopMap?.[String(ordNo)]?.lpaTypeName ?? null;
  // 백엔드 타입명 → 프론트엔드 StudentType 정규화 (공백 제거, 약칭 매핑)
  const lpaTypeName = normalizeLpaTypeName(rawLpaTypeName);

  // Neo4j 지식그래프 추천 추출 (graphYn=Y인 경우에만 존재)
  const recommendationByOrd = rawResultData['recommendationByOrd'] as
    | RecommendationByOrd
    | undefined;

  const roundData = response.resultData[String(ordNo)];
  if (!roundData || roundData.length === 0) {
    return {
      tScores: new Array(38).fill(50),
      reliabilityWarnings: [],
      sections: [],
      lpaTypeName,
      midCategoryScores: null,
      recommendations: recommendationByOrd,
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
    recommendations: recommendationByOrd,
  };
}

export async function fetchStudentFullAnalysis(
  classId: string,
  stdtId: string,
  paperIdx: string = '1',
  graphYn: 'Y' | 'N' = 'N',
): Promise<{
  round1: {
    tScores: number[];
    reliabilityWarnings: string[];
    lpaTypeName: string | null;
    apiTypeProbabilities: Record<string, number> | null;
    midCategoryScores: Record<string, number> | null;
    answerIdx: number | null;
    recommendations?: RecommendationByOrd;
  } | null;
  round2: {
    tScores: number[];
    reliabilityWarnings: string[];
    lpaTypeName: string | null;
    apiTypeProbabilities: Record<string, number> | null;
    midCategoryScores: Record<string, number> | null;
    answerIdx: number | null;
    recommendations?: RecommendationByOrd;
  } | null;
}> {
  const response = await apiRequest<AnalysisResponse>(
    `/api/dgnss/st/analysis?claId=${classId}&stdtId=${stdtId}&paperIdx=${paperIdx}&ordNo=2&graphYn=${graphYn}`,
  );

  const rawResultData = response.resultData as Record<string, unknown>;
  const lpaTopMap = rawResultData['lpaTop'] as Record<string, LpaTopData> | undefined;
  const recommendationByOrd = rawResultData['recommendationByOrd'] as
    | RecommendationByOrd
    | undefined;

  const parseRound = (
    ordNo: 1 | 2,
  ): {
    tScores: number[];
    reliabilityWarnings: string[];
    lpaTypeName: string | null;
    apiTypeProbabilities: Record<string, number> | null;
    midCategoryScores: Record<string, number> | null;
    answerIdx: number | null;
    recommendations?: RecommendationByOrd;
  } | null => {
    const roundData = response.resultData[String(ordNo)];
    if (!roundData || roundData.length === 0) return null;

    const tScores = convertSectionsToTScores(roundData);
    if (!tScores.some((t) => t !== 50)) return null;

    const lpaTopEntry = lpaTopMap?.[String(ordNo)];
    const recEntry = recommendationByOrd?.[String(ordNo)] as GraphRecommendation | undefined;
    const rawLpaTypeName = lpaTopEntry?.lpaTypeName ?? null;
    const apiTypeProbabilities = lpaTopEntry ? buildApiTypeProbabilities(lpaTopEntry) : null;
    return {
      tScores,
      reliabilityWarnings: getReliabilityWarnings(roundData[0]),
      lpaTypeName: normalizeLpaTypeName(rawLpaTypeName),
      apiTypeProbabilities,
      midCategoryScores: extractMidCategoryScores(roundData),
      answerIdx: lpaTopEntry?.answerIdx ?? recEntry?.answerIdx ?? null,
      recommendations: recommendationByOrd,
    };
  };

  return {
    round1: parseRound(1),
    round2: parseRound(2),
  };
}

// ============================================================
// 자기조절학습검사(paperIdx='2') 분석 조회
// 종합검사와 달리 20개 요인, LPA 유형 없음
// ============================================================

export interface SelfregRoundAnalysis {
  /** 자기조절 20개 요인 T-score (index 0~19) */
  tScores: number[];
  reliabilityWarnings: string[];
  answerIdx: number | null;
}

export async function fetchSelfregFullAnalysis(
  classId: string,
  stdtId: string,
  graphYn: 'Y' | 'N' = 'N',
): Promise<{ round1: SelfregRoundAnalysis | null; round2: SelfregRoundAnalysis | null }> {
  const response = await apiRequest<AnalysisResponse>(
    `/api/dgnss/st/analysis?claId=${classId}&stdtId=${stdtId}&paperIdx=2&ordNo=2&graphYn=${graphYn}`,
  );

  const rawResultData = response.resultData as Record<string, unknown>;
  const lpaTopMap = rawResultData['lpaTop'] as Record<string, LpaTopData> | undefined;
  const recommendationByOrd = rawResultData['recommendationByOrd'] as
    | RecommendationByOrd
    | undefined;

  const parseRound = (ordNo: 1 | 2): SelfregRoundAnalysis | null => {
    const roundData = response.resultData[String(ordNo)];
    if (!roundData || roundData.length === 0) return null;

    const tScores = convertSelfregSectionsToTScores(roundData);
    if (!tScores.some((t) => t !== 50)) return null;

    const lpaTopEntry = lpaTopMap?.[String(ordNo)];
    const recEntry = recommendationByOrd?.[String(ordNo)] as GraphRecommendation | undefined;
    return {
      tScores,
      reliabilityWarnings: getReliabilityWarnings(roundData[0]),
      answerIdx: lpaTopEntry?.answerIdx ?? recEntry?.answerIdx ?? null,
    };
  };

  return {
    round1: parseRound(1),
    round2: parseRound(2),
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
        apiTypeProbabilities?: Record<string, number> | null;
        midCategoryScores?: Record<string, number> | null;
        answerIdx?: number | null;
      }
    | null
    | undefined,
  schoolLevel: SchoolLevel,
): Assessment {
  const tScores = data?.tScores;
  const reliabilityWarnings = data?.reliabilityWarnings ?? [];
  const midCategoryScores = data?.midCategoryScores ?? null;

  const safeTScores =
    tScores && Array.isArray(tScores) && tScores.length === 38 ? tScores : new Array(38).fill(50);

  const classification = classifyStudent(safeTScores, schoolLevel);
  // 백엔드가 계산한 유형명이 있으면 우선 사용
  // lpaTypeName이 없으면 프론트엔드 계산값 사용 (고등학교는 "미지원")
  const predictedType = (data?.lpaTypeName || classification.predictedType) as StudentType;
  // API lpaTop 확률이 있으면 우선 사용 — 유형명과 확률 출처를 일치시켜 카드/도넛 불일치 방지
  const typeProbabilities = data?.apiTypeProbabilities ?? classification.allProbabilities;
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
    typeProbabilities,
    deviations,
    reliabilityWarnings,
    attentionResult,
    midCategoryScores,
    answerIdx: data?.answerIdx ?? null,
  };
}

/**
 * 자기조절학습검사(20요인) 전용 Assessment 변환
 * 종합검사와 달리 LPA 유형/도형 분류가 없으므로 유형 관련 필드는 비워둔다.
 */
export function convertSelfregToAssessment(
  studentId: string,
  round: 1 | 2,
  data: (SelfregRoundAnalysis & { answerIdx?: number | null }) | null | undefined,
): Assessment {
  const tScores =
    data?.tScores && Array.isArray(data.tScores) && data.tScores.length === 20
      ? data.tScores
      : new Array(20).fill(50);

  return {
    id: `${studentId}-r${round}`,
    studentId,
    round,
    assessedAt: new Date(),
    tScores,
    predictedType: '미지원' as StudentType, // 자기조절검사는 유형 미제공
    typeConfidence: 0,
    typeProbabilities: {},
    deviations: [],
    reliabilityWarnings: data?.reliabilityWarnings ?? [],
    attentionResult: { needsAttention: false, reasons: [] },
    midCategoryScores: null,
    answerIdx: data?.answerIdx ?? null,
  };
}

export async function buildClassFromAPI(
  claId: string,
  grade: number,
  classNumber: number,
  schoolLevel: SchoolLevel,
  dgnssId: number,
  round2DgnssId?: number,
  schoolLevelCode?: SchoolLevelCode,
): Promise<Class | null> {
  try {
    const studentInfoList = await fetchStudentInfoList(dgnssId, '1', 1);
    if (studentInfoList.length === 0) {
      return null;
    }

    const round2StudentInfoList = round2DgnssId
      ? round2DgnssId === dgnssId
        ? studentInfoList
        : await fetchStudentInfoList(round2DgnssId, '1', 1)
      : [];
    const round2SubmittedStudentIds = createSubmittedStudentIdSet(round2StudentInfoList);
    const hasRound1Exam = !round2DgnssId || round2DgnssId !== dgnssId;

    const studentPromises = studentInfoList.map(async (info) => {
      const fullAnalysis = await fetchStudentFullAnalysis(claId, info.stdtId, '1');
      return { info, fullAnalysis };
    });

    const studentResults = await Promise.all(studentPromises);

    const students: Student[] = studentResults
      .filter(({ info, fullAnalysis }) => {
        const hasValidR1 =
          hasRound1Exam &&
          fullAnalysis.round1?.tScores &&
          Array.isArray(fullAnalysis.round1.tScores);
        const hasValidR2 =
          round2DgnssId &&
          hasSubmittedRound(info.stdtId, round2SubmittedStudentIds) &&
          fullAnalysis.round2?.tScores &&
          Array.isArray(fullAnalysis.round2.tScores);
        return hasValidR1 || hasValidR2;
      })
      .map(({ info, fullAnalysis }) => {
        const assessments: Assessment[] = [];

        if (hasRound1Exam && fullAnalysis.round1?.tScores) {
          assessments.push(convertToAssessment(info.stdtId, 1, fullAnalysis.round1, schoolLevel));
        }

        if (
          round2DgnssId &&
          hasSubmittedRound(info.stdtId, round2SubmittedStudentIds) &&
          fullAnalysis.round2?.tScores
        ) {
          assessments.push(convertToAssessment(info.stdtId, 2, fullAnalysis.round2, schoolLevel));
        }

        return {
          id: info.stdtId,
          classId: claId,
          number: info.rowNum,
          name: info.stdtNm ?? info.nickname ?? `학생${info.rowNum}`,
          schoolLevel,
          schoolLevelCode,
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
    const round1SubmittedCount = students.filter((s) =>
      s.assessments.some((a) => a.round === 1),
    ).length;
    const round2SubmittedCount = students.filter((s) =>
      s.assessments.some((a) => a.round === 2),
    ).length;

    return {
      id: claId,
      schoolLevel,
      schoolLevelCode,
      grade,
      classNumber,
      teacherId: '',
      students,
      stats: {
        totalStudents: studentInfoList.length,
        assessedStudents,
        typeDistribution,
        needAttentionCount,
        round1Completed: round1SubmittedCount > 0,
        round2Completed: round2SubmittedCount > 0,
        examStatus: {
          round1: round1SubmittedCount > 0 ? '종료' : '시작전',
          round2: round2SubmittedCount > 0 ? '종료' : '시작전',
        },
        round2SubmittedCount,
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
  students: Student[];
}

export async function fetchL2DashboardData(
  dgnssId: number,
  claId: string,
  schoolLevel: SchoolLevel,
  grade: number,
  paperIdx: '1' | '2' = '1', // '1': 학습심리정서검사, '2': 자기조절학습검사
): Promise<L2DashboardData> {
  const isSelfreg = paperIdx === '2';

  // 자기조절검사(paperIdx=2)는 반/학생 집계 구조가 종합검사와 달라 전용 함수 사용
  const [examDetail, studentInfoList, classTScores, needAttention] = await Promise.all([
    fetchExamDetail(dgnssId),
    fetchStudentInfoList(dgnssId, paperIdx, 1),
    isSelfreg
      ? fetchSelfregClassAnalysis(claId, 1).then((r) => r ?? new Array(20).fill(50))
      : fetchClassAnalysis(claId, paperIdx, 1),
    fetchNeedAttentionStudents(dgnssId, paperIdx),
  ]);

  const students: Student[] = await Promise.all(
    studentInfoList.map(async (info) => {
      const assessments: Assessment[] = [];

      if (isSelfreg) {
        const selfreg = await fetchSelfregFullAnalysis(claId, info.stdtId);
        if (selfreg.round1?.tScores) {
          assessments.push(
            convertSelfregToAssessment(info.stdtId, 1, {
              ...selfreg.round1,
              answerIdx: selfreg.round1.answerIdx ?? info.answerIdx ?? null,
            }),
          );
        }
        if (selfreg.round2?.tScores) {
          assessments.push(convertSelfregToAssessment(info.stdtId, 2, selfreg.round2));
        }
      } else {
        const fullAnalysis = await fetchStudentFullAnalysis(claId, info.stdtId, paperIdx);
        if (fullAnalysis.round1?.tScores) {
          const r1data = {
            ...fullAnalysis.round1,
            answerIdx: fullAnalysis.round1.answerIdx ?? info.answerIdx ?? null,
          };
          assessments.push(convertToAssessment(info.stdtId, 1, r1data, schoolLevel));
        }
        if (fullAnalysis.round2?.tScores) {
          assessments.push(convertToAssessment(info.stdtId, 2, fullAnalysis.round2, schoolLevel));
        }
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
    }),
  );

  return {
    examDetail,
    studentInfoList,
    classTScores,
    needAttention,
    students,
  };
}
