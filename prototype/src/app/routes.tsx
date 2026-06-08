import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { Layout } from './Layout';
import { StudentLayout } from './StudentLayout';
import { MinimalLayout } from './MinimalLayout';
import { PageLoading } from '../shared/components';
import { useAuth } from '../features/auth/context/AuthContext';
import { FEATURES } from '../shared/config/features';

/**
 * /exam/:code → /join/:code 리다이렉트 컴포넌트
 * 기존 4자리 검사코드 URL을 새로운 inviteCode 기반 URL로 리다이렉트
 */
const ExamToJoinRedirect = () => {
  const { code } = useParams<{ code: string }>();
  return <Navigate to={`/join/${code}`} replace />;
};

// Feature imports
import { TeacherDashboardPage } from '../features/teacher-dashboard';
import { ClassDashboardPage, ClassDetailAnalysisPage } from '../features/class-dashboard-v2';
import { StudentDashboardPage } from '../features/student-dashboard';
import { AIRoomPage } from '../features/ai-room';
import { LandingPage } from '../features/landing';
import { LoginPage, SignUpPage, ForgotPasswordPage } from '../features/auth';
// 기존 검사 페이지 (레거시)
// import { AssessmentPage } from '../features/assessment';

// 검사하기 V2 (그룹 관리 + 검사하기 통합)
import { AssessmentPageV2 } from '../features/assessment-v2';
import { SchedulePage } from '../features/schedule';
import { ExamPage } from '../features/exam';

// 신규 Feature imports
import { GroupListPage, GroupDetailPage, JoinGroupPage } from '../features/groups';
import { CounselingDashboardPage } from '../features/counseling-dashboard';
import { ResourceListPage, ResourceDetailPage } from '../features/resources';
import { CommunityListPage, CommunityDetailPage, CommunityWritePage } from '../features/community';

// 학생용 Feature imports
import { MyExamListPage, MyResultPage, MySelfregResultPage, StudentGroupsPage } from '../features/student-exam';

// 게스트용 Feature imports
import { GuestExamListPage, GuestCompletePage } from '../features/guest-exam';

// 알림 UI Mock (로그인 우회, 디자인 전용)
import {
  TeacherNotificationMockPage,
  StudentNotificationMockPage,
} from '../features/notifications-mock';

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

/**
 * 보호 라우트 래퍼 - 게스트용 (게스트 인증 필요 + 사이드바 없음)
 */
const GuestProtectedLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <PageLoading text="로딩 중..." />;
  }

  // 게스트 인증 체크
  if (!isAuthenticated || user?.memberType !== 'guest') {
    return <Navigate to="/" replace />;
  }

  return (
    <MinimalLayout>
      <Outlet />
    </MinimalLayout>
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
      {/* /exam/:code는 폐기 - /join/:code로 리다이렉트 */}
      <Route path="/exam/:code" element={<ExamToJoinRedirect />} />
      <Route path="/join/:code" element={<JoinGroupPage />} />

      {/* 알림 UI Mock — 로그인 우회, 디자인 전용 */}
      <Route path="/mock/notifications/teacher" element={<TeacherNotificationMockPage />} />
      <Route path="/mock/notifications/student" element={<StudentNotificationMockPage />} />
    </Route>

    {/* 보호 라우트 - 사이드바 있음 */}
    <Route element={<ProtectedLayout />}>
      {/* 검사 영역 - 그룹 관리 + 검사하기 통합 */}
      <Route path="/assessment" element={<AssessmentPageV2 />} />
      {/* 레거시 그룹 라우트 → /assessment로 리다이렉트 */}
      <Route path="/groups" element={<Navigate to="/assessment" replace />} />
      <Route path="/groups/:groupId" element={<Navigate to="/assessment" replace />} />
      {/* 결과보기 영역 */}
      <Route path="/dashboard" element={<Navigate to="/dashboard/comprehensive" replace />} />
      {/* 학습종합검사 */}
      <Route path="/dashboard/comprehensive" element={<TeacherDashboardPage testId="comprehensive" />} />
      <Route path="/dashboard/comprehensive/class/:classId" element={<ClassDashboardPage testId="comprehensive" />} />
      <Route path="/dashboard/comprehensive/class/:classId/student/:studentId" element={<StudentDashboardPage testId="comprehensive" />} />
      {/* 자기조절학습검사 */}
      <Route path="/dashboard/selfreg" element={<TeacherDashboardPage testId="selfreg" />} />
      <Route path="/dashboard/selfreg/class/:classId" element={<ClassDashboardPage testId="selfreg" />} />
      <Route path="/dashboard/selfreg/class/:classId/student/:studentId" element={<StudentDashboardPage testId="selfreg" />} />
      {/* 레거시 경로 지원 */}
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
      {/* 학생 결과보기 - 학습종합검사 */}
      <Route path="/student/result" element={<Navigate to="/student/result/comprehensive" replace />} />
      <Route path="/student/result/comprehensive" element={<MyResultPage />} />
      <Route path="/student/result/comprehensive/:resultId" element={<MyResultPage />} />
      {/* 학생 결과보기 - 자기조절학습검사 */}
      <Route path="/student/result/selfreg" element={<MySelfregResultPage />} />
      <Route path="/student/result/selfreg/:resultId" element={<MySelfregResultPage />} />
      <Route path="/exam/student" element={<ExamPage />} />
    </Route>

    {/* 게스트용 보호 라우트 - 사이드바 없음 */}
    <Route element={<GuestProtectedLayout />}>
      <Route path="/guest/exams" element={<GuestExamListPage />} />
      <Route path="/guest/exam" element={<ExamPage />} />
      <Route path="/guest/complete" element={<GuestCompletePage />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
