/**
 * 상담 일정 Mock 데이터 (레거시 호환용)
 *
 * 주의: 이 파일은 호환성을 위해 유지됩니다.
 * 새로운 기능은 mockUnifiedCounseling.ts를 직접 사용하세요.
 */

// 통합 저장소에서 re-export
export {
  SCHEDULE_CLASSES,
  SCHEDULE_STUDENTS,
  CLASS_COLORS,
  getClassScheduleStats,
} from '@/shared/data/mockUnifiedCounseling';

// Schedule 타입을 UnifiedCounselingRecord로 변환하는 어댑터
import type { Schedule, UnifiedCounselingRecord } from '@/shared/types';
import { mockUnifiedCounselingService } from '@/shared/data/mockUnifiedCounseling';

/**
 * UnifiedCounselingRecord를 기존 Schedule 형식으로 변환
 * 복수 선택된 값 중 첫 번째 값을 사용 (레거시 호환)
 */
const toSchedule = (record: UnifiedCounselingRecord): Schedule => {
  const [date, time] = record.scheduledAt.split(' ');
  return {
    id: record.id,
    students: record.students,
    classId: record.classId,
    date,
    time: time || '09:00',
    type: record.types[0] || 'regular',
    area: record.areas[0] || 'other',
    method: record.methods[0] || 'face-to-face',
    reason: record.reason,
    createdAt: record.createdAt,
  };
};

/**
 * 예정된 상담만 Schedule 형식으로 반환 (레거시 호환)
 * @deprecated unifiedCounselingService.getAll()을 사용하세요
 */
export const getMockSchedules = async (): Promise<Schedule[]> => {
  const records = await mockUnifiedCounselingService.getAll();
  return records
    .filter(r => r.status === 'scheduled')
    .map(toSchedule);
};

/**
 * 기존 MOCK_SCHEDULES와의 호환을 위한 빈 배열
 * @deprecated getMockSchedules() 또는 unifiedCounselingService.getAll()을 사용하세요
 */
export const MOCK_SCHEDULES: Schedule[] = [];
