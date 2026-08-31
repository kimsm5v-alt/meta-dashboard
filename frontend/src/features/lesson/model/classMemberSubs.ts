import type { GroupMember } from '@shared/types';

/** 현재 반의 활성 학생 spUserId. LMS participant 와 동일. */
export function classMemberSubs(members: GroupMember[] | undefined): Set<string> {
  const subs = new Set<string>();
  for (const member of members ?? []) {
    const id = member.spUserId?.trim();
    if (!id) continue;
    if (member.memberType !== 'member') continue;
    if (member.status !== 'active') continue;
    subs.add(id);
  }
  return subs;
}

export function filterParticipantsByClass<T extends { participant: string }>(
  items: T[] | undefined,
  memberSubs: Set<string>,
): T[] {
  if (!items || memberSubs.size === 0) return [];
  return items.filter((item) => memberSubs.has(item.participant));
}
