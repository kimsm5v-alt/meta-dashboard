import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LayoutV2 } from './LayoutV2';
import { MinimalLayout } from './MinimalLayout';
import { StudentLayout } from './StudentLayout';
import { PageLoading } from '../shared/components';
import { useAuth } from '../features/auth/context/AuthContext';

// ============================================================
// Feature Imports (신규 IA 기준 - 기존 폴더 활용)
// ============================================================

// 홈 → teacher-dashboard
import { TeacherDashboardPage as HomePage } from '../features/teacher-dashboard';

// 검사 > 검사관리 → assessment
import { AssessmentPage as ExamManagementPage } from '../features/assessment';
// 검사 > 결과보기 → class-dashboard
import { ClassDashboardPage as ExamResultPage } from '../features/class-dashboard';
// 검사 > 변화추적 (신규 - 임시 placeholder)
const ExamTrackingPage = () => <div className="p-8 text-center text-gray-500">변화추적 (개발 예정)</div>;

// 상담·코칭 > 학생 상담 → schedule
import { SchedulePage as CounselingPage } from '../features/schedule';
// 상담·코칭 > 코칭 → counseling-dashboard
import { CounselingDashboardPage as CoachingPage } from '../features/counseling-dashboard';

// 수업 > 수업 자료실 → resources
import { ResourceListPage as LessonResourcesPage } from '../features/resources';
// 수업 > 나의 수업 (신규 - 임시 placeholder)
const MyLessonPage = () => <div className="p-8 text-center text-gray-500">나의 수업 (개발 예정)</div>;

// AI어시스턴트 → ai-room
import { AIRoomPage as AIAssistantPage } from '../features/ai-room';

// 그룹관리 → groups
import { GroupListPage as GroupManagementPage } from '../features/groups';

// 기존 기능 (호환성 유지)
import { LandingPage } from '../features/landing';
import { LoginPage, SignUpPage, ForgotPasswordPage } from '../features/auth';
import { ExamPage } from '../features/exam';
import { JoinGroupPage } from '../features/groups';
import { MyExamListPage, MyResultPage, MySelfregResultPage, StudentGroupsPage, PreExamFlowPage } from '../features/student-exam';
import { GuestExamListPage, GuestCompletePage } from '../features/guest-exam';

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
 * 보호 라우트 래퍼 - 교사용 V2 (신규 GNB/LNB 레이아웃)
 */
const ProtectedLayoutV2 = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading text="로딩 중..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <LayoutV2>
      <Outlet />
    </LayoutV2>
  );
};

/**
 * 보호 라우트 래퍼 - 학생용
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
 * 보호 라우트 래퍼 - 게스트용
 */
const GuestProtectedLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <PageLoading text="로딩 중..." />;
  }

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
// 라우트 정의 (신규 IA 기준)
// ============================================================

export const AppRoutesV2 = () => (
  <Routes>
    {/* ========================================
        공개 라우트 - 사이드바 없음
    ======================================== */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/join/:code" element={<JoinGroupPage />} />
    </Route>

    {/* ========================================
        교사용 보호 라우트 - 신규 IA 레이아웃
    ======================================== */}
    <Route element={<ProtectedLayoutV2 />}>
      {/* 홈 */}
      <Route path="/home" element={<HomePage />} />

      {/* 검사 */}
      <Route path="/exam" element={<Navigate to="/exam/management" replace />} />
      <Route path="/exam/management" element={<ExamManagementPage />} />
      <Route path="/exam/result" element={<ExamResultPage />} />
      <Route path="/exam/tracking" element={<ExamTrackingPage />} />

      {/* 상담·코칭 */}
      <Route path="/counseling" element={<Navigate to="/counseling/student" replace />} />
      <Route path="/counseling/student" element={<CounselingPage />} />
      <Route path="/counseling/coaching" element={<CoachingPage />} />

      {/* 수업 */}
      <Route path="/lesson" element={<Navigate to="/lesson/resources" replace />} />
      <Route path="/lesson/resources" element={<LessonResourcesPage />} />
      <Route path="/lesson/my-lesson" element={<MyLessonPage />} />

      {/* AI어시스턴트 */}
      <Route path="/ai-assistant" element={<AIAssistantPage />} />

      {/* 그룹관리 */}
      <Route path="/group-management" element={<GroupManagementPage />} />
    </Route>

    {/* ========================================
        학생용 보호 라우트
    ======================================== */}
    <Route element={<StudentProtectedLayout />}>
      <Route path="/student/groups" element={<StudentGroupsPage />} />
      <Route path="/student/exams" element={<MyExamListPage />} />
      <Route path="/student/exam/prepare" element={<PreExamFlowPage />} />
      <Route path="/student/result" element={<Navigate to="/student/result/comprehensive" replace />} />
      <Route path="/student/result/comprehensive" element={<MyResultPage />} />
      <Route path="/student/result/comprehensive/:resultId" element={<MyResultPage />} />
      <Route path="/student/result/selfreg" element={<MySelfregResultPage />} />
      <Route path="/student/result/selfreg/:resultId" element={<MySelfregResultPage />} />
      <Route path="/exam/student" element={<ExamPage />} />
    </Route>

    {/* ========================================
        게스트용 보호 라우트
    ======================================== */}
    <Route element={<GuestProtectedLayout />}>
      <Route path="/guest/exams" element={<GuestExamListPage />} />
      <Route path="/guest/exam" element={<ExamPage />} />
      <Route path="/guest/complete" element={<GuestCompletePage />} />
    </Route>

    {/* ========================================
        Fallback & 레거시 리다이렉트
    ======================================== */}
    {/* 기존 경로 호환성 유지 */}
    <Route path="/assessment" element={<Navigate to="/exam/management" replace />} />
    <Route path="/dashboard/*" element={<Navigate to="/exam/result" replace />} />
    <Route path="/schedule" element={<Navigate to="/counseling/student" replace />} />
    <Route path="/counseling-dashboard" element={<Navigate to="/counseling/coaching" replace />} />
    <Route path="/resources" element={<Navigate to="/lesson/resources" replace />} />
    <Route path="/community" element={<Navigate to="/home" replace />} />
    <Route path="/ai-room" element={<Navigate to="/ai-assistant" replace />} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/home" replace />} />
  </Routes>
);

export default AppRoutesV2;
