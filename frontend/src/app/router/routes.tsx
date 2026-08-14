import { Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { MainLayout } from '@widgets/layout/MainLayout';
import { MainLayoutV2 } from '@widgets/layout/v2/MainLayoutV2';
import { V2Placeholder } from '@widgets/layout/v2/V2Placeholder';
import { MinimalLayout } from '@widgets/layout/MinimalLayout';
import { StudentLayout } from '@widgets/layout/StudentLayout';
import { CaptureOverlay } from '@widgets/screen-capture';
import { PageLoading } from '@shared/ui/Loading';
import { useAuth } from '@features/auth/model/AuthContext';
import { useProfileCheck } from '@shared/hooks/useProfileCheck';
import { FEATURES } from '@shared/config/features';

// Page imports from pages layer
import { ErrorTestPage } from '@pages/dev/ErrorTestPage';
import { SsePocPage } from '@pages/dev/SsePocPage';
import { HomePage } from '@pages/home/HomePage';
import { ExamTrackingPage } from '@pages/exam-tracking/ExamTrackingPage';
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
  LessonLibraryPage,
  LessonMyPage,
  LessonResultPage,
  LessonDeployPage,
  LessonEditorPage,
  LessonViewerPage,
} from '@pages/index';

// ============================================================
// 레이아웃 래퍼
// ============================================================

/** /groups/:groupId → /assessment/:groupId 리다이렉트 */
const GroupDetailRedirect = () => {
  const { groupId } = useParams<{ groupId: string }>();
  return FEATURES.IA_V2 ? (
    <Navigate to={`/exam/management?class=${encodeURIComponent(groupId ?? '')}`} replace />
  ) : (
    <Navigate to={`/assessment/${groupId}`} replace />
  );
};

/**
 * 공개 라우트 래퍼 (사이드바 없음)
 */
const PublicLayout = () => (
  <MinimalLayout>
    <Outlet />
  </MinimalLayout>
);

/** 교사 라우트 공통 인증/권한 검사. 화면 레이아웃은 하위 Route에서 선택한다. */
const TeacherAuthGuard = () => {
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

  return <Outlet />;
};

/** GNB와 LNB를 사용하는 일반 교사 화면 레이아웃. */
const TeacherShellLayout = () => {
  const location = useLocation();
  const TeacherLayout = FEATURES.IA_V2 ? MainLayoutV2 : MainLayout;

  return (
    <TeacherLayout>
      <Outlet />
      {!location.pathname.startsWith('/ai-assistant') && <CaptureOverlay />}
    </TeacherLayout>
  );
};

/**
 * GNB, LNB, 플로팅 어시스턴트, 화면 캡처가 없는 집중형 교사 화면 레이아웃.
 * 수업 실행/발표/미리보기처럼 전체 화면이 필요한 라우트를 이 레이아웃 아래에 둔다.
 */
export const TeacherFullscreenLayout = () => (
  <MinimalLayout>
    <Outlet />
  </MinimalLayout>
);

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

    {/* 보호 라우트 - 교사 인증/권한을 먼저 검사하고 화면별 레이아웃을 선택 */}
    <Route element={<TeacherAuthGuard />}>
      {/* 일반 교사 화면: GNB + LNB */}
      <Route element={<TeacherShellLayout />}>
        {/* 검사 영역 */}
        <Route
          path='/groups'
          element={<Navigate to={FEATURES.IA_V2 ? '/exam/management' : '/assessment'} replace />}
        />
        <Route path='/groups/:groupId' element={<GroupDetailRedirect />} />
        <Route
          path='/assessment'
          element={FEATURES.IA_V2 ? <Navigate to='/exam/management' replace /> : <AssessmentPage />}
        />
        <Route path='/assessment/:groupId' element={<AssessmentPage />} />

        {/* 대시보드 — testId 분기 */}
        <Route
          path='/dashboard'
          element={<Navigate to={FEATURES.IA_V2 ? '/home' : '/dashboard/comprehensive'} replace />}
        />
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
        <Route
          path='/ai-room'
          element={FEATURES.IA_V2 ? <Navigate to='/ai-assistant' replace /> : <AIRoomPage />}
        />

        {FEATURES.IA_V2 && (
          <>
            {/* v2 IA shell. 상세 화면은 각 후속 phase에서 교체한다. */}
            <Route path='/home' element={<HomePage />} />

            <Route path='/exam/management' element={<AssessmentPage />} />
            <Route path='/exam/result' element={<TeacherDashboardPage />} />
            <Route path='/exam/tracking' element={<ExamTrackingPage />} />
            <Route path='/exam/record' element={<V2Placeholder title='생활기록부 작성' />} />

            <Route path='/coaching/class' element={<V2Placeholder title='학급 코칭' />} />
            <Route path='/coaching/individual' element={<V2Placeholder title='개별 코칭' />} />

            <Route path='/lesson/library' element={<LessonLibraryPage />} />
            <Route path='/lesson/my' element={<LessonMyPage />} />
            <Route path='/lesson/result' element={<LessonResultPage />} />

            <Route path='/ai-assistant' element={<AIRoomPage />} />
          </>
        )}
      </Route>

      {/* 집중형 교사 화면은 확정된 수업 라우트를 TeacherFullscreenLayout으로 감싸서 추가한다. */}
      <Route element={<TeacherFullscreenLayout />}>
      
      {FEATURES.IA_V2 && (
          <>
            <Route path='/lesson/deploy/:itemId' element={<LessonDeployPage />} />
            <Route path='/lesson/editor' element={<LessonEditorPage />} />
            <Route path='/lesson/editor/:setId' element={<LessonEditorPage />} />
            <Route path='/lesson/viewer/:slideId' element={<LessonViewerPage />} />
          </>
        )}
      </Route>
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

    {/* <Route path='/lesson/library' element={<LessonLibraryPage />} /> */}

    {/* Fallback */}
    <Route path='*' element={<Navigate to='/' replace />} />
  </Routes>
);

export default AppRoutes;
