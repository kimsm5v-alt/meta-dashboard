/**
 * AI 어시스턴트 공통 타입
 * @see FEATURES 복사본.md - D. 데이터 구조
 */

/** 챗봇/페이지 공통 메시지 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  /** 질문 대상 표기 (예: '6학년 1반 전체', '고우진') */
  targets?: string;
  /** 화면 캡처 첨부 여부 */
  hasCapture?: boolean;
  /** 참고용(AI 분석) 배지 노출 여부 */
  isReference?: boolean;
}

/** 봇 응답 (API 교체 시 이 형태만 유지하면 UI 수정 불필요) */
export interface BotResponse {
  content: string;
  isReference?: boolean;
}

/** 학생 */
export interface StudentItem {
  id: string;
  no: number;
  name: string;
  /** '' | '관심' */
  tag: '' | '관심';
}

/** 학급 */
export interface ClassItem {
  id: string;
  name: string;
  students: StudentItem[];
}

/** 추천 질문 */
export interface SuggestedQuestion {
  emoji: string;
  text: string;
}

/** 플로팅 챗봇 보기 모드 */
export type ChatbotViewMode = 'bubble' | 'inputbar' | 'corner' | 'fullscreen';

/** 어시스턴트 페이지 좌측 모드 */
export type AssistantMode = 'chat' | 'record';

/** 생활기록부 문구 유형 */
export type RecordToneType = '종합' | '강점 중심' | '행동·태도';

/** 대화 히스토리 항목 */
export interface Conversation {
  id: string;
  title: string;
  group: '오늘' | '지난 7일' | '이전';
  messages: ChatMessage[];
  /** 플로팅 챗봇에서 시작된 대화의 화면 라벨 (예: '결과보기') — 있으면 히스토리에 화면 배지 표시 */
  screen?: string;
}
