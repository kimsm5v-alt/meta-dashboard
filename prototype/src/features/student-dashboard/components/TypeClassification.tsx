import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TYPE_COLORS } from '../../../shared/data/lpaProfiles';
import { getTypeInfo } from '../../../shared/utils/lpaClassifier';
import type { StudentType, SchoolLevel } from '../../../shared/types';

interface TypeClassificationProps {
  predictedType: StudentType;
  typeProbabilities: Record<string, number>;
  schoolLevel: SchoolLevel;
  // 차수 변화 모드용 props
  showCompare?: boolean;
  prevType?: StudentType;
  prevTypeProbabilities?: Record<string, number>;
  // 유형별 설명
  typeDescriptions?: Record<string, string>;
}

export const TypeClassification: React.FC<TypeClassificationProps> = ({
  predictedType,
  typeProbabilities,
  schoolLevel,
  showCompare = false,
  prevType,
  prevTypeProbabilities,
  typeDescriptions = {},
}) => {
  const typeInfo = getTypeInfo(predictedType, schoolLevel);

  // typeProbabilities가 없을 경우 빈 배열 반환
  if (!typeProbabilities) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">학습 유형 분류</h3>
        <div className="text-center text-gray-500 py-8">
          유형 분류 데이터를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  // 차수 변화 모드: 1차 -> 2차 비교 UI
  if (showCompare && prevType && prevTypeProbabilities) {
    return (
      <LpaCompareView
        prevType={prevType}
        prevProbs={prevTypeProbabilities}
        currType={predictedType}
        currProbs={typeProbabilities}
        typeDescriptions={typeDescriptions}
      />
    );
  }

  const chartData = Object.entries(typeProbabilities)
    .map(([type, prob]) => ({
      name: type,
      value: Math.round(prob * 10) / 10,
      color: TYPE_COLORS[type] || '#9CA3AF',
    }))
    .sort((a, b) => b.value - a.value);

  return (
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
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                innerRadius="45%"
                outerRadius="75%"
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
                cornerRadius={4}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#gradient-${index})`}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const typeName = data.name;
                    const description = typeDescriptions[typeName];
                    return (
                      <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg max-w-72">
                        <p className="font-bold text-yellow-400 mb-1">{typeName}</p>
                        <p className="text-gray-100 mb-2">{data.value}%</p>
                        {description && (
                          <p className="leading-relaxed text-gray-300">{description}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                content={() => (
                  <div className="flex justify-center gap-4 mt-2">
                    {chartData.map((item, index) => (
                      <div key={index} className="relative group flex items-center gap-1.5 cursor-help">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-gray-700">
                          {item.name} {item.value}%
                        </span>
                        {/* 툴팁 */}
                        {typeDescriptions[item.name] && (
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 shadow-lg pointer-events-none">
                            <p className="font-bold text-yellow-400 mb-1">{item.name}</p>
                            <p className="leading-relaxed text-gray-300">{typeDescriptions[item.name]}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
  );
};

// ============================================================
// 차수 비교 뷰 (HSJ Dashboard 스타일: 1차 -> 2차)
// ============================================================
interface LpaCompareViewProps {
  prevType: StudentType;
  prevProbs: Record<string, number>;
  currType: StudentType;
  currProbs: Record<string, number>;
  typeDescriptions?: Record<string, string>;
}

// 실제 데이터 키와 매칭되는 유형 순서
const TYPE_ORDER = ['자원소진형', '안전 균형형', '몰입자원 풍부형'];

function LpaCompareView({ prevType, prevProbs, currType, currProbs, typeDescriptions = {} }: LpaCompareViewProps) {
  return (
    <div className="flex items-center justify-center gap-8 pb-6">
      {/* 1차 검사 */}
      <LpaDonutMini type={prevType} probs={prevProbs} label="1차 검사" typeDescriptions={typeDescriptions} />

      {/* 화살표 */}
      <div className="flex flex-col items-center">
        <div className="text-3xl text-gray-400">→</div>
        {prevType !== currType ? (
          <span className="mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
            유형 변화
          </span>
        ) : (
          <span className="mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
            유형 유지
          </span>
        )}
      </div>

      {/* 2차 검사 */}
      <LpaDonutMini type={currType} probs={currProbs} label="2차 검사" typeDescriptions={typeDescriptions} />
    </div>
  );
}

interface LpaDonutMiniProps {
  type: StudentType;
  probs: Record<string, number>;
  label: string;
  typeDescriptions?: Record<string, string>;
}

function LpaDonutMini({ type, probs, label, typeDescriptions = {} }: LpaDonutMiniProps) {
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const sortedData = TYPE_ORDER.map(t => ({
    type: t,
    prob: probs[t] || 0,
    color: TYPE_COLORS[t] || '#9CA3AF',
  }));

  let accumulated = 0;
  const segments = sortedData.map(d => {
    const segment = { ...d, offset: accumulated };
    accumulated += d.prob;
    return segment;
  });

  const topColor = TYPE_COLORS[type] || '#6B7280';

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-semibold text-gray-600 mb-2">{label}</p>
      <div className="relative">
        <svg width={size} height={size}>
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {segments.map(seg => (
              <circle
                key={seg.type}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${(circumference * seg.prob) / 100} ${circumference}`}
                strokeDashoffset={(-circumference * seg.offset) / 100}
              />
            ))}
          </g>
          {/* 중앙 텍스트 */}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#6B7280">
            {Math.round(probs[type] || 0)}%
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize={12} fontWeight={800} fill={topColor}>
            {type}
          </text>
        </svg>
        {/* 차트 호버 영역 - 투명 레이어 */}
        <div className="absolute inset-0 flex">
          {segments.map(seg => {
            if (seg.prob === 0) return null;
            const pctWidth = seg.prob;
            return (
              <div
                key={seg.type}
                className="relative group h-full"
                style={{ width: `${pctWidth}%` }}
              >
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 shadow-lg pointer-events-none">
                  <p className="font-bold text-yellow-400 mb-0.5">{seg.type}</p>
                  <p className="text-gray-100 mb-1">{Math.round(seg.prob)}%</p>
                  {typeDescriptions[seg.type] && (
                    <p className="leading-relaxed text-gray-300 text-[10px]">{typeDescriptions[seg.type]}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex gap-3 mt-2">
        {sortedData.map(d => (
          <div key={d.type} className="relative group flex items-center gap-1 text-xs cursor-help">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-gray-600">{d.type}</span>
            <span className="text-gray-400 tabular-nums">{Math.round(d.prob)}%</span>
            {/* 툴팁 */}
            {typeDescriptions[d.type] && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 shadow-lg pointer-events-none">
                <p className="font-bold text-yellow-400 mb-1">{d.type}</p>
                <p className="leading-relaxed text-gray-300">{typeDescriptions[d.type]}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TypeClassification;
