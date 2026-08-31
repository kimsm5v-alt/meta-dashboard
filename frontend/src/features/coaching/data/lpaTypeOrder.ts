import type { StudentType } from '@shared/types';
import type { RankedType } from '../types';

/**
 * 인원 동점 시 우선순위(지원 필요도 순). 학급전략DB 로직 명세 6절 "엣지 케이스" 그대로.
 * 절대 순서를 바꾸지 않는다.
 */
const ELEMENTARY_PRIORITY: Record<string, number> = {
  '자원소진형': 0,
  '안전 균형형': 1,
  '몰입자원 풍부형': 2,
};

const MIDDLE_PRIORITY: Record<string, number> = {
  '냉소적 무기력형': 0,
  '정서조절 취약형': 1,
  '자기주도 몰입형': 2,
};

/**
 * 인원수 내림차순 정렬, 동점이면 학교급별 우선순위로 tie-break.
 * 0명 유형은 제외한다(분포 범례·STEP 배치 양쪽에서 빠져야 하므로 여기서 걸러낸다).
 */
export function rankTypes(
  counts: { name: StudentType; count: number }[],
  schoolLevel: '초등' | '중등',
): RankedType[] {
  const priority = schoolLevel === '초등' ? ELEMENTARY_PRIORITY : MIDDLE_PRIORITY;

  return counts
    .filter((item) => item.count > 0)
    .map((item) => ({ type: item.name, count: item.count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (priority[a.type] ?? 99) - (priority[b.type] ?? 99);
    });
}
