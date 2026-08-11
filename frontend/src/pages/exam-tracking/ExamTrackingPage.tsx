import { useLayoutContext } from '@widgets/layout/v2/LayoutContext';
import {
  TrackingEmptyState,
  ClassTrackingSection,
  StudentTrackingSection,
} from '@widgets/exam-tracking';

export const ExamTrackingPage = () => {
  const { scope } = useLayoutContext();

  if (scope.level === 'student' && scope.classId && scope.studentId) {
    return <StudentTrackingSection classId={scope.classId} studentId={scope.studentId} />;
  }

  if (scope.level === 'class' && scope.classId) {
    return <ClassTrackingSection classId={scope.classId} />;
  }

  return <TrackingEmptyState />;
};

export default ExamTrackingPage;
