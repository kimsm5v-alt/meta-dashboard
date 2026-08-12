/**
 * 도넛 게이지 컴포넌트
 *
 * - 게이지 채움 비율 = percentile / 100
 * - 시작각 12시, 시계방향
 * - 게이지 색상 = LEVEL_COLORS[getLevel(t)]
 * - 중앙: 등급 텍스트 + "{t}({percentile})" 2줄
 */

import { getLevel } from './utils/level';
import { LEVEL_COLORS } from './constants/strategy';
import type { LevelType } from './types';

interface DonutGaugeProps {
  /** T점수 */
  t: number;
  /** 백분위 */
  percentile: number;
  /** 게이지 크기 (px) */
  size?: number;
  /** 게이지 두께 (px) */
  strokeWidth?: number;
}

export const DonutGauge: React.FC<DonutGaugeProps> = ({
  t,
  percentile,
  size = 100,
  strokeWidth = 8,
}) => {
  const level: LevelType = getLevel(t);
  const color = LEVEL_COLORS[level];

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 백분위 0~100 범위로 clamp
  const safePercentile = Math.max(0, Math.min(100, percentile));
  const progress = (safePercentile / 100) * circumference;

  // 12시 시작, 시계방향: rotate(-90deg), strokeDasharray 순방향
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* 진행 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
      </svg>

      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-xs font-bold"
          style={{ color }}
        >
          {level}
        </span>
        <span className="text-sm font-semibold text-gray-700">
          {t}({percentile})
        </span>
      </div>
    </div>
  );
};

export default DonutGauge;
