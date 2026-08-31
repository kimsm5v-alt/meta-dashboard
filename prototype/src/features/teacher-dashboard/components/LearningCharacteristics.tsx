/**
 * 홈 > Section 5: 반별 학습 특성 비교
 *
 * 결과보기 > 전체의 5대 영역 라인 차트 축소형
 */

import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface ChartDataPoint {
  category: string;
  [key: string]: string | number;
}

interface LearningCharacteristicsProps {
  data: ChartDataPoint[];
}

const CATEGORY_ORDER = ['자아강점', '학습디딤돌', '긍정적공부마음', '학습걸림돌', '부정적공부마음'];
const CLASS_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

export const LearningCharacteristics: React.FC<LearningCharacteristicsProps> = ({ data }) => {
  const navigate = useNavigate();

  // 반 이름 추출 (category 제외한 키들)
  const classNames = data.length > 0
    ? Object.keys(data[0]).filter((key) => key !== 'category')
    : [];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">반별 학습 특성 비교</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          5대 영역별 평균 T점수 (점선 50 = 전국 평균)
        </p>
      </div>

      {/* 축소형 라인 차트 */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 10, right: 40, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="category"
            angle={-25}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
            axisLine={{ stroke: '#D1D5DB' }}
            tickLine={false}
            padding={{ left: 30, right: 30 }}
          />
          <YAxis
            domain={[30, 70]}
            tick={{ fontSize: 11, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
            tickLine={false}
            ticks={[30, 40, 50, 60, 70]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              padding: '8px 12px',
              fontSize: '12px',
            }}
          />
          <ReferenceLine
            y={50}
            stroke="#9CA3AF"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{
              value: '전국 평균',
              position: 'right',
              fontSize: 10,
              fill: '#6B7280',
            }}
          />
          {classNames.map((className, idx) => (
            <Line
              key={className}
              type="linear"
              dataKey={className}
              stroke={CLASS_COLORS[idx % CLASS_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: CLASS_COLORS[idx % CLASS_COLORS.length], strokeWidth: 1, stroke: '#fff' }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="flex gap-4 mt-3 justify-center flex-wrap">
        {classNames.map((className, idx) => (
          <div key={className} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CLASS_COLORS[idx % CLASS_COLORS.length] }}
            />
            <span className="text-xs text-gray-600">{className}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningCharacteristics;
