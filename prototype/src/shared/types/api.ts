/**
 * 백엔드 API 응답 타입 정의
 * DB 스키마(aidt_diagnosis) 기반
 *
 * 향후 API 연동 시 이 파일의 타입들을 사용합니다.
 */

// ============================================================
// 1. 진단검사 마스터 (tb_dgnss_info)
// ============================================================

export interface APIDiagnosisInfo {
  id: number;
  cla_id: string; // 학급ID
  paper_idx: '1' | '2'; // 1: 종합검사, 2: 자기조절학습검사
  tc_id: string; // 교사ID
  ord_no: number; // 회차
  dgnss_at: 'Y' | 'N'; // 진단상태
  dgnss_st_dt: string; // 시작일시 (ISO 8601)
  dgnss_ed_dt: string | null; // 종료일시
}

// ============================================================
// 2. 학생별 검사 상세 (tb_dgnss_result_info)
// ============================================================

export interface APIStudentResult {
  id: number;
  dgnss_id: number;
  stdt_id: string;
  eak_stts_cd: EakStatusCode;
  eak_at: 'Y' | 'N';
  subm_at: 'Y' | 'N';
  subm_dt: string | null;
}

/** 응시상태 코드 */
export type EakStatusCode = 1 | 2 | 3 | 4 | 5;

export const EAK_STATUS_LABELS: Record<EakStatusCode, string> = {
  1: '응시전',
  2: '응시중',
  3: '제출완료',
  4: '채점중',
  5: '채점완료',
} as const;

// ============================================================
// 3. 응답지 (tb_dgnss_answer)
// ============================================================

export interface APIAnswer {
  ANSWER_IDX: number;
  DGNSS_RESULT_ID: number;
  DGNSS_ID: 'DGNSS_10' | 'DGNSS_20'; // 10: 종합검사, 20: 자기조절학습
  DGNSS_ORD: number;
  REPEATED_RESPONSE_YN: 'Y' | 'N'; // 연속동일반응 여부
  NO_ANS_CNT: number; // 무응답 개수
  COCH_DGNSS_QESITM01_MARK: string | null; // 반응일관성
  COCH_DGNSS_QESITM02_MARK: string | null; // 사회적바람직성
  COCH_DGNSS_QESITM03_SCORE: number | null; // 학업성취도
  COCH_DGNSS_QESITM04_SCORE: number | null; // 학업만족도
}

// ============================================================
// 4. T점수 결과 (tb_dgnss_answer_report)
// ============================================================

export interface APIAnswerReport {
  ANSWER_REPORT_IDX: number;
  ANSWER_IDX: number;
  SECTION_ID: string;
  DEPTH: ReportDepth;
  M_VALUE: number; // 원점수
  T_SCORE: number;
  T_RANK: string; // 등급 (A~E)
  T_SCRIPT: string; // 해석 텍스트
  P_RANK: number; // 백분위
  RANK_TOTAL: number | null; // 종합순위
}

/** 리포트 계층 */
export type ReportDepth = 3 | 4 | 5; // 3:대분류, 4:중분류, 5:소분류(요인)

// ============================================================
// 5. 섹션 분류표 (tb_dgnss_section)
// ============================================================

export interface APISection {
  SECTION_ID: string;
  SECTION_NM: string; // 섹션명 (약어)
  SECTION_NM_FULL: string; // 섹션명 (전체)
  DEPTH: number;
  OP_DEFINITION: string; // 조작적 정의
  M_VALUE_E: number; // 초등 평균
  SD_VALUE_E: number; // 초등 표준편차
  M_VALUE_M: number; // 중등 평균
  SD_VALUE_M: number; // 중등 표준편차
}

// ============================================================
// API 응답 래퍼 타입
// ============================================================

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface APIPaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ============================================================
// 변환 유틸리티 타입
// ============================================================

/**
 * API 응답 → 프론트엔드 타입 변환 매핑
 *
 * 사용 예시:
 * const mapping = buildSectionIdMapping(apiSections);
 * const factorIndex = mapping.sectionIdToFactorIndex.get('DGNSS_0501');
 */
