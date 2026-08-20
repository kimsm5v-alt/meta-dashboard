/**
 * 학생 참여 링크 조립 — 추가계획11·12 공통 계약.
 * joinKey: Phase B 이후 publish 응답 accessKey. (route param 이름은 activityId 유지)
 */
export function buildLessonJoinUrl(joinKey: string): string {
  const path = `/student/lesson/${encodeURIComponent(joinKey)}`;
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}
