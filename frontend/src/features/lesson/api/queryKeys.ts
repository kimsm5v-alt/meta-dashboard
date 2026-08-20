export const lessonKeys = {
  all: ['lesson'] as const,
  libraryItems: () => [...lessonKeys.all, 'library-items'] as const,
  libraryItem: (libraryItemId: string) => [...lessonKeys.libraryItems(), libraryItemId] as const,
  cmsSets: () => [...lessonKeys.all, 'cms-sets'] as const,
  cmsSet: (setId: string) => [...lessonKeys.cmsSets(), setId] as const,
};
