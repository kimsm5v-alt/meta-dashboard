import styled from '@emotion/styled';
import { CoachingOverviewSection, IndividualCoachingSection } from '@widgets/coaching';
import { useLayoutContext } from '@widgets/layout/v2/LayoutContext';

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const CoachingIndividualPage = () => {
  const { scope } = useLayoutContext();

  return (
    <Wrapper>
      {scope.classId && scope.studentId ? (
        <IndividualCoachingSection
          key={scope.studentId}
          classId={scope.classId}
          studentId={scope.studentId}
        />
      ) : (
        <CoachingOverviewSection />
      )}
    </Wrapper>
  );
};

export default CoachingIndividualPage;
