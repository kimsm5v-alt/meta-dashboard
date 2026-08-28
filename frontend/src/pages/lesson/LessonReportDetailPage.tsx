import { useLocation, useParams } from 'react-router-dom';
import { ReportDetail } from '@widgets/lesson';
import type { ActivitySummaryItem } from '@features/lesson';

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

export const LessonReportDetailPage = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const location = useLocation();
  if (!activityId) return null;
  return <ReportDetail activityId={activityId} activity={activityFromState(location.state)} />;
};

export default LessonReportDetailPage;
