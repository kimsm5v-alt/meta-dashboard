import styled from '@emotion/styled';
import { Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@shared/ui/Button/Button';
import { formatCreatedAt } from '../lib/formatCreatedAt';
import type { LibItem, LibraryColorGroup, ResourceCardVariant } from '../model/types';
import { ENV } from '@shared/config/env';

const COLOR_GROUP_BG: Record<LibraryColorGroup, string> = {
  g1: 'linear-gradient(135deg, #e7f8f2, #f0fbf7)',
  g2: 'linear-gradient(135deg, #fdeef0, #fef4f5)',
  g3: 'linear-gradient(135deg, #f0eefc, #f6f5fd)',
  g4: 'linear-gradient(135deg, #e8f0fe, #eef5ff)',
  g5: 'linear-gradient(135deg, #e6f7fa, #eefbfc)',
  g6: 'linear-gradient(135deg, #fdf3e2, #fdf8ee)',
};

interface ResourceCardProps {
  item: LibItem;
  variant?: ResourceCardVariant;
  onDelete?: (refSetId: string) => void;
}

/**
 * 자료실/나의 자료 카드.
 * prototype ResourceCard · MyLessonCard · CardThumb UI 동등 (Emotion 재구현).
 * 썸네일(이미지 또는 colorGroup fallback) → 제목 → (my: 수정일) → 액션.
 */
export const ResourceCard = ({ item, variant = 'library', onDelete }: ResourceCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const colorGroup = item.colorGroup ?? 'g1';
  const thumbnailUrl = item.thumbnailUrl?.startsWith('/') ? `${ENV.CMS_FILE_URL}${item.thumbnailUrl}` : `${ENV.CMS_FILE_URL}/${item.thumbnailUrl}`;

  return (
    <Shell>
      <Thumb $group={colorGroup}>
        {item.thumbnailUrl ? (
          <ThumbImage src={thumbnailUrl} alt={item.title} loading='lazy' />
        ) : null}
        {variant === 'my' && item.refSetId && onDelete ? (
          <DeleteButton
            type='button'
            title='삭제'
            aria-label='세트지 삭제'
            onClick={(event) => {
              event.stopPropagation();
              onDelete(item.refSetId!);
            }}
          >
            <Trash2 size={14} strokeWidth={2} aria-hidden />
          </DeleteButton>
        ) : null}
      </Thumb>
      <Body $variant={variant}>
        <Title title={item.title}>{item.title}</Title>
        {variant === 'my' ? (
          <UpdatedMeta>수정 {formatCreatedAt(item.createdAt)}</UpdatedMeta>
        ) : null}
        <Actions>
          <Button
            type='button'
            variant='outline'
            size='xs'
            fullWidth
            onClick={() => navigate(`/lesson/editor/${item.id}`)}
          >
            수정하기
          </Button>
          <Button
            type='button'
            variant='primary'
            size='xs'
            fullWidth
            onClick={() => {
              const deployPath = item.refSetId
                ? `/lesson/deploy/${item.id}/${item.refSetId}`
                : `/lesson/deploy/${item.id}`;
              navigate(`${deployPath}${location.search}`, {
                state: { item },
              });
            }}
          >
            시작하기
          </Button>
        </Actions>
      </Body>
    </Shell>
  );
};

const Shell = styled.article`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  background: ${({ theme }) => theme.colors.background.paper};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition:
    transform ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.colors.gray[200]};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const Thumb = styled.div<{ $group: LibraryColorGroup }>`
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: ${({ $group }) => COLOR_GROUP_BG[$group]};
`;

const ThumbImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xs};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.background.paper}cc;
  color: ${({ theme }) => theme.colors.error.main};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.background.paper};
  }
`;

const Body = styled.div<{ $variant: ResourceCardVariant }>`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme, $variant }) => ($variant === 'my' ? '6px' : theme.spacing.sm)};
  padding: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.div`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const UpdatedMeta = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing.xs};
`;
