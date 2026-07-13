/**
 * 검사하기 V2 - 타입 정의
 * 그룹 관리 + 검사하기 통합 버전
 */

import type { Group, GroupMember, SchoolLevelCode } from '@/shared/types';

// ============================================================
// 검사 슬롯 (4개 고정)
// ============================================================

/** 검사 종류 */
export type ExamKind = 'learning' | 'self';

/** 검사 상태 */
export type ExamSlotStatus = 'not_started' | 'in_progress' | 'completed' | 'locked';

/** 검사 슬롯 정의 (시스템 고정) */
export interface ExamSlotDefinition {
  id: string;
  kind: ExamKind;
  round: 1 | 2;
  label: string;
  shortLabel: string;
  recommendedMonth: string;
  semester: string;
  description: string;
  color: string;
}

/** 검사 슬롯 상태 (그룹별) */
export interface ExamSlotState {
  slotId: string;
  dgnssId?: number;
  status: ExamSlotStatus;
  submittedCount: number;
  totalCount: number;
  startDate?: Date;
  endDate?: Date;
  notSubmittedStudents?: string[];
}

// ============================================================
// 그룹 확장 (검사 상태 포함)
// ============================================================

/** 그룹 + 검사 상태 */
export interface GroupWithExamState extends Group {
  examSlots: ExamSlotState[];
  /** 진행 중인 검사 개수 */
  inProgressCount: number;
  /** 완료된 검사 개수 */
  completedCount: number;
  /** 활성 멤버 수 */
  activeMemberCount: number;
}

// ============================================================
// 그룹 상태 요약 (카드 표시용)
// ============================================================

export type GroupStatusType = 'in_progress' | 'all_done' | 'waiting';

export interface GroupStatusSummary {
  type: GroupStatusType;
  label: string;
  examName?: string;
  examRound?: number;
  progress?: number;
  submittedCount?: number;
  totalCount?: number;
}

// ============================================================
// 그룹 폼 데이터
// ============================================================

export interface GroupFormData {
  name: string;
  schoolLevel: SchoolLevelCode;
  grade: number;
  classNumber: number;
  description: string;
  schoolName: string;
}

// ============================================================
// 뷰 상태
// ============================================================

export type ViewMode = 'list' | 'detail';

export interface AssessmentPageState {
  viewMode: ViewMode;
  selectedGroupId: string | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================
// 모달 상태
// ============================================================

export type ModalType =
  | 'create_group'
  | 'edit_group'
  | 'delete_group'
  | 'invite_code'
  | 'start_exam'
  | 'end_exam'
  | 'cancel_exam'
  | null;

export interface ModalState {
  type: ModalType;
  data?: {
    group?: Group | GroupWithExamState;
    slot?: ExamSlotDefinition;
    slotState?: ExamSlotState;
  };
}

// ============================================================
// Re-exports
// ============================================================

export type { Group, GroupMember, SchoolLevelCode };
