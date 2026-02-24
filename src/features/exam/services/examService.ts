import type { ExamQuestion, ExamAPIResponse, QuestionsResponseData, SubmitResponseData } from '../types';

// ============================================================
// API 서비스 설정
// ============================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const USE_API = import.meta.env.VITE_USE_API === 'true';

/** API 요청 함수 (학생용 - 인증 불필요) */
async function examApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ExamAPIResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.resultMessage || 'API 요청 실패');
  }

  return data;
}

// ============================================================
// Mock 데이터 (API 비활성화 시 사용)
// ============================================================

const MOCK_QUESTIONS: ExamQuestion[] = [
  { NO: 1, QESITM_NM: '나는 배우는 내용에 따라 적절한 학습 방법을 선택한다.', answer: '', fullCount: 125 },
  { NO: 2, QESITM_NM: '나는 중요한 문제를 부모님(보호자)과 의논한다.', answer: '', fullCount: 125 },
  { NO: 3, QESITM_NM: '나는 공부하기 전에 쾌적한 환경에서 공부하기 위해 내 주변을 정돈한다.', answer: '', fullCount: 125 },
  { NO: 4, QESITM_NM: '나는 성적 때문에 선생님께 꾸중을 들을 것 같아서 불안하다.', answer: '', fullCount: 125 },
  { NO: 5, QESITM_NM: '나는 잘하는 것이 많다고 생각한다.', answer: '', fullCount: 125 },
  { NO: 6, QESITM_NM: '나는 공부할 때 에너지가 생긴다.', answer: '', fullCount: 125 },
  { NO: 7, QESITM_NM: '나는 공부하기 싫다.', answer: '', fullCount: 125 },
  { NO: 8, QESITM_NM: '나는 공부에 필요한 것들을 잘 찾을 수 있도록 정리해두는 편이다.', answer: '', fullCount: 125 },
  { NO: 9, QESITM_NM: '나는 친구와의 성적 경쟁에서 뒤처질까봐 불안하다.', answer: '', fullCount: 125 },
  { NO: 10, QESITM_NM: '나는 공부할 때 재미있고 활기가 생긴다.', answer: '', fullCount: 125 },
  { NO: 11, QESITM_NM: '나는 수업시간에 집중하는 편이다.', answer: '', fullCount: 125 },
  { NO: 12, QESITM_NM: '나는 공부한 만큼 성적이 오르지 않아서 절망감을 느낀다.', answer: '', fullCount: 125 },
  { NO: 13, QESITM_NM: '나는 무엇을 결정할 때 다른 사람의 간섭없이 원하는 대로 결정할 수 있다.', answer: '', fullCount: 125 },
  { NO: 14, QESITM_NM: '친구가 기분이 좋지 않으면 왜 그런 감정을 느끼는지 잘 안다.', answer: '', fullCount: 125 },
  { NO: 15, QESITM_NM: '나는 다른 사람들이 겪은 일들에 대해 잘 들어주려고 노력한다.', answer: '', fullCount: 125 },
  { NO: 16, QESITM_NM: '나는 공부를 아무리 열심히 해도 성적이 안 나온다.', answer: '', fullCount: 125 },
  { NO: 17, QESITM_NM: '나는 부모님(보호자)이 공부를 많이 하는 다른 사람과 비교해서 우울하다.', answer: '', fullCount: 125 },
  { NO: 18, QESITM_NM: '나는 공부를 시작하면 바로 집중하는 편이다.', answer: '', fullCount: 125 },
  { NO: 19, QESITM_NM: '나는 공부에 대한 부담 때문에 완전히 지쳐 있다.', answer: '', fullCount: 125 },
  { NO: 20, QESITM_NM: '나는 내 자신에 대해 항상 정직하다.', answer: '', fullCount: 125 },
];

/** 125문항 생성 (Mock) */
const generateMockQuestions = (): ExamQuestion[] => {
  const questions: ExamQuestion[] = [];
  for (let i = 0; i < 125; i++) {
    const templateIndex = i % MOCK_QUESTIONS.length;
    questions.push({
      ...MOCK_QUESTIONS[templateIndex],
      NO: i + 1,
    });
  }
  return questions;
};

const ALL_MOCK_QUESTIONS = generateMockQuestions();

// ============================================================
// API 함수
// ============================================================

export interface FetchQuestionsResponse {
  omrIdx: number;
  questions: ExamQuestion[];
  totalPages: number;
  totalQuestions: number;
  answeredCount: number;
}

