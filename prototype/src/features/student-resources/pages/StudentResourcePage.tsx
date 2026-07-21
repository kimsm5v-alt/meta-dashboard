/**
 * 학생 수업 자료실 페이지 — 학생 모드 진입점.
 * 교사용 resources(/lesson)에서 분리한 학생 전용 feature.
 *
 * TODO(routing): app/routes 연결은 팀 논의 후 결정.
 *   - 교사 /lesson 과 분리된 학생 전용 경로 필요 (예: /student/lesson).
 *   - student-exam·student-dashboard 처럼 학생 라우트 그룹/레이아웃에 편입.
 *   - 라우팅 확정 전까지 이 페이지는 어느 라우트에도 마운트되지 않음.
 */
import { StudentResourceProvider, useStudentResource } from '../store/StudentResourceContext';
import { StudentView } from '../components';

/** 토스트 (목업 toast() 대체) */
const Toast = () => {
  const { toastMsg } = useStudentResource();
  if (!toastMsg) return null;
  return (
    <div className="fixed bottom-8 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-gray-900/90 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
      {toastMsg}
    </div>
  );
};

export const StudentResourcePage = () => (
  <StudentResourceProvider>
    <div className="text-xs text-gray-400">수업 › 학생 화면</div>
    <StudentView />
    <Toast />
  </StudentResourceProvider>
);
