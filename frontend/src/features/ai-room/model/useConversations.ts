import { useState, useMemo, useRef, useEffect } from 'react';
import type { Class, Student } from '@shared/types';
import type {
  ContextMode,
  ChatMessage,
  Conversation,
  StudentAliasMap,
} from '@features/ai-room/types';
import type { AssistantResponse } from '@features/ai-room/api/assistantService';
import { callAssistantStream } from '@features/ai-room/api/assistantService';
import { agentResetSession } from '@features/ai-room/api/agentApiService';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_CONVERSATIONS = 'ai_room_conversations';
const STORAGE_KEY_ACTIVE_ID = 'ai_room_active_conversation_id';

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

const createAliasMap = (_students: Student[]): StudentAliasMap => {
  // 마스킹 비활성화: 빈 객체 반환 (학생 이름 그대로 노출)
  return {};
};

const createNewConversation = (): Conversation => ({
  id: Date.now().toString(),
  title: '새 대화',
  messages: [INITIAL_MESSAGE],
  createdAt: new Date(),
  mode: 'all',
  contextLabel: '전체',
});

// localStorage에서 대화 기록 불러오기
const loadConversations = (): Conversation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (!stored) return [createNewConversation()];

    const parsed = JSON.parse(stored) as Conversation[];
    // Date 객체 복원
    return parsed.map((conv) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      messages: conv.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  } catch {
    return [createNewConversation()];
  }
};

// localStorage에 대화 기록 저장
const saveConversations = (conversations: Conversation[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
  } catch {
    // 저장 실패 무시 (quota 초과 등)
  }
};

// localStorage에서 activeConversationId 불러오기
const loadActiveConversationId = (conversations: Conversation[]): string => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (stored && conversations.find((c) => c.id === stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return conversations[0]?.id ?? '';
};

// localStorage에 activeConversationId 저장
const saveActiveConversationId = (id: string) => {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch {
    // ignore
  }
};

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
  streamingContent: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  aliasMap: StudentAliasMap;
  handleNewConversation: () => void;
  handleDeleteConversation: (convId: string) => void;
  handleSelectConversation: (convId: string) => void;
  handleSend: () => Promise<void>;
  handleQuickPrompt: (prompt: string) => void;
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
  // State (with localStorage persistence)
  // ---------------------------------------------------------------------------
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeConversationId, setActiveConversationId] = useState<string>(() =>
    loadActiveConversationId(loadConversations()),
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [responseAliasMap, setResponseAliasMap] = useState<StudentAliasMap>({});

  // localStorage에 대화 기록 저장 (TODO: 백엔드 API 연동 시 POST /ai-room/conversations로 교체)
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // localStorage에 activeConversationId 저장 (TODO: 백엔드 세션 저장으로 교체)
  useEffect(() => {
    saveActiveConversationId(activeConversationId);
  }, [activeConversationId]);

  /**
   * 세션별 RAG 컨텍스트 캐시
   * - 첫 메시지에서 빌드(API 호출), 이후 메시지는 재사용
   * - 대화 삭제 시 해당 세션 캐시도 제거
   */
  const contextCacheRef = useRef<
    Map<string, NonNullable<AssistantResponse['builtContext']>>
  >(new Map());

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const messages = activeConversation.messages;

  const localAliasMap = useMemo(() => createAliasMap(selectedStudents), [selectedStudents]);
  const aliasMap = useMemo(
    () => ({ ...responseAliasMap, ...localAliasMap }),
    [responseAliasMap, localAliasMap],
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
      }),
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
    // 에이전트 서버 세션 + 로컬 컨텍스트 캐시 모두 정리
    agentResetSession(convId).catch(() => {});
    contextCacheRef.current.delete(convId);

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
    return conversations.find((c) => c.id === convId)?.mode;
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
    setStreamingContent('');

    try {
      // 세션 캐시 조회 — 있으면 API 재호출 없이 재사용
      const cachedContext = contextCacheRef.current.get(activeConversationId) ?? null;

      const result = await callAssistantStream(
        {
          sessionId: activeConversationId,
          mode,
          classes,
          selectedClass,
          selectedStudents,
          messages: messages.filter((m) => m.id !== '1'),
          userMessage: currentInput,
          cachedContext,
        },
        (accumulated, isFinal) => {
          setStreamingContent(accumulated);
          if (isFinal) {
            // 스트리밍 완료 → 메시지 목록에 추가하고 스트리밍 초기화
            const aiMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: accumulated,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setStreamingContent('');
          }
        },
      );

      // 첫 메시지에서 빌드된 컨텍스트를 캐시에 저장 → 이후 메시지는 API 재호출 없음
      if (result.builtContext) {
        contextCacheRef.current.set(activeConversationId, result.builtContext);
      }

      if (result.aliasMap && Object.keys(result.aliasMap).length > 0) {
        setResponseAliasMap((prev) => ({ ...prev, ...result.aliasMap }));
      }

      // 에러 발생 시에만 에러 메시지 추가
      if (!result.success) {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `오류가 발생했습니다: ${result.error ?? '알 수 없는 오류'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        setStreamingContent('');
      }
      // fallback 로직 완전 제거 - isFinal 콜백에서만 메시지 추가
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setStreamingContent('');
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
    streamingContent,
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
