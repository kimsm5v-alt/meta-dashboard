import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LayoutV2 } from './LayoutV2';
import { MinimalLayout } from './MinimalLayout';
import { StudentLayout } from './StudentLayout';
import { PageLoading } from '../shared/components';
import { useAuth } from '../features/auth/context/AuthContext';

// ============================================================
// Feature Imports (신규 IA 기준)
// - 홈: 로고 클릭 시 진입
// - 검사: 검사관리 · 결과보기 · 학생 상담 · 변화추적
// - 코칭: 학급 코칭 · 개별 코칭 (독립 GNB)
// - 수업/AI: TBD
// ============================================================

// 홈 → teacher-dashboard
import { TeacherDashboardPage as HomePage } from '../features/teacher-dashboard';

// 검사 > 검사관리/결과보기/변화추적 → assessment (서브탭별로 분기)
import { AssessmentPage as ExamPage_ } from '../features/assessment';
const ExamManagementPage = ExamPage_;
const ExamResultPage = ExamPage_;
const ExamTrackingPage = ExamPage_;

// 검사 > 생활기록부 작성 → school-record
import { SchoolRecordPage } from '../features/school-record';

// 코칭 > 통합 코칭 페이지 (반/학생 선택에 따라 자동 전환)
import { CoachingPage, ClassCoachingPage, IndividualCoachingPage } from '../features/counseling-dashboard';

// 수업 → resources (TBD)
import { ResourceListPage as LessonPage } from '../features/resources';

// 학생 수업 결과보기 → student-resources
import { StudentResourcePage } from '../features/student-resources';

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
 * 프로토타입용: 인증 체크 비활성화
 */
const ProtectedLayoutV2 = () => {
  return (
    <LayoutV2>
      <Outlet />
    </LayoutV2>
  );
};

/**
 * 보호 라우트 래퍼 - 학생용
 * 프로토타입용: 인증 체크 비활성화
 */
const StudentProtectedLayout = () => {
  return (
    <StudentLayout>
      <Outlet />
    </StudentLayout>
  );
};

/**
 * 보호 라우트 래퍼 - 게스트용
 * 프로토타입용: 인증 체크 비활성화
 */
const GuestProtectedLayout = () => {
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
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/join/:code" element={<JoinGroupPage />} />
    </Route>

    {/* ========================================
        교사용 보호 라우트 - 신규 IA 레이아웃
    ======================================== */}
    <Route element={<ProtectedLayoutV2 />}>
      {/* 홈 (로고 클릭 시 진입) - GNB는 유지, LNB만 숨김 */}
      <Route path="/home" element={<HomePage />} />
      <Route path="/HOME" element={<HomePage />} />

      {/* 검사 (검사관리 · 결과보기 · 변화추적) */}
      <Route path="/exam" element={<Navigate to="/exam/management" replace />} />
      <Route path="/exam/management" element={<ExamManagementPage />} />
      <Route path="/exam/result" element={<ExamResultPage />} />
      <Route path="/exam/tracking" element={<ExamTrackingPage />} />
      <Route path="/exam/record" element={<SchoolRecordPage />} />

      {/* 코칭 - 통합 페이지 (반/학생 선택에 따라 자동 전환) */}
      <Route path="/coaching" element={<CoachingPage />} />
      {/* 레거시 경로 호환 */}
      <Route path="/coaching/class" element={<ClassCoachingPage />} />
      <Route path="/coaching/individual" element={<IndividualCoachingPage />} />

      {/* 수업 (TBD) */}
      <Route path="/lesson" element={<LessonPage />} />

      {/* AI 어시스턴트 - GNB 유지, 전체폭 렌더 (LayoutV2에서 사이드바/서브탭 숨김) */}
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
      <Route path="/student/lesson" element={<StudentResourcePage />} />
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
    <Route path="/schedule" element={<Navigate to="/exam/counseling" replace />} />
    <Route path="/counseling/*" element={<Navigate to="/coaching/class" replace />} />
    <Route path="/counseling-dashboard" element={<Navigate to="/coaching/class" replace />} />
    <Route path="/resources" element={<Navigate to="/lesson" replace />} />
    <Route path="/lesson/*" element={<Navigate to="/lesson" replace />} />
    <Route path="/community" element={<Navigate to="/home" replace />} />
    <Route path="/ai-room" element={<Navigate to="/ai-assistant" replace />} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/home" replace />} />
  </Routes>
);

export default AppRoutesV2;
