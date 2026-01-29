/**
 * AI 서비스 추상화 레이어
 * 
 * 📌 현재 상태: API 미정, 구조만 정의
 * 
 * 나중에 API 결정되면 callAI() 함수만 수정하면 됨
 * - Claude API (Anthropic)
 * - GPT API (OpenAI)
 * - 자체 백엔드 API
 * - Azure OpenAI
 * - etc.
 */

// ============================================================
// 타입 정의
// ============================================================

export interface AIConfig {
  provider: 'anthropic' | 'openai' | 'custom' | 'none';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  success: boolean;
  content: string;
  error?: string;
}

// ============================================================
// 설정 (TODO: 환경변수 또는 설정 파일에서 로드)
// ============================================================

const AI_CONFIG: AIConfig = {
  provider: 'none', // TODO: 나중에 변경
  // apiKey: process.env.AI_API_KEY,
  // baseUrl: 'https://api.anthropic.com',
  // model: 'claude-3-sonnet-20240229',
};

// ============================================================
// 메인 AI 호출 함수
// ============================================================

/**
 * AI API 호출
 * 
 * TODO: 실제 API 연동 시 이 함수만 수정
 */
export const callAI = async (request: AIRequest): Promise<AIResponse> => {
  const { provider } = AI_CONFIG;
  
  switch (provider) {
    case 'anthropic':
      return callAnthropic(request);
    case 'openai':
      return callOpenAI(request);
    case 'custom':
      return callCustomAPI(request);
    case 'none':
    default:
      return mockResponse(request);
  }
};

// ============================================================
// Provider별 구현 (TODO)
// ============================================================

/**
 * Anthropic Claude API
 */
const callAnthropic = async (request: AIRequest): Promise<AIResponse> => {
  // TODO: 실제 구현
  // const response = await fetch('https://api.anthropic.com/v1/messages', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'x-api-key': AI_CONFIG.apiKey!,
  //     'anthropic-version': '2023-06-01',
  //   },
  //   body: JSON.stringify({
  //     model: AI_CONFIG.model || 'claude-3-sonnet-20240229',
  //     max_tokens: request.maxTokens || 1024,
  //     messages: request.messages.filter(m => m.role !== 'system'),
  //     system: request.messages.find(m => m.role === 'system')?.content,
  //   }),
  // });
  // const data = await response.json();
  // return { success: true, content: data.content[0].text };
  
  console.log('[AI] Anthropic API 호출 (TODO)');
  return mockResponse(request);
};

/**
 * OpenAI GPT API
 */
const callOpenAI = async (request: AIRequest): Promise<AIResponse> => {
  // TODO: 실제 구현
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
  //   },
  //   body: JSON.stringify({
  //     model: AI_CONFIG.model || 'gpt-4',
  //     max_tokens: request.maxTokens || 1024,
  //     messages: request.messages,
  //   }),
  // });
  // const data = await response.json();
  // return { success: true, content: data.choices[0].message.content };
  
  console.log('[AI] OpenAI API 호출 (TODO)');
  return mockResponse(request);
};

/**
 * 자체 백엔드 API
 */
const callCustomAPI = async (request: AIRequest): Promise<AIResponse> => {
  // TODO: 백엔드 API 엔드포인트로 호출
  // const response = await fetch(`${AI_CONFIG.baseUrl}/api/ai/chat`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request),
  // });
  // return response.json();
  
  console.log('[AI] Custom API 호출 (TODO)');
  return mockResponse(request);
};

/**
 * 목업 응답 (개발용)
 */
const mockResponse = async (request: AIRequest): Promise<AIResponse> => {
  // 개발 중 테스트용 목업 응답
  await new Promise(resolve => setTimeout(resolve, 500)); // 지연 시뮬레이션
  
  return {
    success: true,
    content: '이 학생은 전반적으로 학습에 대한 열의가 있으나, ' +
      '메타인지와 학습기술 영역에서 보완이 필요합니다. ' +
      '특히 학업소진 수준이 높아 적절한 휴식과 스트레스 관리가 권장됩니다.',
  };
};

export default {
  callAI,
  config: AI_CONFIG,
};
