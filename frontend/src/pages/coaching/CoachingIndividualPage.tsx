import styled from '@emotion/styled';
import { CoachingOverviewSection, IndividualCoachingSection } from '@widgets/coaching';
import { useLayoutContext } from '@widgets/layout/v2/LayoutContext';
import { useGroupMembersQuery } from '@features/groups';
import { useAuth } from '@features/auth';

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const CoachingIndividualPage = () => {
  const { scope } = useLayoutContext();
  const { user } = useAuth();
  // LNB가 scope.studentId로 넘기는 값은 GroupMember.id이고, 검사 분석 API는
  // GroupMember.stdtId를 요구한다(TeacherDashboardPage.tsx의 기존 매핑 패턴과 동일).
  const { data: members = [] } = useGroupMembersQuery(scope.classId ?? null, user?.id);
  const stdtId = members.find((member) => member.id === scope.studentId)?.stdtId;

  return (
    <Wrapper>
      {scope.classId && stdtId ? (
        <IndividualCoachingSection key={stdtId} classId={scope.classId} studentId={stdtId} />
      ) : (
        <CoachingOverviewSection />
      )}
    </Wrapper>
  );
};

export default CoachingIndividualPage;
