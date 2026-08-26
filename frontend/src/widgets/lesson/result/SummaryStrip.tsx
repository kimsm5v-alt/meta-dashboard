import styled from '@emotion/styled';
import type { ReportDetailArticle, ReportDetailView } from '@features/lesson';
import { articleResponded } from '@features/lesson';

interface SummaryStripProps {
  view: ReportDetailView;
  article: ReportDetailArticle;
}

const Strip = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  padding: 12px ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.xl};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Count = styled.b<{ $tone?: 'info' | 'error' | 'warning' | 'success' | 'plain' }>`
  color: ${({ theme, $tone }) =>
    $tone === 'info'
      ? theme.colors.info.dark
      : $tone === 'error'
        ? theme.colors.error.dark
        : $tone === 'warning'
          ? theme.colors.warning.dark
          : $tone === 'success'
            ? theme.colors.success.dark
            : theme.colors.gray[800]};
`;

const DotSep = styled.span`
  color: ${({ theme }) => theme.colors.gray[300]};
`;

export const SummaryStrip = ({ view, article }: SummaryStripProps) => {
  const responded = articleResponded(view, article.id);
  const assigned = view.assignedCount;
  const articleResps = view.responses.filter((x) => x.articleId === article.id);
  const manualTargets = article.nature === '활동' && article.gradingType === 2 ? articleResps : [];
  const gradedN = manualTargets.filter((x) => x.errata != null).length;

  const gradingChip =
    manualTargets.length === 0 ? null : (
      <>
        <DotSep>·</DotSep>
        <span>
          채점{' '}
          <Count $tone={gradedN === manualTargets.length ? 'success' : 'warning'}>{gradedN}</Count>/
          {manualTargets.length}
        </span>
      </>
    );

  if (article.nature === '문항' && article.correctAnswer != null) {
    const correct = articleResps.filter((x) => x.errata === 1).length;
    const wrong = articleResps.filter((x) => x.errata === 2).length;
    const partial = articleResps.filter((x) => x.errata === 3).length;
    return (
      <Strip>
        <span>
          정답 <Count $tone='info'>{correct}</Count>
        </span>
        <span>
          오답 <Count $tone='error'>{wrong}</Count>
        </span>
        {partial > 0 ? (
          <span>
            부분 <Count $tone='warning'>{partial}</Count>
          </span>
        ) : null}
        <DotSep>·</DotSep>
        <span>
          제출 <Count $tone='plain'>{responded}</Count>/{assigned}
        </span>
      </Strip>
    );
  }

  const label = article.nature === '개념' ? '조회' : '제출';
  return (
    <Strip>
      <span>
        {label} <Count $tone='plain'>{responded}</Count>/{assigned}명
      </span>
      {gradingChip}
    </Strip>
  );
};
