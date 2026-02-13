import { useState, useMemo } from 'react';
import type { Class, Student } from '@/shared/types';
import type { ContextMode, ChatMessage, Conversation, StudentAliasMap } from '@/features/ai-room/types';
import { callAssistant } from '@/features/ai-room/services/assistantService';

// ============================================================================
// Constants
// ============================================================================

const INITIAL_MESSAGE: ChatMessage = {
  id: '1',
  role: 'assistant',
  content:
    '안녕하세요! 비상교육 학습심리정서검사 AI 어시스턴트입니다.\n\n상단에서 분석할 컨텍스트를 선택하고 질문을 입력해주세요.',
  timestamp: new Date(),
};

// ============================================================================
// Utils
// ============================================================================

const createAliasMap = (students: Student[]): StudentAliasMap => {
  const map: StudentAliasMap = {};
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  students.forEach((student, idx) => {
    map[`student_${alphabet[idx] || idx + 1}`] = student.name;
  });
  return map;
};

const createNewConversation = (): Conversation => ({
  id: Date.now().toString(),
  title: '새 대화',
  messages: [INITIAL_MESSAGE],
  createdAt: new Date(),
  mode: 'all',
  contextLabel: '전체',
});

// ============================================================================
// Hook Interface
// ============================================================================

interface UseConversationsParams {
  classes: Class[];
  mode: ContextMode;
  selectedClass: Class | null;
  selectedStudents: Student[];
  getContextLabel: () => string;
}

interface UseConversationsReturn {
  conversations: Conversation[];
  activeConversationId: string;
  activeConversation: Conversation;
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  aliasMap: StudentAliasMap;
  handleNewConversation: () => void;
  handleDeleteConversation: (convId: string) => void;
  handleSelectConversation: (convId: string) => void;
  handleSend: () => Promise<void>;
  handleQuickPrompt: (prompt: string) => void;
  /** Returns the mode of the selected conversation (used to sync context mode on switch) */
  getConversationMode: (convId: string) => ContextMode | undefined;
}

// ============================================================================
// Hook
// ============================================================================

export const useConversations = ({
  classes,
  mode,
  selectedClass,
  selectedStudents,
  getContextLabel,
}: UseConversationsParams): UseConversationsReturn => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [conversations, setConversations] = useState<Conversation[]>([createNewConversation()]);
  const [activeConversationId, setActiveConversationId] = useState<string>(conversations[0].id);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseAliasMap, setResponseAliasMap] = useState<StudentAliasMap>({});

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const messages = activeConversation.messages;

  const localAliasMap = useMemo(() => createAliasMap(selectedStudents), [selectedStudents]);
  const aliasMap = useMemo(
    () => ({
      ...responseAliasMap,
      ...localAliasMap,
    }),
    [responseAliasMap, localAliasMap]
  );

  // ---------------------------------------------------------------------------
  // Internal: update messages for active conversation
  // ---------------------------------------------------------------------------
  const setMessages = (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    const contextLabel = getContextLabel();
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeConversationId) return conv;
        const newMessages = typeof updater === 'function' ? updater(conv.messages) : updater;
        const userMsg = newMessages.find((m) => m.role === 'user');
        const title = userMsg
          ? userMsg.content.slice(0, 20) + (userMsg.content.length > 20 ? '...' : '')
          : conv.title;
        return { ...conv, messages: newMessages, title, mode, contextLabel };
      })
    );
  };

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleNewConversation = () => {
    const newConv = createNewConversation();
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  };

  const handleDeleteConversation = (convId: string) => {
    if (conversations.length === 1) {
      const newConv = createNewConversation();
      setConversations([newConv]);
      setActiveConversationId(newConv.id);
    } else {
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        const remaining = conversations.filter((c) => c.id !== convId);
        setActiveConversationId(remaining[0].id);
      }
    }
  };

  const handleSelectConversation = (convId: string) => {
    setActiveConversationId(convId);
  };

  const getConversationMode = (convId: string): ContextMode | undefined => {
    const conv = conversations.find((c) => c.id === convId);
    return conv?.mode;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await callAssistant({
        mode,
        classes,
        selectedClass,
        selectedStudents,
        messages: messages.filter((m) => m.id !== '1'),
        userMessage: currentInput,
      });

      if (response.aliasMap && Object.keys(response.aliasMap).length > 0) {
        setResponseAliasMap((prev) => ({ ...prev, ...response.aliasMap }));
      }

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.success
          ? response.content
          : `오류가 발생했습니다: ${response.error || '알 수 없는 오류'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => setInput(prompt);

  return {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    input,
    setInput,
    isLoading,
    aliasMap,
    handleNewConversation,
    handleDeleteConversation,
    handleSelectConversation,
    handleSend,
    handleQuickPrompt,
    getConversationMode,
  };
};
