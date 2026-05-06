/**
 * 검사(Dgnss) 서비스 — 교사용 학습심리정서검사 API
 */

import { apiClient } from '@shared/api';

// ============================================================
// 백엔드 응답 전용 타입
// ============================================================

export interface DgnssInfo {
  dgnssId: number;
  ordNo: number;
  claId: string;
  dgnssAt: 'Y' | 'N';
  paperIdx: number;
  dgnssStDt: string;
  dgnssEdDt: string | null;
  stSubmCnt: number;
  stTotalCnt: number;
  notDgnssStartCnt: number;
  tcId: string;
}

export interface DgnssStudentInfo {
  stdtId: string;
  nickname: string;
  memberType: 'STUDENT' | 'GUEST';
  dgnssResultId: number | null;
  submitYn: 'Y' | 'N' | null;
  startYn: 'Y' | 'N' | null;
}

// ============================================================
// 검사 목록 조회
// ============================================================

/**
 * (교사) 학급의 검사 목록 조회
 */
export const getDgnssList = async (claId: string, paperIdx: number = 1): Promise<DgnssInfo[]> => {
  const res = await apiClient.get<DgnssInfo[] | { dgnssInfo: DgnssInfo[] }>(
    `/api/dgnss/tc/info?claId=${claId}&paperIdx=${paperIdx}`,
  );
  const data = res.resultData;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray((data as { dgnssInfo: DgnssInfo[] }).dgnssInfo)) {
    return (data as { dgnssInfo: DgnssInfo[] }).dgnssInfo;
  }
  return [];
};

// ============================================================
// 검사 시작 / 종료 / 취소 / 재시작
// ============================================================

/**
 * (교사) 검사 시작
 */
export const startDgnss = async (params: {
  claId: string;
  tcId: string;
  ordNo: number;
  grade: string;
  paperIdx: number;
}): Promise<{ dgnssId: number; claId: string; tcId: string }> => {
  const res = await apiClient.post<{ dgnssId: number; claId: string; tcId: string }>(
    '/api/dgnss/tc/start',
    params,
  );
  return res.resultData;
};

/**
 * (교사) 검사 종료
 */
export const endDgnss = async (dgnssId: number): Promise<void> => {
  await apiClient.post('/api/dgnss/tc/end', { dgnssId });
};

/**
 * (교사) 검사 취소
 */
export const cancelDgnss = async (dgnssId: number): Promise<void> => {
  await apiClient.post('/api/dgnss/tc/cancel', { dgnssId });
};

/**
 * (교사) 검사 재시작
 */
export const restartDgnss = async (params: {
  dgnssId: number;
  claId: string;
  grade: string;
}): Promise<void> => {
  await apiClient.post('/api/dgnss/tc/restart', params);
};

// ============================================================
// 학생 현황 조회
// ============================================================

/**
 * (교사) 대시보드 - 학생 검사 현황 목록
 */
export const getDgnssStudentList = async (
  claId: string,
  dgnssId?: number,
): Promise<DgnssStudentInfo[]> => {
  const query = dgnssId
    ? `/api/dgnss/tc/stinfolist?claId=${claId}&dgnssId=${dgnssId}`
    : `/api/dgnss/tc/stinfolist?claId=${claId}`;
  const res = await apiClient.get<DgnssStudentInfo[]>(query);
  return res.resultData ?? [];
};

/**
 * (교사) 미제출 학생 목록
 */
export const getNotSubmittedStudents = async (
  claId: string,
  dgnssId: number,
): Promise<DgnssStudentInfo[]> => {
  const res = await apiClient.get<DgnssStudentInfo[]>(
    `/api/dgnss/tc/notsubm?claId=${claId}&dgnssId=${dgnssId}`,
  );
  return res.resultData ?? [];
};

// ============================================================
// 내보내기
// ============================================================

export const dgnssService = {
  getDgnssList,
  startDgnss,
  endDgnss,
  cancelDgnss,
  restartDgnss,
  getDgnssStudentList,
  getNotSubmittedStudents,
};

export default dgnssService;
