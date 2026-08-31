/**
 * LibItem.createdAt(ISO) → 카드 표시용 'MM/DD'.
 * 파싱 실패 시 원문, 없으면 '-'.
 */
export function formatCreatedAt(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}
