import { useParams } from 'react-router-dom';
import { StudentDetailReport, StudentLessonResultShell } from '@widgets/lesson';

export const StudentLessonResultDetailPage = () => {
  const { activityId } = useParams<{ activityId: string }>();
  if (!activityId) return null;
  return (
    <StudentLessonResultShell>
      <StudentDetailReport activityId={activityId} />
    </StudentLessonResultShell>
  );
};

export default StudentLessonResultDetailPage;
