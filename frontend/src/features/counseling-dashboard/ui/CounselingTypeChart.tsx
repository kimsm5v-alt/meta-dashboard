import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Mock 데이터: 상담 유형별 분포
const mockTypeData = [
  { name: '대면 상담', value: 85, color: '#3351A4' },
  { name: '전화 상담', value: 42, color: '#10B981' },
  { name: '온라인 상담', value: 29, color: '#F59E0B' },
];

// Mock 데이터: 상담 영역별 분포
const mockAreaData = [
  { name: '학업', value: 45, color: '#6366F1' },
  { name: '교우관계', value: 38, color: '#EC4899' },
  { name: '진로', value: 32, color: '#14B8A6' },
  { name: '정서심리', value: 28, color: '#F97316' },
  { name: '가정', value: 13, color: '#8B5CF6' },
];

interface CounselingTypeChartProps {
  type: 'type' | 'area';
}

export const CounselingTypeChart: React.FC<CounselingTypeChartProps> = ({ type }) => {
  const data = type === 'type' ? mockTypeData : mockAreaData;

  return (
    <ResponsiveContainer width='100%' height={240}>
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='50%'
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey='value'
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '8px 12px',
            fontSize: '13px',
          }}
          formatter={(value) => [`${value ?? 0}건`, '상담 횟수']}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} iconType='circle' iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
};
