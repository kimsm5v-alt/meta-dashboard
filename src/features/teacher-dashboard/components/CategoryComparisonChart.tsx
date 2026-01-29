import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Class } from '../../../shared/types';
import { calculateCategoryAverages, transformToCategoryChartData } from '../../../shared/utils/classComparisonUtils';

interface CategoryComparisonChartProps {
  classes: Class[];
  selectedClassId?: string | null;
  onClassSelect?: (classId: string | null) => void;
}

// 반별 색상 (더 생생하고 조화로운 색상)
const CLASS_COLORS = [
  '#6366F1', // 인디고
  '#10B981', // 에메랄드
  '#F59E0B', // 앰버
  '#8B5CF6', // 바이올렛
  '#EF4444', // 레드
  '#14B8A6', // 틸
  '#F97316', // 오렌지
  '#06B6D4', // 시안
  '#EC4899', // 핑크
  '#3B82F6', // 블루
];

export const CategoryComparisonChart: React.FC<CategoryComparisonChartProps> = ({
  classes,
  selectedClassId,
  onClassSelect,
}) => {
  const chartData = useMemo(() => {
    const classAverages = classes.map(calculateCategoryAverages);
    return transformToCategoryChartData(classAverages);
  }, [classes]);

  const handleLineClick = (classId: string) => {
    if (onClassSelect) {
      if (selectedClassId === classId) {
        onClassSelect(null);
      } else {
        onClassSelect(classId);
      }
    }
  };

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={chartData}
          margin={{ top: 30, right: 40, left: 10, bottom: 70 }}
        >
          <defs>
            {classes.map((cls, idx) => (
              <linearGradient key={`gradient-${cls.id}`} id={`gradient-${cls.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CLASS_COLORS[idx % CLASS_COLORS.length]} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={CLASS_COLORS[idx % CLASS_COLORS.length]} stopOpacity={0.3}/>
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />

          <XAxis
            dataKey="category"
            angle={-25}
            textAnchor="end"
            height={90}
            tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
            axisLine={{ stroke: '#D1D5DB', strokeWidth: 1.5 }}
            tickLine={false}
          />

          <YAxis
            domain={[20, 80]}
            label={{
              value: 'T점수',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '13px', fill: '#374151', fontWeight: 600 },
            }}
            tick={{ fontSize: 11, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB', strokeWidth: 1.5 }}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              padding: '12px 16px',
              fontSize: '13px',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px', color: '#111827' }}
            itemStyle={{ padding: '4px 0', fontWeight: 500 }}
          />

          <Legend
            wrapperStyle={{
              paddingTop: '16px',
              fontSize: '13px',
              fontWeight: 500,
            }}
            iconType="line"
            iconSize={16}
            onClick={(e) => {
              const cls = classes.find(c => `${c.grade}-${c.classNumber}반` === e.value);
              if (cls) handleLineClick(cls.id);
            }}
            style={{ cursor: 'pointer' }}
          />

          <ReferenceLine
            y={50}
            stroke="#9CA3AF"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: '전국 평균 (50)',
              position: 'right',
              fontSize: 11,
              fill: '#6B7280',
              fontWeight: 600,
            }}
          />

          {classes.map((cls, idx) => {
            const className = `${cls.grade}-${cls.classNumber}반`;
            const isSelected = selectedClassId === cls.id;
            const hasSelection = selectedClassId !== null;
            const color = CLASS_COLORS[idx % CLASS_COLORS.length];

            return (
              <Line
                key={className}
                type="monotone"
                dataKey={className}
                stroke={color}
                strokeWidth={isSelected ? 4 : hasSelection ? 2 : 3}
                strokeOpacity={isSelected ? 1 : hasSelection ? 0.25 : 0.9}
                dot={{
                  r: isSelected ? 6 : hasSelection ? 3 : 5,
                  fill: color,
                  strokeWidth: 2,
                  stroke: '#fff',
                }}
                activeDot={{
                  r: 8,
                  fill: color,
                  strokeWidth: 3,
                  stroke: '#fff',
                  style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' },
                }}
                onClick={() => handleLineClick(cls.id)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
