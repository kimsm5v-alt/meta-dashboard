import { axiosInstance } from '@shared/api';

interface PdfDownloadResponse {
  fileUrl?: string;
  summaryUrl?: string;
  url?: string;
}

/** 다운로드 유형 상수 */
const DOWNLOAD_TYPE = { STUDENT: 1, CLASS: 2, ALL: 3 } as const;

/**
 * 학급 전체 PDF 일괄 다운로드 (ZIP)
 * POST 요청으로 blob을 받아와 다운로드합니다.
 * 인증은 쿠키 기반으로 이루어지므로 JWT 토큰을 URL에 노출하지 않습니다.
 */
export async function downloadAllPdf(
  dgnssId: number,
  type: 1 | 2 | 3 = DOWNLOAD_TYPE.ALL,
): Promise<void> {
  const response = await axiosInstance.post(
    '/api/dgnss/dgnss-download-all',
    { dgnssId, type },
    {
      responseType: 'blob',
      validateStatus: () => true,
    },
  );

  const contentType = (response.headers['content-type'] as string | undefined) ?? '';

  if (contentType.includes('application/zip') || contentType.includes('octet-stream')) {
    const blob = new Blob([response.data as BlobPart], { type: 'application/zip' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `class_result_round${type}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } else {
    const text = await (response.data as Blob).text();
    const json = JSON.parse(text) as PdfDownloadResponse;
    const fileUrl = json.fileUrl ?? json.summaryUrl ?? json.url;
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  }
}

/**
 * 개별 학생 PDF 다운로드
 * POST /api/dgnss/pdf → blob 스트리밍 또는 fileUrl JSON 반환
 */
export async function downloadStudentPdf(params: {
  userId: string;
  userType: 'S' | 'T';
  dgnssId: number;
  answerIdx: number;
  ordNo: 1 | 2;
}): Promise<void> {
  try {
    const response = await axiosInstance.post('/api/dgnss/pdf', params, {
      responseType: 'blob',
      validateStatus: () => true,
    });

    const contentType = (response.headers['content-type'] as string | undefined) ?? '';

    if (contentType.includes('application/pdf') || contentType.includes('octet-stream')) {
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `result_${params.userId}_${params.ordNo}차.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } else {
      const text = await (response.data as Blob).text();
      const json = JSON.parse(text) as PdfDownloadResponse;
      const fileUrl = json.fileUrl ?? json.summaryUrl ?? json.url;
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
    }
  } catch (error) {
    console.error('[downloadStudentPdf] PDF 다운로드 실패:', error);
    throw error;
  }
}
