import React from 'react';

export type ChangeFilter = 'all' | 'positive' | 'negative' | 'none' | 'not-assessed';

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
    value: 'positive',
    label: '긍정 변화',
    activeClass: 'bg-lime-500 text-white',
    inactiveClass: 'bg-lime-50 text-lime-700 hover:bg-lime-100',
  },
  {
    value: 'negative',
    label: '부정 변화',
    activeClass: 'bg-red-500 text-white',
    inactiveClass: 'bg-red-50 text-red-700 hover:bg-red-100',
  },
  {
    value: 'none',
    label: '변화 없음',
    activeClass: 'bg-gray-600 text-white',
    inactiveClass: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
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
