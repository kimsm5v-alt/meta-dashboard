export const lessonKeys = {
  all: ['lesson'] as const,
  refSets: () => [...lessonKeys.all, 'ref-set'] as const,
  cmsSets: () => [...lessonKeys.all, 'cms-sets'] as const,
};
