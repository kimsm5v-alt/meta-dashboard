import { axiosInstance } from '@shared/api';
import { getAuth } from '@shared/lib/authClient';

/** 인터페이스 정의 */
interface PdfDownloadResponse {
  fileUrl?: string;
  summaryUrl?: string;
  url?: string;
}

interface PdfDownloadRequest {
  userId: string;
  userType: 'S' | 'T';
  dgnssId: number;
  answerIdx: number;
  ordNo: number;
  type?: 1 | 2; // 1: 상세, 2: 요약
}

/**
 * [공통 함수] 응답 데이터의 Content-Type에 따라 다운로드 또는 URL 오픈 처리
 */
async function handleFileResponse(response: any, defaultFileName: string) {
  const contentType = (response.headers['content-type'] as string | undefined) ?? '';

  // 1. 파일 스트림(Blob)인 경우
  if (
    contentType.includes('application/pdf') ||
    contentType.includes('application/zip') ||
    contentType.includes('octet-stream')
  ) {
    const isZip = contentType.includes('application/zip');
    const blob = new Blob([response.data as BlobPart], {
      type: isZip ? 'application/zip' : 'application/pdf',
    });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = isZip ? `${defaultFileName}.zip` : `${defaultFileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }
  // 2. JSON 에러 메시지나 URL이 담긴 응답인 경우
  else {
    const text = await (response.data as Blob).text();
    try {
      const json = JSON.parse(text) as PdfDownloadResponse;
      const fileUrl = json.fileUrl ?? json.summaryUrl ?? json.url;
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
    } catch (e) {
      console.error('파일 처리 중 오류가 발생했습니다.', e);
    }
  }
}

/**
 * 1. 학급 전체 PDF 일괄 다운로드 (ZIP) - GET
 * type: 1=상세 보고서, 2=요약 보고서, 3=상세+요약
 */
export async function downloadAllPdf(dgnssId: number, type: 1 | 2 | 3 = 3): Promise<void> {
  const jwtToken = getAuth().getAccessToken() ?? '';
  const response = await axiosInstance.get('/api/dgnss/dgnss-download-all', {
    params: { dgnssId, type, jwtToken },
    responseType: 'blob',
    validateStatus: () => true,
  });

  await handleFileResponse(response, `class_result_type${type}`);
}

/**
 * 2. 교사용 보고서 PDF 다운로드 - POST
 * (기존 params 안에 넣던 실수를 수정하고 인터페이스를 적용했습니다)
 */
export async function downloadTeacherReportPdf(params: PdfDownloadRequest): Promise<void> {
  const response = await axiosInstance.post('/api/dgnss/pdf', params, {
    responseType: 'blob',
    validateStatus: () => true,
  });

  await handleFileResponse(response, `teacher_report_${params.dgnssId}`);
}

/**
 * 3. 개별 학생 PDF 다운로드 - POST
 */
export async function downloadStudentPdf(params: PdfDownloadRequest): Promise<void> {
  const response = await axiosInstance.post('/api/dgnss/pdf', params, {
    responseType: 'blob',
    validateStatus: () => true,
  });

  // 파일명 예시: result_studentId_1차.pdf
  await handleFileResponse(response, `result_${params.userId}_${params.ordNo}차`);
}
