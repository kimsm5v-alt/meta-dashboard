/**
 * META AI 에이전트 API 서비스
 *
 * https://t-meta-agent-api.vsaidt.com
 *
 * 엔드포인트:
 *   POST /chat         — 일반 응답
 *   POST /chat/stream  — SSE 스트리밍 응답
 *   DELETE /chat/{id}  — 세션 초기화
 */

import { ENV } from '@shared/config/env';

const BASE_URL = ENV.AGENT_API_URL;

// ============================================================
// 타입 정의
// ============================================================

interface AgentQuery {
  text: string;
  session_id: string;
  context_data?: Record<string, unknown> | null;
}

export interface AgentChatResponse {
  response: string;
  session_id: string;
  history_count: number;
}

// SSE 청크 형식 — 스트리밍은 "text" 필드 사용 (일반 응답의 "response"와 다름)
interface StreamChunk {
  text: string;
  is_final: boolean;
}

// ============================================================
// 일반 채팅 (POST /chat)
// ============================================================

export const agentChat = async (
  text: string,
  sessionId: string,
  contextData?: Record<string, unknown> | null,
): Promise<AgentChatResponse> => {
  const body: AgentQuery = { text, session_id: sessionId, context_data: contextData ?? null };

  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Agent API ${res.status}: ${detail}`);
  }

  return res.json() as Promise<AgentChatResponse>;
};

// ============================================================
// 스트리밍 채팅 (POST /chat/stream — SSE)
// ============================================================

export const agentChatStream = async (
  text: string,
  sessionId: string,
  onChunk: (chunk: string, isFinal: boolean) => void,
  contextData?: Record<string, unknown> | null,
): Promise<void> => {
  const body: AgentQuery = { text, session_id: sessionId, context_data: contextData ?? null };

  const res = await fetch(`${BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Agent Stream API ${res.status}: ${detail}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Streaming not supported');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE는 "\n\n"으로 이벤트를 구분
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      for (const line of part.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (raw === '[DONE]') return;

        try {
          const parsed = JSON.parse(raw) as StreamChunk;
          onChunk(parsed.text ?? '', parsed.is_final ?? false);
          if (parsed.is_final) return;
        } catch {
          // 파싱 실패 시 원문 그대로 전달
          onChunk(raw, false);
        }
      }
    }
  }
};

// ============================================================
// 세션 초기화 (DELETE /chat/{session_id})
// ============================================================

export const agentResetSession = async (sessionId: string): Promise<void> => {
  await fetch(`${BASE_URL}/chat/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
};
