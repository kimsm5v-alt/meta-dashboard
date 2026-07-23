import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { MainLayout } from '@widgets/layout/MainLayout';
import { MinimalLayout } from '@widgets/layout/MinimalLayout';
import { StudentLayout } from '@widgets/layout/StudentLayout';
import { CaptureOverlay, FloatingCaptureButton } from '@widgets/screen-capture';
import { PageLoading } from '@shared/ui/Loading';
import { useAuth } from '@features/auth/model/AuthContext';
import { useProfileCheck } from '@shared/hooks/useProfileCheck';
import { FEATURES } from '@shared/config/features';

// Page imports from pages layer
import { ErrorTestPage } from '@pages/dev/ErrorTestPage';
import { SsePocPage } from '@pages/dev/SsePocPage';
import {
  LandingPage,
  LoginPage,
  TeacherDashboardPage,
  ClassDashboardPage,
  ClassDetailAnalysisPage,
  StudentDashboardPage,
  SelfregStudentDashboardPage,
  AIRoomPage,
  AssessmentPage,
  SchedulePage,
  ExamCodeEntryPage,
  ExamPage,
  CounselingDashboardPage,
  ResourceListPage,
  ResourceDetailPage,
  CommunityListPage,
  CommunityDetailPage,
  CommunityWritePage,
  // GuestExamListPage, // 게스트 기능 제외
  // GuestCompletePage,
  StudentGroupsPage,
  MyExamListPage,
  MyResultPage,
  MySelfregResultPage,
} from '@pages/index';

// ============================================================
// 레이아웃 래퍼
// ============================================================

/** /groups/:groupId → /assessment/:groupId 리다이렉트 */
const GroupDetailRedirect = () => {
  const { groupId } = useParams<{ groupId: string }>();
  return <Navigate to={`/assessment/${groupId}`} replace />;
};

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
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isChecking } = useProfileCheck(isAuthenticated);

  if (isLoading || isChecking) {
    return <PageLoading text='로딩 중...' />;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  // 학생이 교사 경로 접근 시 학생 전용 경로로 강제 이동
  if (user?.roleCode === 'STUDENT') {
    return <Navigate to='/student/exams' replace />;
  }

  return (
    <MainLayout>
      <Outlet />
      <FloatingCaptureButton />
      <CaptureOverlay />
    </MainLayout>
  );
};

/**
 * 보호 라우트 래퍼 - 학생용 (인증 필요 + 학생 사이드바)
 */
const StudentProtectedLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isChecking } = useProfileCheck(isAuthenticated);

  if (isLoading || isChecking) {
    return <PageLoading text='로딩 중...' />;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  // 교사가 학생 경로 접근 시 교사 대시보드로 강제 이동
  if (user?.roleCode && user.roleCode !== 'STUDENT') {
    return <Navigate to='/dashboard' replace />;
  }

  return (
    <StudentLayout>
      <Outlet />
    </StudentLayout>
  );
};

/**
 * 보호 라우트 래퍼 - 게스트용 (게스트 인증 필요 + 사이드바 없음)
 */
/* 게스트 기능 제외 (기획 결정)
const GuestProtectedLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoading text='로딩 중...' />;
  if (!isAuthenticated || user?.memberType !== 'guest') return <Navigate to='/' replace />;
  return <MinimalLayout><Outlet /></MinimalLayout>;
};
*/

// ============================================================
// 라우트 정의
// ============================================================

export const AppRoutes = () => (
  <Routes>
    {/* 루트: 미인증이면 랜딩 페이지, 인증 상태면 LandingPage 내부에서 대시보드로 리다이렉트 */}
    <Route path='/' element={<LandingPage />} />

    {/* 공개 라우트 - 사이드바 없음 */}
    <Route element={<PublicLayout />}>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/exam' element={<ExamCodeEntryPage />} />
      <Route path='/exam/:code' element={<ExamPage />} />
      {/* /join/:code 제거 — 그룹 참여(초대링크)는 mypage(SSO)로 이관 (group-from-idp) */}
    </Route>

    {/* 보호 라우트 - 사이드바 있음 */}
    <Route element={<ProtectedLayout />}>
      {/* 검사 영역 */}
      <Route path='/groups' element={<Navigate to='/assessment' replace />} />
      <Route path='/groups/:groupId' element={<GroupDetailRedirect />} />
      <Route path='/assessment' element={<AssessmentPage />} />
      <Route path='/assessment/:groupId' element={<AssessmentPage />} />

      {/* 대시보드 — testId 분기 */}
      <Route path='/dashboard' element={<Navigate to='/dashboard/comprehensive' replace />} />
      <Route path='/dashboard/comprehensive' element={<TeacherDashboardPage />} />
      <Route path='/dashboard/selfreg' element={<TeacherDashboardPage />} />
      <Route path='/dashboard/:testId/class/:classId' element={<ClassDashboardPage />} />
      <Route
        path='/dashboard/:testId/class/:classId/analysis'
        element={<ClassDetailAnalysisPage />}
      />
      {/* 자기조절검사 학생 상세 — selfreg 전용 (generic 라우트보다 먼저 등록) */}
      <Route
        path='/dashboard/selfreg/class/:classId/student/:studentId'
        element={<SelfregStudentDashboardPage />}
      />
      <Route
        path='/dashboard/:testId/class/:classId/student/:studentId'
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

    {/* 게스트 라우트 비활성화 (기획 결정: 게스트 기능 제외) */}
    {/* <Route element={<GuestProtectedLayout />}>
      <Route path='/guest/exams' element={<GuestExamListPage />} />
      <Route path='/guest/exam' element={<ExamPage />} />
      <Route path='/guest/complete' element={<GuestCompletePage />} />
    </Route> */}

    {/* 학생 라우트 - 학생 사이드바, 일반 인증 필요 */}
    <Route element={<StudentProtectedLayout />}>
      <Route path='/student/groups' element={<StudentGroupsPage />} />
      <Route path='/student/exams' element={<MyExamListPage />} />
      <Route
        path='/student/result'
        element={<Navigate to='/student/result/comprehensive' replace />}
      />
      <Route path='/student/result/comprehensive' element={<MyResultPage />} />
      <Route path='/student/result/comprehensive/:resultId' element={<MyResultPage />} />
      <Route path='/student/result/selfreg' element={<MySelfregResultPage />} />
      <Route path='/student/result/selfreg/:resultId' element={<MySelfregResultPage />} />
      <Route path='/exam/student' element={<ExamPage />} />
    </Route>

    {/* 개발용 — 프로덕션 빌드에서도 접근 가능하지만 링크 미노출 */}
    <Route path='/dev/errors' element={<ErrorTestPage />} />
    <Route path='/dev/sse' element={<SsePocPage />} />

    {/* Fallback */}
    <Route path='*' element={<Navigate to='/' replace />} />
  </Routes>
);

export default AppRoutes;
