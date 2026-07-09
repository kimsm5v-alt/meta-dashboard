/**
 * 학생용 검사 목록 타입 정의
 *
 * 2종(학습종합검사, 자기조절학습검사) × 2회차 구조 지원
 */

/** 검사 종류 */
export type ExamType = 'comp' | 'self';

/** 검사 상태 - 7개 분기 */
export type ExamStatus =
  | 'pending'      // 예정: 교사가 아직 검사를 시작하지 않음
  | 'ready'        // 대기중: 교사가 시작함, 학생 미응시
  | 'progress'     // 진행중: 학생 응시 중 (중간 저장됨)
  | 'awaiting'     // 결과 대기중: 학생 제출 완료, 교사 미종료
  | 'result'       // 결과 확인 가능: 교사 종료 완료
  | 'missed'       // 미응시: 응시 기간 종료, 미응시 처리
  | 'locked';      // 잠금: 1차 미제출로 2차 잠김

/** 검사 종류 정보 */
export interface ExamTypeInfo {
  type: ExamType;
  name: string;
  color: string;        // 포인트 컬러
  colorBg: string;      // 배경색 (tint)
  colorText: string;    // 텍스트 색상
  rounds: { round: number; recommendedMonth: string }[];
}

/** 검사 종류별 메타 정보 */
export const EXAM_TYPE_INFO: Record<ExamType, ExamTypeInfo> = {
  comp: {
    type: 'comp',
    name: '학습종합검사',
    color: '#9D53E1',
    colorBg: 'bg-purple-100',
    colorText: 'text-purple-600',
    rounds: [
      { round: 1, recommendedMonth: '3월' },
      { round: 2, recommendedMonth: '9월' },
    ],
  },
  self: {
    type: 'self',
    name: '자기조절학습검사',
    color: '#009F88',
    colorBg: 'bg-teal-100',
    colorText: 'text-teal-600',
    rounds: [
      { round: 1, recommendedMonth: '6월' },
      { round: 2, recommendedMonth: '12월' },
    ],
  },
};

/** 상태별 뱃지 정보 */
export interface StatusBadgeInfo {
  label: string;
  bgColor: string;    // HEX 배경색
  textColor: string;  // HEX 텍스트색
  bgClass: string;    // Tailwind 배경 클래스
  textClass: string;  // Tailwind 텍스트 클래스
}

/** 상태별 메타 정보 */
export const EXAM_STATUS_INFO: Record<ExamStatus, StatusBadgeInfo> = {
  pending: {
    label: '예정',
    bgColor: '#EEF0F4',
    textColor: '#737A88',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-500',
  },
  ready: {
    label: '대기중',
    bgColor: '#E7F0FE',
    textColor: '#2563EB',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-600',
  },
  progress: {
    label: '진행중',
    bgColor: '#FEF1E1',
    textColor: '#D97706',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-600',
  },
  awaiting: {
    label: '결과 대기중',
    bgColor: '#EDEEFC',
    textColor: '#5B5FE0',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-600',
  },
  result: {
    label: '결과 확인 가능',
    bgColor: '#E5F6ED',
    textColor: '#16A34A',
    bgClass: 'bg-green-50',
    textClass: 'text-green-600',
  },
  missed: {
    label: '미응시',
    bgColor: '#FDEBEB',
    textColor: '#DC2626',
    bgClass: 'bg-red-50',
    textClass: 'text-red-600',
  },
  locked: {
    label: '잠금',
    bgColor: '#EEF0F4',
    textColor: '#737A88',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-400',
  },
};

/** 상태별 안내 문구 */
export const EXAM_STATUS_MESSAGE: Partial<Record<ExamStatus, string>> = {
  pending: '교사가 검사를 시작하면 응시할 수 있어요',
  awaiting: '교사가 검사를 종료하면 결과를 확인할 수 있어요',
  missed: '응시 기간이 종료되어 미응시 처리되었어요',
  locked: '1차를 제출하면 응시할 수 있어요',
};

/** 학생 검사 목록 아이템 (UI용) */
export interface StudentExamListItem {
  dgnssId: number;
  dgnssResultId: number;
  /** 검사 종류 */
  type: ExamType;
  /** 검사 회차 (1차, 2차) */
  round: number;
  /** 검사명 (ex: 1차 학습종합검사) */
  name: string;
  /** 상태 */
  status: ExamStatus;
  /** 진행률 (0~100) */
  progress: number;
  /** 응답 완료 문항 수 */
  answeredCount: number;
  /** 총 문항 수 */
  totalQuestions: number;
  /** 제출일 */
  submittedAt: string | null;
  /** 결과 조회 가능 여부 */
  hasResult: boolean;
  /** 권장 응시 월 */
  recommendedMonth: string;
}

/** 섹션별 그룹화된 검사 목록 */
export interface ExamSection {
  type: ExamType;
  typeInfo: ExamTypeInfo;
  exams: StudentExamListItem[];
  completedCount: number;
  totalCount: number;
}

/**
 * API 응답 → UI 타입 변환 헬퍼 (legacy 호환)
 * @deprecated 새로운 7개 상태 시스템 사용 권장
 */
export function mapExamStatus(
  dgnssAt: 'Y' | 'N',
  submAt: 'Y' | 'N',
  eakAt: 'Y' | 'N'
): ExamStatus {
  // 검사가 아직 열리지 않음 (교사 미시작)
  if (dgnssAt === 'N' && eakAt === 'N') {
    return 'pending';
  }

  // 검사 종료 (교사가 종료함)
  if (dgnssAt === 'N' && submAt === 'Y') {
    return 'result';  // 결과 확인 가능
  }

  // 검사 기간 종료 but 미제출
  if (dgnssAt === 'N' && submAt === 'N' && eakAt === 'Y') {
    return 'missed';  // 미응시
  }

  // 검사 진행 중 (교사가 시작함)
  if (dgnssAt === 'Y') {
    if (submAt === 'Y') {
      return 'awaiting';  // 제출 완료, 교사 미종료
    }
    if (eakAt === 'Y') {
      return 'progress';  // 응시 중
    }
    return 'ready';  // 대기중 (교사 시작, 학생 미응시)
  }

  return 'pending';
}
