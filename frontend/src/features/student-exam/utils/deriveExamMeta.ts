/**
 * 검사 목록 파생 메타 유틸 — 권장월/잠금 상태
 *
 * 백엔드 StudentExamItem 응답엔 권장월·잠금 개념이 없다(코드 확인됨).
 * 프로토타입(prototype/src/features/student-exam/types.ts)의 고정값을
 * 그대로 프론트엔드에서 재현한다.
 */
import type { StudentExamListItem } from '../types';

/** paperIdx('1'=학습종합검사,'2'=자기조절학습검사) → ordNo → 권장월 */
export const RECOMMENDED_MONTH: Record<string, Record<number, string>> = {
  '1': { 1: '3월', 2: '9월' },
  '2': { 1: '6월', 2: '12월' },
};

/** 각 항목에 recommendedMonth를 채워 넣는다. 정의되지 않은 조합은 빈 문자열. */
export function withRecommendedMonth(items: StudentExamListItem[]): StudentExamListItem[] {
  return items.map((item) => ({
    ...item,
    recommendedMonth: RECOMMENDED_MONTH[item.paperIdx]?.[item.ordNo] ?? '',
  }));
}

/** 같은 paperIdx의 ordNo=1 항목이 완료(결과 확인 가능 상태)가 아닌데 ordNo=2 항목이
 * 존재하면, 그 ordNo=2 항목의 status를 'locked'로 덮어쓴다.
 *
 * "완료"의 기준은 1차 제출 자체(둘 다 이후 회차 응시 가능해지는 시점)이므로
 * status가 'completed'(제출완료, 결과대기중) 또는 'result_ready'(결과확인가능)
 * 인 경우 모두 "제출 완료"로 취급한다.
 *
 * 단, 이미 제출/완료된 2차 항목은 1차 제출 여부와 무관하게 잠그지 않는다
 * (1차 미제출 후 2차만 완료한 학생의 결과가 가려지는 걸 방지).
 */
export function deriveLockedStatus(items: StudentExamListItem[]): StudentExamListItem[] {
  const firstRoundSubmitted = new Set<string>();
  for (const item of items) {
    if (item.ordNo === 1 && (item.status === 'completed' || item.status === 'result_ready')) {
      firstRoundSubmitted.add(item.paperIdx);
    }
  }

  return items.map((item) => {
    const alreadySubmitted = item.status === 'completed' || item.status === 'result_ready';
    if (item.ordNo === 2 && !alreadySubmitted && !firstRoundSubmitted.has(item.paperIdx)) {
      return { ...item, status: 'locked' as const };
    }
    return item;
  });
}
