import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ENV } from '@shared/config/env';
import { getAuth } from '@shared/lib/authClient';

export type RecordGenerationAction = 'generate' | 'rewrite' | 'shorten' | 'expand';

export interface AgentFactorLevel {
  name: string;
  t_score: number;
  is_positive: boolean;
}

export interface AgentRoundChange {
  category: string;
  direction: '개선' | '유지' | '하락';
}

export interface AgentObservation {
  observations: {
    factor: string;
    type: 'strength' | 'improvement';
    behavior_codes: string[];
  }[];
  free_text: string;
  counseling_notes: string[];
}

export interface AgentStudentInput {
  student_id: string;
  lpa_type: string;
  strengths: AgentFactorLevel[];
  improvements: AgentFactorLevel[];
  round2_available: boolean;
  round_changes: AgentRoundChange[];
  observation?: AgentObservation;
  previous_text?: string;
}

export interface SchoolRecordGenerationRequest {
  session_id: string;
  class_id: string;
  school_level: '초등' | '중등' | '고등';
  school_level_code: 'elementary' | 'middle' | 'high';
  grade: number;
  source: 'TEST_ONLY' | 'COMMON_CONTEXT' | 'INDIVIDUAL_OBSERVATION';
  action: RecordGenerationAction;
  common_context?: {
    situation_label: string;
    activity_text: string;
    behaviors: string[];
  };
  stream_tokens: boolean;
  students: AgentStudentInput[];
}

export interface GenerationWarning {
  match: string;
  label: string;
}

export type SchoolRecordGenerationEvent =
  | { type: 'start'; total: number }
  | { type: 'student_start'; index: number; student_id: string }
  | { type: 'token'; index: number; student_id: string; text: string }
  | {
      type: 'student_done';
      index: number;
      student_id: string;
      text: string;
      char_count: number;
      warnings: GenerationWarning[];
    }
  | { type: 'student_error'; index: number; student_id: string; message: string }
  | { type: 'ping' }
  | { type: 'done'; succeeded: number; failed: number }
  | { type: 'error'; message: string };

interface StreamOptions {
  signal?: AbortSignal;
  onEvent: (event: SchoolRecordGenerationEvent) => void | Promise<void>;
}

const isGenerationEvent = (value: unknown): value is SchoolRecordGenerationEvent => {
  if (!value || typeof value !== 'object') return false;
  return typeof (value as { type?: unknown }).type === 'string';
};

/**
 * 생활기록부 전용 POST SSE. 일반 채팅의 is_final 계약과 달라 별도 파서를 사용한다.
 * POST 재시도는 LLM 중복 호출을 만들 수 있어 연결 오류 시 자동 재시도하지 않는다.
 */
export async function streamSchoolRecordGeneration(
  request: SchoolRecordGenerationRequest,
  options: StreamOptions,
): Promise<void> {
  const token = getAuth().getAccessToken();
  let receivedTerminalEvent = false;
  let eventChain = Promise.resolve();

  await fetchEventSource(`${ENV.CHAT_API_URL}/school-record/generate/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(request),
    signal: options.signal,
    openWhenHidden: true,
    async onopen(response) {
      if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream')) {
        const detail = await response.text().catch(() => response.statusText);
        throw new Error(detail || `생활기록부 생성 API 오류 (${response.status})`);
      }
    },
    onmessage(message) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(message.data);
      } catch {
        throw new Error('생활기록부 생성 응답을 해석하지 못했습니다.');
      }
      if (!isGenerationEvent(parsed)) {
        throw new Error('생활기록부 생성 응답 형식이 올바르지 않습니다.');
      }
      if (parsed.type === 'done' || parsed.type === 'error') receivedTerminalEvent = true;
      eventChain = eventChain.then(() => options.onEvent(parsed));
    },
    onclose() {
      if (!receivedTerminalEvent) {
        throw new Error('생활기록부 생성 연결이 완료 전에 종료되었습니다.');
      }
    },
    onerror(error) {
      throw error;
    },
  });

  await eventChain;
}
