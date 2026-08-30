import styled from '@emotion/styled';
import { Image as ImageIcon, Maximize2, Play } from 'lucide-react';
import type { ArticleNature, CellInfo, RenderMode } from '@features/lesson';
import { fmtDuration } from '@features/lesson';
import { ErrataBadge, NatureBadge } from './ReportBadge';

export interface GridItem {
  key: string;
  title: string;
  nature?: ArticleNature;
  mode: RenderMode;
  cell: CellInfo;
  capture?: string;
  showNature?: boolean;
  highlight?: boolean;
}

interface ResponseGridProps {
  items: GridItem[];
  showSummary?: boolean;
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
  cursor: default;
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

const Muted = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const AnswerB = styled.b`
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const CorrectB = styled.b`
  color: ${({ theme }) => theme.colors.info.dark};
`;

const ManualMark = styled.span<{ $done: boolean }>`
  flex: none;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $done }) =>
    $done ? theme.colors.success.light : theme.colors.warning.light};
  color: ${({ theme, $done }) => ($done ? theme.colors.success.dark : theme.colors.warning.dark)};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const PlayIcon = styled(Play)`
  width: 12px;
  height: 12px;
`;

const MediaLine = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Summary = ({
  cell,
  mode,
  nature,
}: {
  cell: CellInfo;
  mode: RenderMode;
  nature?: ArticleNature;
}) => {
  if (nature === '개념') return null;
  if (!cell.submitted) return <Muted>{cell.value || '미제출'}</Muted>;

  switch (nature) {
    case '활동':
      return <span>{cell.value}</span>;
    case '문항':
      return (
        <>
          내 답 <AnswerB>{cell.value}</AnswerB>
        </>
      );
    default:
      if (mode === 'media' && cell.mediaSec != null) {
        return (
          <MediaLine>
            <PlayIcon />
            {fmtDuration(cell.mediaSec)}
          </MediaLine>
        );
      }
      if (cell.correctAnswer) {
        return (
          <>
            내 답 <AnswerB>{cell.value}</AnswerB> · 정답 <CorrectB>{cell.correctAnswer}</CorrectB>
          </>
        );
      }
      return <span>{cell.value}</span>;
  }
};

const Mark = ({ cell, nature }: { cell: CellInfo; nature?: ArticleNature }) => {
  if (nature !== '활동' && nature !== '문항') return null;
  if (cell.manual) {
    return (
      <ManualMark $done={cell.errata != null}>
        {cell.errata != null ? '채점 완료' : '채점 필요'}
      </ManualMark>
    );
  }
  if (cell.errata != null) return <ErrataBadge errata={cell.errata} />;
  return null;
};

export const ResponseGrid = ({ items, showSummary = true }: ResponseGridProps) => (
  <Grid>
    {items.map((it) => {
      const clickable = it.cell.submitted;
      return (
        <Tile
          key={it.key}
          type='button'
          disabled={!clickable}
          $clickable={clickable}
          $highlight={Boolean(it.highlight)}
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
              <Mark cell={it.cell} nature={it.nature} />
            </LabelRow>
            {it.showNature && it.nature ? (
              <div>
                <NatureBadge nature={it.nature} />
              </div>
            ) : null}
            {showSummary && it.nature !== '개념' ? (
              <SummaryLine>
                <Summary cell={it.cell} mode={it.mode} nature={it.nature} />
              </SummaryLine>
            ) : null}
          </Body>
        </Tile>
      );
    })}
  </Grid>
);
