import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './Layout';
import { StudentLayout } from './StudentLayout';
import { MinimalLayout } from './MinimalLayout';
import { PageLoading } from '../shared/components';
import { useAuth } from '../features/auth/context/AuthContext';
import { FEATURES } from '../shared/config/features';

// Feature imports
import { TeacherDashboardPage } from '../features/teacher-dashboard';
import { ClassDashboardPage, ClassDetailAnalysisPage } from '../features/class-dashboard';
import { StudentDashboardPage } from '../features/student-dashboard';
import { AIRoomPage } from '../features/ai-room';
import { LandingPage } from '../features/landing';
import { LoginPage, SignUpPage, ForgotPasswordPage } from '../features/auth';
import { AssessmentPage } from '../features/assessment';
import { SchedulePage } from '../features/schedule';
import { ExamCodeEntryPage, ExamPage } from '../features/exam';

// 신규 Feature imports
import { GroupListPage, GroupDetailPage, JoinGroupPage } from '../features/groups';
import { CounselingDashboardPage } from '../features/counseling-dashboard';
import { ResourceListPage, ResourceDetailPage } from '../features/resources';
import { CommunityListPage, CommunityDetailPage, CommunityWritePage } from '../features/community';

// 학생용 Feature imports
import { MyExamListPage, MyResultPage, StudentGroupsPage } from '../features/student-exam';

// ============================================================
// 레이아웃 래퍼
// ============================================================

/**
 * 공개 라우트 래퍼 (사이드바 없음)
 */
const PublicLayout = () => (
  <MinimalLayout>
    <Outlet />
  </MinimalLayout>
);

/**
 * 보호 라우트 래퍼 - 교사용 (인증 필요 + 교사 사이드바)
 */
const ProtectedLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading text="로딩 중..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

/**
 * 보호 라우트 래퍼 - 학생용 (인증 필요 + 학생 사이드바)
 */
const StudentProtectedLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading text="로딩 중..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <StudentLayout>
      <Outlet />
    </StudentLayout>
  );
};

// ============================================================
// 라우트 정의
// ============================================================

export const AppRoutes = () => (
  <Routes>
    {/* 공개 라우트 - 사이드바 없음 */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/exam" element={<ExamCodeEntryPage />} />
      <Route path="/exam/:code" element={<ExamPage />} />
      <Route path="/join/:code" element={<JoinGroupPage />} />
    </Route>

    {/* 보호 라우트 - 사이드바 있음 */}
    <Route element={<ProtectedLayout />}>
      {/* 검사 영역 */}
      <Route path="/groups" element={<GroupListPage />} />
      <Route path="/groups/:groupId" element={<GroupDetailPage />} />
      <Route path="/assessment" element={<AssessmentPage />} />
      <Route path="/dashboard" element={<TeacherDashboardPage />} />
      <Route path="/dashboard/class/:classId" element={<ClassDashboardPage />} />
      <Route path="/dashboard/class/:classId/analysis" element={<ClassDetailAnalysisPage />} />
      <Route path="/dashboard/class/:classId/student/:studentId" element={<StudentDashboardPage />} />

      {/* 상담 영역 */}
      <Route path="/schedule" element={<SchedulePage />} />
      {FEATURES.COUNSELING_DASHBOARD && (
        <Route path="/counseling-dashboard" element={<CounselingDashboardPage />} />
      )}

      {/* 콘텐츠 영역 */}
      {FEATURES.RESOURCES && (
        <>
          <Route path="/resources" element={<ResourceListPage />} />
          <Route path="/resources/:resourceId" element={<ResourceDetailPage />} />
        </>
      )}
      {FEATURES.COMMUNITY && (
        <>
          <Route path="/community" element={<CommunityListPage />} />
          <Route path="/community/write" element={<CommunityWritePage />} />
          <Route path="/community/:postId" element={<CommunityDetailPage />} />
        </>
      )}

      {/* AI */}
      <Route path="/ai-room" element={<AIRoomPage />} />
    </Route>

    {/* 학생용 보호 라우트 - 학생 사이드바 */}
    <Route element={<StudentProtectedLayout />}>
      <Route path="/student/groups" element={<StudentGroupsPage />} />
      <Route path="/student/exams" element={<MyExamListPage />} />
      <Route path="/student/result" element={<MyResultPage />} />
      <Route path="/student/result/:resultId" element={<MyResultPage />} />
      <Route path="/exam/student" element={<ExamPage />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
