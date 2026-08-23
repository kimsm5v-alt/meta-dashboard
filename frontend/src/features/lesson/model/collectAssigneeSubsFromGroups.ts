/**
 * 선택한 반(들)의 활성 학생 spUserId 합집합.
 * LMS PUT /assignees 의 assigneeSubs 에 사용 (추가계획11).
 */

import { getGroupDetail } from '@features/groups';

export async function collectAssigneeSubsFromGroups(
  groupIds: string[],
  userId: string,
): Promise<string[]> {
  const subs = new Set<string>();

  for (const groupId of groupIds) {
    const detail = await getGroupDetail(groupId, userId);
    for (const member of detail?.members ?? []) {
      const spUserId = member.spUserId?.trim();
      if (!spUserId) continue;
      if (member.memberType !== 'member') continue;
      if (member.status !== 'active') continue;
      subs.add(spUserId);
    }
  }

  return [...subs];
}
