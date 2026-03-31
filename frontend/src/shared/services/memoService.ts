/**
 * 관찰 메모 서비스
 */

import type {
  ObservationMemo,
  CreateObservationMemoInput,
  UpdateObservationMemoInput,
} from '@shared/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const memoService = {
  /**
   * 학생별 관찰 메모 조회
   */
  getByStudentId: async (studentId: string): Promise<ObservationMemo[]> => {
    const response = await fetch(`${API_BASE}/api/memos/student/${studentId}`);
    if (!response.ok) throw new Error('Failed to fetch memos');
    return response.json();
  },

  /**
   * 관찰 메모 생성
   */
  create: async (input: CreateObservationMemoInput): Promise<ObservationMemo> => {
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
    const response = await fetch(`${API_BASE}/api/memos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete memo');
  },

  /**
   * 중요 표시 토글
   */
  toggleImportant: async (id: string, isImportant: boolean): Promise<ObservationMemo> => {
    const response = await fetch(`${API_BASE}/api/memos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isImportant }),
    });
    if (!response.ok) throw new Error('Failed to toggle important');
    return response.json();
  },
};
