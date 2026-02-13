import { getBarPercent, PREV_COLOR } from '@/shared/utils/chartUtils';
import { lightenColor } from '@/shared/utils/colorUtils';
import { T50_PERCENT } from '@/features/student-dashboard/components/four-step/constants';

// ============================================================
// DualBar Props
// ============================================================

export interface DualBarProps {
  score: number;
  prevScore?: number;
  color: string;
  height?: string;
  radius?: string;
  showLabel?: boolean;
  labelSize?: string;
}

// ============================================================
// DualBar (이중 막대 렌더링 유틸)
// ============================================================

export function DualBar({
  score,
  prevScore,
  color,
  height = 'h-7',
  radius = '0 4px 4px 0',
  showLabel = true,
  labelSize = 'text-xs',
}: DualBarProps) {
  const curPct = Math.max(0, Math.min(getBarPercent(score), 100));
  const hasPrev = prevScore != null;
  const prevPct = hasPrev ? Math.max(0, Math.min(getBarPercent(prevScore), 100)) : 0;

  return (
    <div className={`flex-1 ${height} bg-gray-100 rounded overflow-hidden relative`}>
      {/* T=50 기준선 */}
      <div
        className="absolute top-0 bottom-0 w-px border-l border-dashed border-gray-600 z-[1]"
        style={{ left: `${T50_PERCENT}%` }}
      />

      {hasPrev && prevScore !== score ? (
        prevPct > curPct ? (
          <>
            {/* 1차 > 2차: [0..2차]=색상, [2차..1차]=회색 */}
            <div
              className="absolute top-0 left-0 h-full transition-all duration-300"
              style={{ width: `${curPct}%`, backgroundColor: color }}
            />
            <div
              className="absolute top-0 h-full transition-all duration-300"
              style={{
                left: `${curPct}%`,
                width: `${prevPct - curPct}%`,
                backgroundColor: PREV_COLOR,
                borderRadius: radius,
              }}
            />
            {showLabel && curPct > 20 && (
              <div className="absolute top-0 left-0 h-full flex items-center justify-end pr-2 z-20 pointer-events-none" style={{ width: `${curPct}%` }}>
                <span className={`${labelSize} font-bold text-white whitespace-nowrap`}>
                  T={score.toFixed(0)}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 1차 < 2차: [0..1차]=회색, [1차..2차]=색상 */}
            <div
              className="absolute top-0 left-0 h-full transition-all duration-300"
              style={{ width: `${prevPct}%`, backgroundColor: PREV_COLOR }}
            />
            <div
              className="absolute top-0 h-full transition-all duration-300"
              style={{
                left: `${prevPct}%`,
                width: `${curPct - prevPct}%`,
                backgroundColor: color,
                borderRadius: radius,
              }}
            />
            {showLabel && curPct > 20 && (
              <div className="absolute top-0 left-0 h-full flex items-center justify-end pr-2 z-20 pointer-events-none" style={{ width: `${curPct}%` }}>
                <span className={`${labelSize} font-bold text-white whitespace-nowrap`}>
                  T={score.toFixed(0)}
                </span>
              </div>
            )}
          </>
        )
      ) : (
        /* 단일 막대 (1차 없거나 동일) */
        <div
          className="h-full flex items-center justify-end pr-2 transition-all duration-300"
          style={{
            width: `${curPct}%`,
            backgroundColor: color,
            borderRadius: radius,
          }}
        >
          {showLabel && curPct > 20 && (
            <span className={`${labelSize} font-bold text-white whitespace-nowrap`}>
              T={score.toFixed(0)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// LeafFactorItem Props
// ============================================================

export interface LeafFactorItemProps {
  label: string;
  score: number;
  prevScore?: number;
  color: string;
}

// ============================================================
// LeafFactorItem (3depth 소분류 단일 요인)
// ============================================================

export function LeafFactorItem({ label, score, prevScore, color }: LeafFactorItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-40 pl-6 text-[11px] text-gray-500 flex-shrink-0 flex items-center gap-1">
        <span className="text-gray-300">└</span>
        {label}
      </div>
      <DualBar
        score={score}
        prevScore={prevScore}
        color={lightenColor(color)}
        height="h-5"
        radius="0 3px 3px 0"
        showLabel={false}
        labelSize="text-[10px]"
      />
      <div className="w-12 text-right text-[11px] font-medium text-gray-500">
        {score.toFixed(0)}
      </div>
    </div>
  );
}
