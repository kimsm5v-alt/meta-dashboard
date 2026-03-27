/**
 * 관찰 메모 서비스
 */

import type {
  ObservationMemo,
  CreateObservationMemoInput,
  UpdateObservationMemoInput,
} from '@/shared/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Mock 모드 체크 (VITE_USE_MOCK_DATA=true 또는 VITE_USE_API=false 일 때 Mock 모드)
const isMockMode = () =>
  import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
  import.meta.env.VITE_USE_API === 'false';

// Mock 인메모리 스토어
let mockMemos: ObservationMemo[] = [];

export const memoService = {
  /**
   * 학생별 관찰 메모 조회
   */
  getByStudentId: async (studentId: string): Promise<ObservationMemo[]> => {
    if (isMockMode()) {
      return mockMemos.filter(m => m.studentId === studentId);
    }
    const response = await fetch(`${API_BASE}/api/memos/student/${studentId}`);
    if (!response.ok) throw new Error('Failed to fetch memos');
    return response.json();
  },

  /**
   * 관찰 메모 생성
   */
  create: async (input: CreateObservationMemoInput): Promise<ObservationMemo> => {
    if (isMockMode()) {
      const newMemo: ObservationMemo = {
        ...input,
        id: `memo-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockMemos.push(newMemo);
      return newMemo;
    }
    const response = await fetch(`${API_BASE}/api/memos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to create memo');
    return response.json();
  },

  /**
   * 관찰 메모 수정
   */
  update: async (id: string, input: UpdateObservationMemoInput): Promise<ObservationMemo> => {
    if (isMockMode()) {
      const index = mockMemos.findIndex(m => m.id === id);
      if (index === -1) throw new Error('Memo not found');
      mockMemos[index] = { ...mockMemos[index], ...input, updatedAt: new Date() };
      return mockMemos[index];
    }
    const response = await fetch(`${API_BASE}/api/memos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to update memo');
    return response.json();
  },

  /**
   * 관찰 메모 삭제
   */
  delete: async (id: string): Promise<void> => {
    if (isMockMode()) {
      mockMemos = mockMemos.filter(m => m.id !== id);
      return;
    }
    const response = await fetch(`${API_BASE}/api/memos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete memo');
  },

  /**
   * 중요 표시 토글
   */
  toggleImportant: async (id: string, isImportant: boolean): Promise<ObservationMemo> => {
    if (isMockMode()) {
      const index = mockMemos.findIndex(m => m.id === id);
      if (index === -1) throw new Error('Memo not found');
      mockMemos[index] = { ...mockMemos[index], isImportant, updatedAt: new Date() };
      return mockMemos[index];
    }
    const response = await fetch(`${API_BASE}/api/memos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isImportant }),
    });
    if (!response.ok) throw new Error('Failed to toggle important');
    return response.json();
  },
};
