import {
  ClassCoachingSection,
  CoachingOverviewSection,
  CoachingPageFrame,
} from '@widgets/coaching';
import { useLayoutContext } from '@widgets/layout/v2/LayoutContext';

export const CoachingClassPage = () => {
  const { scope } = useLayoutContext();

  return (
    <CoachingPageFrame title='학급 코칭'>
      {scope.classId ? (
        <ClassCoachingSection key={scope.classId} classId={scope.classId} />
      ) : (
        <CoachingOverviewSection />
      )}
    </CoachingPageFrame>
  );
};

export default CoachingClassPage;
