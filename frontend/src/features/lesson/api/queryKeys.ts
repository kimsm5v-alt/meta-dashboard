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
  activityDetail: (activityId: string) =>
    [...lessonKeys.activities(), 'detail', activityId] as const,
  activityProgress: (activityId: string) =>
    [...lessonKeys.activities(), 'progress', activityId] as const,
  activityStatistics: (activityId: string) =>
    [...lessonKeys.activities(), 'statistics', activityId] as const,
  activityAssignees: (activityId: string) =>
    [...lessonKeys.activities(), 'assignees', activityId] as const,
  activityParticipation: (activityId: string, participationId: string) =>
    [...lessonKeys.activities(), 'participations', activityId, participationId] as const,
  cmsArticle: (articleId: string) => [...lessonKeys.all, 'cms-article', articleId] as const,
  assigneeDirectory: (userId: string) => [...lessonKeys.all, 'assignee-directory', userId] as const,
  thisWeekCount: () => [...lessonKeys.all, 'this-week-count'] as const,
  runningCount: () => [...lessonKeys.all, 'running-count'] as const,
};
