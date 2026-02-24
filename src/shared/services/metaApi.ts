/**
 * META 학습심리정서검사 API 서비스
 *
 * 백엔드 API 호출을 담당하는 서비스 레이어
 * Base URL: t-vcloudapi.vsaidt.com (테스트) / vcloudapi.vsaidt.com (운영)
 */

// ============================================================
// API 응답 타입 정의
// ============================================================

/** 공통 API 응답 래퍼 */
export interface MetaAPIResponse<T> {
  success: boolean;
  resultCode: number;
  resultMessage: string;
  resultData: T;
  paramData?: Record<string, string>;
  sTime: string;
  eTime: string;
  hash: string;
  currentTime: string;
}

/** 검사 목록 아이템 */
export interface ExamListItem {
  dgnssId: number;
  claId: string;
  ordNo: number;
  paperIdx: string;
  dgnssAt: string;
  dgnssStDt: string;
  dgnssEdDt: string;
}

/** 검사 상세 정보 */
export interface ExamDetail {
  dgnssId: number;
  claId: string;
  ordNo: number;
  paperIdx: string;
  dgnssAt: string;
  dgnssStDt: string;
  dgnssEdDt: string;
  dgnssText: string | null;
  stTotalCnt: number;
  stSubmCnt: number;
  notSubmStdtName: string;
  notSubmStdtId: string;
  num: number;
}

/** 학생 목록 아이템 */
export interface StudentListItem {
  stdtId: string;
  rowNum: number;
  gender: string;
  answerIdx: number;
  reaction: '양호' | '주의';
  desirable: '양호' | '주의';
  repeatResponse: 'Y' | 'N';
  reason: string;
  styTime: string;
  styPer: string;
  satisPer: string;
  cnsl: string;
}

/** T점수 아이템 */
export interface TScoreItem {
  ord_no: number;
  SECTION_NM: string;
  SECTION_ID: string;
  tScore: number;
  DEPTH: 3 | 4 | 5;
  reaction?: '양호' | '주의';
  desirable?: '양호' | '주의';
  repeatResponse?: 'Y' | 'N';
  dgnssResultId?: number;
}

/** 학생 분석 결과 */
export interface StudentAnalysisData {
  stdtId: string;
  gender: string;
  grade: string;
  ordNo: number;
  eakStDt: string;
  classCd: string;
  dgnssResultId: number;
  '1': TScoreItem[];
}

/** 학급 분석 결과 */
export interface ClassAnalysisData {
  '1': TScoreItem[];
}

// ============================================================
// API 서비스 설정
// ============================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const USE_API = import.meta.env.VITE_USE_API === 'true';

/** JWT 토큰 가져오기 */
const getAuthToken = (): string | null => {
  return import.meta.env.VITE_JWT_TOKEN || localStorage.getItem('jwt_token');
};

