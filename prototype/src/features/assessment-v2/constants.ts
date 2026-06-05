/**
 * 검사하기 V2 - 상수 정의
 */

import type { ExamSlotDefinition } from './types';

// ============================================================
// 검사 색상
// ============================================================

export const EXAM_COLORS = {
  learning: '#9D53E1', // 학습종합검사
  self: '#009F88',     // 자기조절학습검사
} as const;

// ============================================================
// 검사 슬롯 정의 (4개 고정)
// ============================================================

export const EXAM_SLOTS: ExamSlotDefinition[] = [
  {
    id: 'L1',
    kind: 'learning',
    round: 1,
    label: 'META 학습종합검사',
    shortLabel: '학습종합검사',
    recommendedMonth: '3월',
    semester: '1학기 초',
    description: '학생들의 강점/보완점을 파악할 수 있어요.',
    color: EXAM_COLORS.learning,
  },
  {
    id: 'S1',
    kind: 'self',
    round: 1,
    label: 'META 자기조절학습검사',
    shortLabel: '자기조절학습검사',
    recommendedMonth: '6월',
    semester: '1학기 말',
    description: '자기조절학습능력을 파악하여 스스로 공부에 필요한 부분을 알 수 있어요.',
    color: EXAM_COLORS.self,
  },
  {
    id: 'L2',
    kind: 'learning',
    round: 2,
    label: 'META 학습종합검사',
    shortLabel: '학습종합검사',
    recommendedMonth: '9월',
    semester: '2학기 초',
    description: '학생들의 강점/보완점을 파악할 수 있어요.',
    color: EXAM_COLORS.learning,
  },
  {
    id: 'S2',
    kind: 'self',
    round: 2,
    label: 'META 자기조절학습검사',
    shortLabel: '자기조절학습검사',
    recommendedMonth: '12월',
    semester: '2학기 말',
    description: '자기조절학습능력을 파악하여 스스로 공부에 필요한 부분을 알 수 있어요.',
    color: EXAM_COLORS.self,
  },
];

// ============================================================
// 상태 라벨/스타일
// ============================================================

export const EXAM_STATUS_LABELS = {
  not_started: '시작 전',
  in_progress: '진행중',
  completed: '완료',
  locked: '잠김',
} as const;

export const EXAM_STATUS_STYLES = {
  not_started: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
  in_progress: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  completed: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  locked: {
    bg: 'bg-gray-50',
    text: 'text-gray-400',
    border: 'border-gray-200',
  },
} as const;

// ============================================================
// 그룹 상태 스타일
// ============================================================

export const GROUP_STATUS_STYLES = {
  in_progress: {
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    badge: 'bg-primary-600 text-white',
  },
  all_done: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-500 text-white',
  },
  waiting: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-400 text-white',
  },
} as const;

// ============================================================
// PDF 다운로드 URL
// ============================================================

export const PDF_URLS = {
  learning: '/docs/학습종합검사_교사용_설명서.pdf',
  self: '/docs/자기조절학습검사_교사용_설명서.pdf',
} as const;

// ============================================================
// 학교급별 학년 옵션
// ============================================================

export const GRADE_OPTIONS = {
  elementary: [5, 6],
  middle: [1, 2, 3],
  high: [1, 2, 3],
} as const;

export const CLASS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const SCHOOL_LEVEL_OPTIONS = [
  { value: 'elementary', label: '초등학교' },
  { value: 'middle', label: '중학교' },
  { value: 'high', label: '고등학교' },
] as const;
