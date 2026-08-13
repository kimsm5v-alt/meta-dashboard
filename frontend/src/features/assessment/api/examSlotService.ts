import { fetchExamList } from '@features/assessment/api/assessmentService';
import { EXAM_SLOTS } from '../constants';
import type { ExamSlotState, PaperIdx } from '../types';

export async function getExamSlots(
  claId: string,
  tcId: string,
  paperIdx?: PaperIdx,
): Promise<ExamSlotState[]> {
  const items = await fetchExamList(claId, tcId, paperIdx);
  const slotDefinitions = paperIdx
    ? EXAM_SLOTS.filter((slot) => slot.paperIdx === paperIdx)
    : EXAM_SLOTS;

  return slotDefinitions.map((slotDef) => {
    const item = items.find((i) => i.ordNo === slotDef.ordNo && i.paperIdx === slotDef.paperIdx);

    if (!item) {
      return {
        slotId: slotDef.id,
        status: 'not_started' as const,
        submittedCount: 0,
        totalCount: 0,
      };
    }

    let status: ExamSlotState['status'];
    if (item.dgnssAt === 'Y') {
      status = 'in_progress';
    } else if (item.dgnssEdDt !== null) {
      status = 'completed';
    } else {
      status = 'not_started';
    }

    return {
      slotId: slotDef.id,
      dgnssId: item.dgnssId,
      status,
      submittedCount: item.stSubmCnt,
      totalCount: item.stTotalCnt,
      startDate: new Date(item.dgnssStDt),
      endDate: item.dgnssEdDt ? new Date(item.dgnssEdDt) : undefined,
      notSubmittedStudents: Array.isArray(item.notDgnssStartList) ? item.notDgnssStartList : [],
    };
  });
}
