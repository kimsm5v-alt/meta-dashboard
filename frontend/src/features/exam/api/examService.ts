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
    QESITM_NM:
      '학교 다닐 때, 혼자 공부하는 시간(온라인 학습 제외)이 하루 평균 어느 정도인지 체크해 보세요.',
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
 * 페이지별 구성 정보
 * - 120번 문항의 성격이 다르므로 별도 페이지로 분리
 * - 페이지 6: 101-119 (19문항)
 * - 페이지 7: 120-124 (5문항)
 */
interface PageConfig {
  apiPage: number; // 실제 API에 요청할 페이지 번호
  startNo: number; // 표시할 시작 문항 번호
  endNo: number; // 표시할 끝 문항 번호
}

function getPageConfig(frontendPage: number): PageConfig {
  // 페이지 0-4: 1-100번 (각 20문항)
  if (frontendPage <= 4) {
    return {
      apiPage: frontendPage,
      startNo: frontendPage * 20 + 1,
      endNo: (frontendPage + 1) * 20,
    };
  }
  // 페이지 5: 101-119 (19문항)
  if (frontendPage === 5) {
    return {
      apiPage: 5, // API page 5 (101-120) 요청
      startNo: 101,
      endNo: 119,
    };
  }
  // 페이지 6: 120-124 (5문항)
  return {
    apiPage: 5, // API page 5 (101-120) 요청 - 120번 포함
    startNo: 120,
    endNo: 124,
  };
}

/**
 * 답변 완료 개수로부터 마지막 답변이 있는 페이지 계산
 * @param answeredCount 답변 완료 개수
 * @param paperIdx 검사지 종류 ('1': 학습종합, '2': 자기조절)
 * @returns 페이지 번호 (0-based)
 */
export function getPageFromAnsweredCount(answeredCount: number, paperIdx: string = '1'): number {
  if (answeredCount === 0) return 0;

  if (paperIdx !== '1') {
    return Math.floor((answeredCount - 1) / 20);
  }

  // 학습종합검사 (124문항, 7페이지 구조)
  const lastAnsweredNo = answeredCount;

  if (lastAnsweredNo <= 100) {
    return Math.floor((lastAnsweredNo - 1) / 20);
  }
  if (lastAnsweredNo <= 119) {
    return 5;
  }
  return 6;
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
  // 현재 페이지 범위 계산 (예: page=5, size=20 → 101-120)
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

  // 120-124번 MOCK 문항 전부 추가
  // (나중에 fetchQuestions에서 startNo-endNo 범위로 필터링됨)
  const result = [...filteredQuestions, ...MOCK_QUESTIONS_120_124];

  // 문항 번호 순으로 정렬
  return result.sort((a, b) => a.NO - b.NO);
}

/**
 * 학생 정보 (최초 호출 시에만 전달)
 */
export interface StudentInfoForStart {
  schoolName?: string;
  grade?: number;
  classNumber?: number;
  gender?: 'M' | 'F';
  /** NEIS 표준학교코드 — 학교 검색 선택 시(나이스 연동). 검사쪽 저장용. */
  schoolCode?: string;
}

/**
 * 문항 조회 (페이지네이션)
 * POST /api/dgnss/st/start
 *
 * @param dgnssResultId 검사 결과 ID
 * @param page 프론트엔드 페이지 번호 (0-based)
 * @param _size 사용하지 않음 (하위 호환성 유지)
 * @param paperIdx 검사지 종류 ('1': 학습종합, '2': 자기조절)
 * @param studentInfo 학생 정보 (최초 호출 시에만 포함)
 */
