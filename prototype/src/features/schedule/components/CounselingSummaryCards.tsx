/**
 * 상담·코칭 전체 현황 - 요약 카드
 *
 * 상담 대상 학생 수, 코칭 진행중 학생 수, 예정 상담, 완료 상담
 * - 아이콘 없이 심플한 카드 형태
 */

import type { CounselingOverviewSummary } from '../types';

interface CounselingSummaryCardsProps {
  summary: CounselingOverviewSummary;
}

interface CardItemProps {
  label: string;
  value: number;
  unit: string;
  description?: string;
  valueColor?: string;
}

const CardItem: React.FC<CardItemProps> = ({ label, value, unit, description, valueColor = 'text-gray-900' }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
    <p className={`text-3xl font-bold ${valueColor}`}>
      {value}
      <span className="text-lg font-medium text-gray-400 ml-1">{unit}</span>
    </p>
    {description && <p className="text-xs text-gray-400 mt-2">{description}</p>}
  </div>
);

export const CounselingSummaryCards: React.FC<CounselingSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <CardItem
        label="상담 대상 학생"
        value={summary.targetStudentCount}
        unit="명"
        description="관심 필요 학생"
        valueColor="text-red-500"
      />
      <CardItem
        label="미상담 학생"
        value={summary.activeCoachingCount}
        unit="명"
        description="상담 미진행"
        valueColor="text-amber-600"
      />
      <CardItem
        label="이번 주 예정"
        value={summary.scheduledThisWeek}
        unit="건"
        description="예정된 상담"
        valueColor="text-gray-900"
      />
      <CardItem
        label="이번 달 완료"
        value={summary.completedThisMonth}
        unit="건"
        description="완료된 상담"
        valueColor="text-green-600"
      />
    </div>
  );
};

export default CounselingSummaryCards;
