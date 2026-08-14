import styled from '@emotion/styled';
import { Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@shared/ui/Button/Button';
import type { LibItem, LibraryColorGroup, LibrarySrc, ResourceCardVariant } from '../model/types';
import { LIBRARY_SRC_LABELS } from '../model/types';

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
  onDelete?: (id: string) => void;
}

export const ResourceCard = ({ item, variant = 'library', onDelete }: ResourceCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const colorGroup = item.colorGroup ?? 'g1';

  return (
    <Shell>
      <Thumb $group={colorGroup}>
        {variant === 'my' ? (
          <DeleteButton
            type='button'
            title='삭제'
            aria-label='세트지 삭제'
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.(item.id);
            }}
          >
            <Trash2 size={14} strokeWidth={2} aria-hidden />
          </DeleteButton>
        ) : null}
        <ThumbTitle>{item.title}</ThumbTitle>
      </Thumb>
      <Body>
        {variant === 'my' ? (
          <UpdatedMeta>수정 {item.updated ?? '-'}</UpdatedMeta>
        ) : (
          <>
            {item.src || item.selArea ? (
              <Badges>
                {item.src ? (
                  <SrcBadge $src={item.src}>{LIBRARY_SRC_LABELS[item.src]}</SrcBadge>
                ) : null}
                {item.selArea ? <SelBadge>{item.selArea}</SelBadge> : null}
              </Badges>
            ) : null}
            {item.reason ? <Reason>{item.reason}</Reason> : null}
          </>
        )}
        <Actions>
          <Button
            type='button'
            variant='outline'
            size='md'
            fullWidth
            onClick={() => navigate(`/lesson/editor/${item.id}`)}
          >
            수정하기
          </Button>
          <Button
            type='button'
            variant='primary'
            size='md'
            fullWidth
            onClick={() => navigate(`/lesson/deploy/${item.id}${location.search}`)}
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
  display: flex;
  aspect-ratio: 16 / 9;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${({ $group }) => COLOR_GROUP_BG[$group]};
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
  background: ${({ theme }) => theme.colors.background.paper}b3;
  color: ${({ theme }) => theme.colors.error.main};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.background.paper};
  }
`;

const ThumbTitle = styled.div`
  display: -webkit-box;
  max-width: 100%;
  padding: 0 ${({ theme }) => theme.spacing.md};
  overflow: hidden;
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  text-align: center;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
`;

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const SrcBadge = styled.span<{ $src: LibrarySrc }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};

  ${({ $src, theme }) => {
    switch ($src) {
      case 'verified':
        return `
          background: ${theme.colors.success.light};
          color: ${theme.colors.success.dark};
        `;
      case 'unverified':
        return `
          background: ${theme.colors.warning.light};
          color: ${theme.colors.warning.dark};
        `;
      case 'external':
        return `
          background: ${theme.colors.info.light};
          color: ${theme.colors.info.dark};
        `;
      default:
        return `
          background: ${theme.colors.gray[100]};
          color: ${theme.colors.gray[600]};
        `;
    }
  }}
`;

const SelBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const UpdatedMeta = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const Reason = styled.p`
  margin: 0;
  display: -webkit-box;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing.xs};
`;
