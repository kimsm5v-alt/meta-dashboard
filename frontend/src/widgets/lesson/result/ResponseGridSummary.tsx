import styled from '@emotion/styled';
import { Play } from 'lucide-react';
import type { ArticleNature, CellInfo, RenderMode } from '@features/lesson';
import { fmtDuration } from '@features/lesson';
import { ErrataBadge, NatureBadge } from './ReportBadge';

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

const AnswerText = styled.p`
  margin: 0;
  white-space: pre-line;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.gray[50]};
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const PlainText = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const ResponseSummary = ({
  cell,
  mode,
  nature,
}: {
  cell: CellInfo;
  mode: RenderMode;
  nature?: ArticleNature;
}) => {
  if (nature === '개념') {
    if (!cell.submitted) return <Muted>미제출</Muted>;
    return <PlainText>{cell.value || '조회함'}</PlainText>;
  }
  if (!cell.submitted) return <Muted>{cell.value || '미제출'}</Muted>;

  switch (nature) {
    case '활동':
      return cell.value ? (
        <AnswerText>{cell.value}</AnswerText>
      ) : (
        <PlainText>제출함 (캡처 참고)</PlainText>
      );
    case '문항':
      return cell.value ? <AnswerText>{cell.value}</AnswerText> : <PlainText>제출함</PlainText>;
    default:
      if (mode === 'media' && cell.mediaSec != null) {
        return (
          <MediaLine>
            <PlayIcon />
            재생 · {fmtDuration(cell.mediaSec)}
          </MediaLine>
        );
      }
      if (cell.correctAnswer) {
        return (
          <PlainText>
            내 답 <AnswerB>{cell.value}</AnswerB> · 정답 <CorrectB>{cell.correctAnswer}</CorrectB>
          </PlainText>
        );
      }
      return cell.value ? <AnswerText>{cell.value}</AnswerText> : <PlainText>제출함</PlainText>;
  }
};

export const ResponseMark = ({ cell, nature }: { cell: CellInfo; nature?: ArticleNature }) => {
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

export const ResponseNatureBadge = ({ nature }: { nature?: ArticleNature }) =>
  nature ? <NatureBadge nature={nature} /> : null;
