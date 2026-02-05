/**
 * 상담 기록 서비스 (레거시 호환용)
 *
 * @deprecated unifiedCounselingService를 사용하세요
 *
 * 이 서비스는 기존 코드와의 호환성을 위해 유지됩니다.
 * 내부적으로 unifiedCounselingService를 사용합니다.
 */

import type {
  CounselingRecord,
  CreateCounselingRecordInput,
  UpdateCounselingRecordInput,
  UnifiedCounselingRecord,
} from '@/shared/types';
import { unifiedCounselingService } from './unifiedCounselingService';

/**
 * UnifiedCounselingRecord를 기존 CounselingRecord 형식으로 변환
 */
const toOldFormat = (record: UnifiedCounselingRecord): CounselingRecord => {
  const student = record.students[0];
  return {
    id: record.id,
    studentId: student?.id || '',
    classId: record.classId,
    scheduledAt: record.scheduledAt,
    duration: record.duration || 30,
    types: record.types,
    areas: record.areas,
    methods: record.methods,
    summary: record.summary || record.reason || '',
    nextSteps: record.nextSteps,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

export const counselingService = {
  /**
   * 학생별 상담 기록 조회
   * @deprecated unifiedCounselingService.getByStudentId()를 사용하세요
   */
  getByStudentId: async (studentId: string): Promise<CounselingRecord[]> => {
    const records = await unifiedCounselingService.getByStudentId(studentId);
    // 완료된 상담만 반환 (기존 동작 유지)
    return records
      .filter(r => r.status === 'completed')
      .map(toOldFormat);
  },

  /**
   * 상담 기록 상세 조회
   * @deprecated unifiedCounselingService.getById()를 사용하세요
   */
  getById: async (id: string): Promise<CounselingRecord | null> => {
    const record = await unifiedCounselingService.getById(id);
    if (!record) return null;
    return toOldFormat(record);
  },

  /**
   * 상담 기록 생성
   * @deprecated unifiedCounselingService.create()를 사용하세요
   */
  create: async (input: CreateCounselingRecordInput): Promise<CounselingRecord> => {
    const record = await unifiedCounselingService.create({
      students: [{
        id: input.studentId,
        name: '',
        number: 0,
        classId: input.classId,
      }],
      classId: input.classId,
      scheduledAt: input.scheduledAt,
      duration: input.duration,
      types: input.types,
      areas: input.areas,
      methods: input.methods,
      status: 'completed', // 기존 방식은 바로 완료로 저장
      summary: input.summary,
      nextSteps: input.nextSteps,
    });
    return toOldFormat(record);
  },

  /**
   * 상담 기록 수정
   * @deprecated unifiedCounselingService.update()를 사용하세요
   */
  update: async (id: string, input: UpdateCounselingRecordInput): Promise<CounselingRecord> => {
    const record = await unifiedCounselingService.update(id, {
      scheduledAt: input.scheduledAt,
      duration: input.duration,
      types: input.types,
      areas: input.areas,
      methods: input.methods,
      summary: input.summary,
      nextSteps: input.nextSteps,
    });
    return toOldFormat(record);
  },

  /**
   * 상담 기록 삭제
   * @deprecated unifiedCounselingService.delete()를 사용하세요
   */
  delete: async (id: string): Promise<void> => {
    return unifiedCounselingService.delete(id);
  },
};
