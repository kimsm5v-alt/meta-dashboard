import { ENV } from '@shared/config/env';
import type { ExamSlotDefinition, ExamSlotStatus } from './types';

export const EXAM_SLOTS: ExamSlotDefinition[] = [
  {
    id: 'L1',
    kind: 'learning',
    ordNo: 1,
    paperIdx: '1',
    label: '학습종합검사',
    shortLabel: '학습종합검사',
    round: 1,
    color: '#9D53E1',
    description: '학생의 학습심리정서를 종합적으로 측정합니다.',
    recommendedMonth: '3~4월',
    semester: '1학기',
    isComingSoon: false,
  },
  {
    id: 'S1',
    kind: 'self',
    ordNo: 1,
    paperIdx: '2',
    label: '자기조절학습검사',
    shortLabel: '자기조절학습검사',
    round: 1,
    color: '#009F88',
    description: '학생의 자기조절학습 능력을 측정합니다.',
    recommendedMonth: '6~7월',
    semester: '1학기',
    isComingSoon: ENV.SELFREG_HIDDEN,
  },
  {
    id: 'L2',
    kind: 'learning',
    ordNo: 2,
    paperIdx: '1',
    label: '학습종합검사',
    shortLabel: '학습종합검사',
    round: 2,
    color: '#9D53E1',
    description: '1차 검사 이후 변화를 측정합니다.',
    recommendedMonth: '9~10월',
    semester: '2학기',
    isComingSoon: false,
  },
  {
    id: 'S2',
    kind: 'self',
    ordNo: 2,
    paperIdx: '2',
    label: '자기조절학습검사',
    shortLabel: '자기조절학습검사',
    round: 2,
    color: '#009F88',
    description: '자기조절학습 2차 검사입니다.',
    recommendedMonth: '12월',
    semester: '2학기',
    isComingSoon: ENV.SELFREG_HIDDEN,
  },
];

export const EXAM_STATUS_LABELS: Record<ExamSlotStatus, string> = {
  not_started: '시작 전',
  in_progress: '진행 중',
  completed: '완료',
  locked: '잠금',
};

export const GRADE_OPTIONS: Record<string, number[]> = {
  elementary: [5, 6],
  middle: [1, 2, 3],
  high: [1, 2, 3],
};

export const CLASS_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

export const SCHOOL_LEVEL_OPTIONS = [
  { value: 'elementary', label: '초등' },
  { value: 'middle', label: '중등' },
  { value: 'high', label: '고등' },
];
