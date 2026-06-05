import styled from '@emotion/styled';
import { Send } from 'lucide-react';
import { Card } from '@shared/components';
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
}: AIRoomChatAreaProps) => (
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
      />
      <InputArea>
        <InputContainer>
          <StyledInput
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder='질문을 입력하세요...'
            disabled={isLoading}
          />
          <SendButton onClick={onSend} disabled={isLoading || !input.trim()}>
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
