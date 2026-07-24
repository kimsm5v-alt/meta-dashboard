import html2canvas from 'html2canvas';

export interface CaptureRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CaptureResult {
  dataUri: string;
  w: number;
  h: number;
}

/** 에이전트 image_validation.py와 동일한 기준(장당 5MB) */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** 캡처 UI 자체(오버레이/버튼/토스트 등)를 스크린샷 결과에서 제외하기 위한 마커 속성 */
export const CAPTURE_IGNORE_ATTR = 'data-capture-ignore';

const base64Bytes = (dataUri: string): number => {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
  return Math.floor((base64.length * 3) / 4);
};

/**
 * 화면의 지정된 사각형 영역만 실제로 캡처해 5MB 이하의 data URI로 인코딩한다.
 * PNG로 시도 후 용량 초과 시 JPEG(0.85 → 0.7)로 순차 폴백한다.
 */
export const captureRegion = async (rect: CaptureRect): Promise<CaptureResult> => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const canvas = await html2canvas(document.body, {
    x: rect.x + window.scrollX,
    y: rect.y + window.scrollY,
    width: rect.w,
    height: rect.h,
    scale: dpr,
    useCORS: true,
    backgroundColor: '#ffffff',
    ignoreElements: (el) => el.hasAttribute(CAPTURE_IGNORE_ATTR),
  });

  let dataUri = canvas.toDataURL('image/png');
  if (base64Bytes(dataUri) > MAX_IMAGE_BYTES) {
    dataUri = canvas.toDataURL('image/jpeg', 0.85);
  }
  if (base64Bytes(dataUri) > MAX_IMAGE_BYTES) {
    dataUri = canvas.toDataURL('image/jpeg', 0.7);
  }
  if (base64Bytes(dataUri) > MAX_IMAGE_BYTES) {
    throw new Error(
      '캡처한 영역이 너무 커서 5MB 이하로 압축할 수 없습니다. 더 작은 영역을 선택해주세요.',
    );
  }

  return { dataUri, w: rect.w, h: rect.h };
};
