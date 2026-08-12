import { useLayoutContext } from '@widgets/layout/v2/LayoutContext';
import { useAuth } from '@features/auth';
import { useGroupMembersQuery } from '@features/groups';
import {
  TrackingEmptyState,
  ClassTrackingSection,
  StudentTrackingSection,
} from '@widgets/exam-tracking';

export const ExamTrackingPage = () => {
  const { scope } = useLayoutContext();
  const { user } = useAuth();
  const { data: members = [] } = useGroupMembersQuery(
    scope.level === 'student' ? scope.classId : null,
    user?.id,
  );

  if (scope.level === 'student' && scope.classId && scope.studentId) {
    const member = members.find((item) => item.id === scope.studentId);
    return (
      <StudentTrackingSection
        classId={scope.classId}
        assessmentStudentId={member?.stdtId ?? scope.studentId}
        recordStudentId={scope.studentId}
      />
    );
  }

  if (scope.classId) {
    return <ClassTrackingSection classId={scope.classId} />;
  }

  return <TrackingEmptyState />;
};

export default ExamTrackingPage;
