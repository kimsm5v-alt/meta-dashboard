/**
 * 관찰 메모 서비스
 */

import { apiClient } from '@shared/api';
import type {
  ObservationMemo,
  CreateObservationMemoInput,
  UpdateObservationMemoInput,
} from '@shared/types';

export const memoService = {
  /**
   * 학생별 관찰 메모 조회
   */
  getByStudentId: async (studentId: string): Promise<ObservationMemo[]> => {
    const response = await apiClient.get<ObservationMemo[]>(`/api/memos/student/${studentId}`);
    return response.resultData;
  },

  /**
   * 관찰 메모 생성
   */
  create: async (input: CreateObservationMemoInput): Promise<ObservationMemo> => {
    const response = await apiClient.post<ObservationMemo>('/api/memos', input);
    return response.resultData;
  },

  /**
   * 관찰 메모 수정
   */
  update: async (id: string, input: UpdateObservationMemoInput): Promise<ObservationMemo> => {
    // 백엔드 MemoController 는 PATCH /api/memos/{id} (PUT 은 405). PATCH 사용.
    const response = await apiClient.patch<ObservationMemo>(`/api/memos/${id}`, input);
    return response.resultData;
  },

  /**
   * 관찰 메모 삭제
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/memos/${id}`);
  },

  /**
   * 중요 표시 토글
   */
  toggleImportant: async (id: string, isImportant: boolean): Promise<ObservationMemo> => {
    const response = await apiClient.patch<ObservationMemo>(`/api/memos/${id}`, { isImportant });
    return response.resultData;
  },
};
