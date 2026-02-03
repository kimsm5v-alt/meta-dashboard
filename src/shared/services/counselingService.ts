/**
 * 상담 기록 서비스
 *
 * API 연동 준비 형태로 구현
 * 현재는 mock 사용, 나중에 실제 API로 교체 가능
 */

import type {
  CounselingRecord,
  CreateCounselingRecordInput,
  UpdateCounselingRecordInput,
} from '@/shared/types';
import { mockCounselingService } from '@/shared/data/mockStudentRecords';

// API 베이스 URL (환경변수에서 설정)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// API 사용 여부 (환경변수로 제어)
const USE_API = import.meta.env.VITE_USE_API === 'true';

export const counselingService = {
  /**
   * 학생별 상담 기록 조회
   */
  getByStudentId: async (studentId: string): Promise<CounselingRecord[]> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/counseling/student/${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch counseling records');
      return response.json();
    }
    return mockCounselingService.getByStudentId(studentId);
  },

  /**
   * 상담 기록 상세 조회
   */
  getById: async (id: string): Promise<CounselingRecord | null> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/counseling/${id}`);
      if (!response.ok) return null;
      return response.json();
    }
    return mockCounselingService.getById(id);
  },

  /**
   * 상담 기록 생성
   */
  create: async (input: CreateCounselingRecordInput): Promise<CounselingRecord> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/counseling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to create counseling record');
      return response.json();
    }
    return mockCounselingService.create(input);
  },

  /**
   * 상담 기록 수정
   */
  update: async (id: string, input: UpdateCounselingRecordInput): Promise<CounselingRecord> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/counseling/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to update counseling record');
      return response.json();
    }
    return mockCounselingService.update(id, input);
  },

  /**
   * 상담 기록 삭제
   */
  delete: async (id: string): Promise<void> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/counseling/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete counseling record');
      return;
    }
    return mockCounselingService.delete(id);
  },
};
