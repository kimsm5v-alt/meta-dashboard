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

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const unifiedCounselingService = {
  /**
   * 모든 상담 기록 조회 (상담 일정 페이지용)
   */
  getAll: async (): Promise<UnifiedCounselingRecord[]> => {
    const response = await fetch(`${API_BASE}/api/counseling`);
    if (!response.ok) throw new Error('Failed to fetch records');
    return response.json();
  },

  /**
   * 학생별 상담 기록 조회 (학생 대시보드용)
   * @param studentId 학생 ID (class-6-2-student-01 또는 2-3-01 형식 모두 지원)
   */
  getByStudentId: async (studentId: string): Promise<UnifiedCounselingRecord[]> => {
    const response = await fetch(`${API_BASE}/api/counseling/student/${studentId}`);
    if (!response.ok) throw new Error('Failed to fetch records');
    return response.json();
  },

  /**
   * 학급별 상담 기록 조회
   */
  getByClassId: async (classId: string): Promise<UnifiedCounselingRecord[]> => {
    const response = await fetch(`${API_BASE}/api/counseling/class/${classId}`);
    if (!response.ok) throw new Error('Failed to fetch records');
    return response.json();
  },

  /**
   * 상태별 상담 기록 조회
   */
  getByStatus: async (status: CounselingStatus): Promise<UnifiedCounselingRecord[]> => {
    const response = await fetch(`${API_BASE}/api/counseling/status/${status}`);
    if (!response.ok) throw new Error('Failed to fetch records');
    return response.json();
  },

  /**
   * 단일 상담 기록 조회
   */
  getById: async (id: string): Promise<UnifiedCounselingRecord | null> => {
    const response = await fetch(`${API_BASE}/api/counseling/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch record');
    }
    return response.json();
  },

  /**
   * 상담 기록 생성
   */
  create: async (input: CreateUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    const response = await fetch(`${API_BASE}/api/counseling`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to create record');
    return response.json();
  },

  /**
   * 상담 기록 수정
   */
  update: async (id: string, input: UpdateUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    const response = await fetch(`${API_BASE}/api/counseling/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to update record');
    return response.json();
  },

  /**
   * 예정 상담을 완료 처리
   */
  complete: async (id: string, data: CompleteUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    const response = await fetch(`${API_BASE}/api/counseling/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to complete record');
    return response.json();
  },

  /**
   * 상담 취소
   */
  cancel: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/counseling/${id}/cancel`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to cancel record');
  },

  /**
   * 상담 기록 삭제
   */
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/counseling/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete record');
  },
};
