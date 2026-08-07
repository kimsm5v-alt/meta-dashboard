import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useLocation } from 'react-router-dom';
import {
  MessageCircle,
  Scissors,
  Send,
  X,
  LayoutGrid,
  Maximize2,
  PanelRight,
  Minus,
  Monitor,
  Plus,
} from 'lucide-react';
import aiOwlIcon from '@/assets/raon/ai-owl-icon.png';
import { useAuth } from '@features/auth';
import { useTeacherClasses } from '@features/api';
import { useContextMode } from '@features/ai-room/model/useContextMode';
import { useConversations } from '@features/ai-room/model/useConversations';
import { ChatArea, StudentPickerModal } from '@features/ai-room/ui';
import { groupStudentsByClass } from '@features/ai-room/utils/groupStudentsByClass';
import { useCaptureStore } from '@shared/store/useCaptureStore';
import { useStreamGuardStore } from '@shared/store/useStreamGuardStore';
import { resolveScreenQuestions, screenLabelFor } from './screenQuestions';

type ViewMode = 'bubble' | 'inputbar' | 'corner' | 'fullscreen';

const CORNER_MIN_W = 388;
const CORNER_MIN_H = 240;
const GNB_H = 58;

interface Geo {
  x: number;
  y: number;
  width: number;
  height: number;
}

const initialGeo = (): Geo => {
  const width = CORNER_MIN_W;
  const height = Math.max(CORNER_MIN_H, window.innerHeight - GNB_H - 36);
  return {
    width,
    height,
    x: window.innerWidth - width - 24,
    y: GNB_H + 12,
  };
};

type DragSession =
  | { type: 'move'; mx: number; my: number; geo: Geo }
  | { type: 'resize-top'; mx: number; my: number; geo: Geo }
  | { type: 'resize-left'; mx: number; my: number; geo: Geo }
  | null;

// ============================================================
// Styled components
// ============================================================

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.sticky + 5};
  pointer-events: none;
`;

const BubbleButton = styled.button<{ $raised: boolean }>`
  pointer-events: auto;
  position: fixed;
  right: ${({ theme }) => theme.spacing.lg};
  bottom: ${({ $raised, theme }) => ($raised ? '5.75rem' : theme.spacing.lg)};
  width: 52px;
  height: 52px;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: none;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
    transform: scale(1.06);
  }
`;

const InputBarWrapper = styled.div`
  pointer-events: auto;
  position: fixed;
  right: ${({ theme }) => theme.spacing.lg};
  bottom: ${({ theme }) => theme.spacing.lg};
  width: 388px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 8px 8px 12px;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
`;

const InputBarIcon = styled.img`
  width: 26px;
  height: 26px;
  object-fit: contain;
  flex-shrink: 0;
`;

const InputBarIconButton = styled.button`
  flex-shrink: 0;
  padding: 6px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[500]};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[100]};
  }
`;

const InputBarField = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: transparent;
`;

const InputBarSendButton = styled.button`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const GhostIconButton = styled.button`
  flex-shrink: 0;
  padding: 6px;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[400]};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.md};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[600]};
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const FullscreenBackdrop = styled.div`
  pointer-events: auto;
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.sticky + 5};
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 3vh;
`;

const Panel = styled.div<{
  $fullscreen: boolean;
  $x: number;
  $y: number;
  $w: number;
  $h: number;
}>`
  pointer-events: auto;
  position: ${({ $fullscreen }) => ($fullscreen ? 'relative' : 'fixed')};
  ${({ $fullscreen, $x, $y, $w, $h }) =>
    $fullscreen
      ? `width: min(920px, 92vw); height: 94vh;`
      : `left: ${$x}px; top: ${$y}px; width: ${$w}px; height: ${$h}px;`}
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
`;

const ResizeHandleTop = styled.div`
  position: absolute;
  top: 0;
  left: 10px;
  right: 10px;
  height: 6px;
  cursor: ns-resize;
  z-index: 2;
`;

const ResizeHandleLeft = styled.div`
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 6px;
  cursor: ew-resize;
  z-index: 2;
`;

const PanelHeader = styled.div<{ $draggable: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  flex-shrink: 0;
  cursor: ${({ $draggable }) => ($draggable ? 'move' : 'default')};
`;

const PanelHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
`;

const PanelHeaderIcon = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
`;

const PanelHeaderTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  flex-shrink: 0;
`;

const ScreenBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 120px;
  padding: 3px 8px;
  font-size: 10.5px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary[600]};
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[100]};
  border-radius: ${({ theme }) => theme.radius.full};

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const PanelHeaderActions = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const ModePopoverList = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  width: 150px;
  padding: 6px 0;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  z-index: ${({ theme }) => theme.zIndex.popover};
