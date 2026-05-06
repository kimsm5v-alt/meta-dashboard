/**
 * AI Room 어시스턴트 서비스
 *
 * META AI 에이전트 API (https://t-meta-agent-api.vsaidt.com)에 연결합니다.
 *
 * 처리 흐름:
 * 1. 별칭 맵 생성 (학생 이름 → student_A)  — PII 보호
 * 2. RAG 컨텍스트 생성 (이미 별칭 처리된 데이터 포함)
 * 3. 사용자 메시지 별칭 처리
 * 4. 에이전트 API 호출 (session_id = 대화 ID, context_data = RAG 컨텍스트)
 * 5. 응답에서 별칭 → 이름 복원
 *
 * 세션 관리: 에이전트가 session_id 기반으로 서버 측에서 대화 히스토리를 유지합니다.
 */

import { buildRAGContext, applyAliases, restoreNames } from './contextBuilder';
import { agentChat, agentChatStream } from './agentApiService';
import type { ChatMessage, ContextMode, StudentAliasMap } from '../types';
import type { Class, Student } from '@shared/types';

// ============================================================
// 타입 정의
// ============================================================

export interface AssistantRequest {
  sessionId: string;
  mode: ContextMode;
  classes: Class[];
  selectedClass: Class | null;
  selectedStudents: Student[];
  /** 대화 히스토리 — 에이전트 초기화 시 컨텍스트로만 참조 (서버가 히스토리 관리) */
  messages: ChatMessage[];
  userMessage: string;
  /**
   * 사전 빌드된 RAG 컨텍스트 — 제공 시 buildRAGContext를 건너뜁니다.
   * useConversations에서 세션당 한 번만 빌드하여 캐싱합니다.
   */
  cachedContext?: { ragContext: string; aliasMap: StudentAliasMap } | null;
}

export interface AssistantResponse {
  success: boolean;
  content: string;
  error?: string;
  aliasMap: StudentAliasMap;
  /** 이번 호출에서 빌드된 RAG 컨텍스트 — 캐시가 없었을 때만 값이 있음 */
  builtContext?: { ragContext: string; aliasMap: StudentAliasMap };
}

// ============================================================
// 메인 서비스 함수
// ============================================================

/**
 * AI 어시스턴트 호출 (일반 응답)
 */
