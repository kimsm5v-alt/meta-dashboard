/**
 * 검사 전체 현황 - 요약 카드
 *
 * 관리 중인 반 수, 진행 중 검사, 결과 확인 가능, 미응시 학생
 * - 아이콘 없이 심플한 카드 형태
 */

import type { ExamOverviewSummary } from '../types';

interface SummaryCardsProps {
  summary: ExamOverviewSummary;
}

interface SummaryCardItemProps {
  label: string;
  value: number;
  unit?: string;
  description?: string;
  valueColor?: string;
}

const SummaryCardItem: React.FC<SummaryCardItemProps> = ({
  label,
  value,
  unit = '',
  description,
  valueColor = 'text-gray-900',
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
    <p className={`text-3xl font-bold ${valueColor}`}>
      {value}
      {unit && <span className="text-lg font-medium text-gray-400 ml-1">{unit}</span>}
    </p>
    {description && <p className="text-xs text-gray-400 mt-2">{description}</p>}
  </div>
);

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCardItem
        label="관리 중인 반"
        value={summary.totalClasses}
        unit="개"
        valueColor="text-gray-900"
      />
      <SummaryCardItem
        label="진행 중 검사"
        value={summary.inProgressExams}
        unit="건"
        description="현재 응시 진행 중"
        valueColor="text-amber-600"
      />
      <SummaryCardItem
        label="결과 확인 가능"
        value={summary.completedExams}
        unit="건"
        description="결과보기에서 확인"
        valueColor="text-green-600"
      />
      <SummaryCardItem
        label="미응시 학생"
        value={summary.pendingStudents}
        unit="명"
        description="응시 독려 필요"
        valueColor="text-red-500"
      />
    </div>
  );
};

export default SummaryCards;
