import React from 'react';

export type ChangeFilter = 'all' | 'reliability-warning' | 'need-attention' | 'negative' | 'positive' | 'not-assessed';

interface FilterOption {
  value: ChangeFilter;
  label: string;
  activeClass: string;
  inactiveClass: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    value: 'all',
    label: '전체',
    activeClass: 'bg-primary-500 text-white',
    inactiveClass: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  },
  {
    value: 'reliability-warning',
    label: '신뢰도 주의',
    activeClass: 'bg-red-500 text-white',
    inactiveClass: 'bg-red-50 text-red-600 hover:bg-red-100',
  },
  {
    value: 'need-attention',
    label: '관심 필요',
    activeClass: 'bg-amber-500 text-white',
    inactiveClass: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
  },
  {
    value: 'negative',
    label: '부정 변화',
    activeClass: 'bg-red-500 text-white',
    inactiveClass: 'bg-red-50 text-red-700 hover:bg-red-100',
  },
  {
    value: 'positive',
    label: '긍정 변화',
    activeClass: 'bg-emerald-500 text-white',
    inactiveClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  },
  {
    value: 'not-assessed',
    label: '2차 미실시',
    activeClass: 'bg-gray-600 text-white',
    inactiveClass: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  },
];

interface ChangeFilterButtonsProps {
  value: ChangeFilter;
  onChange: (value: ChangeFilter) => void;
}

export const ChangeFilterButtons: React.FC<ChangeFilterButtonsProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            value === option.value ? option.activeClass : option.inactiveClass
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
