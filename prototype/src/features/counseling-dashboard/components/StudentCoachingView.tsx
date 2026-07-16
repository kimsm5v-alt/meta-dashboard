/**
 * 학생 코칭 탭 - 개별 학생 대상 코칭 정보
 *
 * 구성:
 * ① 학습 유형 알아보기 (도넛 차트 + 유형 설명) - TypeClassification 디자인 적용
 * ② 이 학생만의 강점, 칭찬해주세요
 * ③ 이 학생에게 맞는 코칭, 이렇게 해보세요
 */

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ThumbsUp, MessageSquare, Lightbulb, Info } from 'lucide-react';
import type { StudentCoachingData } from '../types';
import { LPA_TYPE_COLORS } from '../types';

// LPA 유형 설명 (EXAM_COUNSELING.md 기준)
const LPA_TYPE_DESCRIPTIONS: Record<string, string> = {
  // 초등
  '자원소진형': '학습에 필요한 심리·정서적 자원이 상대적으로 낮고, 기대나 부담은 크게 느끼는 유형입니다. 먼저 부담을 낮추고 작은 성공 경험을 통해 학습 회복감을 키워주세요.',
  '안전 균형형': '전반적으로 안정적인 학습 상태를 보이지만, 스스로 점검하고 조절하는 힘은 더 키워야 할 수 있습니다. 계획·점검 습관을 함께 길러주세요.',
  '몰입자원 풍부형': '긍정적 학습 자원이 풍부하고 몰입 가능성이 높은 유형입니다. 강점을 유지하면서 도전 목표와 깊이 있는 학습 경험으로 확장해주세요.',
  // 중등
  '냉소적 무기력형': '심리·정서적 자원이 상대적으로 낮고, 성적과 공부 부담을 크게 느끼는 유형입니다. 먼저 부담을 낮추고 정서적 회복감과 작은 성취 경험을 만들어주세요.',
  '정서조절 취약형': '학습 자원은 일정 수준 있으나, 성적 압박과 소진을 크게 느끼는 유형입니다. 학습 전략뿐 아니라 감정 조절과 부담 관리 방법을 함께 지원해주세요.',
  '자기주도 몰입형': '심리·정서적 자원이 풍부하고 자기주도적 몰입 가능성이 높은 유형입니다. 현재의 강점을 유지하면서 도전 목표와 심화 학습 기회를 제공해주세요.',
};

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

interface StudentCoachingViewProps {
  data: StudentCoachingData;
  className?: string;
}

export const StudentCoachingView: React.FC<StudentCoachingViewProps> = ({
  data,
  className,
}) => {
  const { lpaData, typeInfo, strengthPraises, coachingPathway } = data;

  const topProb = Math.round(lpaData.probabilities[lpaData.predictedType] || 0);

  // Recharts용 차트 데이터
  const chartData = Object.entries(lpaData.probabilities)
    .map(([type, prob]) => ({
      name: type,
      value: Math.round(prob * 10) / 10,
      color: LPA_TYPE_COLORS[type as keyof typeof LPA_TYPE_COLORS] || '#9CA3AF',
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* ① 학습 유형 알아보기 - TypeClassification 디자인 적용 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">학습 유형 분류</h3>
            <LpaInfoTooltip />
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* 좌측: 도넛 그래프 (Recharts) */}
            <div className="md:col-span-2 flex items-center justify-center">
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {chartData.map((entry, index) => (
                        <linearGradient key={`gradient-${index}`} id={`coaching-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
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
                          fill={`url(#coaching-gradient-${index})`}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          const typeName = d.name;
                          const description = LPA_TYPE_DESCRIPTIONS[typeName];
                          return (
                            <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg max-w-72">
                              <p className="font-bold text-yellow-400 mb-1">{typeName}</p>
                              <p className="text-gray-100 mb-2">{d.value}%</p>
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
                        <p className="leading-relaxed text-gray-300">{LPA_TYPE_DESCRIPTIONS[item.name]}</p>
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
                    style={{ backgroundColor: LPA_TYPE_COLORS[typeInfo.type] }}
                  >
                    {topProb}%
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">{typeInfo.type}</h4>
                </div>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ② 이 학생만의 강점, 칭찬해주세요 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ThumbsUp className="w-5 h-5 text-green-600" />
          <h3 className="text-base font-semibold text-gray-900">
            이 학생만의 강점, 칭찬해주세요
          </h3>
        </div>

        <div className="space-y-4">
          {strengthPraises.map((praise, index) => (
            <div
              key={index}
              className="bg-green-50 rounded-lg p-4 border border-green-100"
            >
              {/* 강점 요인 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded">
                  강점 {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-900">{praise.factor}</span>
                <span className="text-xs text-gray-500">({praise.area})</span>
              </div>

              {/* 칭찬 이유 */}
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                {praise.reason}
              </p>

              {/* 칭찬 멘트 */}
              <div className="flex items-start gap-2 bg-white rounded-lg p-3 border border-green-200">
                <MessageSquare className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 font-medium italic">
                  {praise.praiseScript}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ③ 이 학생에게 맞는 코칭, 이렇게 해보세요 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          <h3 className="text-base font-semibold text-gray-900">
            이 학생에게 맞는 코칭, 이렇게 해보세요
          </h3>
        </div>

        {/* 상단 설명문 */}
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              이 학생, 이것만 신경 써주세요
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
              보완점
            </span>
            <span className="text-sm font-medium text-gray-900">{coachingPathway.weakFactor}</span>
            <span className="text-xs text-gray-500">({coachingPathway.area})</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {coachingPathway.pathwayDescription}
          </p>
        </div>

        {/* 코칭 포인트 */}
        <div className="space-y-4">
          {coachingPathway.coachingPoints.map((point, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              {/* 코칭 방법 */}
              <div className="flex items-center gap-2 mb-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <p className="text-sm font-medium text-gray-900">{point.method}</p>
              </div>

              {/* 교사 활용 멘트 */}
              <div className="flex items-start gap-2 bg-white rounded-lg p-3 border border-gray-200">
                <MessageSquare className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-primary-800 font-medium italic">
                  {point.teacherScript}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentCoachingView;
