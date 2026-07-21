/**
 * 자료실 카드 공통 스타일.
 * 3개 카드(ResourceCard·MyLessonCard·ReportCard)가 동일 셸을 공유 → 단일 소스.
 */

/** 카드 셸: 프리미엄 hover(살짝 떠오름 + 그림자). vj-card 핸드오프 감성을 Tailwind 로 재현. */
export const CARD_SHELL =
  'flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-200';
