import type { ParticipationStatus } from '../api/lmsActivityService';
import type { ArticleNature, CellInfo, RenderMode } from './reportDetailTypes';

/** ResponseDetailOverlay 순회 축 */
export type ResponseOverlayAxis = 'student' | 'page';

/** PageTab·StudentTab ResponseGrid / ResponseDetailOverlay 공통 ViewModel */
export type ReportGridItem = {
  key: string;
  title: string;
  nature?: ArticleNature;
  mode: RenderMode;
  cell: CellInfo;
  capture?: string;
  showNature?: boolean;
  highlight?: boolean;
  participationId?: string;
  activityItemId?: string;
  lcmsArticleId?: string;
  participantSub?: string;
  studentName?: string;
  pageSeq?: number;
  pageTitle?: string;
  gradedBySource?: string;
  timeSpentMs?: number;
  submittedAt?: string;
  participationStatus?: ParticipationStatus;
};

export const submittedReportGridItems = (items: ReportGridItem[]): ReportGridItem[] =>
  items.filter((item) => item.cell.submitted);

export const gradingSourceLabel = (source: string | undefined): string | null => {
  if (source === 'TEACHER') return '수동 채점';
  if (source === 'TRUSTED' || source === 'CLIENT') return '자동 채점';
  return null;
};
