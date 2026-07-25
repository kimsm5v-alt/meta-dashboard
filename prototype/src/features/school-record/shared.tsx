import { LPA_COLORS } from './data';
import type { DraftStatus } from './types';

export type DisplayStatusKey = 'empty' | 'inprogress' | 'done';

/** 작성 상태 3분류 (미작성 / 작성 중 / 작성 완료) */
export const displayStatus = (s: DraftStatus): { key: DisplayStatusKey; label: string; badge: string; action: string } => {
  switch (s) {
    case 'DRAFT':
    case 'EDITED':
      return { key: 'done', label: '작성 완료', badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200', action: '수정' };
    case 'INPUTTING':
    case 'GENERATING':
      return { key: 'inprogress', label: '작성 중', badge: 'bg-amber-50 text-amber-600 border border-amber-200', action: '수정' };
    default:
      return { key: 'empty', label: '미작성', badge: 'bg-gray-100 text-gray-500', action: '작성' };
  }
};

export const StatusBadge: React.FC<{ status: DraftStatus }> = ({ status }) => {
  const m = displayStatus(status);
  return <span className={`inline-block text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${m.badge}`}>{m.label}</span>;
};

export const LpaBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`inline-block text-[11.5px] font-semibold px-2 py-0.5 rounded-full border ${LPA_COLORS[type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
    {type}
  </span>
);

/** 요인 칩 (색상 없이 중립 표기) */
export const FactorTag: React.FC<{ label: string; kind?: 'strength' | 'improvement' }> = ({ label }) => (
  <span className="inline-block text-[11.5px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">{label}</span>
);
