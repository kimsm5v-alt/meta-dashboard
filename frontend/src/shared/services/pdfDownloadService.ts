import { axiosInstance } from '@shared/api';

interface PdfDownloadResponse {
  fileUrl?: string;
  summaryUrl?: string;
  url?: string;
}

/**
 * 학급 전체 PDF 일괄 다운로드 (ZIP streaming)
 * dgnss-download-all은 새 창으로 호출해야 ZIP이 다운로드됨
 */
export async function downloadAllPdf(
  dgnssId: number,
  jwtToken: string,
  type: 1 | 2 | 3 = 3,
): Promise<void> {
  const url = `/api/dgnss/dgnss-download-all?jwtToken=${encodeURIComponent(jwtToken)}&dgnssId=${dgnssId}&type=${type}`;
  window.open(url, '_blank');
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
}
