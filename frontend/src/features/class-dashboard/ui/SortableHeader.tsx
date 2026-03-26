import type React from 'react';
import styled from '@emotion/styled';
import { ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'number' | 'name' | 'type1' | 'type2';

interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentField: SortField | null;
  direction: 'asc' | 'desc';
  onSort: (field: SortField) => void;
}

const HeaderButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  transition: color 0.15s ease;
  border: none;
  background: transparent;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[900]};
  }
`;

const ArrowIcon = styled.span<{ $opacity?: number }>`
  width: 0.75rem;
  height: 0.75rem;
  display: inline-flex;
  opacity: ${({ $opacity }) => $opacity ?? 1};

  svg {
    width: 100%;
    height: 100%;
  }
`;

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  label,
  currentField,
  direction,
  onSort,
}) => {
  const isActive = currentField === field;

  return (
    <HeaderButton onClick={() => onSort(field)}>
      {label}
      {isActive ? (
        direction === 'asc' ? (
          <ArrowIcon>
            <ArrowUp />
          </ArrowIcon>
        ) : (
          <ArrowIcon>
            <ArrowDown />
          </ArrowIcon>
        )
      ) : (
        <ArrowIcon $opacity={0.3}>
          <ArrowUp />
        </ArrowIcon>
      )}
    </HeaderButton>
  );
};

export type { SortField };
