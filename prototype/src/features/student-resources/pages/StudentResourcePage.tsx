/**
 * 학생 수업 자료실(수업 결과보기) 페이지 — 학생 모드 진입점.
 * 교사용 resources(/lesson)에서 분리한 학생 전용 feature.
 *
 * 화면5: 대시보드(5-1) ↔ 상세(5-2) 를 내부 state 로 전환.
 * 라우팅: /student/lesson (StudentLayout LNB "수업 결과보기"). — app/routesV2 연결.
 */
import { useState } from 'react';
import { StudentResourceProvider, useStudentResource } from '../store/StudentResourceContext';
import { StudentBanner } from '../components';
import { StudentReportDashboard } from '../components/StudentReportDashboard';
import { StudentDetailReport } from '../components/StudentDetailReport';

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

const StudentResourceInner = () => {
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-xs text-gray-400">수업 › 수업 결과보기</div>
      <div className="mt-5 flex flex-col gap-5">
        {detailId ? (
          <StudentDetailReport id={detailId} onBack={() => setDetailId(null)} />
        ) : (
          <>
            <StudentBanner />
            <StudentReportDashboard onOpen={setDetailId} />
          </>
        )}
      </div>
    </div>
  );
};

export const StudentResourcePage = () => (
  <StudentResourceProvider>
    <StudentResourceInner />
    <Toast />
  </StudentResourceProvider>
);
