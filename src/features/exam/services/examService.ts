/**
 * 학생용 검사 응시 API 서비스
 *
 * API 문서: docs/api-endpoints.md
 * 엔드포인트: /etc/meta/st/* (학생용)
 */

import { apiRequest, mockDelay, isApiMode } from '@/shared/services/apiClient';
import type {
  ExamQuestion,
  QuestionsResponseData,
  SubmitResponseData,
  StudentExamItem,
  StudentExamListResponse,
} from '../types';

// ============================================================
// Mock 데이터
// ============================================================

const MOCK_QUESTIONS: ExamQuestion[] = [
  { NO: 1, QESITM_NM: '나는 배우는 내용에 따라 적절한 학습 방법을 선택한다.', answer: '', fullCount: 124 },
  { NO: 2, QESITM_NM: '나는 중요한 문제를 부모님(보호자)과 의논한다.', answer: '', fullCount: 124 },
  { NO: 3, QESITM_NM: '나는 공부하기 전에 쾌적한 환경에서 공부하기 위해 내 주변을 정돈한다.', answer: '', fullCount: 124 },
  { NO: 4, QESITM_NM: '나는 성적 때문에 선생님께 꾸중을 들을 것 같아서 불안하다.', answer: '', fullCount: 124 },
  { NO: 5, QESITM_NM: '나는 잘하는 것이 많다고 생각한다.', answer: '', fullCount: 124 },
  { NO: 6, QESITM_NM: '나는 공부할 때 에너지가 생긴다.', answer: '', fullCount: 124 },
  { NO: 7, QESITM_NM: '나는 공부하기 싫다.', answer: '', fullCount: 124 },
  { NO: 8, QESITM_NM: '나는 공부에 필요한 것들을 잘 찾을 수 있도록 정리해두는 편이다.', answer: '', fullCount: 124 },
  { NO: 9, QESITM_NM: '나는 친구와의 성적 경쟁에서 뒤처질까봐 불안하다.', answer: '', fullCount: 124 },
  { NO: 10, QESITM_NM: '나는 공부할 때 재미있고 활기가 생긴다.', answer: '', fullCount: 124 },
  { NO: 11, QESITM_NM: '나는 수업시간에 집중하는 편이다.', answer: '', fullCount: 124 },
  { NO: 12, QESITM_NM: '나는 공부한 만큼 성적이 오르지 않아서 절망감을 느낀다.', answer: '', fullCount: 124 },
  { NO: 13, QESITM_NM: '나는 무엇을 결정할 때 다른 사람의 간섭없이 원하는 대로 결정할 수 있다.', answer: '', fullCount: 124 },
  { NO: 14, QESITM_NM: '친구가 기분이 좋지 않으면 왜 그런 감정을 느끼는지 잘 안다.', answer: '', fullCount: 124 },
  { NO: 15, QESITM_NM: '나는 다른 사람들이 겪은 일들에 대해 잘 들어주려고 노력한다.', answer: '', fullCount: 124 },
  { NO: 16, QESITM_NM: '나는 공부를 아무리 열심히 해도 성적이 안 나온다.', answer: '', fullCount: 124 },
  { NO: 17, QESITM_NM: '나는 부모님(보호자)이 공부를 많이 하는 다른 사람과 비교해서 우울하다.', answer: '', fullCount: 124 },
  { NO: 18, QESITM_NM: '나는 공부를 시작하면 바로 집중하는 편이다.', answer: '', fullCount: 124 },
  { NO: 19, QESITM_NM: '나는 공부에 대한 부담 때문에 완전히 지쳐 있다.', answer: '', fullCount: 124 },
  { NO: 20, QESITM_NM: '나는 내 자신에 대해 항상 정직하다.', answer: '', fullCount: 124 },
];

/** 124문항 생성 (Mock) */
const generateMockQuestions = (): ExamQuestion[] => {
  return Array.from({ length: 124 }, (_, i) => ({
    ...MOCK_QUESTIONS[i % MOCK_QUESTIONS.length],
    NO: i + 1,
  }));
};

const ALL_MOCK_QUESTIONS = generateMockQuestions();

// ============================================================
// 학생 검사 API
// ============================================================

export interface FetchQuestionsResponse {
  omrIdx: number;
  questions: ExamQuestion[];
  totalPages: number;
  totalQuestions: number;
  answeredCount: number;
}

/**
 * 학생 검사 목록 조회
 * GET /etc/meta/st/info
 */
export async function fetchStudentExamList(
  claId: string,
  stdtId: string
): Promise<StudentExamItem[]> {
  if (!isApiMode()) {
    await mockDelay(300);
    return [{
      dgnssId: 1000,
      dgnssResultId: 100001,
      paperIdx: '1',
      ordNo: 1,
      dgnssAt: 'Y',
      submAt: 'N',
      submDt: null,
      eakAt: 'N',
    }];
  }

  const response = await apiRequest<StudentExamListResponse>(
    `/etc/meta/st/info?claId=${claId}&stdtId=${stdtId}`
  );
  return response.resultData;
}

/**
 * 진행 중인 검사 찾기
 * 진행 중(dgnssAt=Y)이고 미제출(submAt=N)인 검사
 */
