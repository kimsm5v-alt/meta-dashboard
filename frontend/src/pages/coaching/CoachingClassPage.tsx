import styled from '@emotion/styled';
import { ClassCoachingSection, CoachingOverviewSection } from '@widgets/coaching';
import { useLayoutContext } from '@widgets/layout/v2/LayoutContext';

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const CoachingClassPage = () => {
  const { scope } = useLayoutContext();

  return (
    <Wrapper>
      {scope.classId ? (
        <ClassCoachingSection key={scope.classId} classId={scope.classId} />
      ) : (
        <CoachingOverviewSection />
      )}
    </Wrapper>
  );
};

export default CoachingClassPage;
