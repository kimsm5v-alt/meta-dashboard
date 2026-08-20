import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { toast } from 'sonner';
import {
  LessonEditorEmbed,
  mapLibraryItemToLibItem,
  useSyncLibraryItemOnSaveMutation,
} from '@features/lesson';
import type {
  EmbedError,
  LessonEditorPageLocationState,
  LibItem,
  LibraryItem,
  SavedPayload,
  StartLessonPayload,
} from '@features/lesson';
import { Button } from '@shared/ui/Button';

const SavedModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 24px;
`;

const SavedModalCard = styled.div`
  width: 380px;
  max-width: 100%;
  border-radius: ${({ theme }) => theme.radius['xl']};
  background: ${({ theme }) => theme.colors.background.paper};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
`;

const SavedModalTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
`;

const SavedModalDesc = styled.p`
  margin: 4px 0 0;
  color: #6b7280;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

const SavedModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

/**
 * 수업 저작 풀스크린.
 * 라우트 `/lesson/editor` = 신규, `/lesson/editor/:setId` = CBS 세트 openSet.
 */
export const LessonEditorPage = () => {
  const { setId: routeSetId } = useParams<{ setId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { mutate: syncLibraryItem } = useSyncLibraryItemOnSaveMutation();
  const [savedOpen, setSavedOpen] = useState(false);
  const [libraryItemId, setLibraryItemId] = useState<string | null>(() => {
    const state = location.state as LessonEditorPageLocationState | null;
    return state?.libraryItemId ?? null;
  });
  /** POST/PATCH 응답 LibraryItem — deploy state·labels/options 변환용 */
  const [libraryItem, setLibraryItem] = useState<LibraryItem | null>(null);

  /** 마운트 시점 고정 — 저장 후 replace navigate로 URL만 바꿀 때 embed 리마운트 방지 */
  const [embedSetId] = useState(() => routeSetId);
  const [embedIdentityKey] = useState(() => routeSetId ?? '__new__');

  const handleSaved = (p: SavedPayload) => {
    console.log('[LessonEditorPage] handleSaved', p);
    if (!p.lcmsSetId || !p.title) return;

    syncLibraryItem(
      {
        lcmsSetId: p.lcmsSetId,
        alias: p.title,
        ...(p.thumbnail ? { options: { thumbnailUrl: p.thumbnail } } : {}),
        libraryItemId,
      },
      {
        onSuccess: (item) => {
          setLibraryItemId(item.libraryItemId);
          setLibraryItem(item);
          if (p.trigger === 'manual') setSavedOpen(true);
          if (!routeSetId && p.lcmsSetId) {
            // 신규 저장 시 url 주소 변경 // 깜빡임 발생 시 제거 필요
            navigate(`/lesson/editor/${p.lcmsSetId}${location.search}`, {
              replace: true,
              state: { libraryItemId: item.libraryItemId },
            });
          }
        },
        onError: () => toast.error('나의 자료 저장에 실패했습니다'),
      },
    );
  };

  const handleStartLesson = (p: StartLessonPayload) => {
    console.log('[LessonEditorPage] onStartLesson', p);
    const nextSetId = p.lcmsSetId;
    if (!nextSetId) return;

    if (libraryItemId) {
      const item: LibItem = libraryItem
        ? {
            ...mapLibraryItemToLibItem(libraryItem),
            title: p.title ?? libraryItem.alias ?? '',
          }
        : {
            id: nextSetId,
            libraryItemId,
            title: p.title ?? '',
            src: 'internal',
          };
      navigate(`/lesson/deploy/${nextSetId}/${libraryItemId}${location.search}`, {
        state: { item },
      });
      return;
    }

    navigate(`/lesson/deploy/${nextSetId}${location.search}`);
  };

  const handleError = (error: EmbedError) => {
    // if (import.meta.env.DEV) {
    console.warn('[LessonEditorPage] embed error', error.code, error.message);
    // }
  };

  const goMyData = () => {
    setSavedOpen(false);
    navigate(`/lesson/my${location.search}`);
  };

  return (
    <>
      <LessonEditorEmbed
        setId={embedSetId}
        embedIdentityKey={embedIdentityKey}
        onSaved={handleSaved}
        onStartLesson={handleStartLesson}
        onExit={() => navigate(-1)}
        onError={handleError}
      />

      {savedOpen && (
        <SavedModalOverlay role='presentation' onClick={() => setSavedOpen(false)}>
          <SavedModalCard role='dialog' aria-modal='true' onClick={(e) => e.stopPropagation()}>
            <SavedModalTitle>저장되었습니다</SavedModalTitle>
            <SavedModalDesc>
              작업 내용이 저장되었어요. 계속 편집하거나 나의 자료로 이동할 수 있어요.
            </SavedModalDesc>
            <SavedModalActions>
              <Button
                type='button'
                variant='outline'
                size='sm'
                css={{
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  padding: '6px 12px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: '#374151',
                  background: 'transparent',
                  '&:hover:not(:disabled)': { background: '#f9fafb' },
                }}
                onClick={() => setSavedOpen(false)}
              >
                계속 수정
              </Button>
              <Button
                type='button'
                variant='primary'
                size='sm'
                css={{
                  borderRadius: '0.5rem',
                  padding: '6px 12px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: '#fff',
                  background: '#a855f7',
                  '&:hover:not(:disabled)': {
                    background: '#9333ea',
                    transform: 'none',
                  },
                }}
                onClick={goMyData}
              >
                나의 자료로 이동
              </Button>
            </SavedModalActions>
          </SavedModalCard>
        </SavedModalOverlay>
      )}
    </>
  );
};

export default LessonEditorPage;
