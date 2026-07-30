/**
 * 검사 전체 현황 - 검사 현황 테이블
 *
 * 반 / 검사지 / 1차 응시율 / 2차 응시율 / 액션
 * - 반별로 1차/2차 프로그레스바를 한 행에 표시
 */

import type { ExamOverviewRow, ExamStatus } from '../types';
import { EXAM_STATUS_LABELS, EXAM_STATUS_STYLES } from '../types';
import { useLayoutContext } from '@/app/LayoutV2';

/** 반별로 그룹화된 데이터 타입 */
interface GroupedClassData {
  groupId: string;
  className: string;
  examName: string;
  round1?: ExamOverviewRow;
  round2?: ExamOverviewRow;
}

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

/** 응시율 프로그레스 바 (회차 라벨 포함) */
const RoundProgressBar: React.FC<{
  rate: number;
  status: ExamStatus;
  submittedCount: number;
  totalCount: number;
}> = ({ rate, status, submittedCount, totalCount }) => {
  const getBarColor = () => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'not_started') return 'bg-gray-200';
    if (rate >= 80) return 'bg-primary-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-gray-300';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <StatusBadge status={status} />
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getBarColor()}`}
            style={{ width: `${rate}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 w-12 text-right">{rate}%</span>
      </div>
      <p className="text-xs text-gray-400 text-right">
        {submittedCount} / {totalCount}명
      </p>
    </div>
  );
};

/** 반별로 데이터 그룹화 */
const groupByClass = (rows: ExamOverviewRow[]): GroupedClassData[] => {
  const grouped = new Map<string, GroupedClassData>();

  rows.forEach((row) => {
    if (!grouped.has(row.groupId)) {
      grouped.set(row.groupId, {
        groupId: row.groupId,
        className: row.className,
        examName: row.examName,
      });
    }
    const group = grouped.get(row.groupId)!;
    if (row.round === 1) {
      group.round1 = row;
    } else if (row.round === 2) {
      group.round2 = row;
    }
  });

  return Array.from(grouped.values());
};

/** 검사 유형에 따른 검사지 이름 */
const EXAM_TYPE_LABELS = {
  comp: '학습종합검사',
  self: '자기조절학습검사',
} as const;

export const ExamOverviewTable: React.FC<ExamOverviewTableProps> = ({
  rows,
  onViewResult,
  onManageExam,
}) => {
  const { prototypeMode } = useLayoutContext();
  const examTypeName = EXAM_TYPE_LABELS[prototypeMode.examType];
  const groupedData = groupByClass(rows);

  // 결과보기 가능 여부 (1차 또는 2차 중 하나라도 completed인 경우)
  const hasCompletedExam = (group: GroupedClassData) =>
    group.round1?.status === 'completed' || group.round2?.status === 'completed';

  // 결과보기 클릭 시 완료된 회차 데이터 전달
  const handleViewResult = (group: GroupedClassData) => {
    if (group.round2?.status === 'completed') {
      onViewResult(group.round2);
    } else if (group.round1?.status === 'completed') {
      onViewResult(group.round1);
    }
  };

  // 검사관리 클릭 시 첫 번째 회차 데이터 전달
  const handleManageExam = (group: GroupedClassData) => {
    onManageExam(group.round1 || group.round2!);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* 테이블 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">검사 현황</h2>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                반
              </th>
              <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                검사지
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                1차 응시율
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                2차 응시율
              </th>
              <th className="w-52 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groupedData.map((group) => (
              <tr key={group.groupId} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <span className="font-medium text-gray-900 whitespace-nowrap">{group.className}</span>
                </td>
                <td className="px-4 py-4 text-gray-600 text-sm whitespace-nowrap">{examTypeName}</td>
                <td className="px-4 py-4">
                  {group.round1 ? (
                    <RoundProgressBar
                      rate={group.round1.submissionRate}
                      status={group.round1.status}
                      submittedCount={group.round1.submittedCount}
                      totalCount={group.round1.totalCount}
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {group.round2 ? (
                    <RoundProgressBar
                      rate={group.round2.submissionRate}
                      status={group.round2.status}
                      submittedCount={group.round2.submittedCount}
                      totalCount={group.round2.totalCount}
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => hasCompletedExam(group) && handleViewResult(group)}
                      disabled={!hasCompletedExam(group)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                        hasCompletedExam(group)
                          ? 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
                          : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      결과보기
                    </button>
                    <button
                      onClick={() => handleManageExam(group)}
                      className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      검사관리
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {groupedData.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">표시할 검사 현황이 없습니다.</p>
          <p className="text-sm text-gray-400 mt-1">반을 생성하고 검사를 시작해보세요.</p>
        </div>
      )}
    </div>
  );
};

export default ExamOverviewTable;
