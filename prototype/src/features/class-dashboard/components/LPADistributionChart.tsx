/**
 * 결과보기 - LPA 유형 분포 차트
 *
 * 3가지 유형별 학생 수/비율 도넛 파이차트
 */

import { useState } from 'react';
import type { LPADistribution } from '../types';

interface LPADistributionChartProps {
  distribution: LPADistribution[];
  totalCount: number;
}

export const LPADistributionChart: React.FC<LPADistributionChartProps> = ({
  distribution,
  totalCount,
}) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  // 도넛 차트 설정
  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  // 세그먼트 계산
  let offset = 0;
  const segments = distribution.map((item) => {
    const percentage = item.percentage / 100;
    const dashLength = percentage * circumference;
    const segment = {
      ...item,
      dashLength,
      offset,
    };
    offset += dashLength;
    return segment;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">LPA 유형 분포</h3>

      <div className="flex items-center gap-8">
        {/* 도넛 차트 */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* 배경 원 */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
            />

            {/* 세그먼트 */}
            {segments.map((seg) => (
              <circle
                key={seg.type}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                strokeDashoffset={-seg.offset}
                style={{
                  cursor: 'pointer',
                  opacity: hoveredType === seg.type ? 1 : 0.85,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={() => setHoveredType(seg.type)}
                onMouseLeave={() => setHoveredType(null)}
              />
            ))}
          </svg>

          {/* 중앙 텍스트 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{totalCount}</span>
            <span className="text-xs text-gray-500">명</span>
          </div>
        </div>

        {/* 범례 */}
        <div className="flex-1 space-y-3">
          {distribution.map((item) => (
            <div
              key={item.type}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                hoveredType === item.type ? 'bg-gray-50' : ''
              }`}
              onMouseEnter={() => setHoveredType(item.type)}
              onMouseLeave={() => setHoveredType(null)}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700 flex-1">{item.type}</span>
              <span className="text-sm font-medium text-gray-900">
                {item.count}명
              </span>
              <span className="text-sm text-gray-500">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LPADistributionChart;
