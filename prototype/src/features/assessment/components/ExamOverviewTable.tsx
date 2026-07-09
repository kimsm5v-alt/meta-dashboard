/**
 * 검사 전체 현황 - 검사 현황 테이블
 *
 * 반 / 검사지 / 회차 / 응시율 / 상태 / 액션
 */

import { ChevronRight, Eye, Settings } from 'lucide-react';
import type { ExamOverviewRow, ExamStatus } from '../types';
import { EXAM_STATUS_LABELS, EXAM_STATUS_STYLES } from '../types';

interface ExamOverviewTableProps {
  rows: ExamOverviewRow[];
  onViewResult: (row: ExamOverviewRow) => void;
  onManageExam: (row: ExamOverviewRow) => void;
}

/** 상태 배지 */
const StatusBadge: React.FC<{ status: ExamStatus }> = ({ status }) => {
  const style = EXAM_STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {EXAM_STATUS_LABELS[status]}
    </span>
  );
};

/** 응시율 프로그레스 바 */
const ProgressBar: React.FC<{ rate: number; status: ExamStatus }> = ({ rate, status }) => {
  const getBarColor = () => {
    if (status === 'completed') return 'bg-green-500';
    if (rate >= 80) return 'bg-primary-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-gray-300';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getBarColor()}`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-12 text-right">{rate}%</span>
    </div>
  );
};

export const ExamOverviewTable: React.FC<ExamOverviewTableProps> = ({
  rows,
  onViewResult,
  onManageExam,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* 테이블 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">검사 현황</h2>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                반
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                검사지
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                회차
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                응시율
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{row.className}</span>
                </td>
                <td className="px-6 py-4 text-gray-600">{row.examName}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                    {row.round}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <ProgressBar rate={row.submissionRate} status={row.status} />
                    <p className="text-xs text-gray-400">
                      {row.submittedCount} / {row.totalCount}명
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {row.status === 'completed' && (
                      <button
                        onClick={() => onViewResult(row)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        결과보기
                      </button>
                    )}
                    <button
                      onClick={() => onManageExam(row)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      검사관리
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {rows.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">표시할 검사 현황이 없습니다.</p>
          <p className="text-sm text-gray-400 mt-1">반을 생성하고 검사를 시작해보세요.</p>
        </div>
      )}
    </div>
  );
};

export default ExamOverviewTable;
