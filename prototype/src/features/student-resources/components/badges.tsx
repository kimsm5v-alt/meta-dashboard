/**
 * 학생 리포트 배지 (self-contained). 색상은 프로젝트 기준. 이모지 미사용.
 */
import type { Nature, Errata, StudentStatus } from '../types';

const STATUS: Record<StudentStatus, string> = {
  완료: 'text-emerald-600 bg-emerald-50',
  진행중: 'text-amber-600 bg-amber-50',
  미제출: 'text-gray-400 bg-gray-50',
  대기: 'text-gray-400 bg-gray-50',
};

export const StudentStatusBadge = ({ status }: { status: StudentStatus }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS[status]}`}>{status}</span>
);

const NATURE: Record<Nature, string> = {
  개념: 'bg-gray-100 text-gray-600',
  활동: 'bg-emerald-50 text-emerald-700',
  문항: 'bg-primary-50 text-primary-700',
};

export const NatureBadge = ({ nature }: { nature: Nature }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${NATURE[nature]}`}>{nature}</span>
);

const ERRATA: Record<Errata, { label: string; cls: string }> = {
  1: { label: 'O', cls: 'text-blue-600 bg-blue-50' },
  2: { label: 'X', cls: 'text-red-600 bg-red-50' },
  3: { label: '△', cls: 'text-amber-600 bg-amber-50' },
  4: { label: '–', cls: 'text-gray-400 bg-gray-50' },
};

export const ErrataBadge = ({ errata }: { errata: Errata }) => {
  const m = ERRATA[errata];
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${m.cls}`}>
      {m.label}
    </span>
  );
};
