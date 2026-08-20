import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useExamReminderMutation } from '../api/queries';
import { getExamReminderFeedback } from '../utils';

const REMINDER_COOLDOWN_MS = 5_000;

export const useExamReminderAction = () => {
  const mutation = useExamReminderMutation();
  const requestInFlightRef = useRef(false);
  const cooldownIdsRef = useRef(new Set<number>());
  const [cooldownIds, setCooldownIds] = useState<ReadonlySet<number>>(new Set());

  const sendReminder = async (dgnssId: number) => {
    if (requestInFlightRef.current || cooldownIdsRef.current.has(dgnssId)) return;

    requestInFlightRef.current = true;
    cooldownIdsRef.current.add(dgnssId);
    setCooldownIds(new Set(cooldownIdsRef.current));

    try {
      const result = await mutation.mutateAsync({ dgnssId });
      const feedback = getExamReminderFeedback(result);
      if (feedback.tone === 'success') toast.success(feedback.message);
      else if (feedback.tone === 'info') toast.info(feedback.message);
      else toast.error(feedback.message);
    } catch {
      toast.error('독려 알림을 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      requestInFlightRef.current = false;
      window.setTimeout(() => {
        cooldownIdsRef.current.delete(dgnssId);
        setCooldownIds(new Set(cooldownIdsRef.current));
      }, REMINDER_COOLDOWN_MS);
    }
  };

  return {
    sendReminder,
    isBlocked: (dgnssId: number) => mutation.isPending || cooldownIds.has(dgnssId),
  };
};
