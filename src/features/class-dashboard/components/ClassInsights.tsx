import React from 'react';
import { AlertCircle, CheckCircle, Lightbulb, ExternalLink } from 'lucide-react';
import type { Class } from '@/shared/types';

interface ClassInsightsProps {
  classData: Class;
}

export const ClassInsights: React.FC<ClassInsightsProps> = ({ classData: _classData }) => {
  // 학급 특성 분석 (간단한 예시 - 실제로는 학생 데이터 기반 계산)
  const characteristics = {
    warnings: [
      { label: '학업스트레스 높음', detail: '평균 T=58 · 전체 평균 대비 +8' },
    ],
    strengths: [
      { label: '메타인지 양호', detail: '평균 T=52 · 계획/점검/조절 균형' },
    ],
  };

  const recommendations = [
    '스트레스 해소 활동 (주 1회 명상/체육)',
    '또래 멘토링 프로그램',
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-full flex flex-col">
      {/* 제목 */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">학급 특성 및 추천</h2>
        <p className="text-sm text-gray-500 mt-1">이 학급의 주요 특성과 맞춤형 활동을 확인하세요</p>
      </div>

      {/* 학급 특성 */}
      <div className="space-y-3 mb-4 flex-1">
        {/* 주의 항목 */}
        {characteristics.warnings.map((warning, idx) => (
          <div key={`warning-${idx}`} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center min-h-[80px]">
            <div className="flex items-center gap-2.5 w-full">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-base text-red-900">{warning.label}</p>
                <p className="text-sm text-red-700 mt-0.5">{warning.detail}</p>
              </div>
            </div>
          </div>
        ))}

        {/* 양호 항목 */}
        {characteristics.strengths.map((strength, idx) => (
          <div key={`strength-${idx}`} className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center min-h-[80px]">
            <div className="flex items-center gap-2.5 w-full">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-base text-green-900">{strength.label}</p>
                <p className="text-sm text-green-700 mt-0.5">{strength.detail}</p>
              </div>
            </div>
          </div>
        ))}

        {/* 추천 학급 활동 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center min-h-[80px]">
          <div className="flex items-center gap-2.5 w-full">
            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-base text-blue-900 mb-1.5">💡 추천 학급 활동</p>
              <ul className="space-y-1">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-blue-700 flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 활동 자료 보기 버튼 */}
      <button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
        <span>활동 자료 보기</span>
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
};
