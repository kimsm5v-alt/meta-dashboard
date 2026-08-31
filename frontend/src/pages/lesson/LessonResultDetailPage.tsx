import { useLocation, useParams } from 'react-router-dom';
import { ReportDetail } from '@widgets/lesson';
import type { ActivitySummaryItem } from '@features/lesson';
import { useLayoutContext } from '@widgets/layout/v2/LayoutContext';

const isActivitySummary = (value: unknown): value is ActivitySummaryItem => {
  if (typeof value !== 'object' || value === null) return false;
  if (!('activityId' in value) || !('title' in value) || !('availability' in value)) return false;
  return (
    typeof value.activityId === 'string' &&
    typeof value.title === 'string' &&
    typeof value.availability === 'string'
  );
};

const activityFromState = (state: unknown): ActivitySummaryItem | undefined => {
  if (typeof state !== 'object' || state === null || !('activity' in state)) return undefined;
  const { activity } = state;
  return isActivitySummary(activity) ? activity : undefined;
};

export const LessonResultDetailPage = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const location = useLocation();
  const { scope } = useLayoutContext();
  if (!activityId) return null;
  return (
    <ReportDetail
      activityId={activityId}
      classId={scope.classId}
      activity={activityFromState(location.state)}
    />
  );
};

export default LessonResultDetailPage;
