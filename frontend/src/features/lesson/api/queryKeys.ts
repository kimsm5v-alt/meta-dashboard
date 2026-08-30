export const lessonKeys = {
  all: ['lesson'] as const,
  libraryItems: () => [...lessonKeys.all, 'library-items'] as const,
  libraryItem: (libraryItemId: string) => [...lessonKeys.libraryItems(), libraryItemId] as const,
  cmsSets: () => [...lessonKeys.all, 'cms-sets'] as const,
  cmsSet: (setId: string) => [...lessonKeys.cmsSets(), setId] as const,
  activityEntry: (accessKey: string) => [...lessonKeys.all, 'activity-entry', accessKey] as const,
  participation: (accessKey: string) => [...lessonKeys.all, 'participation', accessKey] as const,
  activities: () => [...lessonKeys.all, 'activities'] as const,
  activitiesByFilter: (availability: string, classId: string) =>
    [...lessonKeys.activities(), availability, classId] as const,
  activityDetail: (activityId: string) =>
    [...lessonKeys.activities(), 'detail', activityId] as const,
  activityProgress: (activityId: string) =>
    [...lessonKeys.activities(), 'progress', activityId] as const,
  activityStatistics: (activityId: string) =>
    [...lessonKeys.activities(), 'statistics', activityId] as const,
  activityParticipations: (activityId: string) =>
    [...lessonKeys.activities(), 'participations', activityId] as const,
  activityParticipation: (activityId: string, participationId: string) =>
    [...lessonKeys.activities(), 'participations', activityId, participationId] as const,
  cmsArticle: (articleId: string) => [...lessonKeys.all, 'cms-article', articleId] as const,
  assigneeDirectory: (userId: string) => [...lessonKeys.all, 'assignee-directory', userId] as const,
  activitiesProgressBundle: (classId: string) =>
    [...lessonKeys.activities(), 'progress-bundle', classId] as const,
  thisWeekCount: (classId: string) => [...lessonKeys.all, 'this-week-count', classId] as const,
  runningCount: (classId: string) => [...lessonKeys.all, 'running-count', classId] as const,
  myActivities: () => [...lessonKeys.all, 'my-activities'] as const,
  participationResult: (participationId: string) =>
    [...lessonKeys.all, 'participation-result', participationId] as const,
};
