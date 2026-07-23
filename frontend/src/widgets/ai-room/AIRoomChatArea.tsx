import styled from '@emotion/styled';
import { Send, Scissors, X } from 'lucide-react';
import { Card } from '@shared/components';
import { useCaptureStore } from '@shared/store/useCaptureStore';
import { ChatArea, QuickPrompts, ConversationSidebar } from '@features/ai-room/ui';
import type { ChatMessage, Conversation, ContextMode } from '@features/ai-room';

const MainArea = styled.div`
  flex: 1;
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  min-height: 0;
`;

const ChatCard = styled(Card)`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(
    to bottom,
    rgba(248, 250, 252, 0.5),
    ${({ theme }) => theme.colors.background.paper}
  );
`;

const InputArea = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  outline: none;
  background-color: rgba(255, 255, 255, 0.8);
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]};
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    cursor: not-allowed;
  }
`;

const CaptureButton = styled.button`
  padding: 12px;
  background-color: ${({ theme }) => theme.colors.background.paper};
  color: ${({ theme }) => theme.colors.gray[500]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[50]};
    color: ${({ theme }) => theme.colors.primary[600]};
    border-color: ${({ theme }) => theme.colors.primary[200]};
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
  padding: 12px 16px;
  background-color: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ theme }) => theme.shadows.md};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary[600]};
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const QuickPromptsWrapper = styled.div`
  width: 288px;
  flex-shrink: 0;
`;

const QuickPromptsCard = styled(Card)`
  height: 100%;
  background: linear-gradient(
    to bottom,
    ${({ theme }) => theme.colors.background.paper},
    rgba(248, 250, 252, 0.5)
  );
  border-color: rgba(${({ theme }) => theme.colors.gray[200]}, 0.8);
`;

interface AIRoomChatAreaProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  aliasMap: Record<string, string>;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  streamingContent?: string;
  mode: ContextMode;
  selectedStudentCount: number;
  isPromptDisabled: boolean;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onSend: () => void;
  onQuickPrompt: (prompt: string) => void;
  contextLabel?: string;
  selectedStudentId?: string | null;
  selectedClassId?: string | null;
}

export const AIRoomChatArea = ({
  conversations,
  activeConversationId,
  messages,
  aliasMap,
  input,
  setInput,
  isLoading,
  streamingContent,
  mode,
  selectedStudentCount,
  isPromptDisabled,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onSend,
  onQuickPrompt,
  contextLabel,
  selectedStudentId,
  selectedClassId,
}: AIRoomChatAreaProps) => {
  const openOverlay = useCaptureStore((s) => s.openOverlay);
  const pendingImage = useCaptureStore((s) => s.pendingImage);
  const pendingMeta = useCaptureStore((s) => s.pendingMeta);
  const clearPendingImage = useCaptureStore((s) => s.clearPendingImage);

  return (
    <MainArea>
      {/* Conversation Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={onSelectConversation}
        onNew={onNewConversation}
        onDelete={onDeleteConversation}
      />

      {/* Chat Area */}
      <ChatCard>
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
          <InputContainer>
            <CaptureButton
              type='button'
              onClick={openOverlay}
              disabled={isLoading}
              aria-label='화면 캡처해서 질문'
            >
              <Scissors size={18} />
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
              <Send size={20} />
            </SendButton>
          </InputContainer>
        </InputArea>
      </ChatCard>

      {/* Quick Prompts Sidebar */}
      <QuickPromptsWrapper>
        <QuickPromptsCard>
          <QuickPrompts
            mode={mode}
            selectedCount={selectedStudentCount}
            onSelect={onQuickPrompt}
            disabled={isPromptDisabled}
          />
        </QuickPromptsCard>
      </QuickPromptsWrapper>
    </MainArea>
  );
};
