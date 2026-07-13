/**
 * 결과보기 > 학생 - 학습 유형 분류
 *
 * LPA 유형 분류 결과를 도넛 차트로 시각화
 * - 초등: 자원소진형, 안전 균형형, 몰입자원 풍부형
 * - 중등: 냉소적 무기력형, 정서조절 취약형, 자기주도 몰입형
 *
 * @see prototype-legacy/src/features/student-dashboard/components/TypeClassification.tsx
 */

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Info } from 'lucide-react';
import {
  TYPE_COLORS,
  LPA_TYPE_DESCRIPTIONS_ELEMENTARY,
  LPA_TYPE_DESCRIPTIONS_MIDDLE,
} from '@/shared/data/lpaProfiles';
import { getTypeInfo } from '@/shared/utils/lpaClassifier';
import type { StudentType, SchoolLevel } from '@/shared/types';

/** LPA 분류 설명 툴팁 컴포넌트 */
const LpaInfoTooltip: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </div>
      {isVisible && (
        <div className="absolute left-0 top-full mt-2 w-[420px] p-4 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50">
          <p className="font-bold text-yellow-400 mb-3 text-sm">학생유형 분포 비교</p>
          <p className="text-gray-200 leading-relaxed">
            비상교육은 학생을 단순한 점수로 구분하지 않고, 학습 특성이 함께 나타나는 패턴을 분석하기 위해 LPA 기반 학습유형 분석을 도입했습니다.
          </p>
          <p className="text-gray-200 leading-relaxed mt-2">
            LPA는 최근 교육·심리·사회과학 연구에서 활용되는 통계 분석 기법으로, 학생의 학습 부담, 심리·정서적 자원, 학습 몰입을 종합적으로 살펴 유사한 학습 상태를 유형화합니다.
          </p>
          <p className="text-gray-200 leading-relaxed mt-2">
            이를 통해 선생님께서는 학생의 현재 상태를 더 입체적으로 이해하고, 유형별로 필요한 지원 방향을 확인할 수 있습니다.
          </p>
          <div className="absolute bottom-full left-4 border-8 border-transparent border-b-gray-900" />
        </div>
      )}
    </div>
  );
};

interface TypeClassificationProps {
  predictedType: StudentType;
  typeProbabilities: Record<string, number>;
  schoolLevel: SchoolLevel;
  showCompare?: boolean;
  prevType?: StudentType;
  prevTypeProbabilities?: Record<string, number>;
}

export const TypeClassification: React.FC<TypeClassificationProps> = ({
  predictedType,
  typeProbabilities,
  schoolLevel,
  showCompare = false,
  prevType,
  prevTypeProbabilities,
}) => {
  const typeInfo = getTypeInfo(predictedType, schoolLevel);
  const typeDescriptions = schoolLevel === '중등'
    ? LPA_TYPE_DESCRIPTIONS_MIDDLE
    : LPA_TYPE_DESCRIPTIONS_ELEMENTARY;

  // typeProbabilities가 없을 경우 빈 배열 반환
  if (!typeProbabilities) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">학습 유형 분류</h3>
            <LpaInfoTooltip />
          </div>
        </div>
        <div className="p-5 text-center text-gray-500 py-8">
          유형 분류 데이터를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  // 차수 변화 모드
  if (showCompare && prevType && prevTypeProbabilities) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">학습 유형 분류</h3>
            <LpaInfoTooltip />
          </div>
        </div>
        <div className="p-5">
          <LpaCompareView
            prevType={prevType}
            prevProbs={prevTypeProbabilities}
            currType={predictedType}
            currProbs={typeProbabilities}
            typeDescriptions={typeDescriptions}
          />
        </div>
      </div>
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-gray-900">학습 유형 분류</h3>
          <LpaInfoTooltip />
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* 좌측: 도넛 그래프 */}
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
                </PieChart>
              </ResponsiveContainer>
              {/* 범례 */}
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
                    {/* 유형별 툴팁 */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg pointer-events-none">
                      <p className="font-bold text-yellow-400 mb-1">{item.name}</p>
                      <p className="leading-relaxed text-gray-300">{typeDescriptions[item.name]}</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 우측: 유형 정보 */}
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
                    <p className="text-sm font-bold text-indigo-700 mb-1">유형 설명</p>
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">{typeInfo.description}</p>
                  </div>
                  {typeInfo.characteristics && typeInfo.characteristics.length > 0 && (
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-sm font-bold text-indigo-700 mb-2">주요 특성</p>
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
    </div>
  );
};

// ============================================================
// 차수 비교 뷰
// ============================================================
interface LpaCompareViewProps {
  prevType: StudentType;
  prevProbs: Record<string, number>;
  currType: StudentType;
  currProbs: Record<string, number>;
  typeDescriptions?: Record<string, string>;
}

const TYPE_ORDER = ['자원소진형', '안전 균형형', '몰입자원 풍부형'];
const TYPE_ORDER_MIDDLE = ['냉소적 무기력형', '정서조절 취약형', '자기주도 몰입형'];

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LpaDonutMini({ type, probs, label, typeDescriptions = {} }: LpaDonutMiniProps) {
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  // 유형 순서 결정
  const typeOrder = Object.keys(probs).some(k => TYPE_ORDER_MIDDLE.includes(k))
    ? TYPE_ORDER_MIDDLE
    : TYPE_ORDER;

  const sortedData = typeOrder.map(t => ({
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
            {/* 유형별 툴팁 */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg pointer-events-none">
              <p className="font-bold text-yellow-400 mb-1">{d.type}</p>
              <p className="leading-relaxed text-gray-300">{typeDescriptions[d.type]}</p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TypeClassification;
