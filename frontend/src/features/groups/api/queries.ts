import { useQuery } from '@tanstack/react-query';

import { getGroupMembers } from './groupService';
import { groupKeys } from './queryKeys';

export const useGroupMembersQuery = (
  groupId: string | null | undefined,
  userId: string | undefined,
) =>
  useQuery({
    queryKey: groupKeys.members(groupId ?? '', userId ?? ''),
    queryFn: () => getGroupMembers(groupId!, userId!),
    enabled: !!groupId && !!userId,
  });
