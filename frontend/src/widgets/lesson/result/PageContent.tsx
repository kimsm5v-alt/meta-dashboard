import styled from '@emotion/styled';
import type { ReportDetailView } from '@features/lesson';
import { renderMode, responseCell, responseOf } from '@features/lesson';
import { NatureBadge } from './ReportBadge';
import { SummaryStrip } from './SummaryStrip';
import { ResponseGrid } from './ResponseGrid';
import type { GridItem } from './ResponseGrid';

interface PageContentProps {
  view: ReportDetailView;
  selectedIndex: number;
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

const SelChip = styled.span`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[700]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
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

export const PageContent = ({ view, selectedIndex }: PageContentProps) => {
  const arts = view.articles;
  const cur = selectedIndex >= arts.length ? 0 : selectedIndex;
  const a = arts[cur];
  if (!a) return null;

  const mode = renderMode(a);
  const items: GridItem[] = view.students.map((s) => {
    const resp = responseOf(view, a.id, s.studentId);
    return {
      key: s.studentId,
      title: `${s.no}. ${s.studentName}`,
      nature: a.nature,
      mode,
      cell: responseCell(a, resp),
      capture: resp?.captureImage,
      showNature: false,
    };
  });

  return (
    <Shell>
      <Head>
        <Order>{a.order}</Order>
        <PageTitle>{a.title}</PageTitle>
        <NatureBadge nature={a.nature} />
        {a.selFactor ? <SelChip>{a.selFactor}</SelChip> : null}
      </Head>
      <SummaryStrip view={view} article={a} />
      <div>
        <SectionTitle>
          학생별 응답 <Count>({items.length})</Count>
        </SectionTitle>
        <ResponseGrid items={items} />
      </div>
    </Shell>
  );
};
