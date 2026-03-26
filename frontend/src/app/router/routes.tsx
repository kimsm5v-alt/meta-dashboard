import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '@widgets/layout/MainLayout';
import { MinimalLayout } from '@widgets/layout/MinimalLayout';
import { PageLoading } from '@shared/ui/Loading';
import { useAuth } from '@features/auth/model/AuthContext';
import { FEATURES } from '@shared/config/features';

// Page imports from pages layer
import { ErrorTestPage } from '@pages/dev/ErrorTestPage';
import {
  LandingPage,
  LoginPage,
  SignUpPage,
  ForgotPasswordPage,
  TeacherDashboardPage,
  ClassDashboardPage,
  ClassDetailAnalysisPage,
  StudentDashboardPage,
  AIRoomPage,
  AssessmentPage,
  SchedulePage,
  ExamCodeEntryPage,
  ExamPage,
  GroupListPage,
  GroupDetailPage,
  JoinGroupPage,
  CounselingDashboardPage,
  ResourceListPage,
  ResourceDetailPage,
  CommunityListPage,
  CommunityDetailPage,
  CommunityWritePage,
} from '@pages/index';

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
    return <PageLoading text='로딩 중...' />;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

// ============================================================
// 라우트 정의
// ============================================================

export const AppRoutes = () => (
  <Routes>
    {/* 공개 라우트 - 사이드바 없음 */}
    <Route element={<PublicLayout />}>
      <Route path='/' element={<LandingPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/signup' element={<SignUpPage />} />
      <Route path='/forgot-password' element={<ForgotPasswordPage />} />
      <Route path='/exam' element={<ExamCodeEntryPage />} />
      <Route path='/exam/:code' element={<ExamPage />} />
      <Route path='/join/:code' element={<JoinGroupPage />} />
    </Route>

    {/* 보호 라우트 - 사이드바 있음 */}
    <Route element={<ProtectedLayout />}>
      {/* 검사 영역 */}
      <Route path='/groups' element={<GroupListPage />} />
      <Route path='/groups/:groupId' element={<GroupDetailPage />} />
      <Route path='/assessment' element={<AssessmentPage />} />
      <Route path='/dashboard' element={<TeacherDashboardPage />} />
      <Route path='/dashboard/class/:classId' element={<ClassDashboardPage />} />
      <Route path='/dashboard/class/:classId/analysis' element={<ClassDetailAnalysisPage />} />
      <Route
        path='/dashboard/class/:classId/student/:studentId'
        element={<StudentDashboardPage />}
      />

      {/* 상담 영역 */}
      <Route path='/schedule' element={<SchedulePage />} />
      {FEATURES.COUNSELING_DASHBOARD && (
        <Route path='/counseling-dashboard' element={<CounselingDashboardPage />} />
      )}

      {/* 콘텐츠 영역 */}
      {FEATURES.RESOURCES && (
        <>
          <Route path='/resources' element={<ResourceListPage />} />
          <Route path='/resources/:resourceId' element={<ResourceDetailPage />} />
        </>
      )}
      {FEATURES.COMMUNITY && (
        <>
          <Route path='/community' element={<CommunityListPage />} />
          <Route path='/community/write' element={<CommunityWritePage />} />
          <Route path='/community/:postId' element={<CommunityDetailPage />} />
        </>
      )}

      {/* AI */}
      <Route path='/ai-room' element={<AIRoomPage />} />
    </Route>

    {/* 개발용 — 프로덕션 빌드에서도 접근 가능하지만 링크 미노출 */}
    <Route path='/dev/errors' element={<ErrorTestPage />} />

    {/* Fallback */}
    <Route path='*' element={<Navigate to='/' replace />} />
  </Routes>
);

export default AppRoutes;
