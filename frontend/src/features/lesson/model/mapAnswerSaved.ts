import type {
  ParticipationContent,
  PatchParticipationResponseItem,
} from '../api/lmsActivityService';
import type { AnswerSavedPayload } from './answerSavedTypes';

export function mapAnswerSavedToPatchResponse(
  payload: AnswerSavedPayload,
  contentItems: ParticipationContent['items'],
  gradingPolicy: string,
): PatchParticipationResponseItem | null {
  const item = contentItems.find((row) => row.lcmsArticleId === payload.articleId);
  if (!item) return null;

  const response: PatchParticipationResponseItem = {
    activityItemId: item.activityItemId,
    answer: payload.answer,
  };

  if (typeof payload.timeSpentMs === 'number' && payload.timeSpentMs > 0) {
    response.timeSpentMs = payload.timeSpentMs;
  }

  if (gradingPolicy === 'CLIENT_ALLOWED' && payload.evaluation) {
    response.evaluation = payload.evaluation;
  }

  return response;
}
