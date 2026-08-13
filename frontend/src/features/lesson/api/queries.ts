import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRefSetList, registerRefSet } from './lmsRefSetService';
import type { RegisterRefSetBody, RefSetListData } from './lmsRefSetService';
import { lessonKeys } from './queryKeys';

export function useRefSetListQuery() {
  return useQuery({
    queryKey: lessonKeys.refSets(),
    queryFn: getRefSetList,
  });
}

export function useRegisterRefSetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterRefSetBody) => {
      // cache 기반 중복 방지: 동일 lcmsSetId 이미 등록된 경우 skip
      const cached = queryClient.getQueryData<RefSetListData>(lessonKeys.refSets());
      const alreadyRegistered = cached?.list.some(
        (item) => item.lcmsSetId === body.lcmsSetId,
      );
      if (alreadyRegistered) return Promise.resolve({ refSetId: '' });
      return registerRefSet(body);
    },
    onSuccess: async (_data, variables) => {
      if (variables.lcmsSetId) {
        await queryClient.invalidateQueries({ queryKey: lessonKeys.refSets() });
      }
    },
  });
}
