export const groupKeys = {
  all: ['groups'] as const,
  myGroups: (userId: string) => [...groupKeys.all, 'list', userId] as const,
  members: (groupId: string, userId: string) =>
    [...groupKeys.all, 'members', groupId, userId] as const,
};