export const callAssistant = async (request: AssistantRequest): Promise<AssistantResponse> => {
  const { sessionId, mode, classes, selectedClass, selectedStudents, userMessage, cachedContext } =
    request;

  try {
    // 1. RAG 컨텍스트 — 캐시가 있으면 재사용, 없으면 빌드 (API 호출 발생)
    const { context: ragContext, aliasMap } = cachedContext
      ? { context: cachedContext.ragContext, aliasMap: cachedContext.aliasMap }
      : await buildRAGContext({ mode, classes, selectedClass, selectedStudents });

    // 2. 사용자 메시지 별칭 처리
    const maskedUserMessage = applyAliases(userMessage, aliasMap);

    // 3. context_data — 첫 메시지(캐시 없음)일 때만 context 포함, 이후엔 null
    const contextData: Record<string, unknown> | null = cachedContext
      ? null
      : { mode, context: ragContext };

    // 4. 에이전트 API 호출
    const agentResponse = await agentChat(maskedUserMessage, sessionId, contextData);

    // 5. 응답에서 별칭 → 이름 복원
    const restoredContent = restoreNames(agentResponse.response, aliasMap);

    return {
      success: true,
      content: restoredContent,
      aliasMap,
      builtContext: cachedContext ? undefined : { ragContext, aliasMap },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return {
      success: false,
      content: '',
      error: `AI 응답 생성 중 오류가 발생했습니다: ${msg}`,
      aliasMap: {},
    };
  }
};

/**
 * AI 어시스턴트 호출 (스트리밍 응답)
 *
 * @param onChunk 청크를 받을 때마다 호출 — (accumulated, isFinal)
 */
export const callAssistantStream = async (
  request: AssistantRequest,
  onChunk: (accumulated: string, isFinal: boolean) => void,
): Promise<AssistantResponse> => {
  const {
    sessionId,
    mode,
    classes,
    selectedClass,
    selectedStudents,
    userMessage,
    cachedContext,
  } = request;

  try {
    // 1. RAG 컨텍스트 — 캐시가 있으면 재사용, 없으면 빌드 (API 호출 발생)
    const { context: ragContext, aliasMap } = cachedContext
      ? { context: cachedContext.ragContext, aliasMap: cachedContext.aliasMap }
      : await buildRAGContext({ mode, classes, selectedClass, selectedStudents });

    // 2. 사용자 메시지 별칭 처리
    const maskedUserMessage = applyAliases(userMessage, aliasMap);

    // 3. context_data — 첫 메시지(캐시 없음)일 때만 context 포함, 이후엔 null
    const contextData: Record<string, unknown> | null = cachedContext
      ? null
      : { mode, context: ragContext };

    // 4. 스트리밍 호출 — 누적하며 별칭 복원 후 콜백
    let accumulated = '';

    await agentChatStream(
      maskedUserMessage,
      sessionId,
      (chunk, isFinal) => {
        accumulated += chunk;
        const restored = restoreNames(accumulated, aliasMap);
        onChunk(restored, isFinal);
      },
      contextData,
    );

    const finalContent = restoreNames(accumulated, aliasMap);
    return {
      success: true,
      content: finalContent,
      aliasMap,
      builtContext: cachedContext ? undefined : { ragContext, aliasMap },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    const errorMsg = `AI 응답 생성 중 오류가 발생했습니다: ${msg}`;
    onChunk(errorMsg, true);
    return { success: false, content: '', error: errorMsg, aliasMap: {} };
  }
};

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 빠른 프롬프트 목록 (QuickPrompts 컴포넌트용)
 */
export const getQuickPromptContext = (
  mode: ContextMode,
  selectedStudentCount: number,
): { category: string; prompts: { label: string; prompt: string }[] } => {
  switch (mode) {
    case 'all':
      return {
        category: '전체 분석',
        prompts: [
          { label: '전체 현황', prompt: '현재 담당하는 학급들의 전체 현황을 분석해주세요.' },
          { label: '관심 학생', prompt: '관심이 필요한 학생들을 알려주세요.' },
          { label: '반별 비교', prompt: '반별 특성을 비교 분석해주세요.' },
          { label: '변화 추이', prompt: '1차와 2차 검사 결과의 변화 추이를 분석해주세요.' },
        ],
      };

    case 'class':
      return {
        category: '반 분석',
        prompts: [
          { label: '반 분석', prompt: '이 반의 전체적인 특성을 분석해주세요.' },
          { label: '유형 분포', prompt: '이 반의 학습유형 분포와 그 의미를 설명해주세요.' },
          { label: '좌석 배치', prompt: '학습유형을 고려한 좌석 배치를 추천해주세요.' },
          { label: '또래 매칭', prompt: '서로 도움이 될 수 있는 또래 짝을 추천해주세요.' },
        ],
      };

    case 'student':
      if (selectedStudentCount === 1) {
        return {
          category: '개별 분석',
          prompts: [
            { label: '결과 요약', prompt: '이 학생의 검사 결과를 요약해주세요.' },
            { label: '상담 기법', prompt: '이 학생에게 적합한 상담 기법을 알려주세요.' },
            {
              label: '생기부 문구',
              prompt: '이 학생의 생활기록부에 쓸 수 있는 문구를 작성해주세요.',
            },
            { label: '가정 연계', prompt: '가정에서 할 수 있는 지원 방법을 알려주세요.' },
          ],
        };
      }
      return {
        category: '다중 분석',
        prompts: [
          { label: '관계성 분석', prompt: '선택한 학생들의 관계성을 분석해주세요.' },
          { label: '결과 비교', prompt: '선택한 학생들의 검사 결과를 비교해주세요.' },
          { label: '그룹 상담', prompt: '선택한 학생들을 위한 그룹 상담 방법을 제안해주세요.' },
          { label: '모둠 구성', prompt: '선택한 학생들로 효과적인 모둠을 구성해주세요.' },
        ],
      };

    default:
      return { category: '', prompts: [] };
  }
};

export default { callAssistant, callAssistantStream, getQuickPromptContext };
