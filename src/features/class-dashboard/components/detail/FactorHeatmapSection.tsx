import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { DomainData } from '../../hooks/useClassDetailData';
import { LevelBadge } from './LevelBadge';
import { FactorBar } from './FactorBar';

interface FactorHeatmapSectionProps {
  domainData: DomainData[];
}

const lightenColor = (hex: string, amount: number = 0.35): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
};

export const FactorHeatmapSection: React.FC<FactorHeatmapSectionProps> = ({ domainData }) => {
  const [expandedSubCats, setExpandedSubCats] = useState<Set<string>>(new Set());

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
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-400" /> 양호
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-400" /> 보통
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-400" /> 주의
          </span>
          <span className="text-gray-400">|</span>
          <span>점선: T=50 (전국 평균)</span>
        </div>
      </div>

      {domainData.map((domain) => (
        <div key={domain.category} className="overflow-hidden">
          {/* 대분류 헤더 */}
          <div
            className={`flex items-center justify-between p-4 rounded-xl mb-3 border ${
              domain.isPositive
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-rose-50/60 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{domain.icon}</span>
              <h3 className="text-lg font-bold text-gray-800">{domain.category}</h3>
              <span className="text-xs text-gray-500 ml-1">
                {domain.isPositive ? '높을수록 좋아요' : '낮을수록 좋아요'}
              </span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                domain.isPositive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {domain.isPositive ? '정적 요인' : '부적 요인'}
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
                    <FactorBar score={subCat.avgTScore} color={subCat.color} />
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
                  </div>

                  {/* 소분류 드롭다운 */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isOpen ? `${subCat.factors.length * 40 + 24}px` : '0px',
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="px-5 py-3 space-y-1.5 bg-white border-t border-gray-100">
                      {subCat.factors.map((factor) => (
                        <div
                          key={factor.index}
                          className="flex items-center gap-3 py-1 hover:bg-gray-50 rounded px-2 -mx-2 transition-colors"
                        >
                          <span className="text-gray-300 text-xs shrink-0">└</span>
                          <span className="text-sm text-gray-600 w-[100px] shrink-0">
                            {factor.name}
                          </span>
                          <FactorBar
                            score={factor.avgTScore}
                            color={lightenColor(subCat.color)}
                            height="sm"
                          />
                          <span className="text-xs font-semibold text-gray-500 w-[42px] text-right shrink-0">
                            T {factor.avgTScore}
                          </span>
                          <LevelBadge
                            level={factor.level}
                            isPositive={factor.isPositive}
                            size="sm"
                          />
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
