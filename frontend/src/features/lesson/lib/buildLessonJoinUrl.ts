/**
 * 학생 참여 링크 조립 — 추가계획11·12 공통 계약.
 * accessKey: publish 응답 accessKey (`act-…`).
 * lcmsSetId: 임시 — URL에 setId를 붙여 Phase B 전 embed 확인용. Phase B에서 path에서 제거 예정.
 */
export function buildLessonJoinUrl(accessKey: string, lcmsSetId?: string): string {
  const segments = [`/student/lesson/${encodeURIComponent(accessKey)}`];
  if (lcmsSetId?.trim()) {
    segments.push(`/${encodeURIComponent(lcmsSetId.trim())}`);
  }
  const path = segments.join('');
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}
