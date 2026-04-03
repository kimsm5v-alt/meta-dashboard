/**
 * 학생용 검사 응시 API 서비스
 *
 * 엔드포인트: /api/dgnss/st/* (학생용)
 */

import { apiClient } from '@shared/api';
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
 * GET /api/dgnss/st/info
 */
export async function fetchStudentExamList(
  claId: string,
  stdtId: string,
): Promise<StudentExamItem[]> {
  const res = await apiClient.get<StudentExamListResponse>(
    `/api/dgnss/st/info?claId=${claId}&stdtId=${stdtId}`,
  );
  return res.resultData as unknown as StudentExamItem[];
}

/**
 * 진행 중인 검사 찾기
 * 진행 중(dgnssAt=Y)이고 미제출(submAt=N)인 검사
 */
export function findActiveExam(exams: StudentExamItem[]): StudentExamItem | null {
  return exams.find((e) => e.dgnssAt === 'Y' && e.submAt === 'N') ?? null;
}

/**
 * 문항 조회 (페이지네이션)
 * GET /api/dgnss/st/start
 */
export async function fetchQuestions(
  dgnssResultId: number,
  page: number = 0,
  size: number = 20,
): Promise<FetchQuestionsResponse> {
  const res = await apiClient.get<QuestionsResponseData>(
    `/api/dgnss/st/start?dgnssResultId=${dgnssResultId}&paperIdx=1&page=${page}&size=${size}`,
  );

  return {
    omrIdx: res.resultData.omrIdx,
    questions: res.resultData.dgnssQuesList,
    totalPages: res.resultData.page.totalPages,
    totalQuestions: res.resultData.page.totalElements,
    answeredCount: res.resultData.stAnsCnt,
  };
}

/**
 * 답변 저장
 * POST /api/dgnss/st/answer
 */
export async function saveAnswer(
  omrIdx: number,
  questionNo: number,
  answer: string,
): Promise<boolean> {
  await apiClient.post<null>('/api/dgnss/st/answer', { omrIdx, no: questionNo, answer });
  return true;
}

/**
 * 검사 제출
 * POST /api/dgnss/st/submit
 */
export async function submitExam(dgnssResultId: number, paperIdx: string = '1'): Promise<boolean> {
  const res = await apiClient.post<SubmitResponseData>('/api/dgnss/st/submit', {
    dgnssResultId,
    paperIdx,
  });
  return res.resultData.submit;
}

/**
 * 검사 새로하기 (답안 초기화)
 * GET /api/dgnss/st/new
 */
export async function resetExam(
  dgnssResultId: number,
  page: number = 0,
  size: number = 20,
): Promise<FetchQuestionsResponse> {
  const res = await apiClient.get<QuestionsResponseData>(
    `/api/dgnss/st/new?dgnssResultId=${dgnssResultId}&paperIdx=1&page=${page}&size=${size}`,
  );

  const questions = res.resultData.dgnssQuesList;
  const totalQuestions = res.resultData.page?.totalElements ?? questions[0]?.fullCount ?? 124;
  const totalPages = res.resultData.page?.totalPages ?? Math.ceil(totalQuestions / size);

  return {
    omrIdx: res.resultData.omrIdx,
    questions,
    totalPages,
    totalQuestions,
    answeredCount: res.resultData.stAnsCnt ?? 0,
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
  stdtId: string,
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
