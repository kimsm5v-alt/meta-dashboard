import styled from '@emotion/styled';
import { Image as ImageIcon, Maximize2 } from 'lucide-react';
import type { ReportGridItem } from '@features/lesson';
import { ResponseMark, ResponseNatureBadge } from './ResponseGridSummary';

interface ResponseGridProps {
  items: ReportGridItem[];
  showSummary?: boolean;
  onItemClick?: (item: ReportGridItem, index: number) => void;
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints['2xl']}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const Tile = styled.button<{ $clickable: boolean; $highlight: boolean }>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid
    ${({ theme, $highlight }) => ($highlight ? theme.colors.primary[400] : theme.colors.gray[200])};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme, $clickable }) =>
    $clickable ? theme.colors.background.paper : theme.colors.gray[50]};
  text-align: left;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  box-shadow: ${({ theme, $highlight }) =>
    $highlight ? `0 0 0 2px ${theme.colors.primary[100]}` : 'none'};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme, $clickable, $highlight }) =>
      $highlight
        ? theme.colors.primary[400]
        : $clickable
          ? theme.colors.primary[300]
          : theme.colors.gray[200]};
  }
`;

const Capture = styled.div`
  position: relative;
  flex: none;
  aspect-ratio: 16 / 9;
  background: ${({ theme }) => theme.colors.gray[100]};
`;

const CaptureImg = styled.img`
  width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
`;

const HoverMask = styled.span`
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.gray[900]}66;

  ${Tile}:hover & {
    display: flex;
  }
`;

const MaxIcon = styled(Maximize2)`
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.colors.background.paper};
`;

const EmptyCapture = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const EmptyIcon = styled(ImageIcon)`
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const EmptyLabel = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  padding: ${({ theme }) => theme.spacing.sm} 12px;
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Title = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const SummaryLine = styled.div`
  min-height: 2rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const GridSummary = ({
  cell,
  nature,
}: {
  cell: ReportGridItem['cell'];
  nature?: ReportGridItem['nature'];
}) => {
  if (nature === '개념') return null;
  if (!cell.submitted) {
    return <span>{cell.value || '미제출'}</span>;
  }
  switch (nature) {
    case '활동':
      return <span>{cell.value}</span>;
    case '문항':
      return (
        <>
          내 답 <b>{cell.value}</b>
        </>
      );
    default:
      return <span>{cell.value}</span>;
  }
};

export const ResponseGrid = ({ items, showSummary = true, onItemClick }: ResponseGridProps) => (
  <Grid>
    {items.map((it, index) => {
      const clickable = it.cell.submitted;
      return (
        <Tile
          key={it.key}
          type='button'
          disabled={!clickable}
          $clickable={clickable}
          $highlight={Boolean(it.highlight)}
          onClick={() => {
            if (clickable) onItemClick?.(it, index);
          }}
        >
          <Capture>
            {it.capture && it.cell.submitted ? (
              <>
                <CaptureImg src={it.capture} alt='' />
                {clickable ? (
                  <HoverMask>
                    <MaxIcon />
                  </HoverMask>
                ) : null}
              </>
            ) : (
              <EmptyCapture>
                <EmptyIcon />
                {!it.cell.submitted ? <EmptyLabel>미제출</EmptyLabel> : null}
              </EmptyCapture>
            )}
          </Capture>
          <Body>
            <LabelRow>
              <Title>{it.title}</Title>
              <ResponseMark cell={it.cell} nature={it.nature} />
            </LabelRow>
            {it.showNature && it.nature ? (
              <div>
                <ResponseNatureBadge nature={it.nature} />
              </div>
            ) : null}
            {showSummary && it.nature !== '개념' ? (
              <SummaryLine>
                <GridSummary cell={it.cell} nature={it.nature} />
              </SummaryLine>
            ) : null}
          </Body>
        </Tile>
      );
    })}
  </Grid>
);
