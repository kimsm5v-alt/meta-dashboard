/**
 * 결정적 해시 — 재로딩해도 동일한 mock 수치를 만들기 위한 유틸.
 * mock-data(back-fill)와 aggregation(응답 생성) 양쪽에서 사용하므로 순환 방지를 위해 분리.
 */
export function hashKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}
