import styled from '@emotion/styled';
import { Send, X, Download, MessageSquare, Plus } from 'lucide-react';
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
  height: 100%;
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
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  background-color: ${({ theme }) => theme.colors.background.paper};
`;

const InputInner = styled.div`
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
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

const StyledInput = styled.textarea`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.5rem;
  resize: none;

  &:disabled {
    cursor: not-allowed;
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
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
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

const TitleIcon = styled(MessageSquare)`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.primary[500]};
`;

const EmptyChatState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 4rem 1.5rem;
  text-align: center;
`;

const EmptyChatTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: 22px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const EmptyChatDescription = styled.p`
  margin: 0.5rem 0 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
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
  isPromptDisabled: boolean;
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
  isPromptDisabled,
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
  // 컴포저 위 대상 요약 칩 — 반별 요약(예: "6학년 1반 전체", "6학년 2반 3명")
  const targetStudents =
    mode === 'class' && selectedClass ? selectedClass.students : selectedStudents;
  const targetChipGroups = groupStudentsByClass(targetStudents, classes);
  const displayMessages = messages.filter((message) => message.id !== '1');

  const handleInputChange = (value: string) => {
    if (value.endsWith('@')) {
      setInput(value.slice(0, -1));
      onOpenTargetPicker();
      return;
    }
    setInput(value);
  };

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
            <TitleIcon size={16} />
            <TitleText>{activeConversation?.title ?? '새 대화'}</TitleText>
          </TitleBarLeft>
          <ExportButton
            onClick={() => activeConversation && downloadConversationAsMarkdown(activeConversation)}
            disabled={!activeConversation || activeConversation.messages.length === 0}
            title='대화 내용 내보내기'
          >
            <Download size={14} />
            내보내기
          </ExportButton>
        </TitleBar>
        {displayMessages.length === 0 && !isLoading ? (
          <EmptyChatState>
            <EmptyChatTitle>무엇을 도와드릴까요?</EmptyChatTitle>
            <EmptyChatDescription>
              대상을 고르면 해당 학급·학생 기준으로 답합니다. 궁금한 점을 입력해 보세요.
            </EmptyChatDescription>
          </EmptyChatState>
        ) : (
          <ChatArea
            messages={displayMessages}
            aliasMap={aliasMap}
            isLoading={isLoading}
            streamingContent={streamingContent}
            conversationId={activeConversationId ?? undefined}
            contextMode={mode}
            contextLabel={contextLabel}
            selectedStudentId={selectedStudentId}
            selectedClassId={selectedClassId}
          />
        )}
        <InputArea>
          <InputInner>
            <TargetRow>
              <TargetButton onClick={onOpenTargetPicker}>
                <Plus size={14} />
                대상
              </TargetButton>
              {mode === 'all' && selectedStudents.length === 0 ? (
                <TargetHint>대상을 고르면 해당 학급·학생 기준으로 답합니다 (선택)</TargetHint>
              ) : (
                targetChipGroups.map((group) => {
                  const isWholeClass = group.students.length === group.totalInClass;
                  return (
                    <TargetChip key={group.classId}>
                      {group.className} {isWholeClass ? '전체' : `${group.students.length}명`}
                      <TargetChipRemoveButton
                        onClick={() => onRemoveClass(group.classId)}
                        aria-label={`${group.className} 대상 제거`}
                      >
                        <X size={12} />
                      </TargetChipRemoveButton>
                    </TargetChip>
                  );
                })
              )}
            </TargetRow>
            <InputContainer>
              <StyledInput
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                rows={1}
                placeholder={
                  isPromptDisabled
                    ? '먼저 질문 대상을 선택해주세요.'
                    : `${activeConversation?.title ?? '새 대화'}에 이어서 질문하거나 @로 대상을 지정하세요`
                }
                disabled={isLoading || isPromptDisabled}
              />
              <SendButton
                onClick={onSend}
                disabled={isLoading || isPromptDisabled || !input.trim()}
              >
                <Send size={16} />
              </SendButton>
            </InputContainer>
          </InputInner>
        </InputArea>
      </ChatCard>
    </MainArea>
  );
};
