import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { rankInterventions } from '@/shared/utils/interventionRanker';
import type { StudentType, SchoolLevel } from '@/shared/types';

interface CoachingStrategyProps {
  predictedType: StudentType;
  schoolLevel: SchoolLevel;
  tScores: number[];
}

export const CoachingStrategy: React.FC<CoachingStrategyProps> = ({
  predictedType,
  schoolLevel,
  tScores,
}) => {
  // 열려있는 아코디언 인덱스 (-1이면 모두 닫힘)
  const [openIndex, setOpenIndex] = useState(0);

  // 개인별 랭킹된 interventions
  const rankedInterventions = useMemo(
    () => rankInterventions(tScores, predictedType, schoolLevel),
    [tScores, predictedType, schoolLevel]
  );

  // 최대 5개까지만 표시
  const displayPaths = useMemo(
    () => rankedInterventions.slice(0, 5),
    [rankedInterventions]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">추천 코칭 전략</h3>
      </div>

      {/* 아코디언 리스트 */}
      <div className="p-4 space-y-2">
        {displayPaths.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            추천 경로가 없습니다.
          </div>
        ) : (
          displayPaths.map((ranked, idx) => {
            const inv = ranked.intervention;
            const isExpanded = openIndex === idx;

            return (
              <div
                key={idx}
                className={`border rounded-xl overflow-hidden transition-all ${
                  isExpanded ? 'border-indigo-300 shadow-sm' : 'border-gray-200'
                }`}
              >
                {/* 아코디언 헤더 */}
                <button
                  onClick={() => setOpenIndex(isExpanded ? -1 : idx)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  {/* 순번 */}
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>

                  {/* 경로 공식 */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-800">
                      <span className="font-bold">{inv.x}</span>
                      {inv.z && (
                        <>
                          {' × '}
                          <span className="font-bold">{inv.z}</span>
                        </>
                      )}
                      {' → '}
                      <span className="font-semibold text-indigo-600">{inv.y}</span>
                    </span>
                  </div>

                  {/* 화살표 */}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* 아코디언 바디 */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-2 gap-4">
                      {/* 왜 이 경로가 중요한가요? */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">
                          왜 이 경로가 중요한가요?
                        </p>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {inv.interpretation}
                          </p>
                        </div>
                      </div>

                      {/* 구체적 실행 전략 */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">
                          구체적 실행 전략
                        </p>
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="space-y-2">
                            {inv.strategy.split(/(?<=\.) /).filter(Boolean).map((step, si) => (
                              <div key={si} className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                                  {si + 1}
                                </span>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {step.trim()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CoachingStrategy;
