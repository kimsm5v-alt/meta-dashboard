/**
 * 리포트 상태 필터 칩 — 전체 / 진행중 / 진행예정 / 완료.
 * 탭별 건수는 별도 쿼리가 필요하므로 현재 범위에서 제외.
 */
import styled from '@emotion/styled';
import type { RsFilter } from './types';

interface ReportFilterChipsProps {
  filter: RsFilter;
  onFilterChange: (f: RsFilter) => void;
}

const FILTERS: RsFilter[] = ['전체', '진행중', '진행예정', '완료'];

const ChipList = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary[500] : theme.colors.gray[200])};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary[50] : theme.colors.background.paper};
  color: ${({ theme, $active }) => ($active ? theme.colors.primary[600] : theme.colors.gray[600])};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:not(:disabled):hover {
    border-color: ${({ theme, $active }) =>
      $active ? theme.colors.primary[500] : theme.colors.gray[300]};
  }
`;

export const ReportFilterChips = ({ filter, onFilterChange }: ReportFilterChipsProps) => (
  <ChipList>
    {FILTERS.map((f) => (
      <Chip key={f} $active={filter === f} onClick={() => onFilterChange(f)}>
        {f}
      </Chip>
    ))}
  </ChipList>
);
