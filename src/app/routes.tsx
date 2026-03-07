import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './Layout';
import { MinimalLayout } from './MinimalLayout';
import { PageLoading } from '../shared/components';
import { useAuth } from '../features/auth/context/AuthContext';

// Feature imports
import { TeacherDashboardPage } from '../features/teacher-dashboard';
import { ClassDashboardPage, ClassDetailAnalysisPage } from '../features/class-dashboard';
import { StudentDashboardPage } from '../features/student-dashboard';
import { AIRoomPage } from '../features/ai-room';
import { LandingPage } from '../features/landing';
import { LoginPage } from '../features/auth';
import { AssessmentPage } from '../features/assessment';
import { SchedulePage } from '../features/schedule';
import { ExamCodeEntryPage, ExamPage } from '../features/exam';

// 신규 Feature imports
import { GroupListPage, GroupDetailPage, JoinGroupPage } from '../features/groups';
import { CounselingDashboardPage } from '../features/counseling-dashboard';
import { ResourceListPage, ResourceDetailPage } from '../features/resources';
import { CommunityListPage, CommunityDetailPage, CommunityWritePage } from '../features/community';

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
 * 보호 라우트 래퍼 (인증 필요 + 사이드바)
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

// ============================================================
// 라우트 정의
// ============================================================

export const AppRoutes = () => (
  <Routes>
    {/* 공개 라우트 - 사이드바 없음 */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
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
      <Route path="/counseling-dashboard" element={<CounselingDashboardPage />} />

      {/* 콘텐츠 영역 */}
      <Route path="/resources" element={<ResourceListPage />} />
      <Route path="/resources/:resourceId" element={<ResourceDetailPage />} />
      <Route path="/community" element={<CommunityListPage />} />
      <Route path="/community/write" element={<CommunityWritePage />} />
      <Route path="/community/:postId" element={<CommunityDetailPage />} />

      {/* AI */}
      <Route path="/ai-room" element={<AIRoomPage />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
