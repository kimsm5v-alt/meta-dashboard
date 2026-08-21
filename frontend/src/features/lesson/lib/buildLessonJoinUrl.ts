/**
 * 학생 참여 링크 조립 — 추가계획11·12 공통 계약.
 * accessKey: publish 응답 accessKey (`act-…`).
 */
export function buildLessonJoinUrl(accessKey: string): string {
  const path = `/student/lesson/${encodeURIComponent(accessKey)}`;
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}
