/**
 * 학급 코칭 탭 - 학급 전체 대상 코칭 정보
 *
 * 구성:
 * ① 차수 선택 (1차/2차)
 * ② 반별 학습 유형분포 (단일 도넛 + 순위) - 가운데 정렬
 * ③ 한 번에 하나씩 — 실행 순서 (3 STEP 스테퍼)
 * ④ 우리 반 우세 유형 특징 + 검사 결과 함께 보기
 * ⑤ STEP 1: 학급 대표 전략 코칭 (상세 카드)
 * ⑥ STEP 2, 3: 추가 코칭 카드
 */

import { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Check, ChevronRight } from 'lucide-react';
import type { ClassCoachingData, LPATypeStrategy } from '../types';
import { LPA_TYPE_COLORS } from '../types';

// LPA 유형 설명 (EXAM_COUNSELING.md 기준)
const LPA_TYPE_DESCRIPTIONS: Record<string, string> = {
  // 초등
  '자원소진형': '학습에 필요한 심리·정서적 자원이 상대적으로 낮고, 기대나 부담은 크게 느끼는 유형입니다. 먼저 부담을 낮추고 작은 성공 경험을 통해 학습 회복감을 키워주세요.',
  '안전균형형': '전반적으로 안정적인 학습 상태를 보이지만, 스스로 점검하고 조절하는 힘은 더 키워야 할 수 있습니다. 계획·점검 습관을 함께 길러주세요.',
  '안전 균형형': '전반적으로 안정적인 학습 상태를 보이지만, 스스로 점검하고 조절하는 힘은 더 키워야 할 수 있습니다. 계획·점검 습관을 함께 길러주세요.',
  '몰입자원풍부형': '긍정적 학습 자원이 풍부하고 몰입 가능성이 높은 유형입니다. 강점을 유지하면서 도전 목표와 깊이 있는 학습 경험으로 확장해주세요.',
  '몰입자원 풍부형': '긍정적 학습 자원이 풍부하고 몰입 가능성이 높은 유형입니다. 강점을 유지하면서 도전 목표와 깊이 있는 학습 경험으로 확장해주세요.',
  // 중등
  '냉소적 무기력형': '심리·정서적 자원이 상대적으로 낮고, 성적과 공부 부담을 크게 느끼는 유형입니다. 먼저 부담을 낮추고 정서적 회복감과 작은 성취 경험을 만들어주세요.',
  '정서조절 취약형': '학습 자원은 일정 수준 있으나, 성적 압박과 소진을 크게 느끼는 유형입니다. 학습 전략뿐 아니라 감정 조절과 부담 관리 방법을 함께 지원해주세요.',
  '자기주도 몰입형': '심리·정서적 자원이 풍부하고 자기주도적 몰입 가능성이 높은 유형입니다. 현재의 강점을 유지하면서 도전 목표와 심화 학습 기회를 제공해주세요.',
};

// 유형별 이모지 색상
const TYPE_EMOJI: Record<string, string> = {
  '자원소진형': '🔴',
  '안전균형형': '🟡',
  '안전 균형형': '🟡',
  '몰입자원풍부형': '🟢',
  '몰입자원 풍부형': '🟢',
  '냉소적 무기력형': '🔴',
  '정서조절 취약형': '🟡',
  '자기주도 몰입형': '🟢',
};

interface ClassCoachingViewProps {
  data: ClassCoachingData;
  className?: string;
}

