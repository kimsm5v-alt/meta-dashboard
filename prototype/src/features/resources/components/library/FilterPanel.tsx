/**
 * 자료실 다축 필터 (목업 filterPanelHTML / axisRow / fToggle / clearLibF).
 * 축: 학교급·추천학년(퀵) + 제공처·SEL영역·수업시간·검사요인(상세) + 정렬.
 * 제어 컴포넌트 — 상태는 LibraryView 소유.
 */
import { useState } from 'react';
import { PROVIDERS, SEL_AREAS, LEVELS, GRADES, DURATIONS, FACTORS_SHORT } from '../../mock-data';

export type FilterAxis = 'provider' | 'casel' | 'level' | 'grade' | 'duration' | 'factor';
export type LibFilters = Record<FilterAxis, string[]>;
export type SortKey = '인기순' | '최신순' | '저장순';

export const EMPTY_FILTERS: LibFilters = {
  provider: [], casel: [], level: [], grade: [], duration: [], factor: [],
};

interface FilterPanelProps {
  filters: LibFilters;
  onToggle: (axis: FilterAxis, val: string) => void;
  onClear: () => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
}

const chipCls = (on: boolean) =>
  `rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
    on
      ? 'border-primary-500 bg-primary-50 text-primary-600'
      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
  }`;

const Chip = ({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={chipCls(on)}>{label}</button>
);

const AxisRow = ({ label, axis, pairs, filters, onToggle }: {
  label: string; axis: FilterAxis; pairs: [string, string][];
  filters: LibFilters; onToggle: (axis: FilterAxis, val: string) => void;
}) => (
  <div className="flex gap-3 py-2">
    <div className="w-16 flex-none pt-1 text-xs font-bold text-gray-500">{label}</div>
    <div className="flex flex-wrap gap-1.5">
      {pairs.map(([v, l]) => (
        <Chip key={v} label={l} on={filters[axis].includes(v)} onClick={() => onToggle(axis, v)} />
      ))}
    </div>
  </div>
);

const SORTS: SortKey[] = ['인기순', '최신순', '저장순'];

export const FilterPanel = ({ filters, onToggle, onClear, sort, onSort }: FilterPanelProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      {/* 퀵 필터 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-bold text-gray-500">학교급</span>
        {LEVELS.map((v) => <Chip key={v} label={v} on={filters.level.includes(v)} onClick={() => onToggle('level', v)} />)}
        <span className="mx-1 h-4 w-px bg-gray-200" />
        <span className="mr-1 text-xs font-bold text-gray-500">추천학년</span>
        {GRADES.map((v) => <Chip key={v} label={v} on={filters.grade.includes(v)} onClick={() => onToggle('grade', v)} />)}
        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          상세 필터 {open ? '▴' : '▾'}
        </button>
      </div>

      {/* 상세 필터 */}
      {open && (
        <div className="mt-3 border-t border-gray-100 pt-2">
          <AxisRow label="제공처" axis="provider" pairs={PROVIDERS} filters={filters} onToggle={onToggle} />
          <AxisRow label="SEL영역" axis="casel" pairs={SEL_AREAS.map((a) => [a, a])} filters={filters} onToggle={onToggle} />
          <AxisRow label="수업시간" axis="duration" pairs={DURATIONS.map((v) => [v, v])} filters={filters} onToggle={onToggle} />
          <AxisRow label="검사요인" axis="factor" pairs={FACTORS_SHORT.map((v) => [v, v])} filters={filters} onToggle={onToggle} />
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-500">정렬</span>
              {SORTS.map((s) => <Chip key={s} label={s} on={sort === s} onClick={() => onSort(s)} />)}
            </div>
            <button onClick={onClear} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50">
              필터 초기화 ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
