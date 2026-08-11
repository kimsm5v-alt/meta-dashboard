import styled from '@emotion/styled';
import {
  DURATIONS,
  FACTORS,
  FILTER_AXIS_LABELS,
  GRADES,
  LEVELS,
  PROVIDERS,
  SEL_AREAS,
  SORT_KEYS,
  SORT_AXIS_LABEL,
  SORT_KEYS_LABELS,
  type FilterAxis,
  type FilterPanelProps,
  type SortKey,
  type LibFilters,
} from '@features/lesson';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState } from 'react';

const Panel = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: 1rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;
const QuickFilters = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
`;
const Details = styled.div``;
const DetailLastRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;
const Group = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
`;
const Label = styled.p`
  width: 60px;
`;
const Chips = styled.div``;
const Chip = styled.button<{ $active: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  ${({ theme, $active }) =>
    $active
      ? `
      border: 1px solid ${theme.colors.primary[500]};
      background-color: ${theme.colors.primary[50]};
      color: ${theme.colors.primary[600]};
    `
      : `
      border: 1px solid ${theme.colors.gray[200]};
      background-color: ${theme.colors.gray[100]};
      color: ${theme.colors.gray[900]};
    `}
`;
const PanelButton = styled.button`
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const FilterGroup = ({
  label,
  options,
  filters,
  sort,
  onToggle,
  onSort,
}: {
  label: FilterAxis | 'sort';
  options: readonly string[];
  filters?: LibFilters;
  sort?: SortKey;
  onToggle?: (axis: FilterAxis, value: string) => void;
  onSort?: (value: SortKey) => void;
}) => {
  const _onClick = (value: string | SortKey) => {
    if (label === 'sort') {
      onSort?.(value as SortKey);
    } else {
      onToggle?.(label as FilterAxis, value);
    }
  };
  return (
    <Group>
      <Label>{label === 'sort' ? SORT_AXIS_LABEL : FILTER_AXIS_LABELS[label as FilterAxis]}</Label>
      <Chips>
        {options.map((option) => (
          <Chip
            key={option}
            $active={
              label === 'sort'
                ? sort === option
                : (filters?.[label as FilterAxis].includes(option) ?? false)
            }
            onClick={() => _onClick(option)}
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
        <FilterGroup label={'level'} options={LEVELS} filters={filters} onToggle={onToggle} />
        <FilterGroup label={'grade'} options={GRADES} filters={filters} onToggle={onToggle} />
        <PanelButton onClick={() => setOpen((o) => !o)}>
          상세 필터 {open ? <ChevronUp /> : <ChevronDown />}
        </PanelButton>
      </QuickFilters>
      {open && (
        <Details>
          <hr />
          <FilterGroup
            label={'provider'}
            options={PROVIDERS}
            filters={filters}
            onToggle={onToggle}
          />
          <FilterGroup
            label={'selArea'}
            options={SEL_AREAS}
            filters={filters}
            onToggle={onToggle}
          />
          <FilterGroup
            label={'duration'}
            options={DURATIONS}
            filters={filters}
            onToggle={onToggle}
          />
          <FilterGroup label={'factor'} options={FACTORS} filters={filters} onToggle={onToggle} />
          <DetailLastRow>
            <FilterGroup label={'sort'} options={SORT_KEYS} sort={sort} onSort={onSort} />
            <PanelButton onClick={onClear}>
              필터 초기화 <X />
            </PanelButton>
          </DetailLastRow>
        </Details>
      )}
    </Panel>
  );
};