/** API 요청 헤더 생성 */
const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/** API 요청 함수 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<MetaAPIResponse<T>> {
  if (!USE_API) {
    throw new Error('API 모드가 비활성화되어 있습니다. VITE_USE_API=true로 설정하세요.');
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }
    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.resultMessage || 'API 요청 실패');
  }

  return data;
}

// ============================================================
// API 함수들
// ============================================================

export const metaApi = {
  /**
   * 검사 목록 조회
   * GET /etc/meta/tc/list
   */
  getExamList: async (): Promise<ExamListItem[]> => {
    const response = await apiRequest<{ list: ExamListItem[] }>(
      '/etc/meta/tc/list'
    );
    return response.resultData.list || [];
  },

  /**
   * 검사 상세 정보 조회
   * GET /etc/meta/tc/detail
   */
  getExamDetail: async (dgnssId: number): Promise<ExamDetail> => {
    const response = await apiRequest<ExamDetail>(
      `/etc/meta/tc/detail?dgnssId=${dgnssId}`
    );
    return response.resultData;
  },

  /**
   * 학생 목록 조회
   * GET /etc/meta/tc/stinfolist
   */
  getStudentList: async (
    dgnssId: number,
    options: { type?: number; paperIdx?: string; testFlag?: string } = {}
  ): Promise<StudentListItem[]> => {
    const { type = 1, paperIdx = '1', testFlag = 'N' } = options;
    const params = new URLSearchParams({
      dgnssId: String(dgnssId),
      type: String(type),
      paperIdx,
      testFlag,
    });

    const response = await apiRequest<{ type: number; stInfoList: StudentListItem[] }>(
      `/etc/meta/tc/stinfolist?${params}`
    );
    return response.resultData.stInfoList || [];
  },

  /**
   * 개별 학생 T점수 조회
   * GET /etc/meta/st/analysis
   */
  getStudentAnalysis: async (
    dgnssResultId: number,
    stdtId: string,
    options: { paperIdx?: string; ordNo?: number } = {}
  ): Promise<StudentAnalysisData> => {
    const { paperIdx = '1', ordNo = 1 } = options;
    const params = new URLSearchParams({
      dgnssResultId: String(dgnssResultId),
      stdtId,
      paperIdx,
      ordNo: String(ordNo),
    });

    const response = await apiRequest<{ stUserInfo: StudentAnalysisData }>(
      `/etc/meta/st/analysis?${params}`
    );
    return response.resultData.stUserInfo;
  },

  /**
   * 학급 평균 T점수 조회
   * GET /etc/meta/tc/analysis
   */
  getClassAnalysis: async (
    claId: string,
    options: { paperIdx?: string; ordNo?: number } = {}
  ): Promise<TScoreItem[]> => {
    const { paperIdx = '1', ordNo = 1 } = options;
    const params = new URLSearchParams({
      claId,
      paperIdx,
      ordNo: String(ordNo),
    });

    const response = await apiRequest<ClassAnalysisData>(
      `/etc/meta/tc/analysis?${params}`
    );
    return response.resultData['1'] || [];
  },

  /**
   * 관심 필요 학생 조회
   * GET /etc/meta/tc/need
   */
  getNeedAttentionStudents: async (dgnssId: number): Promise<unknown> => {
    const response = await apiRequest<unknown>(
      `/etc/meta/tc/need?dgnssId=${dgnssId}`
    );
    return response.resultData;
  },

  /**
   * 미제출 학생 목록 조회
   * GET /etc/meta/tc/notsubm/list
   */
  getNotSubmittedStudents: async (dgnssId: number): Promise<unknown> => {
    const response = await apiRequest<unknown>(
      `/etc/meta/tc/notsubm/list?dgnssId=${dgnssId}`
    );
    return response.resultData;
  },
};

// ============================================================
// 데이터 변환 유틸리티
// ============================================================

/**
 * API T점수 배열에서 38개 소분류만 추출
 */
export function extractTScores(
  items: TScoreItem[],
  round: 1 | 2 = 1
): number[] {
  return items
    .filter((item) => item.DEPTH === 5 && item.ord_no === round)
    .map((item) => item.tScore);
}

/**
 * API T점수 배열에서 11개 중분류만 추출
 */
export function extractMidCategoryScores(
  items: TScoreItem[],
  round: 1 | 2 = 1
): { name: string; score: number }[] {
  return items
    .filter((item) => item.DEPTH === 4 && item.ord_no === round)
    .map((item) => ({
      name: item.SECTION_NM,
      score: item.tScore,
    }));
}

/**
 * 신뢰도 경고 배열 생성
 */
export function buildReliabilityWarnings(item: {
  reaction?: '양호' | '주의';
  desirable?: '양호' | '주의';
  repeatResponse?: 'Y' | 'N';
}): string[] {
  const warnings: string[] = [];

  if (item.reaction === '주의') {
    warnings.push('반응일관성');
  }
  if (item.desirable === '주의') {
    warnings.push('사회적바람직성');
  }
  if (item.repeatResponse === 'Y') {
    warnings.push('연속동일반응');
  }

  return warnings;
}

/**
 * API 모드 확인
 */
export function isApiMode(): boolean {
  return USE_API;
}

export default metaApi;