export function findActiveExam(exams: StudentExamItem[]): StudentExamItem | null {
  return exams.find(e => e.dgnssAt === 'Y' && e.submAt === 'N') ?? null;
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
  if (!isApiMode()) {
    await mockDelay(500);
    const start = page * size;
    const end = Math.min(start + size, ALL_MOCK_QUESTIONS.length);

    return {
      omrIdx: 23503,
      questions: ALL_MOCK_QUESTIONS.slice(start, end),
      totalPages: Math.ceil(ALL_MOCK_QUESTIONS.length / size),
      totalQuestions: ALL_MOCK_QUESTIONS.length,
      answeredCount: 0,
    };
  }

  const response = await apiRequest<QuestionsResponseData>(
    `/etc/meta/st/start?dgnssResultId=${dgnssResultId}&paperIdx=1&page=${page}&size=${size}`
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
 * POST /etc/meta/st/answer
 */
export async function saveAnswer(
  omrIdx: number,
  questionNo: number,
  answer: string
): Promise<boolean> {
  if (!isApiMode()) {
    await mockDelay(100);
    return true;
  }

  const response = await apiRequest<null>('/etc/meta/st/answer', {
    method: 'POST',
    body: JSON.stringify({ omrIdx, no: questionNo, answer }),
  });
  return response.success;
}

/**
 * 검사 제출
 * POST /etc/meta/st/submit
 */
export async function submitExam(
  dgnssResultId: number,
  paperIdx: string = '1'
): Promise<boolean> {
  if (!isApiMode()) {
    await mockDelay(1000);
    return true;
  }

  const response = await apiRequest<SubmitResponseData>('/etc/meta/st/submit', {
    method: 'POST',
    body: JSON.stringify({ dgnssResultId, paperIdx }),
  });
  return response.resultData.submit;
}

/**
 * 검사 새로하기 (답안 초기화)
 * GET /etc/meta/st/new
 */
export async function resetExam(
  dgnssResultId: number,
  page: number = 0,
  size: number = 20
): Promise<FetchQuestionsResponse> {
  if (!isApiMode()) {
    await mockDelay(500);
    const start = page * size;
    const end = Math.min(start + size, ALL_MOCK_QUESTIONS.length);

    return {
      omrIdx: 23504,
      questions: ALL_MOCK_QUESTIONS.slice(start, end).map(q => ({ ...q, answer: '' })),
      totalPages: Math.ceil(ALL_MOCK_QUESTIONS.length / size),
      totalQuestions: ALL_MOCK_QUESTIONS.length,
      answeredCount: 0,
    };
  }

  const response = await apiRequest<QuestionsResponseData>(
    `/etc/meta/st/new?dgnssResultId=${dgnssResultId}&paperIdx=1&page=${page}&size=${size}`
  );

  const questions = response.resultData.dgnssQuesList;
  // /st/new 응답에는 page 객체가 없을 수 있음 - fullCount에서 총 문항 수 추출
  const totalQuestions = response.resultData.page?.totalElements
    ?? questions[0]?.fullCount
    ?? 124;
  const totalPages = response.resultData.page?.totalPages
    ?? Math.ceil(totalQuestions / size);

  return {
    omrIdx: response.resultData.omrIdx,
    questions,
    totalPages,
    totalQuestions,
    answeredCount: response.resultData.stAnsCnt ?? 0,
  };
}

// ============================================================
// 검사 코드 매핑 (QR 코드 ↔ claId)
// ============================================================

const STORAGE_KEY = 'exam_code_map';
const examCodeMap = new Map<string, string>();

// localStorage에서 복원
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const entries = JSON.parse(stored) as [string, string][];
    entries.forEach(([code, claId]) => examCodeMap.set(code, claId));
  }
} catch {
  // ignore
}

function saveExamCodeMap(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...examCodeMap.entries()]));
  } catch {
    // ignore
  }
}

/** 검사 코드 등록 (교사용) */
export function registerExamCode(numericCode: string, claId: string): void {
  examCodeMap.set(numericCode, claId);
  saveExamCodeMap();
}

/** 숫자 코드로 claId 조회 */
export function getClaIdByCode(numericCode: string): string | null {
  return examCodeMap.get(numericCode) ?? null;
}

// ============================================================
// 검사 코드 검증
// ============================================================

export interface ExamCodeData {
  code: string;
  claId?: string;
}

/** QR 코드 파싱 */
export function parseExamCode(code: string): ExamCodeData | null {
  const trimmed = code.trim();

  // 숫자만 허용 (4자리 이상)
  if (!/^\d{4,}$/.test(trimmed)) {
    return null;
  }

  if (!isApiMode()) {
    return { code: trimmed };
  }

  const claId = getClaIdByCode(trimmed);
  return claId ? { code: trimmed, claId } : null;
}

/** 검사 코드 검증 */
export async function validateExamCode(code: string): Promise<{
  valid: boolean;
  name?: string;
  examCode?: string;
  claId?: string;
}> {
  const parsed = parseExamCode(code);

  if (!parsed) {
    return { valid: false };
  }

  return {
    valid: true,
    name: '학습심리정서검사',
    examCode: parsed.code,
    claId: parsed.claId,
  };
}

/** 학생 검사 정보 조회 */
export async function getStudentExamInfo(
  claIdOrCode: string,
  stdtId: string
): Promise<{ dgnssResultId: number; dgnssId: number; ordNo: number } | null> {
  const exams = await fetchStudentExamList(claIdOrCode, stdtId);
  const activeExam = findActiveExam(exams);

  if (!activeExam) {
    return null;
  }

  return {
    dgnssResultId: activeExam.dgnssResultId,
    dgnssId: activeExam.dgnssId,
    ordNo: activeExam.ordNo,
  };
}
