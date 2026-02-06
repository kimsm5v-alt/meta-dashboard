/**
 * AI Room 어시스턴트 서비스
 *
 * AI Room에서 교사의 질문에 AI가 응답하는 서비스입니다.
 * RAG 컨텍스트와 PII 마스킹을 적용하여 안전하고 맥락 있는 응답을 생성합니다.
 */

import { callAI, type AIMessage } from '@/shared/services/ai';
import { buildAssistantPrompt } from '@/shared/data/aiPrompts';
import {
  buildRAGContext,
  restoreNames,
  applyAliases,
} from './contextBuilder';
import type { ChatMessage, ContextMode, StudentAliasMap } from '../types';
import type { Class, Student } from '@/shared/types';

// ============================================================
// 타입 정의
// ============================================================

export interface AssistantRequest {
  mode: ContextMode;
  classes: Class[];
  selectedClass: Class | null;
  selectedStudents: Student[];
  messages: ChatMessage[];
  userMessage: string;
}

export interface AssistantResponse {
  success: boolean;
  content: string;
  error?: string;
  aliasMap: StudentAliasMap;
}

// ============================================================
// 메인 서비스 함수
// ============================================================

/**
 * AI 어시스턴트 호출
 *
 * 처리 흐름:
 * 1. 별칭 맵 생성 (학생 이름 → student_A)
 * 2. RAG 컨텍스트 생성 (T_SCRIPT 기반)
 * 3. 시스템 프롬프트에 컨텍스트 주입
 * 4. 대화 히스토리 마스킹
 * 5. AI 호출
 * 6. 응답에서 별칭 → 이름 복원
 */
export const callAssistant = async (
  request: AssistantRequest
): Promise<AssistantResponse> => {
  const {
    mode,
    classes,
    selectedClass,
    selectedStudents,
    messages,
    userMessage,
  } = request;

  try {
    // 1. RAG 컨텍스트 생성 (별칭 맵도 함께 반환)
    const { context: ragContext, aliasMap } = buildRAGContext({
      mode,
      classes,
      selectedClass,
      selectedStudents,
    });

    // 2. 시스템 프롬프트 생성 (RAG 컨텍스트 주입)
    const systemPrompt = buildAssistantPrompt(ragContext);

    // 3. 대화 히스토리 변환 (이름 → 별칭 마스킹)
    const maskedHistory = messages
      .filter((msg) => msg.id !== '1') // 초기 안내 메시지 제외
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: applyAliases(msg.content, aliasMap),
      }));

    // 4. 현재 사용자 메시지 마스킹
    const maskedUserMessage = applyAliases(userMessage, aliasMap);

    // 5. AI 메시지 배열 구성
    const aiMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...maskedHistory,
      { role: 'user', content: maskedUserMessage },
    ];

    // 6. AI 호출 (AI Room은 이미 별칭 처리했으므로 PII 마스킹 비활성화)
    const response = await callAI({
      messages: aiMessages,
      maxTokens: 2048,
      temperature: 0.7,
      maskPII: false,
    });

    // 7. 응답에서 별칭 → 이름 복원
    const restoredContent = restoreNames(response.content, aliasMap);

    return {
      success: response.success,
      content: response.success ? restoredContent : response.content,
      error: response.error,
      aliasMap,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return {
      success: false,
      content: '',
      error: `AI 응답 생성 중 오류가 발생했습니다: ${errorMessage}`,
      aliasMap: {},
    };
  }
};

/**
 * 스트리밍 응답용 (향후 구현)
 */
export const callAssistantStream = async (
  request: AssistantRequest,
  _onChunk: (chunk: string) => void
): Promise<AssistantResponse> => {
  // TODO: 스트리밍 지원 시 구현
  // 현재는 일반 호출 사용
  return callAssistant(request);
};

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 빠른 프롬프트 생성 (QuickPrompts 컴포넌트용)
 */
export const getQuickPromptContext = (
  mode: ContextMode,
  selectedStudentCount: number
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
            { label: '생기부 문구', prompt: '이 학생의 생활기록부에 쓸 수 있는 문구를 작성해주세요.' },
            { label: '가정 연계', prompt: '가정에서 할 수 있는 지원 방법을 알려주세요.' },
          ],
        };
      } else {
        return {
          category: '다중 분석',
          prompts: [
            { label: '관계성 분석', prompt: '선택한 학생들의 관계성을 분석해주세요.' },
            { label: '결과 비교', prompt: '선택한 학생들의 검사 결과를 비교해주세요.' },
            { label: '그룹 상담', prompt: '선택한 학생들을 위한 그룹 상담 방법을 제안해주세요.' },
            { label: '모둠 구성', prompt: '선택한 학생들로 효과적인 모둠을 구성해주세요.' },
          ],
        };
      }

    default:
      return { category: '', prompts: [] };
  }
};

export default {
  callAssistant,
  callAssistantStream,
  getQuickPromptContext,
};
