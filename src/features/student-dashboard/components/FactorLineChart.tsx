import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, LabelList } from 'recharts';
import { SUB_CATEGORIES, CATEGORY_COLORS } from '../../../shared/data/lpaProfiles';
import { calculateSubCategoryScores } from '../../../shared/utils/summaryGenerator';

interface FactorLineChartProps {
  tScores: number[];
}

export const FactorLineChart: React.FC<FactorLineChartProps> = ({ tScores }) => {
  const subCategoryScores = calculateSubCategoryScores(tScores);

  const chartData = SUB_CATEGORIES.map(subCat => ({
    name: subCat,
    score: subCategoryScores[subCat] || 50,
    color: CATEGORY_COLORS[subCat] || '#9CA3AF',
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">중분류 요인 그래프</h3>
        <span className="text-xs text-gray-500">점선(--): 전국 평균 T=50</span>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 80, left: 120, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[20, 80]} ticks={[20, 30, 40, 50, 60, 70, 80]} hide />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [`T=${value}`, 'T점수']} />
            <ReferenceLine x={50} stroke="#888" strokeDasharray="3 3" />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList dataKey="score" position="insideRight" style={{ fontSize: 12, fontWeight: 600, fill: 'white' }} formatter={(value: number) => `T=${value}`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FactorLineChart;
