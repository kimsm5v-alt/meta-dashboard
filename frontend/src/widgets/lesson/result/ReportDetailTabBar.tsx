import styled from '@emotion/styled';
import { FileText, User } from 'lucide-react';
import type { ReportDetailTab } from '@features/lesson';

interface ReportDetailTabBarProps {
  tab: ReportDetailTab;
  onChange: (tab: ReportDetailTab) => void;
}

const TABS: { id: ReportDetailTab; label: string; Icon: typeof FileText }[] = [
  { id: 'student', label: '학생별 보기', Icon: User },
  { id: 'slide', label: '페이지별 보기', Icon: FileText },
];

const Bar = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const TabBtn = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: -1px;
  padding: 10px ${({ theme }) => theme.spacing.md};
  border: none;
  border-bottom: 2px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary[500] : 'transparent')};
  background: transparent;
  color: ${({ theme, $active }) => ($active ? theme.colors.primary[600] : theme.colors.gray[500])};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme, $active }) =>
      $active ? theme.colors.primary[600] : theme.colors.gray[700]};
  }
`;

const TabIcon = styled.svg`
  width: 16px;
  height: 16px;
`;

export const ReportDetailTabBar = ({ tab, onChange }: ReportDetailTabBarProps) => (
  <Bar>
    {TABS.map((t) => {
      const active = tab === t.id;
      return (
        <TabBtn key={t.id} type='button' $active={active} onClick={() => onChange(t.id)}>
          <TabIcon as={t.Icon} />
          {t.label}
        </TabBtn>
      );
    })}
  </Bar>
);
