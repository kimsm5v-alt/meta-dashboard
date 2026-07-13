/**
 * 검사 전체 현황 - 요약 카드
 *
 * 관리 중인 반 수, 진행 중 검사, 결과 확인 가능, 미응시 학생
 */

import { Users, PlayCircle, CheckCircle, AlertCircle } from 'lucide-react';
import type { ExamOverviewSummary } from '../types';

interface SummaryCardsProps {
  summary: ExamOverviewSummary;
}

interface SummaryCardItemProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  unit?: string;
  description?: string;
}

const SummaryCardItem: React.FC<SummaryCardItemProps> = ({
  icon,
  iconBg,
  label,
  value,
  unit = '',
  description,
}) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {unit && <span className="text-base font-medium text-gray-500 ml-1">{unit}</span>}
      </p>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
  </div>
);

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCardItem
        icon={<Users className="w-6 h-6 text-primary-600" />}
        iconBg="bg-primary-50"
        label="관리 중인 반"
        value={summary.totalClasses}
        unit="개"
      />
      <SummaryCardItem
        icon={<PlayCircle className="w-6 h-6 text-amber-600" />}
        iconBg="bg-amber-50"
        label="진행 중 검사"
        value={summary.inProgressExams}
        unit="건"
        description="현재 응시 진행 중"
      />
      <SummaryCardItem
        icon={<CheckCircle className="w-6 h-6 text-green-600" />}
        iconBg="bg-green-50"
        label="결과 확인 가능"
        value={summary.completedExams}
        unit="건"
        description="결과보기에서 확인"
      />
      <SummaryCardItem
        icon={<AlertCircle className="w-6 h-6 text-red-500" />}
        iconBg="bg-red-50"
        label="미응시 학생"
        value={summary.pendingStudents}
        unit="명"
        description="응시 독려 필요"
      />
    </div>
  );
};

export default SummaryCards;
