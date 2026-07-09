/**
 * 코칭 - 반 전체 - 반 특성 분석 카드
 *
 * LPA 분포, 강점, 개선점
 */

import { Users, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import type { ClassCharacteristics, LPAType } from '../types';
import { LPA_TYPE_COLORS } from '../types';

interface ClassCharacteristicsCardProps {
  characteristics: ClassCharacteristics;
}

export const ClassCharacteristicsCard: React.FC<ClassCharacteristicsCardProps> = ({
  characteristics,
}) => {
  // LPA 분포 데이터 (0 제외)
  const distributionData = Object.entries(characteristics.lpaDistribution)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      type: type as LPAType,
      count,
      percentage: ((count / characteristics.totalStudents) * 100).toFixed(1),
      color: LPA_TYPE_COLORS[type as LPAType],
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-primary-600" />
        <h3 className="text-base font-semibold text-gray-900">반 특성 분석</h3>
        <span className="ml-auto text-sm text-gray-500">총 {characteristics.totalStudents}명</span>
      </div>

      {/* LPA 분포 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">LPA 유형 분포</h4>
        <div className="space-y-2">
          {distributionData.map((item) => (
            <div key={item.type} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-28 truncate">{item.type}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 w-16 text-right">
                {item.count}명 ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>

        {/* 주요 유형 */}
        <div
          className="mt-4 p-3 rounded-lg flex items-center gap-3"
          style={{ backgroundColor: `${LPA_TYPE_COLORS[characteristics.dominantType]}10` }}
        >
          <span className="text-sm text-gray-600">주요 유형:</span>
          <span
            className="px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: LPA_TYPE_COLORS[characteristics.dominantType] }}
          >
            {characteristics.dominantType}
          </span>
        </div>
      </div>

      {/* 강점 / 개선점 / 집중 영역 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 강점 */}
        <div className="p-4 bg-green-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">반의 강점</span>
          </div>
          <ul className="space-y-1">
            {characteristics.strengths.map((item, index) => (
              <li key={index} className="text-xs text-green-700">• {item}</li>
            ))}
          </ul>
        </div>

        {/* 개선점 */}
        <div className="p-4 bg-amber-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">개선 필요</span>
          </div>
          <ul className="space-y-1">
            {characteristics.challenges.map((item, index) => (
              <li key={index} className="text-xs text-amber-700">• {item}</li>
            ))}
          </ul>
        </div>

        {/* 집중 영역 */}
        <div className="p-4 bg-primary-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-800">추천 집중 영역</span>
          </div>
          <ul className="space-y-1">
            {characteristics.recommendedFocus.map((item, index) => (
              <li key={index} className="text-xs text-primary-700">• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClassCharacteristicsCard;
