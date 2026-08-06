import { useState } from 'react';
import styled from '@emotion/styled';
import { MessageCircle, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ConversationGroup } from '@features/ai-room/utils/groupConversations';

/* 프로토타입 aside(w-[240px] bg-[#FAFAFD] border-r)와 동일 — 떠있는 카드가 아니라
   본문과 한 평면을 이루는 사이드바 */
const Container = styled.div`
  width: 15rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #fafafd;
  border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const NewConversationWrapper = styled.div`
  padding: 0.75rem;
`;

const NewConversationButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary[600]};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[50]};
  }
`;

const Divider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  margin: 0 0.75rem 0.5rem;
`;

const HistoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 0.5rem 0.5rem;
`;

const GroupSection = styled.div`
  margin-bottom: 0.75rem;
`;

const GroupLabel = styled.div`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[400]};
  letter-spacing: 0.02em;
  padding: 0 0.5rem;
  margin-bottom: 0.25rem;
`;

const ConversationItem = styled.div<{ $isActive: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ $isActive, theme }) => ($isActive ? theme.colors.primary[50] : 'transparent')};

  &:hover {
    background: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary[50] : theme.colors.gray[50]};
  }
`;

const ConversationButton = styled.button<{ $isActive: boolean }>`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ $isActive, theme }) =>
    $isActive ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary[700] : theme.colors.gray[700]};
`;

const ConversationTitle = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MenuButton = styled.button<{ $isOpen: boolean }>`
  padding: 0.25rem;
  margin-right: 0.375rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.gray[400]};
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  flex-shrink: 0;
  transition: opacity 0.15s ease;

  ${ConversationItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
    color: ${({ theme }) => theme.colors.gray[700]};
  }
`;

const Dropdown = styled.div`
  position: absolute;
  right: 0.25rem;
  top: 100%;
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  margin-top: 2px;
  width: 8.5rem;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 0.25rem 0;
`;

const DropdownItem = styled.button<{ $danger?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  color: ${({ $danger, theme }) => ($danger ? '#ef4444' : theme.colors.gray[700])};

  &:hover {
    background: ${({ $danger, theme }) => ($danger ? '#fef2f2' : theme.colors.gray[50])};
  }
`;

const DropdownOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.dropdown - 1};
`;

const EditInput = styled.input`
  flex: 1;
  min-width: 0;
  margin: 0.25rem;
  padding: 0.3rem 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border: 1px solid ${({ theme }) => theme.colors.primary[300]};
  border-radius: ${({ theme }) => theme.radius.md};
  outline: none;
  background: ${({ theme }) => theme.colors.background.paper};
`;

// ============================================================================
// Types
// ============================================================================

interface ConversationSidebarProps {
  groupedConversations: ConversationGroup[];
  activeConversationId: string | null;
  onSelect: (convId: string) => void;
  onNew: () => void;
  onDelete: (convId: string) => void;
  onRename: (convId: string, newTitle: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  groupedConversations,
  activeConversationId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}) => {
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditValue(currentTitle);
    setMenuId(null);
  };

  const commitEdit = () => {
    if (editingId) onRename(editingId, editValue);
    setEditingId(null);
  };

  return (
    <Container>
      <NewConversationWrapper>
        <NewConversationButton onClick={onNew}>
          <Plus className='w-4 h-4' />새 대화
        </NewConversationButton>
      </NewConversationWrapper>

      <Divider />

      <HistoryList>
        {menuId && <DropdownOverlay onClick={() => setMenuId(null)} />}
        {groupedConversations.map(({ group, items }) => (
          <GroupSection key={group}>
            <GroupLabel>{group}</GroupLabel>
            {items.map((conv) => {
              const isActive = activeConversationId === conv.id;

              if (editingId === conv.id) {
                return (
                  <EditInput
                    key={conv.id}
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitEdit();
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                  />
                );
              }

              return (
                <ConversationItem key={conv.id} $isActive={isActive}>
                  <ConversationButton onClick={() => onSelect(conv.id)} $isActive={isActive}>
                    <MessageCircle className='w-3.5 h-3.5 flex-shrink-0 opacity-70' />
                    <ConversationTitle>{conv.title}</ConversationTitle>
                  </ConversationButton>
                  <MenuButton
                    $isOpen={menuId === conv.id}
                    onClick={() => setMenuId((prev) => (prev === conv.id ? null : conv.id))}
                    title='더보기'
                  >
                    <MoreVertical className='w-4 h-4' />
                  </MenuButton>
                  {menuId === conv.id && (
                    <Dropdown>
                      <DropdownItem onClick={() => startEdit(conv.id, conv.title)}>
                        <Pencil className='w-3.5 h-3.5' />
                        제목 편집
                      </DropdownItem>
                      <DropdownItem
                        $danger
                        onClick={() => {
                          setMenuId(null);
                          onDelete(conv.id);
                        }}
                      >
                        <Trash2 className='w-3.5 h-3.5' />
                        삭제
                      </DropdownItem>
                    </Dropdown>
                  )}
                </ConversationItem>
              );
            })}
          </GroupSection>
        ))}
      </HistoryList>
    </Container>
  );
};
