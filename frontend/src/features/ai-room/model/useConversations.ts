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
import {
  createConversation as createConversationApi,
  addMessage as addMessageApi,
  getConversations as getConversationsApi,
  getMessages as getMessagesApi,
  deleteConversation as deleteConversationApi,
} from '@features/ai-room/api/chatApiService';
import type { Message, Conversation as ServerConversation } from '@features/ai-room/api/chatApiService';

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

const createAliasMap = (_students: Student[]): StudentAliasMap => {
  // 마스킹 비활성화: 빈 객체 반환 (학생 이름 그대로 노출)
  return {};
};

const createNewConversation = (serverId?: number): Conversation => ({
  id: serverId ? serverId.toString() : `temp-${Date.now()}`,
  title: '새 대화',
  messages: [INITIAL_MESSAGE],
  createdAt: new Date(),
  mode: 'all',
  contextLabel: '전체',
});

/**
 * 서버 타임스탬프 문자열 → Date 객체
 */
const parseServerTimestamp = (timestamp: string): Date => {
  // yyyy-MM-dd HH:mm:ss → Date
  const [date, time] = timestamp.split(' ');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute, second] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
};

/**
 * 서버 Message → ChatMessage 변환
 */
const convertMessage = (msg: Message): ChatMessage => ({
  id: msg.id.toString(),
  role: msg.role,
  content: msg.content,
  timestamp: parseServerTimestamp(msg.timestamp),
});

/**
 * 서버 메시지 배열에 INITIAL_MESSAGE 추가
 * - INITIAL_MESSAGE는 서버에 저장하지 않고 프론트에서만 표시
 */
const prependInitialMessage = (messages: ChatMessage[]): ChatMessage[] => {
  return [INITIAL_MESSAGE, ...messages];
};

/**
 * 서버 Conversation → 프론트 Conversation 변환 (메시지 제외)
 */
