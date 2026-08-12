/**
 * 홈 > Section 1: 주요 지표 (Key Metrics)
 *
 * 검사관리 전체 현황 4개 KPI:
 * - 관리 중인 반
 * - 진행 중 검사
 * - 결과 확인 가능
 * - 미응시 학생
 */

interface KeyMetricsProps {
  totalClasses: number;
  inProgressExams: number;
  completedExams: number;
  pendingStudents: number;
}

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  description?: string;
  valueColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  description,
  valueColor = 'text-gray-900',
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
    <p className={`text-3xl font-bold ${valueColor}`}>
      {value}
      <span className="text-lg font-medium text-gray-400 ml-1">{unit}</span>
    </p>
    {description && <p className="text-xs text-gray-400 mt-2">{description}</p>}
  </div>
);

export const KeyMetrics: React.FC<KeyMetricsProps> = ({
  totalClasses,
  inProgressExams,
  completedExams,
  pendingStudents,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="관리 중인 반"
        value={totalClasses}
        unit="개"
        valueColor="text-gray-900"
      />
      <MetricCard
        label="진행 중 검사"
        value={inProgressExams}
        unit="건"
        description="현재 응시 진행 중"
        valueColor="text-amber-600"
      />
      <MetricCard
        label="결과 확인 가능"
        value={completedExams}
        unit="건"
        description="결과보기에서 확인"
        valueColor="text-green-600"
      />
      <MetricCard
        label="미응시 학생"
        value={pendingStudents}
        unit="명"
        description="응시 독려 필요"
        valueColor="text-red-500"
      />
    </div>
  );
};

export default KeyMetrics;
