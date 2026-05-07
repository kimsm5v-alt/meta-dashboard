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
 * 파일 경로를 게이트웨이를 통해 blob으로 받아 새 탭에서 오픈
 * GET {PDF_GW_URL}-extra/files/pfile-download?url={fileUrl}&jwtToken={token}&pionadaYn=Y
 */
async function openBlobFromUrl(fileUrl: string): Promise<void> {
  const jwtToken = getAuth().getAccessToken() ?? '';
  const downloadUrl = `${ENV.API_URL}/files/pfile-download?url=${fileUrl}&jwtToken=${jwtToken}&pionadaYn=Y`;

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
 * POST /api/dgnss/pdf 응답에서 파일 URL을 추출
 */
function extractFileUrl(data: PdfDownloadResponse): string | undefined {
  return (
    data.fileUrl ??
    data.summaryUrl ??
    data.url ??
    data.resultData?.fileUrl ??
    data.resultData?.url
  );
}

/**
 * 1. 학급 전체 PDF 일괄 다운로드 (ZIP) - GET
 * type: 1=상세 보고서, 2=요약 보고서, 3=상세+요약
 */
export async function downloadAllPdf(dgnssId: number, type: 1 | 2 | 3 = 3): Promise<void> {
  const jwtToken = getAuth().getAccessToken() ?? '';
  const response = await axiosInstance.get<PdfDownloadResponse>('/api/dgnss/dgnss-download-all', {
    params: { dgnssId, type, jwtToken },
    validateStatus: () => true,
  });

  const fileUrl = extractFileUrl(response.data);
  if (fileUrl) {
    await openBlobFromUrl(fileUrl);
  }
}

/**
 * 2. 교사용 보고서 PDF 다운로드 - POST
 */
export async function downloadTeacherReportPdf(params: PdfDownloadRequest): Promise<void> {
  const response = await axiosInstance.post<PdfDownloadResponse>('/api/dgnss/pdf', params, {
    validateStatus: () => true,
  });

  const fileUrl = extractFileUrl(response.data);
  console.log('[PDF] teacher report url:', fileUrl, response.data);
  if (fileUrl) {
    await openBlobFromUrl(fileUrl);
  }
}

/**
 * 3. 개별 학생 PDF 다운로드 - POST
 */
export async function downloadStudentPdf(params: PdfDownloadRequest): Promise<void> {
  const response = await axiosInstance.post<PdfDownloadResponse>('/api/dgnss/pdf', params, {
    validateStatus: () => true,
  });

  const fileUrl = extractFileUrl(response.data);
  console.log('[PDF] student pdf url:', fileUrl, response.data);
  if (fileUrl) {
    await openBlobFromUrl(fileUrl);
  }
}

/**
 * 4. PDF 발급 가능한 학생 목록 조회 - GET
 * dgnssId에 해당하는 학생별 answerIdx 맵 반환 (studentId → answerIdx)
 */
export async function fetchPdfAnswerMap(
  dgnssId: number,
  teacherUserId: string,
): Promise<Map<string, number>> {
  const response = await axiosInstance.get<{
    resultData: { data: Array<{ userId: string; answerIdx: number }> };
  }>('/api/dgnss/pdf/search', {
    params: { dgnssId, userId: teacherUserId, userType: 'T' },
  });
  const map = new Map<string, number>();
  for (const item of response.data.resultData?.data ?? []) {
    map.set(item.userId, item.answerIdx);
  }
  return map;
}
