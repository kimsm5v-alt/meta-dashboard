/**
 * 결과보기 - 강점/보완점 카드
 *
 * 반 전체 또는 개인의 강점 요인, 보완 필요 요인
 */

import { TrendingUp, TrendingDown } from 'lucide-react';

interface StrengthWeaknessCardProps {
  strengths: string[];
  weaknesses: string[];
  title?: string;
}

export const StrengthWeaknessCard: React.FC<StrengthWeaknessCardProps> = ({
  strengths,
  weaknesses,
  title = '강점 / 보완점',
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="grid grid-cols-2 gap-6">
        {/* 강점 */}
        <div className="p-4 bg-green-50 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <h4 className="font-medium text-green-800">강점 요인</h4>
          </div>
          <div className="space-y-2">
            {strengths.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg"
              >
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
            {strengths.length === 0 && (
              <p className="text-sm text-green-600">분석 중...</p>
            )}
          </div>
        </div>

        {/* 보완점 */}
        <div className="p-4 bg-orange-50 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-orange-600" />
            </div>
            <h4 className="font-medium text-orange-800">보완 필요 요인</h4>
          </div>
          <div className="space-y-2">
            {weaknesses.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg"
              >
                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
            {weaknesses.length === 0 && (
              <p className="text-sm text-orange-600">분석 중...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrengthWeaknessCard;
