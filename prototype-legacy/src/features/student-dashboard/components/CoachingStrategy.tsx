import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { rankInterventions } from '@/shared/utils/interventionRanker';
import { getTypeDeviations } from '@/shared/utils/lpaClassifier';
import { FACTOR_DEFINITIONS } from '@/shared/data/factors';
import scriptsData from '@/shared/data/scripts_depth3.json';
import type { StudentType, SchoolLevel } from '@/shared/types';

// 점수 구간에 맞는 스크립트 summary 찾기
const getFactorSummary = (factorName: string, tScore: number): string => {
  const scripts = scriptsData.scripts.filter(s => s.depth3 === factorName);
  for (const script of scripts) {
    const lower = script.tScore_lower ?? 0;
    const upper = script.tScore_upper ?? 100;
    if (tScore >= lower && tScore <= upper) {
      return script.summary;
    }
  }
  return '';
};

// 대분류별 색상 매핑 (docs/design/dashboard-design.md 8.6 기준)
const CATEGORY_COLORS: Record<string, string> = {
  '자아강점': 'text-[#00D282]',
  '학습디딤돌': 'text-[#4BC1FF]',
  '긍정적공부마음': 'text-[#67A7FF]',
  '학습걸림돌': 'text-[#FF849F]',
  '부정적공부마음': 'text-[#FF87D4]',
};

interface CoachingStrategyProps {
  predictedType: StudentType;
  schoolLevel: SchoolLevel;
  tScores: number[];
}

type CoachingType = 'strength' | 'complement';  // weakness → complement (보완점)

interface CoachingItem {
  type: CoachingType;
  factorName: string;
  factorCategory: string;  // 대분류
  factorSummary: string;   // 점수 구간별 스크립트 summary
  factorScore: number;
  intervention: {
    x: string;
    z?: string;
    y: string;
    interpretation: string;
    strategy: string;
  };
}

