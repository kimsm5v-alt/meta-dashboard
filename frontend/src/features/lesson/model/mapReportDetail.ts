import {
  LmsHttpError,
  type ActivityItem,
  type LmsErrata,
  type ParticipationResult,
  type ParticipationResultItem,
} from '../api/lmsActivityService';
import type { ArticleNature, CellInfo, ErrataCd } from './reportDetailTypes';
import { pct } from './reportDetailUtils';

const GRADED_ERRATA: ReadonlySet<LmsErrata> = new Set(['CORRECT', 'INCORRECT', 'PARTIAL']);

export const articleTypeToNature = (articleType: number | undefined): ArticleNature | undefined => {
  if (articleType === 20) return '개념';
  if (articleType === 21) return '문항';
  if (articleType === 22) return '활동';
  return undefined;
};

export const lmsErrataToCd = (errata: LmsErrata | undefined): ErrataCd | undefined => {
  switch (errata) {
    case 'CORRECT':
      return 1;
    case 'INCORRECT':
      return 2;
    case 'PARTIAL':
      return 3;
    case 'UNGRADABLE':
      return 4;
    default:
      return undefined;
  }
};

export const sortActivityItems = (items: ActivityItem[] | undefined): ActivityItem[] =>
  [...(items ?? [])].sort((a, b) => a.seq - b.seq);

export const hasParticipationAnswer = (item: ParticipationResultItem): boolean =>
  item.answer !== undefined;

export type ParticipationSummary = {
  answered: number;
  total: number;
  correctN: number;
  gradedN: number;
  hasGraded: boolean;
  rate: number;
};

export const summarizeParticipation = (
  result: ParticipationResult | undefined,
): ParticipationSummary => {
  const items = result?.items ?? [];
  const total = items.length;
  const answered = items.filter(hasParticipationAnswer).length;
  const graded = items.filter((item) => item.errata != null && GRADED_ERRATA.has(item.errata));
  const correctN = graded.filter((item) => item.errata === 'CORRECT').length;
  const gradedN = graded.length;
  return {
    answered,
    total,
    correctN,
    gradedN,
    hasGraded: gradedN > 0,
    rate: pct(correctN, gradedN),
  };
};

export const participationItemOf = (
  result: ParticipationResult | undefined,
  activityItemId: string,
): ParticipationResultItem | undefined =>
  result?.items.find((item) => item.activityItemId === activityItemId);

export const cellFromParticipationItem = (item: ParticipationResultItem | undefined): CellInfo => {
  const submitted = item != null && hasParticipationAnswer(item);
  return {
    submitted,
    value: submitted ? '제출함' : '미제출',
    gradable: item?.errata != null && GRADED_ERRATA.has(item.errata),
    errata: lmsErrataToCd(item?.errata),
    manual: false,
  };
};

export const isNotSubmittedError = (error: unknown): boolean =>
  error instanceof LmsHttpError && (error.errorCode === 'NOT_SUBMITTED' || error.status === 409);
