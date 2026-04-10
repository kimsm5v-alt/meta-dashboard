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
// Mock 문항 데이터 (120-124번, API에서 누락된 문항)
// ============================================================

const MOCK_QUESTIONS_120_124: ExamQuestion[] = [
  {
    NO: 120,
    QESITM_NM: '내 학업 성적은 어느 정도인지 체크해 주세요.',
    answer: '',
    fullCount: 124,
    choices: ['매우 낮음', '낮음', '보통', '높음', '매우 높음'],
  },
  {
    NO: 121,
    QESITM_NM: '나의 성적에 어느 정도 만족하는지 체크해 주세요.',
    answer: '',
    fullCount: 124,
    choices: ['매우 낮음', '낮음', '보통', '높음', '매우 높음'],
  },
  {
    NO: 122,
    QESITM_NM: '다음 중 내가 공부하는 가장 중요한 이유 1가지를 체크해 주세요.',
    answer: '',
    fullCount: 124,
    choices: [
      '공부에 흥미를 느껴서',
      '나의 미래를 위해서',
      '대학을 가기 위해서',
      '주변 사람들(부모님, 선생님)의 기대 때문에',
      '솔직히 왜 하는지 모르겠다',
    ],
  },
  {
    NO: 123,
    QESITM_NM: '학교 다닐 때, 혼자 공부하는 시간(온라인 학습 제외)이 하루 평균 어느 정도인지 체크해 보세요.',
    answer: '',
    fullCount: 124,
    choices: [
      '전혀 안함',
      '1시간 미만',
      '1시간 이상~2시간 미만',
      '2시간 이상~3시간 미만',
      '3시간 이상',
    ],
  },
  {
    NO: 124,
    QESITM_NM: '공부와 관련된 고민이 있을 때, 가장 많이 상담하는 사람 1명을 체크해 주세요.',
    answer: '',
    fullCount: 124,
    choices: ['친구', '선생님', '가족', '상담 전문가', '기타'],
  },
];

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
 * 문항 목록에 누락된 120-124번 문항 추가 (해당 범위 페이지만)
 * @param questions API에서 반환된 문항 목록
 * @param page 현재 페이지 번호
 * @param size 페이지당 문항 수
 */
function fillMissingQuestions(
  questions: ExamQuestion[],
  page: number,
  size: number,
): ExamQuestion[] {
  // 현재 페이지 범위 계산 (예: page=6, size=20 → 121-140)
  const pageStart = page * size + 1;
  const pageEnd = (page + 1) * size;

  // 120-124번 문항이 현재 페이지 범위에 포함되는지 확인
  const shouldIncludeMockQuestions = MOCK_QUESTIONS_120_124.some(
    (q) => q.NO >= pageStart && q.NO <= pageEnd,
  );

  if (!shouldIncludeMockQuestions) {
    return questions.sort((a, b) => a.NO - b.NO);
  }

  // API 응답에서 120-124번 문항 제거 (내용이 비어있을 수 있음)
  const filteredQuestions = questions.filter((q) => q.NO < 120 || q.NO > 124);

  // 현재 페이지 범위에 해당하는 120-124번 mock 문항 추가
  const result = [...filteredQuestions];
  MOCK_QUESTIONS_120_124.forEach((mockQ) => {
    if (mockQ.NO >= pageStart && mockQ.NO <= pageEnd) {
      result.push(mockQ);
    }
  });

  // 문항 번호 순으로 정렬
  return result.sort((a, b) => a.NO - b.NO);
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
  const res = await apiClient.post<QuestionsResponseData>(
    '/api/dgnss/st/start',
    { dgnssResultId, paperIdx: 1, page, size } //나중에 수정
  );

  // API에서 누락된 120-124번 문항 추가 (현재 페이지 범위만)
  const filledQuestions = fillMissingQuestions(res.resultData.dgnssQuesList, page, size);

  return {
    omrIdx: res.resultData.omrIdx,
    questions: filledQuestions,
    totalPages: res.resultData.page.totalPages,
    totalQuestions: 124, // 정확히 124개 문항
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

  // API에서 누락된 120-124번 문항 추가 (현재 페이지 범위만)
  const filledQuestions = fillMissingQuestions(res.resultData.dgnssQuesList, page, size);
  const totalQuestions = 124; // 정확히 124개 문항
  const totalPages = res.resultData.page?.totalPages ?? 7; // 124 / 20 = 7 페이지

  return {
    omrIdx: res.resultData.omrIdx,
    questions: filledQuestions,
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