const convertConversation = (serverConv: ServerConversation): Conversation => ({
  id: serverConv.id.toString(),
  title: serverConv.title,
  mode: serverConv.mode,
  contextLabel: serverConv.contextLabel,
  createdAt: parseServerTimestamp(serverConv.createdAt),
  messages: [INITIAL_MESSAGE], // 초기값, 나중에 getMessages로 채움
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
  // State (서버 중심)
  // ---------------------------------------------------------------------------
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [responseAliasMap, setResponseAliasMap] = useState<StudentAliasMap>({});

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
    conversations.find((c) => c.id === activeConversationId) ||
    conversations[0] ||
    createNewConversation();
  const messages = activeConversation?.messages || [INITIAL_MESSAGE];

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
  // 초기 로드: 서버에서 대화 목록 불러오기
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const loadConversations = async () => {
      try {
        console.log('📥 대화 목록 불러오기 시작...');
        const result = await getConversationsApi(0, 50);

        if (result.items.length === 0) {
          // 서버에 대화가 없으면 새 대화 생성
          console.log('💬 저장된 대화 없음, 새 대화 생성');
          const newConv = createNewConversation();
          setConversations([newConv]);
          setActiveConversationId(newConv.id);
        } else {
          // 서버 대화를 프론트 형식으로 변환
          const converted = result.items.map(convertConversation);
          setConversations(converted);

          // 첫 번째 대화 자동 선택 후 메시지 로드
          const firstConvId = converted[0].id;
          setActiveConversationId(firstConvId);

          console.log(`✅ 대화 ${result.items.length}개 로드, 첫 대화 선택: ${firstConvId}`);

          // 첫 대화의 메시지 로드
          const messagesResult = await getMessagesApi(parseInt(firstConvId, 10));
          const convertedMessages = messagesResult.messages.map(convertMessage);
          // INITIAL_MESSAGE를 앞에 추가 (서버에는 저장 안 함)
          const messagesWithInitial = prependInitialMessage(convertedMessages);

          setConversations((prev) =>
            prev.map((c) =>
              c.id === firstConvId ? { ...c, messages: messagesWithInitial } : c,
            ),
          );

          console.log(`✅ 메시지 ${messagesWithInitial.length}개 로드 완료 (INITIAL 포함)`);
        }
      } catch (err) {
        console.error('❌ 대화 목록 로드 실패:', err);
        // 실패 시 새 대화 생성
        const newConv = createNewConversation();
        setConversations([newConv]);
        setActiveConversationId(newConv.id);
      }
    };

    loadConversations();
  }, []); // 마운트 시 1회만 실행

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleNewConversation = () => {
    const newConv = createNewConversation();
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  };

  const handleDeleteConversation = (convId: string) => {
    // 에이전트 서버 세션 + 로컬 컨텍스트 캐시 정리
    agentResetSession(convId).catch((err: unknown) => {
      console.warn('[AI] 세션 초기화 실패:', err);
    });
    contextCacheRef.current.delete(convId);

    // 백엔드 대화방 soft delete (임시 대화는 제외)
    if (!convId.startsWith('temp-')) {
      deleteConversationApi(parseInt(convId, 10)).catch((err) => {
        console.error('❌ 대화 삭제 실패:', err);
      });
    }

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

  const handleSelectConversation = async (convId: string) => {
    setActiveConversationId(convId);

    // temp- ID는 아직 서버에 없으므로 메시지 로드 스킵
    if (convId.startsWith('temp-')) {
      console.log('🆕 임시 대화 선택, 메시지 로드 스킵:', convId);
      return;
    }

    // 이미 메시지가 로드된 대화인지 확인
    const targetConv = conversations.find((c) => c.id === convId);
    if (targetConv && targetConv.messages.length > 1) {
      // INITIAL_MESSAGE(id='1') 외에 다른 메시지가 있으면 이미 로드된 것
      console.log('✅ 메시지 이미 로드됨, 스킵:', convId);
      return;
    }

    try {
      console.log('📥 메시지 로드 시작:', convId);
      const result = await getMessagesApi(parseInt(convId, 10));
      const convertedMessages = result.messages.map(convertMessage);
      // INITIAL_MESSAGE를 앞에 추가 (서버에는 저장 안 함)
      const messagesWithInitial = prependInitialMessage(convertedMessages);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, messages: messagesWithInitial } : c,
        ),
      );

      console.log(`✅ 메시지 ${messagesWithInitial.length}개 로드 완료 (INITIAL 포함)`);
    } catch (err) {
      console.error('❌ 메시지 로드 실패:', err);
    }
  };

  const getConversationMode = (convId: string): ContextMode | undefined => {
    return conversations.find((c) => c.id === convId)?.mode;
  };

  /**
   * 새 대화 생성 시 서버에 저장하고 ID 교체
   */
  useEffect(() => {
    const syncNewConversations = async () => {
      for (const conv of conversations) {
        // 임시 ID(temp-로 시작)인 경우만 처리
        if (!conv.id.startsWith('temp-')) continue;

        try {
          console.log('💾 대화 생성:', conv.id);
          // INITIAL_MESSAGE는 서버에 저장하지 않음 (프론트에서만 표시)
          const result = await createConversationApi(
            conv.mode,
            conv.contextLabel || '전체',
            conv.title,
            [], // 빈 배열 - INITIAL_MESSAGE 제외
          );

          // 임시 ID를 서버 ID로 교체
          const serverId = result.conversation.id.toString();
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conv.id ? { ...c, id: serverId } : c,
            ),
          );

          // 활성 대화가 방금 생성된 대화면 ID 업데이트
          if (activeConversationId === conv.id) {
            setActiveConversationId(serverId);
          }

          console.log('✅ 대화 생성 완료:', serverId);
        } catch (err) {
          console.error('❌ 대화 생성 실패:', err);
        }
      }
    };

    syncNewConversations();
  }, [conversations, activeConversationId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const tempUserMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempUserMsgId,
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
      const convId = activeConversationId;

      // ✅ 사용자 메시지 저장 → 서버 messageId 반영
      if (!convId.startsWith('temp-')) {
        addMessageApi(parseInt(convId, 10), 'user', currentInput)
          .then((res) => {
            const serverId = res.messages?.[res.messages.length - 1]?.id?.toString();
            if (serverId) {
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id !== convId
                    ? conv
                    : {
                        ...conv,
                        messages: conv.messages.map((m) =>
                          m.id === tempUserMsgId ? { ...m, id: serverId } : m,
                        ),
                      },
                ),
              );
            }
          })
          .catch((err) => console.warn('사용자 메시지 저장 실패:', err));
      }

      // 세션 캐시 조회 — 있으면 API 재호출 없이 재사용
      const cachedContext = contextCacheRef.current.get(activeConversationId) ?? null;

      let tempAiMsgId = '';

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
            tempAiMsgId = `ai-${Date.now() + 1}`;
            const aiMsg: ChatMessage = {
              id: tempAiMsgId,
              role: 'assistant',
              content: accumulated,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setStreamingContent('');

            // ✅ AI 응답 저장 → 서버 messageId 반영
            if (!convId.startsWith('temp-')) {
              addMessageApi(parseInt(convId, 10), 'assistant', accumulated)
                .then((res) => {
                  const serverId = res.messages?.[res.messages.length - 1]?.id?.toString();
                  if (serverId && tempAiMsgId) {
                    setConversations((prev) =>
                      prev.map((conv) =>
                        conv.id !== convId
                          ? conv
                          : {
                              ...conv,
                              messages: conv.messages.map((m) =>
                                m.id === tempAiMsgId ? { ...m, id: serverId } : m,
                              ),
                            },
                      ),
                    );
                  }
                })
                .catch((err) => console.warn('AI 응답 저장 실패:', err));
            }
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
