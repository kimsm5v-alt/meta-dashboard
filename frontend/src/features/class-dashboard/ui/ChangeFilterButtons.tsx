import type React from 'react';
import styled from '@emotion/styled';

export type ChangeFilter =
  | 'all'
  | 'reliability-warning'
  | 'need-attention'
  | 'negative'
  | 'positive'
  | 'not-assessed';

interface FilterOption {
  value: ChangeFilter;
  label: string;
  activeColor: string;
  activeBg: string;
  inactiveBg: string;
  inactiveColor: string;
  hoverBg: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    value: 'all',
    label: '전체',
    activeBg: '#8b5cf6',
    activeColor: '#ffffff',
    inactiveBg: '#f3f4f6',
    inactiveColor: '#4b5563',
    hoverBg: '#e5e7eb',
  },
  {
    value: 'reliability-warning',
    label: '신뢰도 주의',
    activeBg: '#ef4444',
    activeColor: '#ffffff',
    inactiveBg: '#fef2f2',
    inactiveColor: '#dc2626',
    hoverBg: '#fee2e2',
  },
  {
    value: 'need-attention',
    label: '관심 필요',
    activeBg: '#f59e0b',
    activeColor: '#ffffff',
    inactiveBg: '#fffbeb',
    inactiveColor: '#d97706',
    hoverBg: '#fef3c7',
  },
  {
    value: 'negative',
    label: '부정 변화',
    activeBg: '#ef4444',
    activeColor: '#ffffff',
    inactiveBg: '#fef2f2',
    inactiveColor: '#b91c1c',
    hoverBg: '#fee2e2',
  },
  {
    value: 'positive',
    label: '긍정 변화',
    activeBg: '#10b981',
    activeColor: '#ffffff',
    inactiveBg: '#d1fae5',
    inactiveColor: '#047857',
    hoverBg: '#a7f3d0',
  },
  {
    value: 'not-assessed',
    label: '2차 미실시',
    activeBg: '#4b5563',
    activeColor: '#ffffff',
    inactiveBg: '#f3f4f6',
    inactiveColor: '#4b5563',
    hoverBg: '#e5e7eb',
  },
];

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FilterButton = styled.button<{
  $isActive: boolean;
  $activeBg: string;
  $activeColor: string;
  $inactiveBg: string;
  $inactiveColor: string;
  $hoverBg: string;
}>`
  padding: 6px ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: ${({ theme }) => theme.transitions.fast};
  border: none;
  cursor: pointer;
  background: ${({ $isActive, $activeBg, $inactiveBg }) => ($isActive ? $activeBg : $inactiveBg)};
  color: ${({ $isActive, $activeColor, $inactiveColor }) =>
    $isActive ? $activeColor : $inactiveColor};

  &:hover {
    background: ${({ $isActive, $activeBg, $hoverBg }) => ($isActive ? $activeBg : $hoverBg)};
  }
`;

interface ChangeFilterButtonsProps {
  value: ChangeFilter;
  onChange: (value: ChangeFilter) => void;
}

export const ChangeFilterButtons: React.FC<ChangeFilterButtonsProps> = ({ value, onChange }) => {
  return (
    <Container>
      {FILTER_OPTIONS.map((option) => (
        <FilterButton
          key={option.value}
          onClick={() => onChange(option.value)}
          $isActive={value === option.value}
          $activeBg={option.activeBg}
          $activeColor={option.activeColor}
          $inactiveBg={option.inactiveBg}
          $inactiveColor={option.inactiveColor}
          $hoverBg={option.hoverBg}
        >
          {option.label}
        </FilterButton>
      ))}
    </Container>
  );
};
