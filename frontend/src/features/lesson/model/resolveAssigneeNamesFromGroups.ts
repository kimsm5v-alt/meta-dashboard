/**
 * 배정 sub(spUserId) → 그룹 멤버 이름/출석번호.
 * collectAssigneeSubsFromGroups 의 역방향. 임시 — 추후 변경될 수 있음.
 */

import { getGroupDetail, getMyGroups } from '@features/groups';

export type AssigneeNameInfo = {
  name: string;
  memberNo?: number;
};

export async function resolveAssigneeNamesFromGroups(
  userId: string,
): Promise<Map<string, AssigneeNameInfo>> {
  const groups = await getMyGroups(userId);
  const map = new Map<string, AssigneeNameInfo>();

  await Promise.all(
    groups.map(async (group) => {
      const detail = await getGroupDetail(group.id, userId);
      for (const member of detail?.members ?? []) {
        const spUserId = member.spUserId?.trim();
        if (!spUserId) continue;
        if (member.memberType !== 'member') continue;
        if (member.status !== 'active') continue;
        if (map.has(spUserId)) continue;
        map.set(spUserId, {
          name: member.name?.trim() ?? '',
          memberNo: member.memberNo,
        });
      }
    }),
  );

  return map;
}
