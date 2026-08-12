import styled from '@emotion/styled';
import type { FilterAxis, FilterPanelProps, LibFilters, SortKey } from '../model/types';
import {
  DURATIONS,
  FACTORS,
  FILTER_AXIS_LABELS,
  GRADES,
  LEVELS,
  PROVIDERS,
  SEL_AREAS,
  SORT_AXIS_LABEL,
  SORT_KEYS,
  SORT_KEYS_LABELS,
} from '../model/filterTaxonomy';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState } from 'react';

const Panel = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.background.paper};
  padding: ${({ theme }) => theme.spacing.md};
`;

const QuickFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

const Divider = styled.span`
  display: inline-block;
  width: 1px;
  height: 16px;
  margin: 0 ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.gray[200]};
  flex-shrink: 0;
`;

const Details = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const DetailLastRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
`;

const Group = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: ${({ $compact }) => ($compact ? 'center' : 'flex-start')};
  gap: ${({ $compact, theme }) => ($compact ? '6px' : theme.spacing.md)};
  padding: ${({ $compact, theme }) => ($compact ? '0' : `${theme.spacing.sm} 0`)};
`;

const Label = styled.span<{ $compact?: boolean }>`
  flex: none;
  width: ${({ $compact }) => ($compact ? 'auto' : '64px')};
  margin-right: ${({ $compact, theme }) => ($compact ? theme.spacing.xs : '0')};
  padding-top: ${({ $compact }) => ($compact ? '0' : '4px')};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const Chip = styled.button<{ $active: boolean }>`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  cursor: pointer;
  transition:
    color ${({ theme }) => theme.transitions.fast},
    background-color ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  ${({ theme, $active }) =>
    $active
      ? `
      border: 1px solid ${theme.colors.primary[500]};
      background-color: ${theme.colors.primary[50]};
      color: ${theme.colors.primary[600]};
    `
      : `
      border: 1px solid ${theme.colors.gray[200]};
      background-color: ${theme.colors.background.paper};
      color: ${theme.colors.gray[600]};

      &:hover {
        border-color: ${theme.colors.gray[300]};
      }
    `}
`;

const PanelButton = styled.button<{ $pushEnd?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: ${({ $pushEnd }) => ($pushEnd ? 'auto' : '0')};
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: transparent;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  color: ${({ theme }) => theme.colors.gray[600]};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
`;

const FilterGroup = ({
  label,
  options,
  filters,
  sort,
  onToggle,
  onSort,
  compact = false,
}: {
  label: FilterAxis | 'sort';
  options: readonly string[];
  filters?: LibFilters;
  sort?: SortKey;
  onToggle?: (axis: FilterAxis, value: string) => void;
  onSort?: (value: SortKey) => void;
  compact?: boolean;
}) => {
  const handleClick = (value: string) => {
    if (label === 'sort') {
      onSort?.(value as SortKey);
      return;
    }
    onToggle?.(label, value);
  };

  return (
    <Group $compact={compact}>
      <Label $compact={compact}>
        {label === 'sort' ? SORT_AXIS_LABEL : FILTER_AXIS_LABELS[label]}
      </Label>
      <Chips>
        {options.map((option) => (
          <Chip
            key={option}
            type='button'
            $active={
              label === 'sort' ? sort === option : (filters?.[label].includes(option) ?? false)
            }
            onClick={() => handleClick(option)}
          >
            {label === 'sort' ? SORT_KEYS_LABELS[option as SortKey] : option}
          </Chip>
        ))}
      </Chips>
    </Group>
  );
};

export const FilterPanel = ({ filters, sort, onToggle, onClear, onSort }: FilterPanelProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Panel>
      <QuickFilters>
        <FilterGroup label='level' options={LEVELS} filters={filters} onToggle={onToggle} compact />
        <Divider aria-hidden />
        <FilterGroup label='grade' options={GRADES} filters={filters} onToggle={onToggle} compact />
        <PanelButton type='button' $pushEnd onClick={() => setOpen((prev) => !prev)}>
          상세 필터 {open ? <ChevronUp /> : <ChevronDown />}
        </PanelButton>
      </QuickFilters>
      {open && (
        <Details>
          <FilterGroup label='provider' options={PROVIDERS} filters={filters} onToggle={onToggle} />
          <FilterGroup label='selArea' options={SEL_AREAS} filters={filters} onToggle={onToggle} />
          <FilterGroup label='duration' options={DURATIONS} filters={filters} onToggle={onToggle} />
          <FilterGroup label='factor' options={FACTORS} filters={filters} onToggle={onToggle} />
          <DetailLastRow>
            <FilterGroup label='sort' options={SORT_KEYS} sort={sort} onSort={onSort} compact />
            <PanelButton type='button' onClick={onClear}>
              필터 초기화 <X />
            </PanelButton>
          </DetailLastRow>
        </Details>
      )}
    </Panel>
  );
};
