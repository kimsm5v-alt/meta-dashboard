import { useCallback, useEffect, useRef, useState } from 'react';
import { LmsHttpError, patchParticipation } from '../api/lmsActivityService';
import type {
  ParticipationContent,
  PatchParticipationResponseItem,
} from '../api/lmsActivityService';
import { isAnswerSavedPayload } from './answerSavedTypes';
import { mapAnswerSavedToPatchResponse } from './mapAnswerSaved';

const DEBOUNCE_MS = 600;
const MAX_WAIT_MS = 2500;

export type ParticipationAutosaveInput = {
  participationId: string;
  contentItems: ParticipationContent['items'];
  gradingPolicy: string;
  onFatalError?: (error: LmsHttpError) => void;
};

export type UseParticipationAutosaveResult = {
  enqueue: (payload: unknown) => void;
  flush: () => Promise<void>;
  isSaving: boolean;
};

const stripEvaluation = (
  responses: PatchParticipationResponseItem[],
): PatchParticipationResponseItem[] =>
  responses.map(({ evaluation: _evaluation, ...rest }) => rest);

const isRetriableNetworkError = (error: unknown): boolean => {
  if (!(error instanceof LmsHttpError)) return false;
  if (error.status === 0) return true;
  return error.status >= 500;
};

export function useParticipationAutosave({
  participationId,
  contentItems,
  gradingPolicy,
  onFatalError,
}: ParticipationAutosaveInput): UseParticipationAutosaveResult {
  const [isSaving, setIsSaving] = useState(false);
  const pendingRef = useRef(new Map<string, PatchParticipationResponseItem>());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef<Promise<void> | null>(null);
  const stoppedRef = useRef(false);
  const onFatalErrorRef = useRef(onFatalError);

  useEffect(() => {
    onFatalErrorRef.current = onFatalError;
  });

  const clearTimers = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
  }, []);

  const mergeBack = useCallback((responses: PatchParticipationResponseItem[]) => {
    for (const response of responses) {
      pendingRef.current.set(response.activityItemId, response);
    }
  }, []);

  const patchResponses = useCallback(
    async (responses: PatchParticipationResponseItem[]) => {
      try {
        await patchParticipation(participationId, { responses });
      } catch (error) {
        if (error instanceof LmsHttpError) {
          if (error.status === 400 && error.errorCode === 'GRADING_NOT_ALLOWED') {
            await patchParticipation(participationId, { responses: stripEvaluation(responses) });
            return;
          }
          if (
            error.status === 409 &&
            (error.errorCode === 'ALREADY_SUBMITTED' || error.errorCode === 'ACTIVITY_CLOSED')
          ) {
            stoppedRef.current = true;
            pendingRef.current.clear();
            onFatalErrorRef.current?.(error);
            return;
          }
        }
        if (isRetriableNetworkError(error)) {
          mergeBack(responses);
          try {
            await patchParticipation(participationId, { responses });
            return;
          } catch (retryError) {
            if (isRetriableNetworkError(retryError)) {
              mergeBack(responses);
            }
            throw retryError;
          }
        }
        throw error;
      }
    },
    [mergeBack, participationId],
  );

  const flush = useCallback(async () => {
    if (stoppedRef.current) return;

    clearTimers();

    while (true) {
      if (inflightRef.current) {
        await inflightRef.current;
      }
      if (pendingRef.current.size === 0) break;

      const responses = [...pendingRef.current.values()];
      pendingRef.current.clear();

      setIsSaving(true);
      const run = patchResponses(responses).finally(() => {
        setIsSaving(false);
      });
      inflightRef.current = run;
      await run;
      inflightRef.current = null;
    }
  }, [clearTimers, patchResponses]);

  const scheduleFlush = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void flush();
    }, DEBOUNCE_MS);

    if (!maxWaitTimerRef.current) {
      maxWaitTimerRef.current = setTimeout(() => {
        maxWaitTimerRef.current = null;
        void flush();
      }, MAX_WAIT_MS);
    }
  }, [flush]);

  const enqueue = useCallback(
    (value: unknown) => {
      if (stoppedRef.current || !isAnswerSavedPayload(value)) return;

      const mapped = mapAnswerSavedToPatchResponse(value, contentItems, gradingPolicy);
      if (!mapped) return;

      pendingRef.current.set(mapped.activityItemId, mapped);
      scheduleFlush();
    },
    [contentItems, gradingPolicy, scheduleFlush],
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void flush();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearTimers();
      void flush();
    };
  }, [clearTimers, flush]);

  return {
    enqueue,
    flush,
    isSaving,
  };
}
