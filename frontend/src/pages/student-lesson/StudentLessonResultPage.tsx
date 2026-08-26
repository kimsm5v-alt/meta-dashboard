import {
  StudentLessonBanner,
  StudentLessonResultShell,
  StudentReportDashboard,
} from '@widgets/lesson';

export const StudentLessonResultPage = () => (
  <StudentLessonResultShell>
    <StudentLessonBanner />
    <StudentReportDashboard />
  </StudentLessonResultShell>
);

export default StudentLessonResultPage;
