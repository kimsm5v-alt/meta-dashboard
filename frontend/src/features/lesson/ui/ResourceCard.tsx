import styled from '@emotion/styled';
import type { CSSObject } from '@emotion/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { theme } from '@app/styles/theme';
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
  const thumbnailUrl = item.thumbnailUrl?.startsWith('/')
    ? `${ENV.CMS_FILE_URL}${item.thumbnailUrl}`
    : `${ENV.CMS_FILE_URL}/${item.thumbnailUrl}`;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Shell>
      <Thumb $group={colorGroup}>
        {item.thumbnailUrl && !imgFailed ? (
          <ThumbImage
            src={thumbnailUrl}
            alt={item.title}
            loading='lazy'
            onError={() => setImgFailed(true)}
          />
        ) : null}
        {imgFailed ? <ThumbTitle title={item.title}>{item.title}</ThumbTitle> : null}
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
            css={CARD_BTN_SECONDARY_CSS}
            onClick={() => navigate(`/lesson/editor/${item.id}${location.search}`)}
          >
            수정하기
          </Button>
          <Button
            type='button'
            variant='primary'
            size='xs'
            fullWidth
            css={CARD_BTN_PRIMARY_CSS}
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
  border-radius: ${({ theme }) => theme.radius.lg};
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
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ThumbImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbTitle = styled.p`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  margin: 0;
  padding: 0 ${({ theme }) => theme.spacing.md};
  overflow: hidden;
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  text-align: center;
  text-overflow: ellipsis;
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

/** prototype cardStyles CARD_BTN_SECONDARY / CARD_BTN_PRIMARY 동등 */
const CARD_BTN_SECONDARY_CSS: CSSObject = {
  flex: 1,
  width: 'auto',
  borderRadius: '8px',
  border: `1px solid ${theme.colors.gray[300]}`,
  padding: '6px 8px',
  fontSize: theme.typography.fontSize.xs,
  fontWeight: theme.typography.fontWeight.medium,
  color: theme.colors.gray[700],
  background: 'transparent',
  transition: 'color 150ms ease, background-color 150ms ease',
  '&:hover:not(:disabled)': {
    background: theme.colors.gray[50],
  },
};

const CARD_BTN_PRIMARY_CSS: CSSObject = {
  flex: 1,
  width: 'auto',
  borderRadius: '8px',
  border: 'none',
  padding: '6px 8px',
  fontSize: theme.typography.fontSize.xs,
  fontWeight: theme.typography.fontWeight.medium,
  color: '#ffffff',
  background: theme.colors.primary[500],
  transform: 'none',
  transition: 'color 150ms ease, background-color 150ms ease',
  '&:hover:not(:disabled)': {
    background: theme.colors.primary[600],
    transform: 'none',
  },
};
