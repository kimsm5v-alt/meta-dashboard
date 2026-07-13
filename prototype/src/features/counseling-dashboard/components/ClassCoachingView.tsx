/**
 * 학급 코칭 탭 - 학급 전체 대상 코칭 정보
 *
 * 구성:
 * ① 검사별 유형 분포 (1차/2차 도넛 차트 나란히)
 * ② 우리 반 우세 유형 특징
 * ③ 학급 추천 전략
 * ④ 우리 반 검사 결과 함께 보기 (고정, 수업교안 다운로드)
 * ⑤⑥ 추가 코칭 1, 2
 */

import { Download, Info } from 'lucide-react';
import type { ClassCoachingData } from '../types';
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

interface ClassCoachingViewProps {
  data: ClassCoachingData;
  className?: string;
}

export const ClassCoachingView: React.FC<ClassCoachingViewProps> = ({
  data,
  className,
}) => {
  const { lpaDistribution, dominantType, dominantTypeCharacteristics, recommendedStrategy, additionalStrategies } = data;

  // 1차 도넛 차트 데이터
  const round1Data = Object.entries(lpaDistribution.distribution)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / lpaDistribution.completedStudents) * 100),
      color: LPA_TYPE_COLORS[type as keyof typeof LPA_TYPE_COLORS] || '#9CA3AF',
    }))
    .sort((a, b) => b.count - a.count);

  // 2차 검사 데이터 (Mock - 아직 진행 안됨)
  const round2Available = false;

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* ① 검사별 유형 분포 (1차/2차 나란히) */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">검사별 유형 분포</h3>
            {/* LPA 분류 설명 툴팁 */}
            <div className="relative group">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute left-0 top-full mt-2 w-[420px] p-4 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
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
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            1차와 2차 검사 결과를 비교하여 학생들의 유형 변화를 확인하세요.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-6">
          {/* 1차 검사 도넛 */}
          <LPADonutChart
            round={1}
            distribution={round1Data}
            totalCount={lpaDistribution.completedStudents}
            tooltipPosition="left"
          />

          {/* 2차 검사 도넛 (예정 표시) */}
          {round2Available ? (
            <LPADonutChart
              round={2}
              distribution={round1Data} // 2차 데이터 사용
              totalCount={lpaDistribution.completedStudents}
              tooltipPosition="right"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-4xl text-gray-300 mb-2">—</div>
              <p className="text-sm text-gray-500">2차 검사가 아직 진행되지 않았습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 나머지 섹션들 - 가로 2열 배치 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ② 우리 반 우세 유형 특징 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-base font-semibold text-gray-900">우리 반 우세 유형 특징</h3>
            <span
              className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: LPA_TYPE_COLORS[dominantType] }}
            >
              {dominantType}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {dominantTypeCharacteristics}
          </p>
        </div>

        {/* ③ 학급 추천 전략 */}
        <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl border border-primary-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-semibold text-gray-900">학급 추천 전략</h3>
            <span
              className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: LPA_TYPE_COLORS[recommendedStrategy.type] }}
            >
              {recommendedStrategy.type} 대응
            </span>
          </div>

          <h4 className="text-lg font-bold text-primary-700 mb-2">
            {recommendedStrategy.strategyTitle}
          </h4>
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            {recommendedStrategy.strategyDescription}
          </p>

          <div className="space-y-2">
            {recommendedStrategy.actionItems.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 중단: 우리 반 검사 결과 함께 보기 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          우리 반 검사 결과 함께 보기
        </h3>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          학생들과 함께 검사 결과를 살펴보고 학급 전체의 학습 특성을 공유해보세요.
          학급 구성원으로서 서로를 이해하고, 함께 성장하는 분위기를 만들 수 있습니다.
        </p>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          아래 버튼을 클릭하면 학급 수업에서 활용할 수 있는 교안을 다운로드할 수 있습니다.
        </p>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Download className="w-4 h-4" />
          수업교안 다운로드
        </button>
      </div>

      {/* 하단: 추가 코칭 1, 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {additionalStrategies.map((strategy, index) => (
          <div key={strategy.type} className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-base font-semibold text-gray-900">추가 코칭 {index + 1}</h3>
              <span
                className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                style={{ backgroundColor: LPA_TYPE_COLORS[strategy.type] }}
              >
                {strategy.type}
              </span>
            </div>

            <h4 className="text-base font-bold text-gray-800 mb-2">
              {strategy.strategyTitle}
            </h4>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {strategy.strategyDescription}
            </p>

            <div className="space-y-2">
              {strategy.actionItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// LPA 도넛 차트 컴포넌트
interface LPADistributionItem {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

interface LPADonutChartProps {
  round: 1 | 2;
  distribution: LPADistributionItem[];
  totalCount: number;
  tooltipPosition: 'left' | 'right';
}

const LPADonutChart: React.FC<LPADonutChartProps> = ({
  round,
  distribution,
  totalCount,
  tooltipPosition,
}) => {
  const size = 188;
  const stroke = 30;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const segs = distribution.map((item) => {
    const frac = item.percentage / 100;
    const dash = frac * circ;
    const seg = { ...item, frac, dash, offset };
    offset += dash;
    return seg;
  });

  // 툴팁 위치 클래스
  const legendTooltipClass = tooltipPosition === 'right'
    ? 'right-full mr-2'
    : 'left-full ml-2';

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-bold text-gray-700 mb-3">{round}차 검사</div>
      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {segs.map((s) => {
              if (s.count === 0) return null;
              return (
                <circle
                  key={s.type}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${s.dash} ${circ - s.dash}`}
                  strokeDashoffset={-s.offset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-gray-900">{totalCount}</p>
              <p className="text-xs text-gray-500">명</p>
            </div>
          </div>
        </div>

        {/* 범례 */}
        <div className="space-y-2">
          {distribution.map((item) => (
            <div
              key={item.type}
              className="relative group flex items-center gap-2 w-full text-left px-2 py-1 rounded transition-colors cursor-help hover:bg-gray-50"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-gray-700">{item.type}</span>
              <span className="ml-auto text-sm font-medium tabular-nums">
                {item.count}명 · {item.percentage}%
              </span>
              {/* 범례 호버 툴팁 */}
              <div className={`absolute ${legendTooltipClass} top-0 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-lg`}>
                <p className="font-bold text-yellow-400 mb-1">{item.type}</p>
                <p className="leading-relaxed text-gray-300">{LPA_TYPE_DESCRIPTIONS[item.type]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassCoachingView;