export const CoachingStrategy: React.FC<CoachingStrategyProps> = ({
  predictedType,
  schoolLevel,
  tScores,
}) => {
  // 열려있는 아코디언 인덱스 (-1이면 모두 닫힘) - 기본 접힘
  const [openIndex, setOpenIndex] = useState(-1);

  // 개인별 랭킹된 interventions
  const rankedInterventions = useMemo(
    () => rankInterventions(tScores, predictedType, schoolLevel),
    [tScores, predictedType, schoolLevel]
  );

  // 강점/약점 기반 코칭 2개 추출
  const coachingItems = useMemo<CoachingItem[]>(() => {
    try {
      // 유형 대비 특이점 가져오기
      const deviations = getTypeDeviations(tScores, predictedType, schoolLevel, 10);
      if (deviations.length === 0 || rankedInterventions.length === 0) return [];

      const result: CoachingItem[] = [];

      // 강점/보완점 요인 찾기
      let strengthDev: typeof deviations[0] | null = null;
      let complementDev: typeof deviations[0] | null = null;
      let strengthFactorDef: typeof FACTOR_DEFINITIONS[0] | null = null;
      let complementFactorDef: typeof FACTOR_DEFINITIONS[0] | null = null;

      for (const dev of deviations) {
        const factorDef = FACTOR_DEFINITIONS.find(f => f.name === dev.factor);
        if (!factorDef) continue;

        const isPositiveFactor = factorDef.isPositive;
        const isHigherThanMean = dev.diff > 0;
        const isStrength = (isPositiveFactor && isHigherThanMean) || (!isPositiveFactor && !isHigherThanMean);

        if (isStrength && !strengthDev) {
          strengthDev = dev;
          strengthFactorDef = factorDef;
        } else if (!isStrength && !complementDev) {
          complementDev = dev;
          complementFactorDef = factorDef;
        }

        if (strengthDev && complementDev) break;
      }

      // 강점 코칭: 강점 요인과 관련된 intervention 찾기
      if (strengthDev && strengthFactorDef) {
        const strengthIntervention = rankedInterventions.find(r =>
          r.intervention.x === strengthDev!.factor || r.intervention.z === strengthDev!.factor
        );
        if (strengthIntervention) {
          result.push({
            type: 'strength',
            factorName: strengthDev.factor,
            factorCategory: strengthFactorDef.category,
            factorSummary: getFactorSummary(strengthDev.factor, strengthDev.studentScore),
            factorScore: strengthDev.studentScore,
            intervention: strengthIntervention.intervention,
          });
        }
      }

      // 보완점 코칭: 보완점 요인과 관련된 intervention 찾기
      if (complementDev && complementFactorDef) {
        const complementIntervention = rankedInterventions.find(r =>
          r.intervention.x === complementDev!.factor || r.intervention.z === complementDev!.factor
        );
        if (complementIntervention) {
          result.push({
            type: 'complement',
            factorName: complementDev.factor,
            factorCategory: complementFactorDef.category,
            factorSummary: getFactorSummary(complementDev.factor, complementDev.studentScore),
            factorScore: complementDev.studentScore,
            intervention: complementIntervention.intervention,
          });
        }
      }

      // 만약 강점/보완점 매칭이 부족하면, 상위 랭킹에서 채우기
      if (result.length < 2) {
        for (const ranked of rankedInterventions) {
          const alreadyIncluded = result.some(r =>
            r.intervention.x === ranked.intervention.x && r.intervention.z === ranked.intervention.z
          );
          if (!alreadyIncluded) {
            const factorDef = FACTOR_DEFINITIONS.find(f => f.name === ranked.intervention.x);
            const factorIdx = FACTOR_DEFINITIONS.findIndex(f => f.name === ranked.intervention.x);
            result.push({
              type: result.length === 0 ? 'strength' : 'complement',
              factorName: ranked.intervention.x,
              factorCategory: factorDef?.category || '',
              factorSummary: getFactorSummary(ranked.intervention.x, tScores[factorIdx] || 50),
              factorScore: tScores[factorIdx] || 50,
              intervention: ranked.intervention,
            });
          }
          if (result.length >= 2) break;
        }
      }

      return result.slice(0, 2);
    } catch {
      return [];
    }
  }, [tScores, predictedType, schoolLevel, rankedInterventions]);

  // 강점/보완점 아이템 분리
  const strengthItem = coachingItems.find(item => item.type === 'strength');
  const complementItem = coachingItems.find(item => item.type === 'complement');

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">추천 코칭 전략</h3>
      </div>

      {/* 강점/보완점 카드 */}
      {(strengthItem || complementItem) && (
        <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-100">
          {/* 강점 카드 */}
          {strengthItem && (
            <div className="rounded-xl border p-4 bg-emerald-50 border-emerald-200">
              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 bg-emerald-100 text-emerald-700">
                강점
              </span>
              <p className={`text-xs font-medium mb-1 ${CATEGORY_COLORS[strengthItem.factorCategory] || 'text-gray-500'}`}>
                #{strengthItem.factorCategory}
              </p>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {strengthItem.factorName}
              </h4>
              {strengthItem.factorSummary && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {strengthItem.factorSummary}
                </p>
              )}
            </div>
          )}

          {/* 보완점 카드 */}
          {complementItem && (
            <div className="rounded-xl border p-4 bg-amber-50 border-amber-200">
              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 bg-amber-100 text-amber-700">
                보완점
              </span>
              <p className={`text-xs font-medium mb-1 ${CATEGORY_COLORS[complementItem.factorCategory] || 'text-gray-500'}`}>
                #{complementItem.factorCategory}
              </p>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {complementItem.factorName}
              </h4>
              {complementItem.factorSummary && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {complementItem.factorSummary}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 아코디언 리스트 */}
      <div className="p-4 space-y-2">
        {coachingItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            추천 코칭 전략이 없습니다.
          </div>
        ) : (
          coachingItems.map((item, idx) => {
            const isExpanded = openIndex === idx;
            const isStrength = item.type === 'strength';
            const inv = item.intervention;

            return (
              <div
                key={idx}
                className={`border rounded-xl overflow-hidden transition-all ${
                  isExpanded
                    ? isStrength
                      ? 'border-emerald-300 shadow-sm'
                      : 'border-amber-300 shadow-sm'
                    : 'border-gray-200'
                }`}
              >
                {/* 아코디언 헤더 */}
                <button
                  onClick={() => setOpenIndex(isExpanded ? -1 : idx)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  {/* 라벨 배지: [강점 코칭] 또는 [보완 코칭] */}
                  <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isStrength
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isStrength ? '강점 코칭' : '보완 코칭'}
                  </span>

                  {/* 요인명 */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-gray-800">
                      {item.factorName}
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
                  <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50/50">
                    {/* 경로 수식: X × Z → Y */}
                    <div className="mb-5 p-4 bg-gray-100 rounded-xl border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 mb-2">코칭 경로</p>
                      <p className="text-base font-bold text-gray-900">
                        {inv.x}
                        {inv.z && (
                          <span> × {inv.z}</span>
                        )}
                        <span className="text-gray-400 mx-2">→</span>
                        <span className="text-purple-600">{inv.y}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* 왜 이 경로가 중요한가요? */}
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-sm font-bold text-gray-800">왜 이 경로가 중요한가요?</h4>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {inv.interpretation}
                          </p>
                        </div>
                      </div>

                      {/* 구체적 실행 전략 */}
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-sm font-bold text-gray-800">구체적 실행 전략</h4>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="space-y-2.5">
                            {inv.strategy.split(/(?<=\.) /).filter(Boolean).map((step, si) => (
                              <div key={si} className="flex items-start gap-2.5">
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