export interface APIToFrontendMapping {
  sectionIdToFactorIndex: Map<string, number>;
  factorIndexToSectionId: Map<number, string>;
}

/**
 * 신뢰도 경고 타입 매핑
 */
export const RELIABILITY_WARNING_MAP: Record<string, string> = {
  COCH_DGNSS_QESITM01_MARK: '반응일관성',
  COCH_DGNSS_QESITM02_MARK: '사회적바람직성',
  REPEATED_RESPONSE_YN: '연속동일반응',
} as const;

// ============================================================
// API 엔드포인트 타입 (향후 사용)
// ============================================================

/**
 * 진단 검사 목록 조회 요청
 */
export interface GetDiagnosisListRequest {
  tc_id: string;
  page?: number;
  pageSize?: number;
}

/**
 * 학생 결과 조회 요청
 */
export interface GetStudentResultRequest {
  dgnss_id: number;
  stdt_id?: string; // 특정 학생만 조회 시
}

/**
 * T점수 리포트 조회 요청
 */
export interface GetAnswerReportRequest {
  answer_idx: number;
  depth?: ReportDepth; // 특정 계층만 조회 시
}

// ============================================================
// 프론트엔드 미사용 지표 (추후 활용 가능)
// ============================================================

/**
 * 프론트엔드에서 현재 미사용 중인 API 필드들
 *
 * - P_RANK: 백분위 순위
 * - RANK_TOTAL: 종합순위
 * - COCH_DGNSS_QESITM03_SCORE: 학업성취도 (검사 문항)
 * - COCH_DGNSS_QESITM04_SCORE: 학업만족도 (검사 문항)
 * - eak_stts_cd: 응시상태 (1~5)
 *
 * 향후 기능 확장 시 활용 예정
 */
export interface UnusedAPIFields {
  P_RANK: number;
  RANK_TOTAL: number | null;
  COCH_DGNSS_QESITM03_SCORE: number | null;
  COCH_DGNSS_QESITM04_SCORE: number | null;
  eak_stts_cd: EakStatusCode;
}

// ============================================================
// 대시보드 API 응답 타입 (dashboardService용)
// ============================================================

/** 검사 목록 아이템 (GET /api/dgnss/tc/info) */
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

/** 검사 목록 응답 */
export interface DgnssInfoResponse {
  dgnssInfo: DgnssInfoItem[];
}

/** 검사 상세 응답 (GET /api/dgnss/tc/detail) */
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

/** 학생 정보 아이템 (GET /api/dgnss/tc/stinfolist) */
export interface StudentInfoItem {
  stdtId: string;
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

/** 학생 정보 목록 응답 */
export interface StudentInfoListResponse {
  type: number;
  stInfoList: StudentInfoItem[];
}

/** 관심 필요 학생 응답 (GET /api/dgnss/tc/need) */
export interface NeedStudentsResponse {
  reaction: Array<{ num: number; stdtId: string }>;
  repeatResponse: Array<{ num: number; stdtId: string }>;
  desirable: Array<{ num: number; stdtId: string }>;
  etcInfo: Record<string, Array<{ num: number; stdtId: string }>>;
}

/** 분석 섹션 아이템 (GET /api/dgnss/tc/analysis, /api/dgnss/st/analysis) */
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

/** 분석 응답 (회차별 데이터) */
export type AnalysisResponse = Record<string, AnalysisSectionItem[]>;

/** 학생 분석 결과 */
export interface StudentAnalysisResult {
  tScores: number[];
  reliabilityWarnings: string[];
  sections: AnalysisSectionItem[];
}

/** 학생 전체 분석 결과 (1회차 + 2회차) */
export interface StudentFullAnalysisResult {
  round1: { tScores: number[]; reliabilityWarnings: string[] } | null;
  round2: { tScores: number[]; reliabilityWarnings: string[] } | null;
}
