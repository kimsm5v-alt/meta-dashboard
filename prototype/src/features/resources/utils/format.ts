/**
 * 포맷 유틸 · 스코프 어댑터 · 콘텐츠 조회.
 */
import { LIB, STRENGTH_TOP3, FACTOR_REC, ROADMAP_CARDS, MY, REPORTS } from '../mock-data';
import type { LibItem, MyLesson, Report, Scope } from '../types';

/** 초 → "M분 SS초" */
export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${String(s).padStart(2, '0')}초`;
}

/**
 * LayoutV2 선택 반명 → 목업 스코프 문자열.
 * LayoutV2 MOCK_CLASSES 의 name('2-3반' 등)이 목업 CLASSES 와 일치하므로 그대로 사용.
 * 미선택(null/undefined) → '전체'.
 */
export function scopeFromClass(selectedClassName?: string | null): Scope {
  return selectedClassName ?? '전체';
}

/** 전체 스코프 여부 */
export function isAllScope(scope: Scope): boolean {
  return scope === '전체';
}

/** 스코프 기준 리포트 목록 (부록A #6) — 전체=전부 / 반=cls 필터 */
export function scopedReports(scope: Scope): Report[] {
  return scope === '전체' ? REPORTS : REPORTS.filter((r) => r.cls === scope);
}

/** id 로 콘텐츠 통합 조회 (자료실 + 추천 + 로드맵 + 나의 자료) */
export function findContent(id: string): LibItem | MyLesson | undefined {
  return (
    [...LIB, ...STRENGTH_TOP3, ...FACTOR_REC, ...ROADMAP_CARDS].find((x) => x.id === id) ||
    MY.find((x) => x.id === id)
  );
}
