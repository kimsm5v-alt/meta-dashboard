import { useState } from 'react';
import { CATEGORY_COLORS, DOMAIN_ICONS, POSITIVE_DOMAINS } from '@/shared/data/lpaProfiles';
import { calculateSubCategoryScores } from '@/shared/utils/summaryGenerator';
import { SUB_CATEGORY_FACTORS, FACTOR_DEFINITIONS, DOMAIN_GROUPS } from '@/shared/data/factors';
import { ChevronDown } from 'lucide-react';
import { getBarPercent, REF_LINE_POS, PREV_COLOR } from '@/shared/utils/chartUtils';
import { lightenColor } from '@/shared/utils/colorUtils';

interface FactorLineChartProps {
  tScores: number[];
  prevTScores?: number[];
}

export const FactorLineChart: React.FC<FactorLineChartProps> = ({ tScores, prevTScores }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const subCategoryScores = calculateSubCategoryScores(tScores);
  const prevSubCategoryScores = prevTScores ? calculateSubCategoryScores(prevTScores) : null;

  const toggle = (name: string) => setExpanded(prev => (prev === name ? null : name));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">중분류 요인 그래프</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>점선: 전국 평균 T=50</span>
          {prevTScores && (
            <>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-gray-400" /> 1차
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-indigo-400" /> 2차
              </span>
            </>
          )}
        </div>
      </div>

      {/* Scale ticks */}
      <div className="flex items-center mb-1">
        <div className="w-[120px] shrink-0" />
        <div className="flex-1 relative h-4">
          {[20, 30, 40, 50, 60, 70, 80].map(tick => (
            <span
              key={tick}
              className="absolute text-[10px] text-gray-400 -translate-x-1/2"
              style={{ left: `${getBarPercent(tick)}%` }}
            >
              {tick}
            </span>
          ))}
        </div>
        <div className="w-[52px] shrink-0" />
      </div>

      <div className="space-y-4">
        {DOMAIN_GROUPS.map(group => {
          const isPositive = POSITIVE_DOMAINS.has(group.domain);
          const icon = DOMAIN_ICONS[group.domain] ?? '📊';

          return (
            <div key={group.domain}>
              {/* 대분류 헤더 */}
              <div
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg mb-1 border ${
                  isPositive
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-rose-50/60 border-rose-200'
                }`}
              >
                <span className="text-sm">{icon}</span>
                <h4 className="text-sm font-bold text-gray-800">{group.domain}</h4>
                <span className="text-xs text-gray-500">
                  {isPositive ? '높을수록 좋아요' : '낮을수록 좋아요'}
                </span>
              </div>

              {/* 중분류 막대들 */}
              <div className="space-y-0.5">
                {group.subCategories.map(subCat => {
                  const score = subCategoryScores[subCat] || 50;
                  const color = CATEGORY_COLORS[subCat] || '#9CA3AF';
                  const isOpen = expanded === subCat;
                  const indices = SUB_CATEGORY_FACTORS[subCat] || [];
                  const prevScore = prevSubCategoryScores ? (prevSubCategoryScores[subCat] || 50) : null;
                  const hasPrev = prevScore != null;

                  return (
                    <div key={subCat}>
                      {/* Main bar row */}
                      <div
                        className="flex items-center cursor-pointer group hover:bg-gray-50 rounded-lg py-1.5 px-1 transition-colors"
                        onClick={() => toggle(subCat)}
                      >
                        <div className="w-[120px] shrink-0 text-[13px] text-gray-700 font-medium flex items-center gap-1">
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                          />
                          <span>{subCat}</span>
                        </div>

                        <div className="flex-1 relative h-7 bg-gray-100 rounded overflow-hidden">
                          {/* Reference line T=50 */}
                          <div
                            className="absolute top-0 bottom-0 w-px border-l border-dashed border-gray-400 z-10"
                            style={{ left: `${REF_LINE_POS}%` }}
                          />
                          {hasPrev && prevScore !== score ? (
                            prevScore > score ? (
                              <>
                                <div
                                  className="absolute top-0 left-0 h-full transition-all duration-300"
                                  style={{
                                    width: `${getBarPercent(score)}%`,
                                    backgroundColor: color,
                                  }}
                                />
                                <div
                                  className="absolute top-0 h-full transition-all duration-300"
                                  style={{
                                    left: `${getBarPercent(score)}%`,
                                    width: `${getBarPercent(prevScore) - getBarPercent(score)}%`,
                                    backgroundColor: PREV_COLOR,
                                    borderRadius: '0 4px 4px 0',
                                  }}
                                />
                                <div className="absolute top-0 left-0 h-full flex items-center justify-end pr-2 z-20 pointer-events-none" style={{ width: `${getBarPercent(score)}%` }}>
                                  <span className="text-[11px] font-semibold text-white whitespace-nowrap">
                                    T={score}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div
                                  className="absolute top-0 left-0 h-full transition-all duration-300"
                                  style={{
                                    width: `${getBarPercent(prevScore)}%`,
                                    backgroundColor: PREV_COLOR,
                                  }}
                                />
                                <div
                                  className="absolute top-0 h-full transition-all duration-300"
                                  style={{
                                    left: `${getBarPercent(prevScore)}%`,
                                    width: `${getBarPercent(score) - getBarPercent(prevScore)}%`,
                                    backgroundColor: color,
                                    borderRadius: '0 4px 4px 0',
                                  }}
                                />
                                <div className="absolute top-0 left-0 h-full flex items-center justify-end pr-2 z-20 pointer-events-none" style={{ width: `${getBarPercent(score)}%` }}>
                                  <span className="text-[11px] font-semibold text-white whitespace-nowrap">
                                    T={score}
                                  </span>
                                </div>
                              </>
                            )
                          ) : (
                            <div
                              className="h-full flex items-center justify-end pr-2"
                              style={{
                                width: `${getBarPercent(score)}%`,
                                backgroundColor: color,
                                borderRadius: '0 4px 4px 0',
                              }}
                            >
                              <span className="text-[11px] font-semibold text-white whitespace-nowrap">
                                T={score}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="w-[52px] shrink-0 text-right text-[13px] font-semibold text-gray-600">
                          {score}
                        </div>
                      </div>

                      {/* Sub-factor dropdown */}
                      <div
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{
                          maxHeight: isOpen ? `${indices.length * 36 + 16}px` : '0px',
                          opacity: isOpen ? 1 : 0,
                        }}
                      >
                        <div className="pl-[32px] pr-[52px] py-1.5 space-y-1">
                          {indices.map(idx => {
                            const factor = FACTOR_DEFINITIONS[idx];
                            if (!factor) return null;
                            const fScore = tScores[idx];
                            const prevFScore = prevTScores ? prevTScores[idx] : null;
                            const hasPrevF = prevFScore != null;
                            const lightColor = lightenColor(color);
                            return (
                              <div key={idx} className="flex items-center">
                                <div className="w-[88px] shrink-0 text-[11px] text-gray-500 text-right pr-2 truncate">
                                  {factor.name}
                                </div>
                                <div className="flex-1 relative h-5 bg-gray-50 rounded overflow-hidden">
                                  <div
                                    className="absolute top-0 bottom-0 w-px border-l border-dashed border-gray-300 z-10"
                                    style={{ left: `${REF_LINE_POS}%` }}
                                  />
                                  {hasPrevF && prevFScore !== fScore ? (
                                    prevFScore > fScore ? (
                                      <>
                                        <div
                                          className="absolute top-0 left-0 h-full transition-all duration-300"
                                          style={{
                                            width: `${getBarPercent(fScore)}%`,
                                            backgroundColor: lightColor,
                                          }}
                                        />
                                        <div
                                          className="absolute top-0 h-full transition-all duration-300"
                                          style={{
                                            left: `${getBarPercent(fScore)}%`,
                                            width: `${getBarPercent(prevFScore) - getBarPercent(fScore)}%`,
                                            backgroundColor: PREV_COLOR,
                                            borderRadius: '0 3px 3px 0',
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <div
                                          className="absolute top-0 left-0 h-full transition-all duration-300"
                                          style={{
                                            width: `${getBarPercent(prevFScore)}%`,
                                            backgroundColor: PREV_COLOR,
                                          }}
                                        />
                                        <div
                                          className="absolute top-0 h-full transition-all duration-300"
                                          style={{
                                            left: `${getBarPercent(prevFScore)}%`,
                                            width: `${getBarPercent(fScore) - getBarPercent(prevFScore)}%`,
                                            backgroundColor: lightColor,
                                            borderRadius: '0 3px 3px 0',
                                          }}
                                        />
                                      </>
                                    )
                                  ) : (
                                    <div
                                      className="h-full flex items-center justify-end pr-1.5"
                                      style={{
                                        width: `${getBarPercent(fScore)}%`,
                                        backgroundColor: lightColor,
                                        borderRadius: '0 3px 3px 0',
                                      }}
                                    >
                                      {getBarPercent(fScore) > 25 && (
                                        <span className="text-[10px] font-medium text-white/90 whitespace-nowrap">
                                          {fScore}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="w-[36px] shrink-0 text-right text-[11px] text-gray-500 font-medium">
                                  {fScore}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FactorLineChart;
