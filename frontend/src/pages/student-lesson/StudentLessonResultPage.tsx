import { useMemo } from 'react';
import { useMyActivitiesQuery } from '@features/lesson';
import { PageLoading } from '@shared/ui/Loading';
import {
  StudentLessonBanner,
  StudentLessonResultShell,
  StudentReportDashboard,
} from '@widgets/lesson';

export const StudentLessonResultPage = () => {
  const { data, isPending, isError } = useMyActivitiesQuery();

  const { openActivity, listItems } = useMemo(() => {
    const activities = data ?? [];
    return {
      openActivity: activities.find((item) => item.availability === 'OPEN'),
      listItems: activities.filter((item) => item.availability !== 'OPEN'),
    };
  }, [data]);

  if (isPending) {
    return (
      <StudentLessonResultShell>
        <PageLoading text='수업 목록을 불러오는 중...' />
      </StudentLessonResultShell>
    );
  }

  if (isError) {
    return (
      <StudentLessonResultShell>
        <p>수업 목록을 불러오지 못했습니다.</p>
      </StudentLessonResultShell>
    );
  }

  return (
    <StudentLessonResultShell>
      {openActivity ? <StudentLessonBanner activity={openActivity} /> : null}
      <StudentReportDashboard items={listItems} />
    </StudentLessonResultShell>
  );
};

export default StudentLessonResultPage;
