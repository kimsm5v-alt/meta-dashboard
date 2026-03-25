/**
 * 교사용 검사 관리 API 서비스
 *
 * API 문서: docs/api-endpoints.md
 * 엔드포인트: /etc/meta/tc/* (교사용)
 */

import { apiRequest } from '@shared/services/apiClient';

// ============================================================
// 타입 정의
// ============================================================

/** 학년군 */
export type GradeLevel = 'el' | 'mi' | 'hi';

/** 검사 시작 응답 */
export interface StartExamResponse {
  dgnssId: number;
  claId: string;
  ordNo: number;
  dgnssAt: 'Y' | 'N';
  dgnssStDt: string;
  dgnssEdDt: string | null;
  stTotalCnt: number;
  stSubmCnt: number;
}

/** 검사 목록 항목 */
export interface ExamListItem {
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
  notDgnssStartList: string[] | null;
}

/** 검사 목록 응답 */
interface ExamListResponse {
  dgnssInfo: ExamListItem[];
}

/** 검사 상세 응답 */
export interface ExamDetailResponse {
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
  notSubmStdtId: string;
  notSubmStdtName: string;
}

// ============================================================
// 교사용 검사 API
// ============================================================

/**
 * 검사 시작 (생성)
 * GET /etc/meta/tc/start
 */
export async function startExam(
  claId: string,
  tcId: string,
  ordNo: number,
  grade: GradeLevel,
  paperIdx: string = '1',
): Promise<StartExamResponse> {
  const response = await apiRequest<StartExamResponse>(
    `/etc/meta/tc/start?claId=${claId}&tcId=${tcId}&ordNo=${ordNo}&grade=${grade}&paperIdx=${paperIdx}`,
    { debug: true },
  );
  return response.resultData;
}

/**
 * 검사 목록 조회
 * GET /etc/meta/tc/info
 *
 * 참고: /tc/list는 404 반환, /tc/info 사용
 */
export async function fetchExamList(
  claId: string,
  tcId: string,
  paperIdx?: string,
): Promise<ExamListItem[]> {
  let endpoint = `/etc/meta/tc/info?claId=${claId}&tcId=${tcId}`;
  if (paperIdx) {
    endpoint += `&paperIdx=${paperIdx}`;
  }

  const response = await apiRequest<ExamListResponse | ExamListItem[]>(endpoint, { debug: true });

  // API 응답 구조 처리: resultData가 배열이거나 { dgnssInfo: [...] } 형태일 수 있음
  const resultData = response.resultData;
  if (Array.isArray(resultData)) {
    return resultData;
  }
  if (resultData && Array.isArray(resultData.dgnssInfo)) {
    return resultData.dgnssInfo;
  }
  return [];
}

/**
 * 검사 상세 조회
 * GET /etc/meta/tc/detail
 */
export async function fetchExamDetail(dgnssId: number): Promise<ExamDetailResponse> {
  const response = await apiRequest<ExamDetailResponse>(`/etc/meta/tc/detail?dgnssId=${dgnssId}`, {
    debug: true,
  });
  return response.resultData;
}

/**
 * 검사 종료
 * GET /etc/meta/tc/end
 */
export async function endExam(dgnssId: number, paperIdx?: string): Promise<void> {
  let endpoint = `/etc/meta/tc/end?dgnssId=${dgnssId}`;
  if (paperIdx) {
    endpoint += `&paperIdx=${paperIdx}`;
  }

  await apiRequest<unknown>(endpoint, { debug: true });
}

/**
 * 검사 취소
 * GET /etc/meta/tc/cancel
 *
 * 주의: 데이터가 삭제됨. 되돌릴 수 없음.
 */
export async function cancelExam(dgnssId: number): Promise<void> {
  await apiRequest<null>(`/etc/meta/tc/cancel?dgnssId=${dgnssId}`, { debug: true });
}

/**
 * 검사 재시작
 * GET /etc/meta/tc/restart
 */
export async function restartExam(
  dgnssId: number,
  claId: string,
  grade: GradeLevel,
): Promise<void> {
  await apiRequest<{ result: string }>(
    `/etc/meta/tc/restart?dgnssId=${dgnssId}&claId=${claId}&grade=${grade}`,
    { debug: true },
  );
}

/** 미제출 학생 항목 */
export interface NotSubmittedStudent {
  stdtId: string;
}

/**
 * 미제출 학생 목록 조회
 * GET /etc/meta/tc/notsubm
 */
export async function fetchNotSubmittedStudents(dgnssId: number): Promise<NotSubmittedStudent[]> {
  const response = await apiRequest<NotSubmittedStudent[]>(
    `/etc/meta/tc/notsubm?dgnssId=${dgnssId}`,
    { debug: true },
  );
  return response.resultData ?? [];
}
