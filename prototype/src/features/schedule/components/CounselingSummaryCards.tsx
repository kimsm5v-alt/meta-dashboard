/**
 * 상담·코칭 전체 현황 - 요약 카드
 *
 * 상담 대상 학생 수, 코칭 진행중 학생 수, 예정 상담, 완료 상담
 */

import { Users, Lightbulb, Calendar, CheckCircle } from 'lucide-react';
import type { CounselingOverviewSummary } from '../types';

interface CounselingSummaryCardsProps {
  summary: CounselingOverviewSummary;
}

interface CardItemProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  unit: string;
  description?: string;
}

const CardItem: React.FC<CardItemProps> = ({ icon, iconBg, label, value, unit, description }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        <span className="text-base font-medium text-gray-500 ml-1">{unit}</span>
      </p>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
  </div>
);

export const CounselingSummaryCards: React.FC<CounselingSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <CardItem
        icon={<Users className="w-6 h-6 text-red-600" />}
        iconBg="bg-red-50"
        label="상담 대상 학생"
        value={summary.targetStudentCount}
        unit="명"
        description="관심 필요 학생"
      />
      <CardItem
        icon={<Lightbulb className="w-6 h-6 text-amber-600" />}
        iconBg="bg-amber-50"
        label="코칭 진행중"
        value={summary.activeCoachingCount}
        unit="명"
        description="코칭 전략 적용 중"
      />
      <CardItem
        icon={<Calendar className="w-6 h-6 text-primary-600" />}
        iconBg="bg-primary-50"
        label="이번 주 예정"
        value={summary.scheduledThisWeek}
        unit="건"
        description="예정된 상담"
      />
      <CardItem
        icon={<CheckCircle className="w-6 h-6 text-green-600" />}
        iconBg="bg-green-50"
        label="이번 달 완료"
        value={summary.completedThisMonth}
        unit="건"
        description="완료된 상담"
      />
    </div>
  );
};

export default CounselingSummaryCards;
