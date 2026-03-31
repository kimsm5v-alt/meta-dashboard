import styled from '@emotion/styled';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Card } from '@shared/components';
import type { Conversation } from '@features/ai-room/types';

const Container = styled.div`
  width: 14rem;
  flex-shrink: 0;
`;

const StyledCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const NewButton = styled.button`
  padding: 0.375rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ConversationItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid
    ${({ $isActive, theme }) => ($isActive ? theme.colors.primary[200] : 'transparent')};
  background: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary[50] : 'transparent'};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary[50] : theme.colors.gray[50]};
  }
`;

const ConversationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConversationTitle = styled.p<{ $isActive: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ $isActive, theme }) =>
    $isActive ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary[700] : theme.colors.gray[700]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ConversationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.25rem;
`;

const ModeBadge = styled.span<{ $mode: 'all' | 'class' | 'student' }>`
  padding: 0.125rem 0.375rem;
  font-size: 9px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ $mode, theme }) =>
    $mode === 'all'
      ? theme.colors.gray[100]
      : $mode === 'class'
        ? '#dbeafe'
        : '#d1fae5'};
  color: ${({ $mode, theme }) =>
    $mode === 'all'
      ? theme.colors.gray[600]
      : $mode === 'class'
        ? '#1d4ed8'
        : '#047857'};
`;

const DateText = styled.span`
  font-size: 9px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const DeleteButton = styled.button`
  padding: 0.25rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s ease;

  ${ConversationItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }

  svg {
    transition: color 0.15s ease;
  }

  &:hover svg {
    color: #ef4444;
  }
`;

// ============================================================================
// Types
// ============================================================================

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (convId: string) => void;
  onNew: () => void;
  onDelete: (convId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelect,
  onNew,
  onDelete,
}) => {
  return (
    <Container>
      <StyledCard>
        <Header>
          <HeaderLeft>
            <MessageSquare className='w-4 h-4 text-gray-500' />
            <HeaderTitle>대화 기록</HeaderTitle>
          </HeaderLeft>
          <NewButton onClick={onNew} title='새 대화'>
            <Plus className='w-4 h-4 text-gray-500' />
          </NewButton>
        </Header>
        <ConversationList>
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              $isActive={activeConversationId === conv.id}
            >
              <ConversationContent>
                <ConversationTitle $isActive={activeConversationId === conv.id}>
                  {conv.title}
                </ConversationTitle>
                <ConversationMeta>
                  <ModeBadge $mode={conv.mode}>{conv.contextLabel || '전체'}</ModeBadge>
                  <DateText>
                    {conv.createdAt.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </DateText>
                </ConversationMeta>
              </ConversationContent>
              <DeleteButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                title='삭제'
              >
                <Trash2 className='w-3.5 h-3.5 text-gray-400' />
              </DeleteButton>
            </ConversationItem>
          ))}
        </ConversationList>
      </StyledCard>
    </Container>
  );
};
