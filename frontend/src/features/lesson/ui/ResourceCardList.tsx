import styled from '@emotion/styled';
import { Inbox, SearchX } from 'lucide-react';
import type { LibItem, ResourceCardVariant } from '../model/types';
import { ResourceCard } from './ResourceCard';

const DEFAULT_EMPTY_MESSAGE: Record<ResourceCardVariant, string> = {
  library: '조건에 맞는 콘텐츠가 없습니다.',
  my: '아직 만든 세트지가 없어요. 자료실에서 담거나 새로 만들어 보세요.',
};

interface ResourceCardListProps {
  items: LibItem[];
  /** library: 자료실 뱃지 / my: 수정일 메타 + 삭제 버튼 */
  variant?: ResourceCardVariant;
  /** 미지정 시 variant별 기본 문구 */
  emptyMessage?: string;
  onDelete?: (id: string) => void;
}

export const ResourceCardList = ({
  items,
  variant = 'library',
  emptyMessage,
  onDelete,
}: ResourceCardListProps) => {
  if (items.length === 0) {
    const EmptyIconMark = variant === 'my' ? Inbox : SearchX;
    return (
      <Empty role='status'>
        <EmptyIcon aria-hidden>
          <EmptyIconMark size={28} strokeWidth={1.75} />
        </EmptyIcon>
        <EmptyText>{emptyMessage ?? DEFAULT_EMPTY_MESSAGE[variant]}</EmptyText>
      </Empty>
    );
  }

  return (
    <Grid>
      {items.map((item) => (
        <ResourceCard key={item.id} item={item} variant={variant} onDelete={onDelete} />
      ))}
    </Grid>
  );
};

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
  border: 1px dashed ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.gray[50]};
  text-align: center;
`;

const EmptyIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const EmptyText = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;
