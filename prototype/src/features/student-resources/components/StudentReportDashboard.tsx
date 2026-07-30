/**
 * 학생 리포트 5-1 대시보드 — 배정된 활동 리스트 (제출 상태 + 마감일 + 정답률).
 * 완료 활동만 상세(5-2)로 진입.
 */
import { Calendar, ChevronRight } from 'lucide-react';
import { STUDENT_REPORTS, STUDENT_REPORT_DETAILS } from '../mock-data';
import { useStudentResource } from '../store/StudentResourceContext';
import { StudentStatusBadge } from './badges';

export const StudentReportDashboard = ({ onOpen }: { onOpen: (id: string) => void }) => {
  const { toast } = useStudentResource();

  const handle = (id: string, hasDetail: boolean) => {
    if (hasDetail) onOpen(id);
    else toast('아직 제출하지 않은 활동이에요.');
  };

  return (
    <div>
      <h2 className="mb-3 text-lg font-extrabold tracking-tight text-gray-900">나의 수업 결과</h2>
      <div className="flex flex-col gap-2">
        {STUDENT_REPORTS.map((r) => {
          const hasDetail = !!STUDENT_REPORT_DETAILS[r.id];
          const showRate = r.status === '완료' && typeof r.correctRate === 'number';
          return (
            <button
              key={r.id}
              onClick={() => handle(r.id, hasDetail)}
              className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors ${
                hasDetail ? 'hover:border-primary-200 hover:bg-primary-50/30' : 'opacity-80'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-gray-900">{r.title}</span>
                  <StudentStatusBadge status={r.status} />
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    마감 {r.due}
                  </span>
                  {showRate && (
                    <span className="font-semibold text-emerald-600">정답률 {r.correctRate}%</span>
                  )}
                  {r.status === '완료' && r.correctRate == null && (
                    <span className="text-gray-400">정답 없는 활동</span>
                  )}
                </div>
              </div>
              {hasDetail && <ChevronRight className="h-4 w-4 flex-none text-gray-300" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
