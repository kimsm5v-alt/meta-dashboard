import styled from '@emotion/styled';
import type { PageTabListItem } from '@features/lesson';
import { NatureBadge } from './ReportBadge';

interface PageListProps {
  pages: PageTabListItem[];
  assignedCount: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const Head = styled.div`
  padding: 6px ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const HeadCount = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const Row = styled.button<{ $on: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: ${({ theme }) => theme.spacing.sm} 10px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme, $on }) => ($on ? theme.colors.primary[50] : 'transparent')};
  text-align: left;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme, $on }) => ($on ? theme.colors.primary[50] : theme.colors.gray[50])};
  }
`;

const Order = styled.span<{ $on: boolean }>`
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme, $on }) => ($on ? theme.colors.primary[500] : theme.colors.gray[100])};
  color: ${({ theme, $on }) => ($on ? theme.colors.background.paper : theme.colors.gray[600])};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Body = styled.span`
  min-width: 0;
  flex: 1;
`;

const Title = styled.span`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Meta = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const NatureWrap = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
`;

export const PageList = ({ pages, assignedCount, selectedIndex, onSelect }: PageListProps) => {
  const cur = selectedIndex >= pages.length ? 0 : selectedIndex;

  return (
    <Shell>
      <Head>
        페이지 <HeadCount>({pages.length})</HeadCount>
      </Head>
      {pages.map((page, i) => {
        const on = i === cur;
        return (
          <Row key={page.activityItemId} type='button' $on={on} onClick={() => onSelect(i)}>
            <Order $on={on}>{page.seq}</Order>
            <Body>
              {page.nature ? (
                <NatureWrap>
                  <NatureBadge nature={page.nature} />
                </NatureWrap>
              ) : null}
              <Title>{page.title}</Title>
              <Meta>
                응답 {page.gradedCount}/{assignedCount}
              </Meta>
            </Body>
          </Row>
        );
      })}
    </Shell>
  );
};
