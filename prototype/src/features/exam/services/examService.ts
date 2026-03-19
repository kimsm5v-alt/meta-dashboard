/**
 * 학생용 검사 응시 API 서비스
 *
 * API 문서: docs/api-endpoints.md
 * 엔드포인트: /etc/meta/st/* (학생용)
 */

import { apiRequest } from '@/shared/services/apiClient';
import type {
  ExamQuestion,
  QuestionsResponseData,
  SubmitResponseData,
  StudentExamItem,
  StudentExamListResponse,
} from '../types';

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

  const claId = getClaIdByCode(trimmed);
  return claId ? { code: trimmed, claId } : { code: trimmed };
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
