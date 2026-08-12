/**
 * 포맷 유틸 · 스코프 어댑터 · 콘텐츠 조회.
 */
import { LIB, STRENGTH_TOP3, FACTOR_REC, MY, REPORTS } from '../mock-data';
import type { LibItem, MyLesson, Report, Scope } from '../types';

/** 초 → "M분 SS초" */
export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${String(s).padStart(2, '0')}초`;
}

/** 초 → "M분 SS초" (1분 미만은 "SS초") */
export function fmtDuration(sec: number): string {
  return sec < 60 ? `${sec}초` : fmtTime(sec);
}

/** 'YYYY-MM-DD' → 'MM/DD' (다른 포맷이 들어오면 그대로 반환) */
export function fmtDate(iso: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[1]}/${m[2]}` : iso;
}

/** 'YYYY-MM-DD HH:mm' → 'MM/DD HH:mm' */
export function fmtDateTime(iso: string): string {
  const [d, t] = iso.split(' ');
  return t ? `${fmtDate(d)} ${t}` : fmtDate(d);
}

/** 비율(%) — whole 0 이면 0 */
export function pct(part: number, whole: number): number {
  return whole ? Math.round((part / whole) * 100) : 0;
}

/**
 * LayoutV2 선택 반명 → 목업 스코프 문자열.
 * LayoutV2 MOCK_CLASSES 의 name('2-3반' 등)이 목업 CLASSES 와 일치하므로 그대로 사용.
 * 미선택(null/undefined) → '전체'.
 */
export function scopeFromClass(selectedClassName?: string | null): Scope {
  return selectedClassName ?? '전체';
}

/**
 * 수업(/lesson) 진입 시 기본 선택 반 = LNB 반 목록 최상단.
 * app/LayoutV2.tsx MOCK_CLASSES[0].id ('group-1' = '2-3반') 와 동기화 필요.
 * TODO(app): LayoutV2 가 MOCK_CLASSES 를 export 하면 이 상수를 지우고 classes[0].id 사용.
 */
export const DEFAULT_LESSON_CLASS_ID = 'group-1';

/** 전체 스코프 여부 */
export function isAllScope(scope: Scope): boolean {
  return scope === '전체';
}

/** 스코프 기준 리포트 목록 (부록A #6) — 전체=전부 / 반=cls 필터 */
export function scopedReports(scope: Scope): Report[] {
  return scope === '전체' ? REPORTS : REPORTS.filter((r) => r.cls === scope);
}

/** id 로 콘텐츠 통합 조회 (자료실 + 추천 + 나의 자료) */
export function findContent(id: string): LibItem | MyLesson | undefined {
  return (
    [...LIB, ...STRENGTH_TOP3, ...FACTOR_REC].find((x) => x.id === id) ||
    MY.find((x) => x.id === id)
  );
}
