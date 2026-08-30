import styled from '@emotion/styled';
import type { PageTabGridRow, PageTabListItem } from '@features/lesson';
import { NatureBadge } from './ReportBadge';
import { SummaryStrip } from './SummaryStrip';
import { ResponseGrid } from './ResponseGrid';
import type { GridItem } from './ResponseGrid';

interface PageContentProps {
  page: PageTabListItem;
  assignedCount: number;
  gridRows: PageTabGridRow[];
}

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 20px;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Order = styled.span`
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const PageTitle = styled.b`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const SectionTitle = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Count = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

export const PageContent = ({ page, assignedCount, gridRows }: PageContentProps) => {
  const items: GridItem[] = gridRows.map((row) => ({
    key: row.key,
    title: row.title,
    nature: row.nature,
    mode: 'plain',
    cell: row.cell,
    capture: row.capture,
    showNature: false,
  }));

  return (
    <Shell>
      <Head>
        <Order>{page.seq}</Order>
        <PageTitle>{page.title}</PageTitle>
        {page.nature ? <NatureBadge nature={page.nature} /> : null}
      </Head>
      <SummaryStrip page={page} assignedCount={assignedCount} />
      <div>
        <SectionTitle>
          학생별 응답 <Count>({assignedCount})</Count>
        </SectionTitle>
        <ResponseGrid items={items} showSummary />
      </div>
    </Shell>
  );
};
