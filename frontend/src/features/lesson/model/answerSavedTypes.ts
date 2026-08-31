import type { LmsErrata } from '../api/lmsActivityService';

/** everyCanvas activity-join → Host `answerSaved` (2026-08-26 가이드 §5) */
export type AnswerSavedPayload = {
  seq?: number;
  articleId: string;
  sub_id?: string;
  answer: unknown;
  timeSpentMs?: number;
  evaluation?: {
    errata: LmsErrata;
    awardedScore?: number;
  };
};

export const isAnswerSavedPayload = (value: unknown): value is AnswerSavedPayload => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.articleId === 'string' && record.articleId.length > 0;
};
