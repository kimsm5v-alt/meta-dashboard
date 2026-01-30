import type { Student, Class } from '@/shared/types';

// 컨텍스트 모드
export type ContextMode = 'all' | 'class' | 'student';

// 채팅 메시지
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
