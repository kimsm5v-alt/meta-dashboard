/**
 * QCH 로그 적재 유틸리티
 *
 * - raw fetch 사용 (apiClient 재귀 차단)
 * - fire-and-forget + 500ms timeout
 * - 실패해도 앱 흐름에 영향 없음 (swallow)
 * - 민감정보 자동 redaction
 */

const TRACE_ID_KEY = 'qch_trace_id';

export type QchLogType = 'ERROR' | 'WARN' | 'INFO' | 'EVENT';

export type QchActionType =
  | 'CLICK'
  | 'INPUT'
  | 'NAVIGATE'
  | 'PAGE_VIEW'
  | 'FORM_SUBMIT'
  | 'USER_INTERACTION'
  | 'JS_ERROR'
  | 'AUTO';

export interface QchApiLogEvent {
  component: string;
  logType: QchLogType;
  code: string;
  message: string;
  isUserAction?: boolean;
  intent?: string;
  actionType?: QchActionType;
  actionId?: string;
  clientCallId: string;
  userId?: string;
  raw?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

// ============================================================
// ID 생성
// ============================================================

export function createClientCallId(): string {
  return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function getOrCreateTraceId(): string {
  try {
    const found = sessionStorage.getItem(TRACE_ID_KEY);
    if (found) return found;
    const next = `sess-${createClientCallId()}`;
    sessionStorage.setItem(TRACE_ID_KEY, next);
    return next;
  } catch {
    return `sess-${createClientCallId()}`;
  }
}

// ============================================================
// QCH 헤더 빌더 (backend API 호출 시 첨부용)
// ============================================================

export function buildQchRequestHeaders(clientCallId: string, actionId = ''): Record<string, string> {
  return {
    'X-QCH-Trace-Id': getOrCreateTraceId(),
    'X-QCH-Action-Id': actionId,
    'X-QCH-Client-Call-Id': clientCallId,
  };
}

// ============================================================
// 민감정보 redaction
// ============================================================

const REDACT_KEYS = ['authorization', 'cookie', 'password', 'token', 'secret'];

function redact(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const key = k.toLowerCase();
    if (REDACT_KEYS.some((r) => key.includes(r))) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = redact(v);
    }
  }
  return out;
}

// ============================================================
// 로그 적재 (fire-and-forget)
// ============================================================

export function logApiEvent(event: QchApiLogEvent): void {
  const baseUrl = import.meta.env.VITE_QCH_BASE_URL as string | undefined;
  const serviceKey = import.meta.env.VITE_QCH_SERVICE_KEY as string | undefined;
  const env = import.meta.env.VITE_QCH_ENV as string | undefined;
  const enabled = import.meta.env.VITE_ENABLE_QCH_LOGGING === 'true';

  if (!enabled || !baseUrl || !serviceKey || !env) return;

  const traceId = getOrCreateTraceId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-QCH-Is-User-Action': String(event.isUserAction ?? false),
    'X-QCH-Trace-Id': traceId,
    'X-QCH-Action-Id': event.actionId ?? '',
    'X-QCH-Client-Call-Id': event.clientCallId,
    'X-QCH-User-Id': event.userId ?? '',
  };
  if (event.intent) headers['X-QCH-Intent'] = encodeURIComponent(event.intent);
  if (event.actionType) headers['X-QCH-Action-Type'] = event.actionType;

  const payload = {
    serviceKey,
    env,
    sourceType: 'BROWSER',
    component: event.component,
    logType: event.logType,
    code: event.code,
    message: event.message,
    isError: event.logType === 'ERROR',
    createdAt: new Date().toISOString(),
    raw: redact(event.raw ?? {}),
    extra: redact(event.extra ?? {}),
  };

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 500);

  void fetch(`${baseUrl}/api/v1/ingest/app-log`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
    .catch(() => undefined)
    .finally(() => window.clearTimeout(timer));
}