export const ClassCoachingView: React.FC<ClassCoachingViewProps> = ({
  data,
  className,
}) => {
  const { lpaDistribution, dominantTypeCharacteristics, recommendedStrategy, additionalStrategies } = data;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);

  // 도넛 차트 데이터 - 순위 정렬
  const distributionData = Object.entries(lpaDistribution.distribution)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / lpaDistribution.completedStudents) * 100),
      color: LPA_TYPE_COLORS[type as keyof typeof LPA_TYPE_COLORS] || '#9CA3AF',
    }))
    .sort((a, b) => b.count - a.count);

  // 2차 검사 가능 여부 (mock: 아직 없음)
  const isRound2Available = false;

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* ① 차수 선택 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedRound(1)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedRound === 1
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          1차 검사
        </button>
        <button
          onClick={() => isRound2Available && setSelectedRound(2)}
          disabled={!isRound2Available}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedRound === 2
              ? 'bg-primary-600 text-white'
              : isRound2Available
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          2차 검사 {!isRound2Available && '(예정)'}
        </button>
      </div>

      {/* ② 반별 학습 유형 분포 - 좌측 정렬 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-lg font-bold text-gray-900">반별 학습 유형 분포</h3>
          <div className="relative group">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[420px] p-4 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
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
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-gray-900" />
            </div>
          </div>
        </div>

        {/* 차수 라벨 */}
        <p className="text-center text-sm text-gray-500 mb-4">{selectedRound}차 검사</p>

        <div className="flex items-center justify-center gap-10">
          {/* 도넛 차트 */}
          <LPADonutChart
            distribution={distributionData}
            totalCount={lpaDistribution.completedStudents}
          />

          {/* 순위 목록 - 도넛 옆에 */}
          <div className="space-y-3">
            {distributionData.map((item, index) => (
              <div
                key={item.type}
                className="relative group flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-help"
              >
                <span className="text-sm font-bold text-gray-600 w-8">
                  {index + 1}위
                </span>
                <span className="text-base">
                  {TYPE_EMOJI[item.type] || '⚪'}
                </span>
                <span className="text-sm font-medium text-gray-800">{item.type}</span>
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                  {item.count}명 · {item.percentage}%
                </span>
                {/* 호버 툴팁 */}
                <div className="absolute left-full ml-2 top-0 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-lg">
                  <p className="font-bold text-yellow-400 mb-1">{item.type}</p>
                  <p className="leading-relaxed text-gray-300">{LPA_TYPE_DESCRIPTIONS[item.type]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ④ 우리 반 우세 유형 특징 + 검사 결과 함께 보기 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">우리 반 우세 유형 특징</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {dominantTypeCharacteristics}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            우리 반 검사 결과 함께 보기
          </h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            검사 직후, 학생들이 스스로 결과를 해석하고 자기이해를 넓히도록 돕는 학급 전체 활동지 수업이에요.
          </p>
          <button className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
            활동지 살펴보기
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ③ 한 번에 하나씩 — 실행 순서 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">한 번에 하나씩 — 실행 순서</h3>
        <div className="flex items-center justify-center gap-10">
          <StepIndicator
            step={1}
            title="학급 대표 전략 코칭"
            subtitle={`${recommendedStrategy.type} 중심`}
            active
          />
          <ChevronRight className="w-6 h-6 text-gray-300 flex-shrink-0" />
          <StepIndicator
            step={2}
            title="추가 코칭 1"
            subtitle={additionalStrategies[0]?.type || ''}
          />
          <ChevronRight className="w-6 h-6 text-gray-300 flex-shrink-0" />
          <StepIndicator
            step={3}
            title="추가 코칭 2"
            subtitle={additionalStrategies[1]?.type || ''}
          />
        </div>
      </div>

      {/* ⑤ STEP 1: 학급 대표 전략 코칭 */}
      <div className="flex gap-4">
        {/* 타임라인 좌측 */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            1
          </div>
          <div className="w-px bg-gray-300 flex-1 my-2" />
        </div>

        {/* 우측 컨텐츠 */}
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">우선 이것부터 시작하세요</h3>
          <MainStrategyCard
            strategy={recommendedStrategy}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            additionalStrategies={additionalStrategies}
          />
        </div>
      </div>

      {/* ⑥ STEP 2: 추가 코칭 1 */}
      <div className="flex gap-4">
        {/* 타임라인 좌측 */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            2
          </div>
          <div className="w-px bg-gray-300 flex-1 my-2" />
        </div>

        {/* 우측 컨텐츠 */}
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">여유가 생기면 추가로</h3>
          <AdditionalStrategyCard
            step={2}
            strategy={additionalStrategies[0]}
          />
        </div>
      </div>

      {/* ⑦ STEP 3: 추가 코칭 2 */}
      <div className="flex gap-4">
        {/* 타임라인 좌측 */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            3
          </div>
          <div className="w-px bg-gray-300 flex-1 my-2" />
        </div>

        {/* 우측 컨텐츠 */}
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">더 깊이 있게</h3>
          <AdditionalStrategyCard
            step={3}
            strategy={additionalStrategies[1]}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 서브 컴포넌트
// ============================================================

/** 도넛 차트 */
interface LPADistributionItem {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

interface LPADonutChartProps {
  distribution: LPADistributionItem[];
  totalCount: number;
}

const LPADonutChart: React.FC<LPADonutChartProps> = ({ distribution, totalCount }) => {
  const size = 180;
  const stroke = 32;
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

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
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
          <p className="text-3xl font-extrabold text-gray-900">{totalCount}</p>
          <p className="text-xs text-gray-500">명</p>
        </div>
      </div>
    </div>
  );
};

/** 스텝 인디케이터 - 원 안에 숫자, 아래에 STEP */
interface StepIndicatorProps {
  step: number;
  title: string;
  subtitle: string;
  active?: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ step, title, subtitle, active }) => {
  // 단계별 색상 (항상 원색)
  const getStepColor = () => {
    switch (step) {
      case 1:
        return 'bg-violet-600 text-white';
      case 2:
        return 'bg-blue-500 text-white';
      case 3:
        return 'bg-green-500 text-white';
      default:
        return 'bg-primary-600 text-white';
    }
  };

  const getTextColor = () => {
    switch (step) {
      case 1:
        return 'text-violet-600';
      case 2:
        return 'text-blue-500';
      case 3:
        return 'text-green-500';
      default:
        return 'text-primary-600';
    }
  };

  return (
    <div className="flex flex-col items-center text-center min-w-[140px]">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-1 ${getStepColor()}`}>
        {step}
      </div>
      <p className={`text-xs font-medium mb-0.5 ${getTextColor()}`}>
        STEP {step}
      </p>
      <p className="text-sm font-medium text-gray-900">
        {title}
      </p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
};

/** 메인 전략 카드 (STEP 1) */
interface MainStrategyCardProps {
  strategy: LPATypeStrategy;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  additionalStrategies: LPATypeStrategy[];
}

const MainStrategyCard: React.FC<MainStrategyCardProps> = ({
  strategy,
  showAdvanced,
  onToggleAdvanced,
  additionalStrategies,
}) => {
  // 다른 유형 이름들
  const otherTypes = additionalStrategies.map(s => s.type).join('·');

  return (
    <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl border border-primary-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2.5 py-1 bg-primary-600 text-white text-xs font-bold rounded">
          STEP 1
        </span>
        <span className="text-sm text-gray-500">|</span>
        <h3 className="text-base font-semibold text-gray-900">학급 대표 전략 코칭</h3>
      </div>

      <h4 className="text-xl font-bold text-gray-900 mb-3">
        {strategy.strategyTitle}
      </h4>
      <p className="text-sm text-gray-700 mb-5 leading-relaxed">
        {strategy.strategyDescription}
      </p>

      {/* 액션 아이템 */}
      <div className="space-y-3 mb-6">
        {strategy.actionItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-bold">
              {index + 1}
            </span>
            <span className="text-sm text-gray-700 pt-0.5">{item}</span>
          </div>
        ))}
      </div>

      {/* 성공 지표 */}
      {strategy.successIndicators && strategy.successIndicators.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
            <Check className="w-4 h-4" />
            2주 후 이런 변화가 보이면 작동 중이에요
          </p>
          <div className="space-y-2">
            {strategy.successIndicators.map((indicator, index) => (
              <label key={index} className="flex items-start gap-2 text-sm text-green-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-green-300 text-green-600 focus:ring-green-500 mt-0.5"
                />
                {indicator}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 다른 유형에는? */}
      {strategy.noteForOtherTypes && (
        <div className="bg-white/60 border border-gray-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">👥 다른 유형에는?</span>{' '}
            {strategy.noteForOtherTypes}
          </p>
        </div>
      )}

      {/* 심화 코칭 아코디언 */}
      {strategy.advancedStrategies && strategy.advancedStrategies.length > 0 && (
        <div className="border-t border-primary-200 pt-4">
          <button
            onClick={onToggleAdvanced}
            className="flex items-center gap-2 text-left"
          >
            {showAdvanced ? (
              <ChevronUp className="w-5 h-5 text-primary-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-primary-600" />
            )}
            <span className="text-sm font-medium text-primary-700">
              우세 유형({strategy.type}) 심화 코칭 {strategy.advancedStrategies.length}가지 더 보기
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {strategy.advancedStrategies.map((adv, index) => (
                <div key={index} className="bg-white/60 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-800 mb-2">{adv.title}</h5>
                  <p className="text-sm text-gray-600 mb-3">{adv.description}</p>
                  <ul className="space-y-1">
                    {adv.actionItems.map((item, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-primary-500">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** 추가 전략 카드 (STEP 2, 3) */
interface AdditionalStrategyCardProps {
  step: number;
  strategy: LPATypeStrategy;
}

const AdditionalStrategyCard: React.FC<AdditionalStrategyCardProps> = ({ step, strategy }) => {
  const emoji = TYPE_EMOJI[strategy.type] || '⚪';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded">
          STEP {step}
        </span>
        <span className="text-sm text-gray-500">|</span>
        <span className="text-sm font-medium text-gray-700">추가 코칭 {step - 1}</span>
        <span className="text-sm text-gray-500">|</span>
        <span className="text-sm font-medium text-gray-700">
          {emoji} {strategy.type} 대상
        </span>
      </div>

      <h4 className="text-base font-bold text-gray-800 mb-3">
        {strategy.strategyTitle}
      </h4>

      <div className="space-y-2 mb-4">
        {strategy.actionItems.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center font-medium">
              {idx + 1}
            </span>
            <span className="text-sm text-gray-700">{item}</span>
          </div>
        ))}
      </div>

      {/* 다른 유형에는? */}
      {strategy.noteForOtherTypes && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">👥 다른 유형에는?</span>{' '}
            {strategy.noteForOtherTypes}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClassCoachingView;
