import { axiosInstance } from '@shared/api';
import { getAuth } from '@shared/lib/authClient';

interface PdfDownloadResponse {
  fileUrl?: string;
  summaryUrl?: string;
  url?: string;
}

/**
 * 학급 전체 PDF 일괄 다운로드 (ZIP)
 * type: 1=상세 보고서(기본), 2=요약 보고서, 3=상세+요약
 */
export async function downloadAllPdf(
  dgnssId: number,
  type: 1 | 2 | 3 = 1,
): Promise<void> {
  const jwtToken = getAuth().getAccessToken() ?? '';
  const response = await axiosInstance.get('/api/dgnss/dgnss-download-all', {
    params: { dgnssId, type, jwtToken },
    responseType: 'blob',
    validateStatus: () => true,
  });

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
    throw error;
  }
}
