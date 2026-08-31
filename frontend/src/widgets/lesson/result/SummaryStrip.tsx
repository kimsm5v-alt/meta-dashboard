import styled from '@emotion/styled';
import type { PageTabListItem } from '@features/lesson';

interface SummaryStripProps {
  page: PageTabListItem;
  assignedCount: number;
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

export const SummaryStrip = ({ page, assignedCount }: SummaryStripProps) => {
  const resp = page.gradedCount;
  const gradedManual = Math.max(0, page.gradedCount - page.ungradable);

  if (page.nature === '문항') {
    return (
      <Strip>
        <span>
          정답 <Count $tone='info'>{page.correct}</Count>
        </span>
        <span>
          오답 <Count $tone='error'>{page.incorrect}</Count>
        </span>
        <span>
          부분정답 <Count $tone='warning'>{page.partial}</Count>
        </span>
        <DotSep>·</DotSep>
        <span>
          제출 <Count $tone='info'>{resp}</Count>/{assignedCount}명
        </span>
      </Strip>
    );
  }

  if (page.nature === '활동') {
    return (
      <Strip>
        <span>
          제출 <Count $tone={resp === assignedCount ? 'success' : 'warning'}>{resp}</Count>/
          {assignedCount}명
        </span>
        <DotSep>·</DotSep>
        <span>
          채점{' '}
          <Count $tone={gradedManual === page.gradedCount ? 'success' : 'warning'}>
            {gradedManual}
          </Count>
          /{page.gradedCount}
        </span>
      </Strip>
    );
  }

  const label = page.nature === '개념' ? '조회' : '제출';
  return (
    <Strip>
      <span>
        {label} <Count $tone='plain'>{resp}</Count>/{assignedCount}명
      </span>
    </Strip>
  );
};
