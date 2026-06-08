import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'number' | 'name' | 'type1' | 'type2';

interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentField: SortField | null;
  direction: 'asc' | 'desc';
  onSort: (field: SortField) => void;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  label,
  currentField,
  direction,
  onSort,
}) => {
  const isActive = currentField === field;

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
    >
      {label}
      {isActive ? (
        direction === 'asc' ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUp className="w-3 h-3 opacity-30" />
      )}
    </button>
  );
};

export type { SortField };
