/**
 * AI 서비스 추상화 레이어
 *
 * 여러 AI Provider를 지원하는 통합 인터페이스
 * 현재 지원: Google Gemini (기본)
 *
 * 호출 흐름:
 * 컴포넌트 → callAI({ feature, messages }) → aiPrompts.ts에서 시스템 프롬프트 가져옴 → gemini.ts → API
 *
 * 기능별 프롬프트 (aiPrompts.ts에서 관리):
 * - analysis: 학생 분석 총평
 * - record: 생활기록부 생성
 * - assistant: AI 어시스턴트
 */

import { callGemini, isGeminiConfigured } from './gemini';
import { getSystemPrompt, type AIFeature } from '../data/aiPrompts';

// ============================================================
// 타입 정의
// ============================================================

export type AIProvider = 'gemini' | 'mock';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  feature?: AIFeature; // 기능별 프롬프트 자동 적용
}

export interface AIResponse {
  success: boolean;
  content: string;
  error?: string;
}

// ============================================================
// 메인 AI 호출 함수
// ============================================================

/**
 * AI API 호출
 *
 * @param request.feature - 기능 타입을 지정하면 해당 시스템 프롬프트가 자동 적용됨
 *                          'analysis' | 'record' | 'assistant'
 *
 * @example
 * // 기능 프롬프트 자동 적용
 * callAI({ feature: 'analysis', messages: [{ role: 'user', content: '...' }] })
 *
 * // 커스텀 시스템 프롬프트 직접 전달
 * callAI({ messages: [{ role: 'system', content: '...' }, { role: 'user', content: '...' }] })
 */
export const callAI = async (request: AIRequest): Promise<AIResponse> => {
  const provider = getProvider();

  // 기능별 시스템 프롬프트 적용
  const messages = applyFeaturePrompt(request.messages, request.feature);

  const processedRequest = { ...request, messages };

  if (provider === 'gemini') {
    return callGeminiProvider(processedRequest);
  }

  return mockResponse();
};

/**
 * 기능별 AI 호출 (간편 함수)
 *
 * @example
 * callAIWithFeature('analysis', '학생 검사 결과: ...')
 */
export const callAIWithFeature = async (
  feature: AIFeature,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<AIResponse> => {
  return callAI({
    messages: [{ role: 'user', content: userMessage }],
    feature,
    ...options,
  });
};

// ============================================================
// 내부 함수
// ============================================================

/**
 * 현재 AI Provider 결정
 */
const getProvider = (): AIProvider => {
  return isGeminiConfigured() ? 'gemini' : 'mock';
};

/**
 * 기능별 시스템 프롬프트를 메시지 배열에 적용
 */
const applyFeaturePrompt = (
  messages: AIMessage[],
  feature?: AIFeature
): AIMessage[] => {
  if (!feature) return messages;

  const systemPrompt = getSystemPrompt(feature);
  if (!systemPrompt) return messages;

  const result = [...messages];
  const existingSystemIndex = result.findIndex(m => m.role === 'system');

  if (existingSystemIndex >= 0) {
    // 기존 system 메시지가 있으면 프롬프트를 앞에 합침
    result[existingSystemIndex] = {
      role: 'system',
      content: `${systemPrompt}\n\n${result[existingSystemIndex].content}`,
    };
  } else {
    // system 메시지가 없으면 새로 추가
    result.unshift({ role: 'system', content: systemPrompt });
  }

  return result;
};

/**
 * Gemini Provider 호출
 */
const callGeminiProvider = async (request: AIRequest): Promise<AIResponse> => {
  const response = await callGemini({
    messages: request.messages,
    maxTokens: request.maxTokens,
    temperature: request.temperature,
  });

  return {
    success: response.success,
    content: response.content,
    error: response.error,
  };
};

/**
 * Mock 응답 (API 미설정 시)
 */
const mockResponse = async (): Promise<AIResponse> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    success: true,
    content:
      '이 학생은 대인관계능력과 학습기술이 우수하여 또래와 원만한 관계를 유지하며 효율적으로 학습하고 있습니다. ' +
      '다만 학업스트레스가 높고 학업소진 경향이 있어 정서적 지원이 필요한 상태입니다. ' +
      '적절한 휴식을 권장하고, 작은 성취에 대해 격려해주는 피드백을 제공해보세요.',
  };
};

// ============================================================
// 상태 확인
// ============================================================

/**
 * AI 서비스 상태 반환
 */
export const getAIStatus = () => {
  const provider = getProvider();
  return {
    provider,
    isConfigured: provider !== 'mock',
    isMock: provider === 'mock',
  };
};

export { type AIFeature } from '../data/aiPrompts';

export default {
  callAI,
  callAIWithFeature,
  getAIStatus,
};
