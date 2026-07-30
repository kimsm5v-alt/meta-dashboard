/**
 * 리포트 배지 모음.
 * 상태(RsBadge)·반(ClassBadge) + REPORT_SPEC_v2 신규: 성격(NatureBadge)·정오(ErrataBadge)·제출상태(StatusBadge).
 * 색상은 프로젝트 기준(primary-500 계열) 적용. 이모지 미사용(색 도트/문자 기호).
 */
import { Users } from 'lucide-react';
import type { ReportStatus, Nature, Errata, StatusCd } from '../../types';

// ============================================
// 리포트 상태 (배포 수업)
// ============================================
const RS: Record<ReportStatus, { cls: string; dot: string; label: string }> = {
  진행중: { cls: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', label: '진행중' },
  진행예정: { cls: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500', label: '진행예정' },
  완료: { cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', label: '완료' },
};

export const RsBadge = ({ status }: { status: ReportStatus }) => {
  const m = RS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

/** 반 배지 */
export const ClassBadge = ({ cls }: { cls: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
    <Users className="h-3 w-3" />
    {cls}
  </span>
);

// ============================================
// 콘텐츠 성격 (개념/활동/문항) — REPORT_SPEC_v2 색상
// ============================================
const NATURE_STYLE: Record<Nature, string> = {
  개념: 'bg-gray-100 text-gray-600',
  활동: 'bg-emerald-50 text-emerald-700',
  문항: 'bg-primary-50 text-primary-700',
};

export const NatureBadge = ({ nature }: { nature: Nature }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${NATURE_STYLE[nature]}`}>{nature}</span>
);

// ============================================
// 정오 (1=정답 O / 2=오답 X / 3=부분 △ / 4=채점불가 –)
// ============================================
const ERRATA: Record<Errata, { label: string; cls: string }> = {
  1: { label: 'O', cls: 'text-blue-600 bg-blue-50' },
  2: { label: 'X', cls: 'text-red-600 bg-red-50' },
  3: { label: '△', cls: 'text-amber-600 bg-amber-50' },
  4: { label: '–', cls: 'text-gray-400 bg-gray-50' },
};

/** 정오 뱃지 (문항 채점 결과) */
export const ErrataBadge = ({ errata }: { errata: Errata }) => {
  const m = ERRATA[errata];
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${m.cls}`}>
      {m.label}
    </span>
  );
};

// ============================================
// 제출 상태 (statusCd 2=미제출 / 3=제출 / 4=진행중 / 5=완료)
// ============================================
const STATUS: Record<StatusCd, { label: string; cls: string }> = {
  5: { label: '완료', cls: 'text-emerald-600 bg-emerald-50' },
  4: { label: '진행중', cls: 'text-amber-600 bg-amber-50' },
  3: { label: '제출', cls: 'text-blue-600 bg-blue-50' },
  2: { label: '미제출', cls: 'text-gray-400 bg-gray-50' },
};

export const StatusBadge = ({ statusCd }: { statusCd: StatusCd }) => {
  const m = STATUS[statusCd];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${m.cls}`}>{m.label}</span>;
};
