export const lessonKeys = {
  all: ['lesson'] as const,
  refSets: () => [...lessonKeys.all, 'ref-set'] as const,
  refSet: (refSetId: string) => [...lessonKeys.refSets(), refSetId] as const,
  cmsSets: () => [...lessonKeys.all, 'cms-sets'] as const,
  cmsSet: (setId: string) => [...lessonKeys.cmsSets(), setId] as const,
};
