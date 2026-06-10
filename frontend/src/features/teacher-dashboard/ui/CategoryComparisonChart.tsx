import type React from 'react';
import { useMemo } from 'react';
import styled from '@emotion/styled';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { Class } from '@shared/types';
import {
  calculateCategoryAverages,
  transformToCategoryChartData,
  calculateSubCategoryAverages,
  transformToSubCategoryChartData,
} from '@shared/utils/classComparisonUtils';

interface CategoryComparisonChartProps {
  classes: Class[];
  selectedClassId?: string | null;
  onClassSelect?: (classId: string | null) => void;
  drillLevel?: '5areas' | '11categories';
}

const CLASS_COLORS = [
  '#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
  '#14B8A6', '#F97316', '#06B6D4', '#EC4899', '#3B82F6',
];

const Container = styled.div`
  position: relative;
`;

export const CategoryComparisonChart: React.FC<CategoryComparisonChartProps> = ({
  classes,
  selectedClassId,
  onClassSelect,
  drillLevel = '5areas',
}) => {
  const chartData = useMemo(() => {
    if (drillLevel === '11categories') {
      return transformToSubCategoryChartData(classes.map(calculateSubCategoryAverages));
    }
    return transformToCategoryChartData(classes.map(calculateCategoryAverages));
  }, [classes, drillLevel]);

  const handleLineClick = (classId: string) => {
    if (onClassSelect) {
      onClassSelect(selectedClassId === classId ? null : classId);
    }
  };

  const chartHeight = drillLevel === '11categories' ? 460 : 400;

  return (
    <Container>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 40, left: 10, bottom: drillLevel === '11categories' ? 90 : 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />

          <XAxis
            dataKey="category"
            angle={-25}
            textAnchor="end"
            height={drillLevel === '11categories' ? 90 : 70}
            tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
            axisLine={{ stroke: '#D1D5DB', strokeWidth: 1.5 }}
            tickLine={false}
          />

          <YAxis
            domain={[20, 80]}
            tick={{ fontSize: 11, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.98)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              padding: '12px 16px',
              fontSize: '13px',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px', color: '#111827' }}
            itemStyle={{ padding: '2px 0', fontWeight: 500 }}
          />

          <Legend
            wrapperStyle={{ paddingTop: '12px', fontSize: '12px', fontWeight: 500 }}
            iconType="line"
            iconSize={14}
            onClick={(e) => {
              const cls = classes.find((c) => `${c.grade}-${c.classNumber}반` === e.value);
              if (cls) handleLineClick(cls.id);
            }}
            style={{ cursor: 'pointer' }}
          />

          <ReferenceLine
            y={50}
            stroke="#9CA3AF"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ value: '전국 평균 (50)', position: 'right', fontSize: 11, fill: '#9CA3AF' }}
          />

          {classes.map((cls, idx) => {
            const name = `${cls.grade}-${cls.classNumber}반`;
            const isSelected = selectedClassId === cls.id;
            const hasSelection = selectedClassId !== null;
            const color = CLASS_COLORS[idx % CLASS_COLORS.length];
            return (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={color}
                strokeWidth={isSelected ? 3.5 : hasSelection ? 1.5 : 2.5}
                strokeOpacity={isSelected ? 1 : hasSelection ? 0.25 : 0.9}
                dot={{ r: isSelected ? 5 : 3.5, fill: color, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: color, strokeWidth: 2, stroke: '#fff' }}
                onClick={() => handleLineClick(cls.id)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Container>
  );
};
