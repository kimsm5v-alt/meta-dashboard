/**
 * Google Gemini API 서비스
 *
 * Gemini 2.0 Flash 모델을 사용한 AI 호출 서비스
 *
 * 주요 기능:
 * - 429 에러 시 자동 재시도 (최대 3회, 지수 백오프)
 * - PII 자동 마스킹 (학생 개인정보 보호)
 * - contents 배열 방식으로 시스템 프롬프트 전달
 *
 * 호출 흐름:
 * ai.ts → callGemini() → Gemini API → 응답 파싱
 */

import { maskPII } from '../utils/piiMasking';

// ============================================================
// 타입 정의
// ============================================================

export interface GeminiConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiRequest {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
  temperature?: number;
}

export interface GeminiResponse {
  success: boolean;
  content: string;
  error?: string;
  errorCode?: number;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

// ============================================================
// 설정 (단일 관리)
// ============================================================

const getConfig = (): GeminiConfig => ({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
});

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 2000,
  maxDelayMs: 60000,
};

// ============================================================
// 내부 유틸리티
// ============================================================

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * 429 에러 응답에서 재시도 대기 시간 추출
 */
const extractRetryDelay = (errorData: unknown): number | null => {
  try {
    const data = errorData as {
      error?: { details?: Array<{ '@type'?: string; retryDelay?: string }> };
    };
    const retryInfo = data?.error?.details?.find(d =>
      d['@type']?.includes('RetryInfo')
    );
    if (retryInfo?.retryDelay) {
      return Math.ceil(parseFloat(retryInfo.retryDelay.replace('s', '')) * 1000);
    }
  } catch {
    // 파싱 실패 시 null 반환
  }
  return null;
};

/**
 * 메시지 형식 변환 (OpenAI/Anthropic → Gemini contents 배열)
 *
 * Gemini는 system role을 직접 지원하지 않으므로
 * system 메시지를 user/model 쌍으로 변환하여 전달
 */
const convertMessages = (
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  shouldMaskPII: boolean = true
): GeminiMessage[] => {
  const contents: GeminiMessage[] = [];

  for (const msg of messages) {
    const content = shouldMaskPII ? maskPII(msg.content) : msg.content;

    if (msg.role === 'system') {
      // system → user 메시지로 변환 + model 확인 응답 추가
      contents.push({
        role: 'user',
        parts: [{ text: `[시스템 지시사항]\n${content}` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: '네, 지시사항을 이해했습니다. 요청에 따라 답변하겠습니다.' }],
      });
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: content }],
      });
    }
  }

  return contents;
};

// ============================================================
// 메인 API 호출 함수
// ============================================================

/**
 * Gemini API 호출
 *
 * @param request - 요청 데이터 (messages, maxTokens, temperature)
 * @param options - 옵션 (maskPII: PII 마스킹 여부)
 * @returns 응답 (success, content, error)
 */
export const callGemini = async (
  request: GeminiRequest,
  options: { maskPII?: boolean; retryCount?: number } = { maskPII: true }
): Promise<GeminiResponse> => {
  const config = getConfig();
  const retryCount = options.retryCount || 0;

  // 1. API Key 검증
  if (!config.apiKey) {
    return {
      success: false,
      content: '',
      error: 'API Key가 설정되지 않았습니다. .env 파일을 확인하세요.',
    };
  }

  try {
    // 2. 요청 본문 구성
    const contents = convertMessages(request.messages, options.maskPII ?? true);
    const requestBody = {
      contents,
      generationConfig: {
        maxOutputTokens: request.maxTokens || 1024,
        temperature: request.temperature ?? 0.7,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    // 3. API 호출
    const url = `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    // 4. 에러 처리
    if (response.status === 429) {
      return handleRateLimitError(response, request, options, retryCount);
    }

    if (response.status === 404) {
      return {
        success: false,
        content: '',
        error: `모델을 찾을 수 없습니다: ${config.model}`,
        errorCode: 404,
      };
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    // 5. 응답 파싱
    const data = await response.json();

    // 안전 필터 등으로 응답이 차단된 경우
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const blockReason = data.promptFeedback?.blockReason
        || data.candidates?.[0]?.finishReason
        || 'Empty response';
      return {
        success: false,
        content: '',
        error: `응답이 생성되지 않았습니다: ${blockReason}`,
      };
    }

    return {
      success: true,
      content: text,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            candidatesTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      content: '',
      error: errorMessage,
    };
  }
};

/**
 * 429 Rate Limit 에러 처리 (지수 백오프 재시도)
 */
const handleRateLimitError = async (
  response: Response,
  request: GeminiRequest,
  options: { maskPII?: boolean; retryCount?: number },
  retryCount: number
): Promise<GeminiResponse> => {
  const errorData = await response.json();

  if (retryCount < RETRY_CONFIG.maxRetries) {
    const retryDelay = extractRetryDelay(errorData);
    const delay = retryDelay
      ? Math.min(retryDelay, RETRY_CONFIG.maxDelayMs)
      : Math.min(RETRY_CONFIG.baseDelayMs * Math.pow(2, retryCount), RETRY_CONFIG.maxDelayMs);

    await sleep(delay);

    return callGemini(request, { ...options, retryCount: retryCount + 1 });
  }

  return {
    success: false,
    content: '',
    error: '요청 한도 초과. 잠시 후 다시 시도해주세요.',
    errorCode: 429,
  };
};

// ============================================================
// 상태 확인 함수
// ============================================================

/**
 * Gemini API Key 설정 여부 확인
 */
export const isGeminiConfigured = (): boolean => {
  const config = getConfig();
  return Boolean(
    config.apiKey &&
      config.apiKey !== 'your_gemini_api_key_here' &&
      !config.apiKey.includes('여기에')
  );
};

/**
 * 현재 Gemini 모델 정보 반환
 */
export const getGeminiModelInfo = () => {
  const config = getConfig();
  return {
    model: config.model,
    baseUrl: config.baseUrl,
    isConfigured: isGeminiConfigured(),
  };
};

export default {
  callGemini,
  isGeminiConfigured,
  getGeminiModelInfo,
};
