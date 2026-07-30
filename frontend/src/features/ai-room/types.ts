import type { Student, Class } from '@shared/types';

// 컨텍스트 모드
export type ContextMode = 'all' | 'class' | 'student';

// 채팅 메시지
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  /** 첨부된 스크린샷 캡처 이미지(data URI). 턴 한정이라 서버에는 저장되지 않는다. */
  images?: string[];
}

// AI 전송용 컨텍스트 데이터
export interface AllContextData {
  mode: 'all';
  classCount: number;
  totalStudents: number;
  typeDistribution: Record<string, number>;
}

export interface ClassContextData {
  mode: 'class';
  classId: string;
  grade: number;
  classNumber: number;
  studentCount: number;
  typeDistribution: Record<string, number>;
  averageTScores?: number[];
}

export interface StudentContextData {
  mode: 'student';
  students: {
    alias: string; // student_A, student_B, etc.
    type: string;
    tScores: number[];
    keywords: string[];
  }[];
}

export type AIContextData = AllContextData | ClassContextData | StudentContextData;

// 선택 상태
export interface SelectionState {
  mode: ContextMode;
  selectedClass: Class | null;
  selectedStudents: Student[];
}

// 학생 별칭 매핑 (이름 치환용)
export interface StudentAliasMap {
  [alias: string]: string; // { "student_A": "김민준", "student_B": "이서연" }
}

// 대화 기록
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  mode: ContextMode;
  contextLabel?: string;
}
