/**
 * 날짜 포맷팅 공용 유틸리티
 */

/** 'YYYY-MM-DD HH:mm' → 한국어 단축 날짜 (예: '2월 13일 (목)') */
export const formatScheduleDateKr = (dateStr: string): string => {
  const [date] = dateStr.split(' ');
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
};

/** 'YYYY-MM-DD HH:mm' → 시간 부분 추출 (예: '09:00') */
export const extractTime = (dateStr: string): string => {
  return dateStr.split(' ')[1] || '09:00';
};

/** 'YYYY-MM-DD' → 한국어 월/일 (예: '02. 13.') */
export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
};

/** Date 객체 → 'YYYY-MM-DD' (로컬 타임존 기준) */
export const formatDateISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
