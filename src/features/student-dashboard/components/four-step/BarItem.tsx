import { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { SUB_CATEGORY_FACTORS, FACTOR_DEFINITIONS } from '@/shared/data/factors';
import { CATEGORY_COLORS } from '@/shared/data/lpaProfiles';
import { lightenColor } from '@/shared/utils/colorUtils';
import { DualBar } from '@/features/student-dashboard/components/four-step/DualBar';

// ============================================================
// BarItem Props
// ============================================================

export interface BarItemProps {
  label: string;
  score: number;
  prevScore?: number;
  isNegative?: boolean;
  subCategoryKey?: string;
  tScores?: number[];
  prevTScores?: number[];
}

// ============================================================
// BarItem (2depth 중분류)
// ============================================================

export function BarItem({
  label,
  score,
  prevScore,
  isNegative = false,
  subCategoryKey,
  tScores,
  prevTScores,
}: BarItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const barHex = subCategoryKey ? (CATEGORY_COLORS[subCategoryKey] ?? '#9CA3AF') : '#9CA3AF';

  const subFactors = useMemo(() => {
    if (!subCategoryKey || !tScores) return [];
    const indices = SUB_CATEGORY_FACTORS[subCategoryKey];
    if (!indices) return [];
    return indices.map(idx => ({
      name: FACTOR_DEFINITIONS[idx].name,
      score: tScores[idx],
      prevScore: prevTScores ? prevTScores[idx] : undefined,
    }));
  }, [subCategoryKey, tScores, prevTScores]);

  const hasSubFactors = subFactors.length > 1;

  return (
    <div>
      <div
        className={`flex items-center gap-2 ${hasSubFactors ? 'cursor-pointer' : ''}`}
        onClick={() => hasSubFactors && setIsExpanded(!isExpanded)}
      >
        <div className="w-40 text-xs font-medium text-gray-700 flex items-center gap-1 flex-shrink-0">
          {hasSubFactors && (
            isExpanded
              ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          )}
          {label}
          {isNegative && (
            <span className="text-[10px] text-red-500 font-normal">(부적)</span>
          )}
        </div>
        <DualBar score={score} prevScore={prevScore} color={barHex} />
        <div className="w-12 text-right text-xs font-semibold text-gray-600">
          {score.toFixed(0)}
        </div>
      </div>

      {/* 하위 요인 드롭다운 */}
      {isExpanded && hasSubFactors && (
        <div className="mt-1 space-y-1">
          {subFactors.map(factor => (
            <div key={factor.name} className="flex items-center gap-2">
              <div className="w-40 pl-6 text-[11px] text-gray-500 flex-shrink-0 flex items-center gap-1">
                <span className="text-gray-300">└</span>
                {factor.name}
              </div>
              <DualBar
                score={factor.score}
                prevScore={factor.prevScore}
                color={lightenColor(barHex)}
                height="h-5"
                radius="0 3px 3px 0"
                showLabel={false}
                labelSize="text-[10px]"
              />
              <div className="w-12 text-right text-[11px] font-medium text-gray-500">
                {factor.score.toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