/**
 * 문항 조회 (페이지네이션)
 * GET /etc/meta/stnt/start/update
 */
export async function fetchQuestions(
  dgnssResultId: number,
  page: number = 0,
  size: number = 20
): Promise<FetchQuestionsResponse> {
  if (!USE_API) {
    // Mock API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));

    const start = page * size;
    const end = Math.min(start + size, ALL_MOCK_QUESTIONS.length);
    const questions = ALL_MOCK_QUESTIONS.slice(start, end);

    return {
      omrIdx: 23503,
      questions,
      totalPages: Math.ceil(ALL_MOCK_QUESTIONS.length / size),
      totalQuestions: ALL_MOCK_QUESTIONS.length,
      answeredCount: 0,
    };
  }

  const response = await examApiRequest<QuestionsResponseData>(
    `/etc/meta/stnt/start/update?dgnssResultId=${dgnssResultId}&paperIdx=1&page=${page}&size=${size}`
  );

  return {
    omrIdx: response.resultData.omrIdx,
    questions: response.resultData.dgnssQuesList,
    totalPages: response.resultData.page.totalPages,
    totalQuestions: response.resultData.page.totalElements,
    answeredCount: response.resultData.stAnsCnt,
  };
}

/**
 * 답변 저장
 * POST /etc/meta/stnt/answer/save
 */
export async function saveAnswer(
  omrIdx: number,
  questionNo: number,
  answer: string
): Promise<boolean> {
  if (!USE_API) {
    // Mock API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`[Mock] Saved answer: omrIdx=${omrIdx}, no=${questionNo}, answer=${answer}`);
    return true;
  }

  const response = await examApiRequest<null>(
    '/etc/meta/stnt/answer/save',
    {
      method: 'POST',
      body: JSON.stringify({ omrIdx, no: questionNo, answer }),
    }
  );

  return response.success;
}

/**
 * 검사 제출
 * POST /etc/meta/st/submit
 */
export async function submitExam(
  dgnssResultId: number
): Promise<boolean> {
  if (!USE_API) {
    // Mock API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[Mock] Submitted exam: dgnssResultId=${dgnssResultId}`);
    return true;
  }

  const response = await examApiRequest<SubmitResponseData>(
    '/etc/meta/st/submit',
    {
      method: 'POST',
      body: JSON.stringify({ dgnssResultId }),
    }
  );

  return response.resultData.submit;
}

/**
 * QR 코드 형식: {dgnssId}-{studentCount}
 * 예: 1672-10
 * - dgnssId: 검사 ID (학급 단위, /tc/start API에서 반환)
 * - studentCount: 총 학생 수
 *
 * 학생이 번호를 입력하면 백엔드 API로 dgnssResultId를 조회
 */
export interface ExamCodeData {
  dgnssId: number;
  studentCount: number;
}

/**
 * QR 코드 파싱
 * 형식: {dgnssId}-{studentCount}
 */
export function parseExamCode(code: string): ExamCodeData | null {
  const parts = code.split('-');
  if (parts.length !== 2) return null;

  const dgnssId = parseInt(parts[0], 10);
  const studentCount = parseInt(parts[1], 10);

  if (isNaN(dgnssId) || isNaN(studentCount)) {
    return null;
  }

  if (dgnssId <= 0 || studentCount <= 0) {
    return null;
  }

  return { dgnssId, studentCount };
}

/**
 * 검사 코드 검증
 * QR 코드 형식: {dgnssId}-{studentCount}
 */
export async function validateExamCode(code: string): Promise<{
  valid: boolean;
  name?: string;
  grade?: number;
  classNumber?: number;
  round?: number;
  dgnssId?: number;
  studentCount?: number;
}> {
  // QR 코드 파싱
  const parsed = parseExamCode(code);

  if (!parsed) {
    return { valid: false };
  }

  // 파싱 성공 시 유효
  return {
    valid: true,
    name: '학습심리정서검사',
    dgnssId: parsed.dgnssId,
    studentCount: parsed.studentCount,
  };
}

/**
 * 학생 번호로 dgnssResultId 조회
 * Mock: dgnssId * 100 + studentNumber
 */
export async function getStudentDgnssResultId(
  dgnssId: number,
  studentCount: number,
  studentNumber: number
): Promise<{
  dgnssResultId: number;
} | null> {
  if (studentNumber < 1 || studentNumber > studentCount) {
    return null;
  }

  // Mock: 간단한 계산으로 dgnssResultId 생성
  return { dgnssResultId: dgnssId * 100 + studentNumber };
}
