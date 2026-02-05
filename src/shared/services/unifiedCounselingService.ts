/**
 * 통합 상담 서비스
 *
 * 상담 일정(Schedule)과 학생 대시보드 상담 기록(CounselingRecord)을 통합 관리합니다.
 * 양방향 연동을 지원하여 어디서 등록/수정/삭제해도 모든 곳에 반영됩니다.
 */

import type {
  UnifiedCounselingRecord,
  CreateUnifiedCounselingInput,
  UpdateUnifiedCounselingInput,
  CompleteUnifiedCounselingInput,
  CounselingStatus,
} from '@/shared/types';
import { mockUnifiedCounselingService } from '@/shared/data/mockUnifiedCounseling';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const USE_API = import.meta.env.VITE_USE_API === 'true';

export const unifiedCounselingService = {
  /**
   * 모든 상담 기록 조회 (상담 일정 페이지용)
   */
  getAll: async (): Promise<UnifiedCounselingRecord[]> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/unified-counseling`);
      if (!response.ok) throw new Error('Failed to fetch records');
      return response.json();
    }
    return mockUnifiedCounselingService.getAll();
  },

  /**
   * 학생별 상담 기록 조회 (학생 대시보드용)
   * @param studentId 학생 ID (class-6-2-student-01 또는 2-3-01 형식 모두 지원)
   */
  getByStudentId: async (studentId: string): Promise<UnifiedCounselingRecord[]> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/unified-counseling/student/${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch records');
      return response.json();
    }
    return mockUnifiedCounselingService.getByStudentId(studentId);
  },

  /**
   * 학급별 상담 기록 조회
   */
  getByClassId: async (classId: string): Promise<UnifiedCounselingRecord[]> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/unified-counseling/class/${classId}`);
      if (!response.ok) throw new Error('Failed to fetch records');
      return response.json();
    }
    return mockUnifiedCounselingService.getByClassId(classId);
  },

  /**
   * 상태별 상담 기록 조회
   */
  getByStatus: async (status: CounselingStatus): Promise<UnifiedCounselingRecord[]> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/unified-counseling/status/${status}`);
      if (!response.ok) throw new Error('Failed to fetch records');
      return response.json();
    }
    return mockUnifiedCounselingService.getByStatus(status);
  },

  /**
   * 단일 상담 기록 조회
   */
  getById: async (id: string): Promise<UnifiedCounselingRecord | null> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/unified-counseling/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch record');
      }
      return response.json();
    }
    return mockUnifiedCounselingService.getById(id);
  },

  /**
   * 상담 기록 생성
   */
  create: async (input: CreateUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/unified-counseling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to create record');
      return response.json();
    }
    return mockUnifiedCounselingService.create(input);
  },

  /**
   * 상담 기록 수정
   */
  update: async (id: string, input: UpdateUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/unified-counseling/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to update record');
      return response.json();
    }
    return mockUnifiedCounselingService.update(id, input);
  },

  /**
   * 예정 상담을 완료 처리
   */
  complete: async (id: string, data: CompleteUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/unified-counseling/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to complete record');
      return response.json();
    }
    return mockUnifiedCounselingService.complete(id, data);
  },

  /**
   * 상담 취소
   */
  cancel: async (id: string): Promise<void> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/unified-counseling/${id}/cancel`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to cancel record');
      return;
    }
    return mockUnifiedCounselingService.cancel(id);
  },

  /**
   * 상담 기록 삭제
   */
  delete: async (id: string): Promise<void> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/unified-counseling/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete record');
      return;
    }
    return mockUnifiedCounselingService.delete(id);
  },
};
