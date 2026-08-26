export const lessonKeys = {
  all: ['lesson'] as const,
  libraryItems: () => [...lessonKeys.all, 'library-items'] as const,
  libraryItem: (libraryItemId: string) => [...lessonKeys.libraryItems(), libraryItemId] as const,
  cmsSets: () => [...lessonKeys.all, 'cms-sets'] as const,
  cmsSet: (setId: string) => [...lessonKeys.cmsSets(), setId] as const,
  activityEntry: (accessKey: string) => [...lessonKeys.all, 'activity-entry', accessKey] as const,
  participation: (accessKey: string) => [...lessonKeys.all, 'participation', accessKey] as const,
  activities: () => [...lessonKeys.all, 'activities'] as const,
  activitiesByFilter: (availability: string) => [...lessonKeys.activities(), availability] as const,
  thisWeekCount: () => [...lessonKeys.all, 'this-week-count'] as const,
  runningCount: () => [...lessonKeys.all, 'running-count'] as const,
};
