import { getBarPercent, REF_LINE_POS, PREV_COLOR } from '@/shared/utils/chartUtils';

interface FactorBarProps {
  score: number;
  color: string;
  height?: 'sm' | 'md';
  /** 비교 모드: 1차 점수. 전달 시 1차=진한회색, 2차=색상 이중 막대 렌더링 */
  prevScore?: number;
}

export const FactorBar: React.FC<FactorBarProps> = ({ score, color, height = 'md', prevScore }) => {
  const h = height === 'sm' ? 'h-5' : 'h-7';
  const radius = height === 'sm' ? '0 3px 3px 0' : '0 4px 4px 0';
  const isCompare = prevScore != null;

  if (!isCompare) {
    // 기본 단일 막대
    return (
      <div className={`flex-1 relative ${h} bg-gray-100 rounded overflow-hidden`}>
        <div
          className="absolute top-0 bottom-0 w-px border-l border-dashed border-gray-400 z-10"
          style={{ left: `${REF_LINE_POS}%` }}
        />
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${getBarPercent(score)}%`,
            backgroundColor: color,
            borderRadius: radius,
          }}
        />
      </div>
    );
  }

  // 비교 모드 이중 막대
  const cur = score;       // 2차
  const prev = prevScore;  // 1차
  const curPct = getBarPercent(cur);
  const prevPct = getBarPercent(prev);

  if (prev > cur) {
    // CASE 1: 1차 > 2차 → [0..2차]=색상, [2차..1차]=진한회색
    return (
      <div className={`flex-1 relative ${h} bg-gray-100 rounded overflow-hidden`}>
        <div
          className="absolute top-0 bottom-0 w-px border-l border-dashed border-gray-400 z-10"
          style={{ left: `${REF_LINE_POS}%` }}
        />
        {/* 2차 영역 (색상) */}
        <div
          className="absolute top-0 left-0 h-full transition-all duration-300"
          style={{
            width: `${curPct}%`,
            backgroundColor: color,
          }}
        />
        {/* 1차 초과분 (진한회색) */}
        <div
          className="absolute top-0 h-full transition-all duration-300"
          style={{
            left: `${curPct}%`,
            width: `${prevPct - curPct}%`,
            backgroundColor: PREV_COLOR,
            borderRadius: radius,
          }}
        />
      </div>
    );
  }

  if (prev < cur) {
    // CASE 2: 1차 < 2차 → [0..1차]=진한회색, [1차..2차]=색상
    return (
      <div className={`flex-1 relative ${h} bg-gray-100 rounded overflow-hidden`}>
        <div
          className="absolute top-0 bottom-0 w-px border-l border-dashed border-gray-400 z-10"
          style={{ left: `${REF_LINE_POS}%` }}
        />
        {/* 1차 영역 (진한회색) */}
        <div
          className="absolute top-0 left-0 h-full transition-all duration-300"
          style={{
            width: `${prevPct}%`,
            backgroundColor: PREV_COLOR,
          }}
        />
        {/* 2차 증가분 (색상) */}
        <div
          className="absolute top-0 h-full transition-all duration-300"
          style={{
            left: `${prevPct}%`,
            width: `${curPct - prevPct}%`,
            backgroundColor: color,
            borderRadius: radius,
          }}
        />
      </div>
    );
  }

  // CASE 3: 1차 = 2차 → 그냥 색상
  return (
    <div className={`flex-1 relative ${h} bg-gray-100 rounded overflow-hidden`}>
      <div
        className="absolute top-0 bottom-0 w-px border-l border-dashed border-gray-400 z-10"
        style={{ left: `${REF_LINE_POS}%` }}
      />
      <div
        className="h-full transition-all duration-300"
        style={{
          width: `${curPct}%`,
          backgroundColor: color,
          borderRadius: radius,
        }}
      />
    </div>
  );
};
