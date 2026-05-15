/**
 * 백엔드 AI Chat API 서비스
 *
 * Base URL: http://{host}:8081
 * 인증: Authorization: Bearer {accessToken}
 *
 * 엔드포인트:
 *   POST /api/ai/conversations         — 대화방 생성 + 초기 메시지
 *   GET /api/ai/conversations         — 대화방 목록
 *   GET /api/ai/conversations/{id}/messages  — 메시지 조회
 *   POST /api/ai/conversations/{id}/messages — 메시지 추가
 *   POST /api/ai/conversations/{id}/delete   — 대화방 삭제 (Soft Delete)
 */

import { apiClient } from '@shared/api';

// ============================================================
// 타입 정의
// ============================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // yyyy-MM-dd HH:mm:ss
}

export interface Conversation {
  id: number;
  title: string;
  mode: 'all' | 'class' | 'student';
  contextLabel: string;
  contextData?: unknown;
  createdAt: string; // yyyy-MM-dd HH:mm:ss
  updatedAt: string;
  lastMessageAt: string;
}

export interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface CreateConversationRequest {
  title?: string;
  mode: 'all' | 'class' | 'student';
  contextLabel: string;
  contextData?: unknown;
  messages?: ChatMessage[] | ChatMessage;
}

interface CreateConversationResponse {
  conversation: Conversation;
  messages: Message[];
}

interface ListConversationsResponse {
  items: (Conversation & { messageCount: number })[];
  page: number;
  size: number;
  totalCount: number;
}

interface GetMessagesResponse {
  conversation: Conversation;
  messages: Message[];
  nextBeforeMessageId?: number;
  size: number;
}

interface AddMessageResponse {
  conversation: Conversation;
  messages: Message[];
}

// ============================================================
// 유틸리티
// ============================================================

/**
 * 현재 시각을 백엔드 포맷으로 반환 (yyyy-MM-dd HH:mm:ss)
 */
const getCurrentTimestamp = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
};

// ============================================================
// API 함수
// ============================================================

/**
 * 대화방 생성 + 초기 메시지 저장
 */
export const createConversation = async (
  mode: 'all' | 'class' | 'student',
  contextLabel: string,
  title?: string,
  messages?: ChatMessage[],
  contextData?: unknown,
): Promise<CreateConversationResponse> => {
  const request: CreateConversationRequest = {
    title,
    mode,
    contextLabel,
    contextData,
    messages: messages || [],
  };

  const res = await apiClient.post<CreateConversationResponse>(
    '/api/ai/conversations',
    request,
  );

  return res.resultData;
};

/**
 * 대화방 목록 조회
 */
export const getConversations = async (
  page: number = 0,
  size: number = 10,
): Promise<ListConversationsResponse> => {
  const res = await apiClient.get<ListConversationsResponse>(
    `/api/ai/conversations?page=${page}&size=${size}`,
  );

  return res.resultData;
};

/**
 * 대화방 메시지 조회 (커서 페이징)
 */
export const getMessages = async (
  conversationId: number,
  beforeMessageId?: number,
  size: number = 50,
): Promise<GetMessagesResponse> => {
  let url = `/api/ai/conversations/${conversationId}/messages?size=${size}`;
  if (beforeMessageId !== undefined) {
    url += `&beforeMessageId=${beforeMessageId}`;
  }

  const res = await apiClient.get<GetMessagesResponse>(url);
  return res.resultData;
};

/**
 * 기존 대화방에 메시지 추가 (단건 또는 배열)
 */
export const addMessages = async (
  conversationId: number,
  messages: ChatMessage | ChatMessage[],
): Promise<AddMessageResponse> => {
  const request = Array.isArray(messages) ? { messages } : messages;

  const res = await apiClient.post<AddMessageResponse>(
    `/api/ai/conversations/${conversationId}/messages`,
    request,
  );

  return res.resultData;
};

/**
 * 메시지 추가 (편의 함수 - 단건)
 */
export const addMessage = async (
  conversationId: number,
  role: 'user' | 'assistant' | 'system',
  content: string,
): Promise<AddMessageResponse> => {
  return addMessages(conversationId, {
    role,
    content,
    timestamp: getCurrentTimestamp(),
  });
};

/**
 * 대화방 삭제 (Soft Delete)
 */
export const deleteConversation = async (
  conversationId: number,
): Promise<{ conversationId: number; useYn: string; deleted: boolean }> => {
  const res = await apiClient.post<{
    conversationId: number;
    useYn: string;
    deleted: boolean;
  }>(`/api/ai/conversations/${conversationId}/delete`, {});

  return res.resultData;
};

export { getCurrentTimestamp };
