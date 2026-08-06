import styled from '@emotion/styled';
import { Send, Scissors, X, Download, MessageSquare, Plus } from 'lucide-react';
import { useCaptureStore } from '@shared/store/useCaptureStore';
import { ChatArea, ConversationSidebar } from '@features/ai-room/ui';
import { downloadConversationAsMarkdown } from '@features/ai-room/utils/exportConversation';
import { groupStudentsByClass } from '@features/ai-room/utils/groupStudentsByClass';
import type { ConversationGroup } from '@features/ai-room/utils/groupConversations';
import type { ChatMessage, Conversation, ContextMode } from '@features/ai-room';
import type { Class, Student } from '@shared/types';

/* 프로토타입 AIRoomPage.tsx와 동일 구성: LNB + 본문이 하나의 평면(divider만) —
   Card로 감싼 두 개의 떠있는 박스가 아니다 */
const MainArea = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
  background: ${({ theme }) => theme.colors.background.paper};
`;

const ChatCard = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const InputArea = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  background-color: ${({ theme }) => theme.colors.background.paper};
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary[300]};
  }
`;

const StyledInput = styled.input`
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

const CaptureButton = styled.button`
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
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const CaptureChip = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: fit-content;
  max-width: 100%;
  padding: 6px 10px 6px 6px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const CaptureThumb = styled.img`
  width: 44px;
  height: 44px;
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
    background-color: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const SendButton = styled.button`
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: none;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.gray[200]};
    cursor: not-allowed;
  }
`;

const TitleBar = styled.div`
  flex-shrink: 0;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const TitleBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

const TitleText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[800]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
  padding: 0.375rem 0.625rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[600]};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.primary[600]};
    border-color: ${({ theme }) => theme.colors.primary[300]};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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
  transition: background-color 0.15s ease;

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
  background-color: ${({ theme }) => theme.colors.primary[50]};
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

interface AIRoomChatAreaProps {
  groupedConversations: ConversationGroup[];
  activeConversation: Conversation | null;
  activeConversationId: string | null;
  messages: ChatMessage[];
  aliasMap: Record<string, string>;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  streamingContent?: string;
  mode: ContextMode;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onSend: () => void;
  contextLabel?: string;
  selectedStudentId?: string | null;
  selectedClassId?: string | null;
  classes: Class[];
  selectedClass: Class | null;
  selectedStudents: Student[];
  onOpenTargetPicker: () => void;
  onRemoveClass: (classId: string) => void;
}

export const AIRoomChatArea = ({
  groupedConversations,
  activeConversation,
  activeConversationId,
  messages,
  aliasMap,
  input,
  setInput,
  isLoading,
  streamingContent,
  mode,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onSend,
  contextLabel,
  selectedStudentId,
  selectedClassId,
  classes,
  selectedClass,
  selectedStudents,
  onOpenTargetPicker,
  onRemoveClass,
}: AIRoomChatAreaProps) => {
  const openOverlay = useCaptureStore((s) => s.openOverlay);
  const pendingImage = useCaptureStore((s) => s.pendingImage);
  const pendingMeta = useCaptureStore((s) => s.pendingMeta);
  const clearPendingImage = useCaptureStore((s) => s.clearPendingImage);

  // 컴포저 위 대상 요약 칩 — 반별 요약(예: "6학년 1반 전체", "6학년 2반 3명")
  const targetStudents =
    mode === 'class' && selectedClass ? selectedClass.students : selectedStudents;
  const targetChipGroups = groupStudentsByClass(targetStudents, classes);

  return (
    <MainArea>
      {/* Conversation Sidebar */}
      <ConversationSidebar
        groupedConversations={groupedConversations}
        activeConversationId={activeConversationId}
        onSelect={onSelectConversation}
        onNew={onNewConversation}
        onDelete={onDeleteConversation}
        onRename={onRenameConversation}
      />

      {/* Chat Area */}
      <ChatCard>
        <TitleBar>
          <TitleBarLeft>
            <MessageSquare className='w-4 h-4 text-primary-500 flex-shrink-0' />
            <TitleText>{activeConversation?.title ?? '새 대화'}</TitleText>
          </TitleBarLeft>
          <ExportButton
            onClick={() => activeConversation && downloadConversationAsMarkdown(activeConversation)}
            disabled={!activeConversation || activeConversation.messages.length === 0}
            title='대화 내용 내보내기'
          >
            <Download className='w-3.5 h-3.5' />
            내보내기
          </ExportButton>
        </TitleBar>
        <ChatArea
          messages={messages}
          aliasMap={aliasMap}
          isLoading={isLoading}
          streamingContent={streamingContent}
          conversationId={activeConversationId ?? undefined}
          contextMode={mode}
          contextLabel={contextLabel}
          selectedStudentId={selectedStudentId}
          selectedClassId={selectedClassId}
        />
        <InputArea>
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
            <TargetButton onClick={onOpenTargetPicker}>
              <Plus size={14} />
              대상
            </TargetButton>
            {mode === 'all' ? (
              <TargetHint>대상을 고르면 해당 학급·학생 기준으로 답합니다 (선택)</TargetHint>
            ) : (
              targetChipGroups.map((group) => {
                const isWholeClass = group.students.length === group.totalInClass;
                return (
                  <TargetChip key={group.classId}>
                    {group.className} {isWholeClass ? '전체' : `${group.students.length}명`}
                    <TargetChipRemoveButton onClick={() => onRemoveClass(group.classId)}>
                      <X size={12} />
                    </TargetChipRemoveButton>
                  </TargetChip>
                );
              })
            )}
          </TargetRow>
          <InputContainer>
            <CaptureButton
              type='button'
              onClick={openOverlay}
              disabled={isLoading}
              aria-label='화면 캡처해서 질문'
            >
              <Scissors size={15} />
            </CaptureButton>
            <StyledInput
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
              placeholder={
                pendingImage ? '이 영역에 대해 무엇이 궁금하세요?' : '질문을 입력하세요...'
              }
              disabled={isLoading}
            />
            <SendButton onClick={onSend} disabled={isLoading || (!input.trim() && !pendingImage)}>
              <Send size={16} />
            </SendButton>
          </InputContainer>
        </InputArea>
      </ChatCard>
    </MainArea>
  );
};
