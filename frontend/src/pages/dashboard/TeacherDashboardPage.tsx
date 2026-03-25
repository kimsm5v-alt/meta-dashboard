import { PageTitle } from '@shared/ui';
import { StatsOverview, ClassList } from '@widgets/dashboard';

export const TeacherDashboardPage = () => {
  return (
    <div>
      <PageTitle title='대시보드' subtitle='전체 학급 현황을 한눈에 확인하세요' />
      <StatsOverview />
      <ClassList />
    </div>
  );
};
