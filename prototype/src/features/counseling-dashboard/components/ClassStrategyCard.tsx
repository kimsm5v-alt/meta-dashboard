/**
 * 코칭 - 반 전체 - 반 운영 전략 카드
 *
 * 반 특성에 맞는 운영 전략 목록
 */

import { Lightbulb, Target, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { ClassStrategy } from '../types';

interface ClassStrategyCardProps {
  strategies: ClassStrategy[];
}

export const ClassStrategyCard: React.FC<ClassStrategyCardProps> = ({ strategies }) => {
  const [expandedId, setExpandedId] = useState<string | null>(strategies[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="text-base font-semibold text-gray-900">반 운영 전략</h3>
      </div>

      <div className="space-y-3">
        {strategies.map((strategy) => {
          const isExpanded = expandedId === strategy.id;

          return (
            <div
              key={strategy.id}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* 헤더 */}
              <button
                onClick={() => toggleExpand(strategy.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Target className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-gray-900">{strategy.title}</h4>
                    <span className="text-xs text-gray-500">{strategy.targetArea}</span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* 상세 내용 */}
              {isExpanded && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">{strategy.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    {/* 활동 */}
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-primary-600" />
                        주요 활동
                      </h5>
                      <ul className="space-y-1">
                        {strategy.activities.map((activity, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 기대 효과 */}
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-green-600" />
                        기대 효과
                      </h5>
                      <ul className="space-y-1">
                        {strategy.expectedOutcomes.map((outcome, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                            {outcome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClassStrategyCard;