`;

const ModePopoverItem = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme, $active }) => ($active ? theme.colors.primary[600] : theme.colors.gray[600])};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const PanelBody = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ComposerArea = styled.div`
  flex-shrink: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  padding: ${({ theme }) => theme.spacing.md};
`;

const CaptureChip = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: fit-content;
  max-width: 100%;
  padding: 6px 10px 6px 6px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const CaptureThumb = styled.img`
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const CaptureMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CaptureLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary[700]};
`;

const CaptureSize = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const CaptureRemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[400]};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const TargetRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const TargetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: #ffffff;
  background: ${({ theme }) => theme.colors.primary[500]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const TargetHint = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const TargetChip = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[700]};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  white-space: nowrap;
`;

const TargetChipRemoveButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  display: flex;
  align-items: center;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[900]};
  }
`;

const ComposerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius['2xl']};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary[300]};
  }
`;

const ComposerCaptureButton = styled.button`
  flex-shrink: 0;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[400]};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const ComposerInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:disabled {
    cursor: not-allowed;
  }
`;

const ComposerSendButton = styled.button`
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: none;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[200]};
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
`;

const EmptyStateIcon = styled.img`
  display: block;
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  object-fit: contain;
`;

const EmptyStateTitle = styled.h3`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 4px;
`;

const EmptyStateSubtitle = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-bottom: 20px;
`;

const QuestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const QuestionCard = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 10px 14px;
  text-align: left;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[300]};
    background: ${({ theme }) => theme.colors.primary[50]};
  }
`;

const QuestionEmoji = styled.span`
  font-size: 15px;
  flex-shrink: 0;
`;

