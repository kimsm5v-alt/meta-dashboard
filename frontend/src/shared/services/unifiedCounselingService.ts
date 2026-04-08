/**
 * 통합 상담 서비스
 *
 * 상담 일정(Schedule)과 학생 대시보드 상담 기록(CounselingRecord)을 통합 관리합니다.
 * 양방향 연동을 지원하여 어디서 등록/수정/삭제해도 모든 곳에 반영됩니다.
 */

import { apiClient } from '@shared/api';
import type {
  UnifiedCounselingRecord,
  CreateUnifiedCounselingInput,
  UpdateUnifiedCounselingInput,
  CompleteUnifiedCounselingInput,
  CounselingStatus,
} from '@shared/types';

export const unifiedCounselingService = {
  /**
   * 모든 상담 기록 조회 (상담 일정 페이지용)
   */
  getAll: async (): Promise<UnifiedCounselingRecord[]> => {
    const response = await apiClient.get<UnifiedCounselingRecord[]>('/unified-counseling');
    return response.resultData;
  },

  /**
   * 학생별 상담 기록 조회 (학생 대시보드용)
   * @param studentId 학생 ID (class-6-2-student-01 또는 2-3-01 형식 모두 지원)
   */
  getByStudentId: async (studentId: string): Promise<UnifiedCounselingRecord[]> => {
    const response = await apiClient.get<UnifiedCounselingRecord[]>(
      `/unified-counseling/student/${studentId}`,
    );
    return response.resultData;
  },

  /**
   * 학급별 상담 기록 조회
   */
  getByClassId: async (classId: string): Promise<UnifiedCounselingRecord[]> => {
    const response = await apiClient.get<UnifiedCounselingRecord[]>(
      `/unified-counseling/class/${classId}`,
    );
    return response.resultData;
  },

  /**
   * 상태별 상담 기록 조회
   */
  getByStatus: async (status: CounselingStatus): Promise<UnifiedCounselingRecord[]> => {
    const response = await apiClient.get<UnifiedCounselingRecord[]>(
      `/unified-counseling/status/${status}`,
    );
    return response.resultData;
  },

  /**
   * 단일 상담 기록 조회
   */
  getById: async (id: string): Promise<UnifiedCounselingRecord | null> => {
    try {
      const response = await apiClient.get<UnifiedCounselingRecord>(
        `/unified-counseling/${id}`,
      );
      return response.resultData;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) return null;
      throw error;
    }
  },

  /**
   * 상담 기록 생성
   */
  create: async (input: CreateUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    const response = await apiClient.post<UnifiedCounselingRecord>('/unified-counseling', input);
    return response.resultData;
  },

  /**
   * 상담 기록 수정
   */
  update: async (
    id: string,
    input: UpdateUnifiedCounselingInput,
  ): Promise<UnifiedCounselingRecord> => {
    const response = await apiClient.put<UnifiedCounselingRecord>(
      `/unified-counseling/${id}`,
      input,
    );
    return response.resultData;
  },

  /**
   * 예정 상담을 완료 처리
   */
  complete: async (
    id: string,
    data: CompleteUnifiedCounselingInput,
  ): Promise<UnifiedCounselingRecord> => {
    const response = await apiClient.post<UnifiedCounselingRecord>(
      `/unified-counseling/${id}/complete`,
      data,
    );
    return response.resultData;
  },

  /**
   * 상담 취소
   */
  cancel: async (id: string): Promise<void> => {
    await apiClient.post(`/unified-counseling/${id}/cancel`);
  },

  /**
   * 상담 기록 삭제
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/unified-counseling/${id}`);
  },
};
