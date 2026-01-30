import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './Layout';
import { MinimalLayout } from './MinimalLayout';
import { PageLoading } from '../shared/components';
import { useAuth } from '../features/auth/context/AuthContext';

// Feature imports
import { UploadPage } from '../features/upload';
import { TeacherDashboardPage } from '../features/teacher-dashboard';
import { ClassDashboardPage } from '../features/class-dashboard';
import { StudentDashboardPage } from '../features/student-dashboard';
import { AIRoomPage } from '../features/ai-room';
import { LandingPage } from '../features/landing';
import { LoginPage } from '../features/auth';
import { AssessmentPage } from '../features/assessment';
import { SchedulePage } from '../features/schedule';

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
    </Route>

    {/* 보호 라우트 - 사이드바 있음 */}
    <Route element={<ProtectedLayout />}>
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/assessment" element={<AssessmentPage />} />
      <Route path="/dashboard" element={<TeacherDashboardPage />} />
      <Route path="/dashboard/class/:classId" element={<ClassDashboardPage />} />
      <Route path="/dashboard/class/:classId/student/:studentId" element={<StudentDashboardPage />} />
      <Route path="/ai-room" element={<AIRoomPage />} />
      <Route path="/schedule" element={<SchedulePage />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
