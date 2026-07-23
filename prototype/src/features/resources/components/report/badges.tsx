/**
 * 리포트 상태 배지 (목업 rsBadge). Phase 4·5 공용.
 */
import type { ReportStatus } from '../../types';

const MAP: Record<ReportStatus, { cls: string; label: string }> = {
  진행중: { cls: 'bg-emerald-50 text-emerald-600', label: '🟢 진행중' },
  진행예정: { cls: 'bg-amber-50 text-amber-600', label: '🟡 진행예정' },
  완료: { cls: 'bg-gray-100 text-gray-600', label: '⬜ 완료' },
};

export const RsBadge = ({ status }: { status: ReportStatus }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${MAP[status].cls}`}>{MAP[status].label}</span>
);

/** 반 배지 (👥 반) */
export const ClassBadge = ({ cls }: { cls: string }) => (
  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">👥 {cls}</span>
);
