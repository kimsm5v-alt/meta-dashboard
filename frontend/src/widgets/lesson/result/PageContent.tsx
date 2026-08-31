import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import type { ActivityProgress, PageTabListItem, ReportGridItem } from '@features/lesson';
import { submittedReportGridItems } from '@features/lesson';
import { NatureBadge } from './ReportBadge';
import { SummaryStrip } from './SummaryStrip';
import { ResponseGrid } from './ResponseGrid';
import { ResponseDetailOverlay } from './ResponseDetailOverlay';

interface PageContentProps {
  activityId: string;
  activityTitle: string;
  page: PageTabListItem;
  assignedCount: number;
  gridRows: ReportGridItem[];
  progress?: ActivityProgress;
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

export const PageContent = ({
  activityId,
  activityTitle,
  page,
  assignedCount,
  gridRows,
  progress,
}: PageContentProps) => {
  const [overlayIndex, setOverlayIndex] = useState<number | null>(null);

  const submitted = useMemo(() => submittedReportGridItems(gridRows), [gridRows]);

  const handleItemClick = (item: ReportGridItem) => {
    const idx = submitted.findIndex((s) => s.key === item.key);
    if (idx >= 0) setOverlayIndex(idx);
  };

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
        <ResponseGrid items={gridRows} showSummary onItemClick={handleItemClick} />
      </div>
      {overlayIndex != null ? (
        <ResponseDetailOverlay
          axis='page'
          activityId={activityId}
          activityTitle={activityTitle}
          siblings={submitted}
          initialIndex={overlayIndex}
          onClose={() => setOverlayIndex(null)}
          progress={progress}
          fixedPage={{ seq: page.seq, title: page.title, nature: page.nature }}
        />
      ) : null}
    </Shell>
  );
};
