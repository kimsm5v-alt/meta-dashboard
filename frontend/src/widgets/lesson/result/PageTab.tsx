import { useState } from 'react';
import styled from '@emotion/styled';
import { Clock } from 'lucide-react';
import type { ReportDetailView } from '@features/lesson';
import { PageList } from './PageList';
import { PageContent } from './PageContent';

interface PageTabProps {
  view: ReportDetailView;
}

const Empty = styled.div`
  margin-top: 20px;
  padding: 64px 0;
  border: 1px dashed ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.gray[50]};
  text-align: center;
`;

const EmptyIcon = styled(Clock)`
  display: block;
  width: 32px;
  height: 32px;
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const EmptyText = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: 20px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 300px 1fr;
  }
`;

export const PageTab = ({ view }: PageTabProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (view.participantCount === 0) {
    return (
      <Empty>
        <EmptyIcon />
        <EmptyText>아직 제출된 응답이 없습니다.</EmptyText>
      </Empty>
    );
  }

  return (
    <Layout>
      <PageList view={view} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
      <PageContent view={view} selectedIndex={selectedIndex} />
    </Layout>
  );
};