export async function fetchQuestions(
  dgnssResultId: number,
  page: number = 0,
  _size: number = 20,
  paperIdx: string = '1',
  studentInfo?: StudentInfoForStart,
): Promise<FetchQuestionsResponse> {
  if (paperIdx !== '1') {
    // 자기조절학습검사: 단순 페이징, 백엔드 응답 그대로 사용
    const payload: Record<string, unknown> = {
      dgnssResultId,
      paperIdx: Number(paperIdx),
      page,
      size: 20,
    };

    // 최초 호출 시 학생 정보 포함
    if (studentInfo) {
      if (studentInfo.schoolName) payload.schoolName = studentInfo.schoolName;
      if (studentInfo.grade !== undefined) payload.grade = studentInfo.grade;
      if (studentInfo.classNumber !== undefined) payload.classNumber = studentInfo.classNumber;
      if (studentInfo.gender) payload.gender = studentInfo.gender;
      if (studentInfo.schoolCode) payload.schoolCode = studentInfo.schoolCode;
    }

    const res = await apiClient.post<QuestionsResponseData>('/api/dgnss/st/start', payload);
    return {
      omrIdx: res.resultData.omrIdx,
      questions: res.resultData.dgnssQuesList.sort((a, b) => a.NO - b.NO),
      totalPages: res.resultData.page.totalPages,
      totalQuestions: res.resultData.page.totalElements,
      answeredCount: res.resultData.stAnsCnt,
    };
  }

  // 학습종합검사: 7페이지 구조 + 120-124번 mock 문항
  const config = getPageConfig(page);

  const payload: Record<string, unknown> = {
    dgnssResultId,
    paperIdx: 1,
    page: config.apiPage,
    size: 20,
  };

  // 최초 호출 시 학생 정보 포함
  if (studentInfo) {
    if (studentInfo.schoolName) payload.schoolName = studentInfo.schoolName;
    if (studentInfo.grade !== undefined) payload.grade = studentInfo.grade;
    if (studentInfo.classNumber !== undefined) payload.classNumber = studentInfo.classNumber;
    if (studentInfo.gender) payload.gender = studentInfo.gender;
  }

  const res = await apiClient.post<QuestionsResponseData>('/api/dgnss/st/start', payload);

  const filledQuestions = fillMissingQuestions(res.resultData.dgnssQuesList, config.apiPage, 20);
  const filteredQuestions = filledQuestions.filter(
    (q) => q.NO >= config.startNo && q.NO <= config.endNo,
  );

  return {
    omrIdx: res.resultData.omrIdx,
    questions: filteredQuestions,
    totalPages: 7,
    totalQuestions: 124,
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
 *
 * @param dgnssResultId 검사 결과 ID
 * @param page 프론트엔드 페이지 번호 (0-based)
 * @param _size 사용하지 않음 (하위 호환성 유지)
 * @param paperIdx 검사지 종류 ('1': 학습종합, '2': 자기조절)
 */
export async function resetExam(
  dgnssResultId: number,
  page: number = 0,
  _size: number = 20,
  paperIdx: string = '1',
  studentInfo?: StudentInfoForStart,
): Promise<FetchQuestionsResponse> {
  if (paperIdx !== '1') {
    // 자기조절학습검사: reset 후 start API로 재조회
    // (GET /api/dgnss/st/new 응답에 page 정보가 없으므로 POST /api/dgnss/st/start로 재조회)

    // 기본 파라미터
    const params = new URLSearchParams({
      dgnssResultId: String(dgnssResultId),
      paperIdx: paperIdx,
      page: String(page),
      size: '20',
    });

    // studentInfo가 있을 때만 추가 파라미터 전달
    if (studentInfo) {
      if (studentInfo.schoolName) params.append('schoolName', studentInfo.schoolName);
      if (studentInfo.schoolCode) params.append('schoolCode', studentInfo.schoolCode);
      if (studentInfo.grade !== undefined) params.append('grade', String(studentInfo.grade));
      if (studentInfo.classNumber !== undefined)
        params.append('classNumber', String(studentInfo.classNumber));
      if (studentInfo.gender) params.append('gender', studentInfo.gender);
    }

    const res = await apiClient.get<QuestionsResponseData>(
      `/api/dgnss/st/new?${params.toString()}`,
    );

    return {
      omrIdx: res.resultData.omrIdx,
      questions: res.resultData.dgnssQuesList.sort((a, b) => a.NO - b.NO),
      totalPages: 4,
      totalQuestions: 72,
      answeredCount: res.resultData.stAnsCnt ?? 0,
    };
  }

  // 학습종합검사: 7페이지 구조 + 120-124번 mock 문항
  const config = getPageConfig(page);

  // 기본 파라미터
  const params = new URLSearchParams({
    dgnssResultId: String(dgnssResultId),
    paperIdx: '1',
    page: String(config.apiPage),
    size: '20',
  });

  // studentInfo가 있을 때만 추가 파라미터 전달
  if (studentInfo) {
    if (studentInfo.schoolName) params.append('schoolName', studentInfo.schoolName);
    if (studentInfo.schoolCode) params.append('schoolCode', studentInfo.schoolCode);
    if (studentInfo.grade !== undefined) params.append('grade', String(studentInfo.grade));
    if (studentInfo.classNumber !== undefined)
      params.append('classNumber', String(studentInfo.classNumber));
    if (studentInfo.gender) params.append('gender', studentInfo.gender);
  }

  const res = await apiClient.get<QuestionsResponseData>(`/api/dgnss/st/new?${params.toString()}`);

  const filledQuestions = fillMissingQuestions(res.resultData.dgnssQuesList, config.apiPage, 20);
  const filteredQuestions = filledQuestions.filter(
    (q) => q.NO >= config.startNo && q.NO <= config.endNo,
  );

  return {
    omrIdx: res.resultData.omrIdx,
    questions: filteredQuestions,
    totalPages: 7,
    totalQuestions: 124,
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
