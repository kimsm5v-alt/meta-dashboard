import type { Group, GroupMember, SchoolLevelCode } from '@shared/types';

export type ExamKind = 'learning' | 'self';
export type PaperIdx = '1' | '2';
export type ExamSlotStatus = 'not_started' | 'in_progress' | 'completed' | 'locked';
export type ViewMode = 'list' | 'detail';
export type ModalType = 'create_group' | 'edit_group' | 'delete_group' | null;
export type ExamReminderCode = 'OK' | 'NO_TARGET' | 'NOT_IN_PROGRESS' | 'NOT_OWNER' | 'NOT_FOUND';

export interface ExamReminderResponse {
  code: ExamReminderCode;
  requestedCount: number;
  sentCount: number;
  failedCount: number;
  lastSentAt: string | null;
}

export interface ExamSlotDefinition {
  id: 'L1' | 'S1' | 'L2' | 'S2';
  kind: ExamKind;
  ordNo: 1 | 2;
  paperIdx: PaperIdx;
  label: string;
  shortLabel: string;
  round: 1 | 2;
  color: string;
  description: string;
  recommendedMonth: string;
  semester: string;
  isComingSoon: boolean;
}

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

export interface GroupWithExamState extends Group {
  examSlots: ExamSlotState[];
  inProgressCount: number;
  completedCount: number;
  activeMemberCount: number;
}

export interface GroupFormData {
  name: string;
  schoolLevel: SchoolLevelCode;
  grade: number;
  classNumber: number;
  description?: string;
  schoolName?: string;
}

export type { Group, GroupMember };
