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
  CounselingRecord,
} from '@/shared/types';
import { apiRequest } from './apiClient';
import { mockCounselingRecords } from '@/shared/data/mockStudentRecords';

// Mock 모드 체크 (VITE_USE_MOCK_DATA=true 또는 VITE_USE_API=false 일 때 Mock 모드)
const isMockMode = () =>
  import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
  import.meta.env.VITE_USE_API === 'false';

// CounselingRecord → UnifiedCounselingRecord 변환
const toUnifiedRecord = (record: CounselingRecord): UnifiedCounselingRecord => ({
  id: record.id,
  students: [{ id: record.studentId, name: '' }], // name은 나중에 채워짐
  classId: record.classId,
  scheduledAt: record.scheduledAt,
  duration: record.duration,
  types: record.types as UnifiedCounselingRecord['types'],
  areas: record.areas,
  methods: record.methods,
  status: 'completed' as CounselingStatus,
  summary: record.summary,
  nextSteps: record.nextSteps,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

// Mock 인메모리 스토어
let mockRecords = mockCounselingRecords.map(toUnifiedRecord);

export const unifiedCounselingService = {
  /**
   * 모든 상담 기록 조회 (상담 일정 페이지용)
   */
  getAll: async (): Promise<UnifiedCounselingRecord[]> => {
    if (isMockMode()) {
      return mockRecords;
    }
    const response = await apiRequest<UnifiedCounselingRecord[]>('/api/counseling');
    return response.resultData;
  },

  /**
   * 학생별 상담 기록 조회 (학생 대시보드용)
   * @param studentId 학생 ID (class-6-2-student-01 또는 2-3-01 형식 모두 지원)
   */
  getByStudentId: async (studentId: string): Promise<UnifiedCounselingRecord[]> => {
    if (isMockMode()) {
      return mockRecords.filter(r => r.students.some(s => s.id === studentId));
    }
    const response = await apiRequest<UnifiedCounselingRecord[]>(`/api/counseling/student/${studentId}`);
    return response.resultData;
  },

  /**
   * 학급별 상담 기록 조회
   */
  getByClassId: async (classId: string): Promise<UnifiedCounselingRecord[]> => {
    if (isMockMode()) {
      return mockRecords.filter(r => r.classId === classId);
    }
    const response = await apiRequest<UnifiedCounselingRecord[]>(`/api/counseling/class/${classId}`);
    return response.resultData;
  },

  /**
   * 상태별 상담 기록 조회
   */
  getByStatus: async (status: CounselingStatus): Promise<UnifiedCounselingRecord[]> => {
    if (isMockMode()) {
      return mockRecords.filter(r => r.status === status);
    }
    const response = await apiRequest<UnifiedCounselingRecord[]>(`/api/counseling/status/${status}`);
    return response.resultData;
  },

  /**
   * 단일 상담 기록 조회
   */
  getById: async (id: string): Promise<UnifiedCounselingRecord | null> => {
    if (isMockMode()) {
      return mockRecords.find(r => r.id === id) || null;
    }
    try {
      const response = await apiRequest<UnifiedCounselingRecord>(`/api/counseling/${id}`);
      return response.resultData;
    } catch (error) {
      // 404인 경우 null 반환
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  /**
   * 상담 기록 생성
   */
  create: async (input: CreateUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    if (isMockMode()) {
      const newRecord: UnifiedCounselingRecord = {
        ...input,
        id: `cr-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRecords.push(newRecord);
      return newRecord;
    }
    const response = await apiRequest<UnifiedCounselingRecord>('/api/counseling', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.resultData;
  },

  /**
   * 상담 기록 수정
   */
  update: async (id: string, input: UpdateUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    if (isMockMode()) {
      const index = mockRecords.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Record not found');
      mockRecords[index] = { ...mockRecords[index], ...input, updatedAt: new Date() };
      return mockRecords[index];
    }
    const response = await apiRequest<UnifiedCounselingRecord>(`/api/counseling/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return response.resultData;
  },

  /**
   * 예정 상담을 완료 처리
   */
  complete: async (id: string, data: CompleteUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    if (isMockMode()) {
      const index = mockRecords.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Record not found');
      mockRecords[index] = {
        ...mockRecords[index],
        ...data,
        status: 'completed',
        updatedAt: new Date(),
      };
      return mockRecords[index];
    }
    const response = await apiRequest<UnifiedCounselingRecord>(`/api/counseling/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.resultData;
  },

  /**
   * 상담 취소
   */
  cancel: async (id: string): Promise<void> => {
    if (isMockMode()) {
      const index = mockRecords.findIndex(r => r.id === id);
      if (index !== -1) {
        mockRecords[index] = { ...mockRecords[index], status: 'cancelled', updatedAt: new Date() };
      }
      return;
    }
    await apiRequest<void>(`/api/counseling/${id}/cancel`, {
      method: 'POST',
    });
  },

  /**
   * 상담 기록 삭제
   */
  delete: async (id: string): Promise<void> => {
    if (isMockMode()) {
      mockRecords = mockRecords.filter(r => r.id !== id);
      return;
    }
    await apiRequest<void>(`/api/counseling/${id}`, {
      method: 'DELETE',
    });
  },
};
