/**
 * 교사용 검사 관리 API 서비스
 *
 * 엔드포인트: /api/dgnss/tc/* (교사용)
 */

import { apiClient } from '@shared/api';

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
 * POST /api/dgnss/tc/start
 */
export async function startExam(
  claId: string,
  tcId: string,
  ordNo: number,
  grade: GradeLevel,
  paperIdx: string = '1',
): Promise<StartExamResponse> {
  const res = await apiClient.post<StartExamResponse>('/api/dgnss/tc/start', {
    claId,
    tcId,
    ordNo,
    grade,
    paperIdx,
  });
  return res.resultData;
}

/**
 * 검사 목록 조회
 * GET /api/dgnss/tc/info
 */
export async function fetchExamList(
  claId: string,
  _tcId: string,
  paperIdx?: string,
): Promise<ExamListItem[]> {
  let endpoint = `/api/dgnss/tc/info?claId=${claId}`;
  if (paperIdx) {
    endpoint += `&paperIdx=${paperIdx}`;
  }

  const res = await apiClient.get<ExamListResponse | ExamListItem[]>(endpoint);
  const resultData = res.resultData;

  if (Array.isArray(resultData)) {
    return resultData;
  }
  if (resultData && Array.isArray((resultData as ExamListResponse).dgnssInfo)) {
    return (resultData as ExamListResponse).dgnssInfo;
  }
  return [];
}

/**
 * 검사 상세 조회
 * GET /api/dgnss/tc/detail
 */
export async function fetchExamDetail(dgnssId: number): Promise<ExamDetailResponse> {
  const res = await apiClient.get<ExamDetailResponse>(`/api/dgnss/tc/detail?dgnssId=${dgnssId}`);
  return res.resultData;
}

/**
 * 검사 종료
 * POST /api/dgnss/tc/end
 */
export async function endExam(dgnssId: number, _paperIdx?: string): Promise<void> {
  await apiClient.post('/api/dgnss/tc/end', { dgnssId });
}

/**
 * 검사 취소
 * POST /api/dgnss/tc/cancel
 *
 * 주의: 데이터가 삭제됨. 되돌릴 수 없음.
 */
export async function cancelExam(dgnssId: number): Promise<void> {
  await apiClient.post('/api/dgnss/tc/cancel', { dgnssId });
}

/**
 * 검사 재시작
 * POST /api/dgnss/tc/restart
 */
export async function restartExam(
  dgnssId: number,
  claId: string,
  grade: GradeLevel,
): Promise<void> {
  await apiClient.post('/api/dgnss/tc/restart', { dgnssId, claId, grade });
}

/** 미제출 학생 항목 */
export interface NotSubmittedStudent {
  stdtId: string;
}

/**
 * 미제출 학생 목록 조회
 * GET /api/dgnss/tc/notsubm
 */
export async function fetchNotSubmittedStudents(dgnssId: number): Promise<NotSubmittedStudent[]> {
  const res = await apiClient.get<NotSubmittedStudent[]>(
    `/api/dgnss/tc/notsubm?dgnssId=${dgnssId}`,
  );
  return res.resultData ?? [];
}
