import { useState, useMemo } from 'react';
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { DomainData } from '../../hooks/useClassDetailData';
import { LevelBadge } from './LevelBadge';
import { FactorBar } from './FactorBar';
import { lightenColor } from '@/shared/utils/colorUtils';

// delta 배지 컴포넌트
const DeltaBadge: React.FC<{ delta: number; isPositive: boolean }> = ({ delta, isPositive }) => {
  // isPositive: 정적 요인이면 delta 양수가 좋은 것, 부적 요인이면 delta 음수가 좋은 것
  const isGood = isPositive ? delta > 0 : delta < 0;
  const isBad = isPositive ? delta < 0 : delta > 0;
  const absDelta = Math.abs(delta);

  if (absDelta < 0.5) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-400 shrink-0">
        <Minus className="w-2.5 h-2.5" />
        {delta > 0 ? '+' : ''}{delta.toFixed(1)}
      </span>
    );
  }

  if (isGood) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 shrink-0">
        <TrendingUp className="w-2.5 h-2.5" />
        +{absDelta.toFixed(1)}
      </span>
    );
  }

  if (isBad) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 shrink-0">
        <TrendingDown className="w-2.5 h-2.5" />
        -{absDelta.toFixed(1)}
      </span>
    );
  }

  return null;
};

interface FactorHeatmapSectionProps {
  domainData: DomainData[];
  prevDomainData?: DomainData[];
}

export const FactorHeatmapSection: React.FC<FactorHeatmapSectionProps> = ({ domainData, prevDomainData }) => {
  const [expandedSubCats, setExpandedSubCats] = useState<Set<string>>(new Set());
  const isCompare = !!prevDomainData;

  // 1차 데이터 lookup (중분류명 → avgTScore, 소분류 index → avgTScore)
  const prevLookup = useMemo(() => {
    if (!prevDomainData) return { subCat: {} as Record<string, number>, factor: {} as Record<number, number> };
    const subCat: Record<string, number> = {};
    const factor: Record<number, number> = {};
    for (const domain of prevDomainData) {
      for (const sc of domain.subCategories) {
        subCat[sc.name] = sc.avgTScore;
        for (const f of sc.factors) {
          factor[f.index] = f.avgTScore;
        }
      }
    }
    return { subCat, factor };
  }, [prevDomainData]);

  const toggleSubCat = (name: string) =>
    setExpandedSubCats((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <div className="space-y-6">
      {/* 범례 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          중분류를 클릭하면 세부 요인을 확인할 수 있습니다.
        </p>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span>점선: T=50 (전국 평균)</span>
          {isCompare && (
            <>
              <span className="text-gray-400">|</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-gray-400" /> 1차
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-indigo-400" /> 2차
              </span>
              <span className="text-gray-400">|</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" /> 향상
              </span>
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-500" /> 하락
              </span>
            </>
          )}
        </div>
      </div>

      {domainData.map((domain) => (
        <div key={domain.category} className="overflow-hidden">
          {/* 대분류 헤더 */}
          <div
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg mb-1 border ${
              domain.isPositive
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-rose-50/60 border-rose-200'
            }`}
          >
            <span className="text-sm">{domain.icon}</span>
            <h3 className="text-sm font-bold text-gray-800">{domain.category}</h3>
            <span className="text-xs text-gray-500">
              {domain.isPositive ? '높을수록 좋아요' : '낮을수록 좋아요'}
            </span>
          </div>

          {/* 중분류 카드들 */}
          <div className="space-y-2 pl-2">
            {domain.subCategories.map((subCat) => {
              const isOpen = expandedSubCats.has(subCat.name);

              return (
                <div
                  key={subCat.name}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* 중분류 헤더 (클릭 가능) */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 cursor-pointer hover:bg-gray-100/80 transition-colors"
                    onClick={() => toggleSubCat(subCat.name)}
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? '' : '-rotate-90'
                      }`}
                    />
                    <span className="font-semibold text-gray-800 w-[120px] shrink-0">
                      {subCat.displayName}
                    </span>
                    <FactorBar
                      score={subCat.avgTScore}
                      color={subCat.color}
                      prevScore={isCompare ? prevLookup.subCat[subCat.name] : undefined}
                    />
                    <span
                      className="text-sm font-bold shrink-0 w-[50px] text-right"
                      style={{ color: subCat.color }}
                    >
                      T {subCat.avgTScore}
                    </span>
                    <LevelBadge
                      level={subCat.level}
                      isPositive={subCat.isPositive}
                      size="sm"
                    />
                    {isCompare && prevLookup.subCat[subCat.name] != null && (
                      <DeltaBadge
                        delta={Math.round((subCat.avgTScore - prevLookup.subCat[subCat.name]) * 10) / 10}
                        isPositive={subCat.isPositive}
                      />
                    )}
                  </div>

                  {/* 소분류 드롭다운 */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isOpen ? `${subCat.factors.length * 46 + 24}px` : '0px',
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="px-4 py-3 space-y-1.5 bg-white border-t border-gray-100">
                      {subCat.factors.map((factor) => (
                        <div
                          key={factor.index}
                          className="flex items-center gap-3 py-1 hover:bg-gray-50 rounded px-2 -mx-2 transition-colors"
                        >
                          <span className="text-gray-300 text-xs shrink-0 w-4 text-center">└</span>
                          <span className="text-sm text-gray-600 w-[120px] shrink-0">
                            {factor.name}
                          </span>
                          <FactorBar
                            score={factor.avgTScore}
                            color={lightenColor(subCat.color)}
                            height="sm"
                            prevScore={isCompare ? prevLookup.factor[factor.index] : undefined}
                          />
                          <span className="text-xs font-semibold text-gray-500 w-[50px] text-right shrink-0">
                            T {factor.avgTScore}
                          </span>
                          <LevelBadge
                            level={factor.level}
                            isPositive={factor.isPositive}
                            size="sm"
                          />
                          {isCompare && prevLookup.factor[factor.index] != null && (
                            <DeltaBadge
                              delta={Math.round((factor.avgTScore - prevLookup.factor[factor.index]) * 10) / 10}
                              isPositive={factor.isPositive}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
