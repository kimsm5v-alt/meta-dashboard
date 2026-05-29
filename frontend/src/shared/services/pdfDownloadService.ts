import axios from 'axios';
import { axiosInstance } from '@shared/api';
import { getAuth } from '@shared/lib/authClient';
import { ENV } from '@shared/config/env';

interface PdfDownloadResponse {
  fileUrl?: string;
  summaryUrl?: string;
  url?: string;
  resultData?: {
    fileUrl?: string;
    summaryUrl?: string;
    url?: string;
  };
}

interface PdfDownloadRequest {
  userId: string;
  userType: 'S' | 'T';
  dgnssId: number;
  answerIdx?: number;
  ordNo: number;
  type?: 1 | 2; // 1: 상세, 2: 요약
}

/**
 * /files/pfile-download 프록시를 통해 NAS 파일을 blob으로 받아 새 탭에서 오픈
 * GET /files/pfile-download?url={filePath}&jwtToken={token}
 */
async function openBlobFromUrl(fileUrl: string): Promise<void> {
  const jwtToken = getAuth().getAccessToken() ?? '';
  const downloadUrl = `${ENV.API_URL}/files/pfile-download?url=${fileUrl}&jwtToken=${jwtToken}`;

  const response = await axios.get(downloadUrl, {
    headers: { Authorization: `Bearer ${jwtToken}` },
    responseType: 'blob',
  });

  const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = blobUrl;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
}

/**
 * blob을 파일로 다운로드 (ZIP 등)
 */
function downloadBlob(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
}

/**
 * POST /api/dgnss/pdf 응답에서 파일 URL을 추출
 */
function extractFileUrl(data: PdfDownloadResponse): string | undefined {
  return (
    data.fileUrl ??
    data.summaryUrl ??
    data.url ??
    data.resultData?.fileUrl ??
    data.resultData?.summaryUrl ??
    data.resultData?.url
  );
}

/**
 * 1. 학급 전체 PDF 일괄 다운로드 (ZIP)
 * Step 1) pdf/search → 미생성 학생 목록
 * Step 2) 학생별 POST /api/dgnss/pdf → PDF 생성 (다운로드 없음)
 * Step 3) dgnss-download-all → ZIP 다운로드
 */
export async function downloadAllPdf(
  dgnssId: number,
  ordNo: 1 | 2,
  type: 1 | 2 | 3 = 3,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  // Step 1: 미생성 PDF 대상 학생 조회 (type=3: 상세·요약 둘 중 하나라도 미생성)
  const searchRes = await axiosInstance.get<{
    resultData: { data: Array<{ userId: string; userType: 'S' | 'T'; answerIdx: number; targetType: string }> };
  }>('/api/dgnss/pdf/search', {
    params: { dgnssId, type },
  });
  const students = searchRes.data.resultData?.data ?? [];

  // Step 2: 학생별 PDF 생성 요청 (URL 무시, 생성만)
  // targetType "2"(요약)는 /summary/pdf, "1"(상세)는 /pdf
  for (let i = 0; i < students.length; i++) {
    const { userId, userType, answerIdx, targetType } = students[i];
    if (targetType === '2') {
      await axiosInstance.post(
        '/api/dgnss/summary/pdf',
        { answerIdx },
        { validateStatus: () => true },
      );
    } else {
      await axiosInstance.post(
        '/api/dgnss/pdf',
        { userId, userType, dgnssId, answerIdx, ordNo, type: Number(targetType) },
        { validateStatus: () => true },
      );
    }
    onProgress?.(i + 1, students.length);
  }

  // Step 3-1: ZIP 생성 및 URL 조회 (JSON 응답)
  const jwtToken = getAuth().getAccessToken() ?? '';
  const zipRes = await axiosInstance.get<{ resultData: { zipFileUrl: string } }>(
    '/api/dgnss/dgnss-download-all',
    { params: { dgnssId, type, jwtToken } },
  );
  const zipFileUrl = zipRes.data.resultData?.zipFileUrl;
  if (!zipFileUrl) throw new Error('ZIP 파일 URL을 받지 못했습니다.');

  // Step 3-2: URL로 실제 ZIP 다운로드 (/pfile-download 기존 패턴 동일)
  const downloadUrl = `${ENV.API_URL}/files/pfile-download?url=${encodeURIComponent(zipFileUrl)}&jwtToken=${jwtToken}`;
  const response = await axios.get(downloadUrl, {
    headers: { Authorization: `Bearer ${jwtToken}` },
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  let filename = `학습심리정서검사_${dgnssId}.zip`;
  if (disposition) {
    const rfc5987 = disposition.match(/filename\*=UTF-8''([^;\s]+)/i);
    const plain = disposition.match(/filename=([^;\s]+)/i);
    if (rfc5987) {
      filename = decodeURIComponent(rfc5987[1]);
    } else if (plain) {
      filename = decodeURIComponent(plain[1].replace(/['"]/g, ''));
    }
  }
  downloadBlob(response.data as Blob, filename);
}

/**
 * 2. 교사용 보고서 PDF 다운로드 - POST
 * type=2(요약)는 /summary/pdf, type=1(상세)는 /pdf
 */
export async function downloadTeacherReportPdf(params: PdfDownloadRequest): Promise<void> {
  if (params.type === 2) {
    const response = await axiosInstance.post<PdfDownloadResponse>(
      '/api/dgnss/summary/pdf',
      { answerIdx: params.answerIdx },
      { validateStatus: () => true },
    );
    const fileUrl = extractFileUrl(response.data);
    if (fileUrl) await openBlobFromUrl(fileUrl);
    return;
  }

  const response = await axiosInstance.post<PdfDownloadResponse>('/api/dgnss/pdf', params, {
    validateStatus: () => true,
  });
  const fileUrl = extractFileUrl(response.data);
  if (fileUrl) await openBlobFromUrl(fileUrl);
}

/**
 * 3. 개별 학생 PDF 다운로드 - POST
 * type=2(요약)는 /summary/pdf, type=1(상세)는 /pdf
 */
export async function downloadStudentPdf(params: PdfDownloadRequest): Promise<void> {
  if (params.type === 2) {
    const response = await axiosInstance.post<PdfDownloadResponse>(
      '/api/dgnss/summary/pdf',
      { answerIdx: params.answerIdx },
      { validateStatus: () => true },
    );
    const fileUrl = extractFileUrl(response.data);
    if (fileUrl) await openBlobFromUrl(fileUrl);
    return;
  }

  const response = await axiosInstance.post<PdfDownloadResponse>('/api/dgnss/pdf', params, {
    validateStatus: () => true,
  });
  const fileUrl = extractFileUrl(response.data);
  if (fileUrl) await openBlobFromUrl(fileUrl);
}

/**
 * 4. PDF 발급 가능한 학생 목록 조회 - GET
 * dgnssId에 해당하는 학생별 answerIdx 맵 반환 (studentId → answerIdx)
 */
export async function fetchPdfAnswerMap(dgnssId: number): Promise<Map<string, number>> {
  const response = await axiosInstance.get<{
    resultData: { data: Array<{ userId: string; answerIdx: number }> };
  }>('/api/dgnss/pdf/search', {
    params: { dgnssId, type: 3 },
  });
  const map = new Map<string, number>();
  for (const item of response.data.resultData?.data ?? []) {
    map.set(item.userId, item.answerIdx);
  }
  return map;
}
