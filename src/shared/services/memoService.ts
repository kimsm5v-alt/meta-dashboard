/**
 * 관찰 메모 서비스
 *
 * API 연동 준비 형태로 구현
 * 현재는 mock 사용, 나중에 실제 API로 교체 가능
 */

import type {
  ObservationMemo,
  CreateObservationMemoInput,
  UpdateObservationMemoInput,
} from '@/shared/types';
import { mockMemoService } from '@/shared/data/mockStudentRecords';

// API 베이스 URL (환경변수에서 설정)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// API 사용 여부 (환경변수로 제어)
const USE_API = import.meta.env.VITE_USE_API === 'true';

export const memoService = {
  /**
   * 학생별 관찰 메모 조회
   */
  getByStudentId: async (studentId: string): Promise<ObservationMemo[]> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/memos/student/${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch memos');
      return response.json();
    }
    return mockMemoService.getByStudentId(studentId);
  },

  /**
   * 관찰 메모 생성
   */
  create: async (input: CreateObservationMemoInput): Promise<ObservationMemo> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/memos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to create memo');
      return response.json();
    }
    return mockMemoService.create({
      ...input,
      isImportant: input.isImportant ?? false,
    });
  },

  /**
   * 관찰 메모 수정
   */
  update: async (id: string, input: UpdateObservationMemoInput): Promise<ObservationMemo> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/memos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to update memo');
      return response.json();
    }
    return mockMemoService.update(id, input);
  },

  /**
   * 관찰 메모 삭제
   */
  delete: async (id: string): Promise<void> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/memos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete memo');
      return;
    }
    return mockMemoService.delete(id);
  },

  /**
   * 중요 표시 토글
   */
  toggleImportant: async (id: string, isImportant: boolean): Promise<ObservationMemo> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/memos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isImportant }),
      });
      if (!response.ok) throw new Error('Failed to toggle important');
      return response.json();
    }
    return mockMemoService.update(id, { isImportant });
  },
};
