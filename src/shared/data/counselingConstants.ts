import type { ScheduleType, CounselingArea, CounselingMethod } from '@/shared/types';

// 시간 옵션 생성 (09:00 ~ 17:00, 30분 단위)
export const TIME_OPTIONS: string[] = [];
for (let hour = 9; hour <= 17; hour++) {
  TIME_OPTIONS.push(`${hour.toString().padStart(2, '0')}:00`);
  if (hour < 17) {
    TIME_OPTIONS.push(`${hour.toString().padStart(2, '0')}:30`);
  }
}

export const SCHEDULE_TYPES: ScheduleType[] = ['regular', 'urgent', 'follow-up', 'initial'];
export const COUNSELING_AREAS: CounselingArea[] = [
  'academic', 'career', 'peer', 'family', 'emotion', 'behavior', 'health', 'other',
];
export const COUNSELING_METHODS: CounselingMethod[] = ['face-to-face', 'phone', 'video', 'group'];
