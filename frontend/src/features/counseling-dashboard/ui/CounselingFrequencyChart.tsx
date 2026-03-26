import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock 데이터: 월별 상담 건수
const mockFrequencyData = [
  { month: '9월', count: 12 },
  { month: '10월', count: 18 },
  { month: '11월', count: 25 },
  { month: '12월', count: 15 },
  { month: '1월', count: 8 },
  { month: '2월', count: 22 },
  { month: '3월', count: 23 },
];

export const CounselingFrequencyChart: React.FC = () => {
  return (
    <ResponsiveContainer width='100%' height={240}>
      <LineChart data={mockFrequencyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' vertical={false} />
        <XAxis
          dataKey='month'
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#D1D5DB' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#D1D5DB' }}
          tickLine={false}
          width={40}
        />
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
          labelStyle={{ fontWeight: 600, marginBottom: '4px', color: '#111827' }}
        />
        <Line
          type='monotone'
          dataKey='count'
          stroke='#3351A4'
          strokeWidth={3}
          dot={{
            r: 5,
            fill: '#3351A4',
            strokeWidth: 2,
            stroke: '#fff',
          }}
          activeDot={{
            r: 7,
            fill: '#3351A4',
            strokeWidth: 3,
            stroke: '#fff',
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
