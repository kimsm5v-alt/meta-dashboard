import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TYPE_COLORS } from '../../../shared/data/lpaProfiles';
import { getTypeInfo } from '../../../shared/utils/lpaClassifier';
import type { StudentType, SchoolLevel } from '../../../shared/types';

interface TypeClassificationProps {
  predictedType: StudentType;
  typeProbabilities: Record<string, number>;
  schoolLevel: SchoolLevel;
}

export const TypeClassification: React.FC<TypeClassificationProps> = ({
  predictedType,
  typeProbabilities,
  schoolLevel,
}) => {
  const typeInfo = getTypeInfo(predictedType, schoolLevel);

  const chartData = Object.entries(typeProbabilities)
    .map(([type, prob]) => ({
      name: type,
      value: Math.round(prob * 10) / 10,
      color: TYPE_COLORS[type] || '#9CA3AF',
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">학습 유형 분류</h3>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* 좌측: 도넛 그래프 (40%) */}
        <div className="md:col-span-2 flex items-center justify-center">
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={chartData}
                  cx="60%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  innerRadius={70}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                  cornerRadius={4}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#gradient-${index})`}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={(value: string, entry: any) => `${value} ${entry.payload.value}%`}
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: '13px', paddingLeft: '0px', marginLeft: '-100px', lineHeight: '2' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 우측: 유형 정보 (60%) */}
        <div className="md:col-span-3">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="text-center mb-3">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white font-bold text-xl mb-2 shadow-lg"
                style={{ backgroundColor: TYPE_COLORS[predictedType] }}
              >
                {Math.round(typeProbabilities[predictedType] || 0)}%
              </div>
              <h4 className="text-xl font-bold text-gray-800">{predictedType}</h4>
            </div>
            {typeInfo && (
              <div className="space-y-3">
                <div className="bg-white/60 rounded-lg p-3">
                  <p className="text-sm font-bold text-indigo-700 mb-1">📋 유형 설명</p>
                  <p className="text-sm text-gray-800 leading-relaxed font-medium">{typeInfo.description}</p>
                </div>
                {typeInfo.characteristics && typeInfo.characteristics.length > 0 && (
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-sm font-bold text-indigo-700 mb-2">✨ 주요 특성</p>
                    <ul className="space-y-1">
                      {typeInfo.characteristics.map((char, i) => (
                        <li key={i} className="text-sm text-gray-800 flex items-start gap-2 font-medium">
                          <span className="text-primary-500 font-bold flex-shrink-0">•</span>
                          <span>{char}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypeClassification;