const QuestionText = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.gray[700]};
`;

// ============================================================
// Component
// ============================================================

export const FloatingAssistant = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { classes } = useTeacherClasses();

  const contextMode = useContextMode();
  const {
    mode,
    selectedClass,
    selectedStudents,
    isStudentModalOpen,
    setIsStudentModalOpen,
    getContextLabel,
    applyTargetSelection,
    removeClassSelection,
  } = contextMode;
  const currentTargetStudents =
    mode === 'class' && selectedClass ? selectedClass.students : selectedStudents;

  const {
    activeConversationId,
    messages,
    streamingContent,
    input,
    setInput,
    isLoading,
    aliasMap,
    handleSend,
  } = useConversations({
    classes,
    mode,
    selectedClass,
    selectedStudents,
    getContextLabel,
    authTcId: user?.id ?? null,
  });

  const setStreaming = useStreamGuardStore((s) => s.setStreaming);
  useEffect(() => {
    setStreaming(isLoading);
  }, [isLoading, setStreaming]);
  useEffect(() => () => setStreaming(false), [setStreaming]);

  const bottomRightFabCount = useCaptureStore((s) => s.bottomRightFabCount);
  const openOverlay = useCaptureStore((s) => s.openOverlay);
  const pendingImage = useCaptureStore((s) => s.pendingImage);
  const pendingMeta = useCaptureStore((s) => s.pendingMeta);
  const clearPendingImage = useCaptureStore((s) => s.clearPendingImage);

  const [view, setView] = useState<ViewMode>('bubble');
  const [geo, setGeo] = useState<Geo>(initialGeo);
  const [modeOpen, setModeOpen] = useState(false);
  const dragRef = useRef<DragSession>(null);

  const hasConversation = messages.length > 1;
  const hasStudentTarget = mode === 'student' && selectedStudents.length > 0;
  const screenLabel = screenLabelFor(location.pathname);
  const questions = resolveScreenQuestions(location.pathname, hasStudentTarget);
  const askedTexts = new Set(messages.filter((m) => m.role === 'user').map((m) => m.content));
  const remainingQuestions = hasConversation
    ? questions.filter((q) => !askedTexts.has(q.text))
    : questions;

  // 캡처 완료 시 버블/입력바였다면 자동으로 코너 패널을 연다
  useEffect(() => {
    if (pendingImage) {
      // pendingImage는 useCaptureStore(외부 시스템)의 상태 — 그 변화에 반응해 로컬 뷰 모드를 동기화한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView((v) => (v === 'bubble' || v === 'inputbar' ? 'corner' : v));
    }
  }, [pendingImage]);

  // ── 드래그 / 리사이즈 (코너 모드) ────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const s = dragRef.current;
      if (!s) return;
      const dx = e.clientX - s.mx;
      const dy = e.clientY - s.my;
      if (s.type === 'move') {
        const x = Math.min(Math.max(0, s.geo.x + dx), window.innerWidth - s.geo.width);
        const y = Math.min(Math.max(GNB_H, s.geo.y + dy), window.innerHeight - 80);
        setGeo((g) => ({ ...g, x, y }));
      } else if (s.type === 'resize-top') {
        const bottom = s.geo.y + s.geo.height;
        const height = Math.max(CORNER_MIN_H, bottom - (s.geo.y + dy));
        const y = bottom - height;
        setGeo((g) => ({ ...g, y, height }));
      } else if (s.type === 'resize-left') {
        const right = s.geo.x + s.geo.width;
        const width = Math.max(CORNER_MIN_W, right - (s.geo.x + dx));
        const x = right - width;
        setGeo((g) => ({ ...g, x, width }));
      }
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startDrag =
    (type: NonNullable<DragSession>['type']) => (e: React.MouseEvent<HTMLDivElement>) => {
      if (view !== 'corner') return;
      if (type === 'move' && (e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      dragRef.current = { type, mx: e.clientX, my: e.clientY, geo };
      document.body.style.userSelect = 'none';
    };

  // ── ESC로 모드 팝오버 닫기 ───────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modeOpen) setModeOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modeOpen]);

  const handleQuestionPick = (text: string) => {
    if (isLoading) return;
    setView((v) => (v === 'bubble' || v === 'inputbar' ? 'corner' : v));
    handleSend(text);
  };

  const handleComposerSend = () => {
    if ((!input.trim() && !pendingImage) || isLoading) return;
    setView((v) => (v === 'bubble' || v === 'inputbar' ? 'corner' : v));
    handleSend();
  };

  const isFullscreen = view === 'fullscreen';

  const composer = (
    <ComposerArea>
      {pendingImage && (
        <CaptureChip>
          <CaptureThumb src={pendingImage} alt='캡처된 화면 미리보기' />
          <CaptureMeta>
            <CaptureLabel>화면 캡처 첨부됨</CaptureLabel>
            {pendingMeta && (
              <CaptureSize>
                {pendingMeta.w}×{pendingMeta.h}px 영역
              </CaptureSize>
            )}
          </CaptureMeta>
          <CaptureRemoveButton onClick={clearPendingImage} aria-label='캡처 첨부 제거'>
            <X size={14} />
          </CaptureRemoveButton>
        </CaptureChip>
      )}
      <TargetRow>
        <TargetButton onClick={() => setIsStudentModalOpen(true)}>
          <Plus size={14} />
          대상
        </TargetButton>
        {mode === 'all' ? (
          <TargetHint>대상을 고르면 해당 학급·학생 기준으로 답합니다 (선택)</TargetHint>
        ) : (
          groupStudentsByClass(currentTargetStudents, classes).map((group) => {
            const isWholeClass = group.students.length === group.totalInClass;
            return (
              <TargetChip key={group.classId}>
                {group.className} {isWholeClass ? '전체' : `${group.students.length}명`}
                <TargetChipRemoveButton onClick={() => removeClassSelection(group.classId)}>
                  <X size={12} />
                </TargetChipRemoveButton>
              </TargetChip>
            );
          })
        )}
      </TargetRow>
      <ComposerRow>
        <ComposerCaptureButton
          type='button'
          onClick={openOverlay}
          disabled={isLoading}
          aria-label='화면 캡처해서 질문'
        >
          <Scissors size={15} />
        </ComposerCaptureButton>
        <ComposerInput
          type='text'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleComposerSend()}
          placeholder={
            pendingImage ? '이 영역에 대해 무엇이 궁금하세요?' : '화면에 대해 물어보세요'
          }
          disabled={isLoading}
        />
        <ComposerSendButton
          onClick={handleComposerSend}
          disabled={isLoading || (!input.trim() && !pendingImage)}
        >
          <Send size={16} />
        </ComposerSendButton>
      </ComposerRow>
    </ComposerArea>
  );

  const modePopover = modeOpen && (
    <ModePopoverList>
      {(
        [
          { key: 'inputbar', label: '입력바', icon: <Minus size={16} /> },
          { key: 'corner', label: '코너 패널', icon: <PanelRight size={16} /> },
          { key: 'fullscreen', label: '전체화면', icon: <Maximize2 size={16} /> },
        ] as const
      ).map((m) => (
        <ModePopoverItem
          key={m.key}
          $active={view === m.key}
          onClick={() => {
            setView(m.key);
            setModeOpen(false);
          }}
        >
          {m.icon}
          {m.label}
        </ModePopoverItem>
      ))}
    </ModePopoverList>
  );

  const panel = (
    <Panel $fullscreen={isFullscreen} $x={geo.x} $y={geo.y} $w={geo.width} $h={geo.height}>
      {!isFullscreen && (
        <>
          <ResizeHandleTop onMouseDown={startDrag('resize-top')} />
          <ResizeHandleLeft onMouseDown={startDrag('resize-left')} />
        </>
      )}
      <PanelHeader
        $draggable={!isFullscreen}
        onMouseDown={!isFullscreen ? startDrag('move') : undefined}
      >
        <PanelHeaderLeft>
          <PanelHeaderIcon src={aiOwlIcon} alt='AI 어시스턴트' />
          <PanelHeaderTitle>AI 어시스턴트</PanelHeaderTitle>
          <ScreenBadge title={`현재 화면: ${screenLabel}`}>
            <Monitor size={11} />
            <span>{screenLabel}</span>
          </ScreenBadge>
        </PanelHeaderLeft>
        <PanelHeaderActions>
          <GhostIconButton onClick={() => setModeOpen((v) => !v)} title='보기 모드'>
            <LayoutGrid size={18} />
          </GhostIconButton>
          <GhostIconButton onClick={() => setView('bubble')} title='닫기'>
            <X size={18} />
          </GhostIconButton>
          {modePopover}
        </PanelHeaderActions>
      </PanelHeader>

      <PanelBody>
        {hasConversation ? (
          <ChatArea
            messages={messages}
            aliasMap={aliasMap}
            isLoading={isLoading}
            streamingContent={streamingContent}
            conversationId={activeConversationId ?? undefined}
            contextMode={mode}
            contextLabel={getContextLabel()}
            selectedStudentId={selectedStudents[0]?.id ?? null}
            selectedClassId={selectedClass?.id ?? null}
          />
        ) : (
          <EmptyState>
            <EmptyStateIcon src={aiOwlIcon} alt='AI 어시스턴트' />
            <EmptyStateTitle>무엇이 궁금하세요?</EmptyStateTitle>
            <EmptyStateSubtitle>{screenLabel} 화면에 대해 물어보세요</EmptyStateSubtitle>
            <QuestionList>
              {remainingQuestions.map((q) => (
                <QuestionCard key={q.text} onClick={() => handleQuestionPick(q.text)}>
                  <QuestionEmoji>{q.emoji}</QuestionEmoji>
                  <QuestionText>{q.text}</QuestionText>
                </QuestionCard>
              ))}
            </QuestionList>
          </EmptyState>
        )}
      </PanelBody>

      {composer}
    </Panel>
  );

  return (
    <>
      <Overlay>
        {view === 'bubble' && (
          <BubbleButton
            $raised={bottomRightFabCount > 0}
            onClick={() => setView('corner')}
            title='AI 어시스턴트'
          >
            <MessageCircle size={24} />
          </BubbleButton>
        )}

        {view === 'inputbar' && (
          <InputBarWrapper>
            <InputBarIcon src={aiOwlIcon} alt='AI 어시스턴트' />
            <InputBarIconButton onClick={openOverlay} title='화면 캡처해서 질문'>
              <Scissors size={15} />
            </InputBarIconButton>
            <InputBarField
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComposerSend()}
              placeholder='화면에 대해 물어보세요'
            />
            <InputBarSendButton onClick={handleComposerSend} title='전송'>
              <Send size={14} />
            </InputBarSendButton>
            <GhostIconButton onClick={() => setView('corner')} title='패널 열기'>
              <LayoutGrid size={16} />
            </GhostIconButton>
            <GhostIconButton onClick={() => setView('bubble')} title='닫기'>
              <X size={16} />
            </GhostIconButton>
          </InputBarWrapper>
        )}

        {view === 'corner' && panel}
      </Overlay>

      {isFullscreen && <FullscreenBackdrop>{panel}</FullscreenBackdrop>}

      <StudentPickerModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        classes={classes}
        selectedStudents={currentTargetStudents}
        onConfirm={(students) => applyTargetSelection(students, classes)}
      />
    </>
  );
};
