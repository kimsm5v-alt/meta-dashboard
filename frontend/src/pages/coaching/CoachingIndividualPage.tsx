import {
  CoachingOverviewSection,
  CoachingPageFrame,
  IndividualCoachingSection,
} from '@widgets/coaching';
import { useLayoutContext } from '@widgets/layout/v2/LayoutContext';
import { useGroupMembersQuery } from '@features/groups';
import { useAuth } from '@features/auth';

export const CoachingIndividualPage = () => {
  const { scope } = useLayoutContext();
  const { user } = useAuth();
  // LNB가 scope.studentId로 넘기는 값은 GroupMember.id이고, 검사 분석 API는
  // GroupMember.stdtId를 요구한다(TeacherDashboardPage.tsx의 기존 매핑 패턴과 동일).
  const { data: members = [] } = useGroupMembersQuery(scope.classId ?? null, user?.id);
  const stdtId = members.find((member) => member.id === scope.studentId)?.stdtId;

  return (
    <CoachingPageFrame title='개별 코칭'>
      {scope.classId && stdtId ? (
        <IndividualCoachingSection key={stdtId} classId={scope.classId} studentId={stdtId} />
      ) : (
        <CoachingOverviewSection />
      )}
    </CoachingPageFrame>
  );
};

export default CoachingIndividualPage;
