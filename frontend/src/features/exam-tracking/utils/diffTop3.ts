import type { ClassProfileItem } from '@features/class-dashboard/model/useClassProfile';

export interface Top3ChangeItem extends ClassProfileItem {
  /** 1차 Top3엔 없었는데 2차 Top3에 새로 들어온 항목이면 true (1차 목록에서는 항상 false) */
  isNew: boolean;
}

export interface Top3Diff {
  round1: Top3ChangeItem[];
  round2: Top3ChangeItem[];
}

export function diffTop3(
  round1Items: ClassProfileItem[],
  round2Items: ClassProfileItem[],
): Top3Diff {
  const round1Names = new Set(round1Items.map((item) => item.factorName));

  return {
    round1: round1Items.map((item) => ({ ...item, isNew: false })),
    round2: round2Items.map((item) => ({
      ...item,
      isNew: !round1Names.has(item.factorName),
    })),
  };
}
