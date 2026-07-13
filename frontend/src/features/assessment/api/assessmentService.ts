/**
 * 교사용 검사 관리 API 서비스
 *
 * 엔드포인트: /api/dgnss/tc/* (교사용)
 */

import { apiClient, axiosInstance } from '@shared/api';

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
  _paperIdx?: string,
): Promise<ExamListItem[]> {
  const endpoint = `/api/dgnss/tc/info?claId=${claId}`;

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
export async function endExam(dgnssId: number): Promise<void> {
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
  nickname: string;
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

/**
 * 엑셀 양식 샘플 다운로드
 * GET /api/dgnss/tc/sample-excel?dgnssId={id}
 */
export async function downloadSampleExcel(dgnssId: number): Promise<void> {
  const res = await axiosInstance.get<Blob>(`/api/dgnss/tc/sample-excel?dgnssId=${dgnssId}`, {
    responseType: 'blob',
  });
  const blob = new Blob([res.data as BlobPart], {
    type:
      res.headers['content-type'] ??
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const disposition = res.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i);
  a.download = match?.[1] ? decodeURIComponent(match[1]) : `sample-excel-${dgnssId}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 검수용 응답값 엑셀 업로드
 * POST /api/dgnss/tc/upload-answers
 */
export async function uploadAnswersExcel(dgnssId: number, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('dgnssId', String(dgnssId));
  formData.append('file', file);
  await apiClient.post<void>('/api/dgnss/tc/upload-answers', formData);
}

/** 2회차 출제 사전 검증 — 차단 학생 */
export interface ExamStartPreviewStudent {
  stdtId: string;
  nickname: string;
  memberNo: number;
}

/** 2회차 출제 사전 검증 응답 */
export interface ExamStartPreviewResponse {
  canStart: boolean;
  totalCount: number;
  eligibleCount: number;
  blockedOtherClassCount: number;
  noHistoryCount: number;
  blockedStudents: ExamStartPreviewStudent[];
}

/**
 * 검사 출제 사전 검증 (1·2회차 공통)
 * GET /api/dgnss/tc/start/preview?claId=&paperIdx=&ordNo=
 */
export async function previewExamStart(
  claId: string,
  paperIdx: string = '1',
  ordNo: number = 2,
): Promise<ExamStartPreviewResponse> {
  const res = await apiClient.get<ExamStartPreviewResponse>(
    `/api/dgnss/tc/start/preview?claId=${claId}&paperIdx=${paperIdx}&ordNo=${ordNo}`,
  );
  return res.resultData;
}
