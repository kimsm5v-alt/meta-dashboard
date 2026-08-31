/**
 * 자기조절학습검사 > 변화추적 > 학생 선택 시 화면
 *
 * 화면 구성:
 * 1. AI 변화 분석
 * 2. 학습 현황 변화 (Q120~Q124 설문 응답 비교)
 * 3. 종합 해석 비교 (SrlProfileTable)
 * 4. 유의미한 요인 변화 (3점 이상)
 * 5. 주요 변화 요인 (5점 이상, 구간 변화 / 구간 내 변화)
 *
 * 학습종합검사 대비 제거된 섹션:
 * - LPA 유형 분류 (TypeClassification) - 유형 분류 자체가 없음
 * - 개입 이력 (코칭 기능 없음)
 * - 종합결과 비교 (SelfregOverviewChart) - 반 화면과 일관성 유지
 */

import { useMemo, useState } from 'react';
import { TrendingUp, Sparkles, ArrowRight, ChevronDown, ChevronUp, TrendingDownIcon } from 'lucide-react';
import { StudentHeader } from '@/shared/components';
import type { LearningStatus } from '../types';
import { LEARNING_STATUS_LABELS } from '../types';
import type { TLevel } from '@/shared/types';
import { SrlProfileTable } from './SrlProfileTable';
import type { SelfregStudentChangeData } from './SelfregClassTrackingView';

interface SelfregStudentTrackingViewProps {
  student: SelfregStudentChangeData;
  className: string;
  classId: string;
  onBack: () => void;
}

// ============================================================
// 자기조절학습검사 20개 요인 정보
// ============================================================

const SELFREG_FACTOR_INFO = [
  // 동기전략 > 학습원동력 (3개)
  { id: 1, name: '성장마인드셋', category: '학습원동력', domain: '동기전략', definition: '지능이나 능력이 노력을 통해 변화하고 성장할 수 있다고 생각하는 정도' },
  { id: 2, name: '학업효능감', category: '학습원동력', domain: '동기전략', definition: '스스로 수업내용이나 과제를 잘 이해하고 잘 해낼 자신이 있다고 믿는 정도' },
  { id: 3, name: '학습동기', category: '학습원동력', domain: '동기전략', definition: '학습에 대한 흥미가 높고, 미래를 위해 학습활동이 중요하다고 생각하는 정도' },
  // 동기전략 > 정서조절 (3개)
  { id: 4, name: '성적부담조절', category: '정서조절', domain: '동기전략', definition: '성적이 만족스럽지 않아도 다시 공부하기 위해 마음을 조절하는 정도' },
  { id: 5, name: '공부부담조절', category: '정서조절', domain: '동기전략', definition: '공부를 잘하지 못할 것 같거나 이해하기 어렵다고 느끼는 마음을 조절하는 정도' },
  { id: 6, name: '실패부담조절', category: '정서조절', domain: '동기전략', definition: '공부가 어렵다고 느끼거나 틀린 문제가 많아 속상한 마음을 조절할 수 있는 정도' },
  // 인지전략 > 메타인지 (3개)
  { id: 7, name: '계획능력', category: '메타인지', domain: '인지전략', definition: '공부 목표를 세우고, 목표에 따라 순차적으로 학습을 계획하는 능력' },
  { id: 8, name: '점검능력', category: '메타인지', domain: '인지전략', definition: '공부 목표 달성 정도와 공부 방법이 적절했는지를 전반적으로 파악할 수 있는 능력' },
  { id: 9, name: '조절능력', category: '메타인지', domain: '인지전략', definition: '공부 과정 중에 나타난 문제를 반복하지 않도록 더 나은 공부 방법을 찾아 조정하는 능력' },
  // 인지전략 > 인지적 학습기술 (3개)
  { id: 10, name: '이해기술', category: '인지적 학습기술', domain: '인지전략', definition: '학습내용을 효과적으로 이해하기 위해 노력하는 정도' },
  { id: 11, name: '기억기술', category: '인지적 학습기술', domain: '인지전략', definition: '기억을 잘 하기 위해 반복학습, 노트 필기, 밑줄 긋기 등 기억 전략을 활용하는 정도' },
  { id: 12, name: '집중기술', category: '인지적 학습기술', domain: '인지전략', definition: '공부에 방해되는 생각이나 행동을 자제하고, 최대한 공부에 집중하려고 노력하는 정도' },
  // 행동전략 > 행동조절 (3개)
  { id: 13, name: '자기칭찬', category: '행동조절', domain: '행동전략', definition: '좋은 성취를 거뒀거나 열심히 노력한 이후 스스로에게 보상을 주는 행위' },
  { id: 14, name: '도움구하기', category: '행동조절', domain: '행동전략', definition: '학습 시 모르는 것을 알기 위해 자료를 찾거나 교사 등 주변 사람에게 도움을 요청하는 정도' },
  { id: 15, name: '학습지속성', category: '행동조절', domain: '행동전략', definition: '공부가 지루해도 숙제나 계획한 공부를 끝까지 마치고자 노력하는 정도' },
  // 행동전략 > 행동적 학습기술 (5개)
  { id: 16, name: '공부환경', category: '행동적 학습기술', domain: '행동전략', definition: '학습에 최적화된 공부환경이 될 수 있도록 정리, 정돈하는 습관' },
  { id: 17, name: '시간관리', category: '행동적 학습기술', domain: '행동전략', definition: '규칙적으로 공부할 수 있는 시간을 계획하고, 관리하는 습관' },
  { id: 18, name: '수업태도', category: '행동적 학습기술', domain: '행동전략', definition: '수업에 집중하여 선생님 말씀을 경청하고, 수업에 필요한 물품을 사전에 준비하는 습관' },
  { id: 19, name: '노트하기', category: '행동적 학습기술', domain: '행동전략', definition: '학습한 핵심 내용을 정리하여 기록하고, 기억하기 위해 활용하는 공부습관' },
  { id: 20, name: '시험준비', category: '행동적 학습기술', domain: '행동전략', definition: '평소에 시험 준비 전략을 학습에 잘 적용하고, 시험 상황에서도 실수를 줄이기 위해 노력하는 정도' },
];

// 3개 대분류 색상
const SELFREG_DOMAIN_COLORS: Record<string, string> = {
  '동기전략': '#9F91F8',
  '인지전략': '#4AC1FF',
  '행동전략': '#FF8993',
};

// T점수 → 구간 변환
const getLevel = (score: number): TLevel => {
  if (score >= 70) return '매우높음';
  if (score >= 60) return '높음';
  if (score >= 40) return '보통';
  if (score >= 30) return '낮음';
  return '매우낮음';
};

// ============================================================
// AI 변화 분석 생성 (Mock) - 자기조절학습검사용
// ============================================================

const generateAIAnalysis = (student: SelfregStudentChangeData) => {
  const { change, changeDirection } = student;

  if (changeDirection === 'up') {
    return {
      summary: '긍정적인 변화가 관찰됩니다.',
      tags: ['#자기조절력향상', '#학습전략강화'],
      details: [
        `평균 T점수가 ${Math.abs(change || 0).toFixed(1)}점 상승하여 전반적인 자기조절학습 능력이 개선되었습니다.`,
        '학습 동기, 인지 전략, 행동 조절 영역에서 고르게 향상을 보이고 있습니다.',
        '현재의 긍정적 변화를 유지하기 위해 지속적인 관심과 격려가 필요합니다.',
      ],
    };
  }

  if (changeDirection === 'down') {
    return {
      summary: '주의가 필요한 변화가 관찰됩니다.',
      tags: ['#자기조절력점검', '#학습전략보완'],
      details: [
        `평균 T점수가 ${Math.abs(change || 0).toFixed(1)}점 하락하여 자기조절학습 능력에 주의가 필요합니다.`,
        '학습 동기나 집중력, 시간 관리 등에서 어려움을 겪고 있을 수 있습니다.',
        '학생과의 개별 상담을 통해 변화 원인을 파악하는 것을 권장합니다.',
      ],
    };
  }

  return {
    summary: '안정적인 상태를 유지하고 있습니다.',
    tags: ['#안정적유지', '#강점활용'],
    details: [
      '1차와 2차 검사 결과가 유사하게 유지되고 있습니다.',
      '현재 상태가 안정적이므로, 강점을 더 발전시킬 수 있는 기회를 제공해주세요.',
    ],
  };
};

// ============================================================
// 학습 현황 변화 컴포넌트
// ============================================================

interface LearningStatusItemProps {
  label: string;
  round1Value: string;
  round2Value: string;
  hasChanged: boolean;
}

const LearningStatusItem: React.FC<LearningStatusItemProps> = ({
  label,
  round1Value,
  round2Value,
  hasChanged,
}) => {
  return (
    <div className={`rounded-lg p-4 ${hasChanged ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
      <p className="text-sm font-bold text-gray-900 mb-3 text-center">{label}</p>
      <div className="flex items-center gap-2">
        <span className={`text-sm flex-1 text-center break-keep ${hasChanged ? 'text-gray-500' : 'text-gray-700'}`}>
          {round1Value}
        </span>
        <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 ${hasChanged ? 'text-amber-500' : 'text-gray-300'}`} />
        <span className={`text-sm font-semibold flex-1 text-center break-keep ${hasChanged ? 'text-amber-700' : 'text-gray-900'}`}>
          {round2Value}
        </span>
      </div>
    </div>
  );
};

// ============================================================
// 주요 변화 요인 관련 타입 및 유틸
// ============================================================

// 주요 변화 요인: 5점 이상
const SIGNIFICANT_CHANGE_THRESHOLD = 5;
const DEFAULT_DISPLAY_COUNT = 5;

type ChangeDirection = 'improved' | 'attention';

interface FactorChange {
  index: number;
  name: string;
  category: string;
  domain: string;
  round1Score: number;
  round2Score: number;
  round1Level: TLevel;
  round2Level: TLevel;
  delta: number;
  levelChanged: boolean;
  direction: ChangeDirection;
}

// 자기조절학습검사는 모두 긍정 요인이므로 단순화
const getChangeDirection = (delta: number): ChangeDirection => {
  return delta > 0 ? 'improved' : 'attention';
};

const LEVEL_ORDER: TLevel[] = ['매우낮음', '낮음', '보통', '높음', '매우높음'];
const getLevelDiff = (from: TLevel, to: TLevel): number => {
  return Math.abs(LEVEL_ORDER.indexOf(to) - LEVEL_ORDER.indexOf(from));
};

const sortFactors = (factors: FactorChange[]): FactorChange[] => {
  return [...factors].sort((a, b) => {
    const deltaCompare = Math.abs(b.delta) - Math.abs(a.delta);
    if (deltaCompare !== 0) return deltaCompare;
    const levelDiffA = getLevelDiff(a.round1Level, a.round2Level);
    const levelDiffB = getLevelDiff(b.round1Level, b.round2Level);
    if (levelDiffB !== levelDiffA) return levelDiffB - levelDiffA;
    return a.name.localeCompare(b.name);
  });
};

// ============================================================
// 변화폭 막대 컴포넌트
// ============================================================

interface ChangeBarProps {
  delta: number;
  maxDelta: number;
  direction: ChangeDirection;
  isSecondary?: boolean;
}

const ChangeBar: React.FC<ChangeBarProps> = ({ delta, maxDelta, direction, isSecondary = false }) => {
  const ratio = maxDelta > 0 ? Math.abs(delta) / maxDelta : 0;
  const widthPercent = Math.min(ratio * 100, 100);

  const barColor = direction === 'improved'
    ? (isSecondary ? 'bg-emerald-300' : 'bg-emerald-500')
    : (isSecondary ? 'bg-red-300' : 'bg-red-500');

  const trackColor = isSecondary ? 'bg-gray-100' : 'bg-gray-200';

  return (
    <div className={`w-full h-2 ${trackColor} rounded-full overflow-hidden`}>
      <div
        className={`h-full ${barColor} rounded-full transition-all duration-300`}
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
};

// ============================================================
// 요인 행 컴포넌트
// ============================================================

interface FactorRowProps {
  factor: FactorChange;
  maxDelta: number;
  direction: ChangeDirection;
  showLevelChange: boolean;
  isSecondary?: boolean;
}

const FactorRow: React.FC<FactorRowProps> = ({
  factor,
  maxDelta,
  direction,
  showLevelChange,
  isSecondary = false,
}) => {
  const valueColor = direction === 'improved' ? 'text-emerald-600' : 'text-red-600';
  const levelBadgeColor = direction === 'improved'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-red-100 text-red-700';
  const domainColor = SELFREG_DOMAIN_COLORS[factor.domain] || '#9CA3AF';

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
      {/* 요인명 */}
      <span className="w-[80px] flex-shrink-0 text-sm font-semibold text-gray-900">
        {factor.name}
      </span>

      {/* 대분류 태그 */}
      <span
        className="w-16 flex-shrink-0 text-[10px] font-semibold"
        style={{ color: domainColor }}
      >
        #{factor.domain}
      </span>

      {/* 구간 이동 */}
      <span className="w-[100px] flex-shrink-0 text-xs">
        {showLevelChange ? (
          <span className="flex items-center gap-1">
            <span className="text-gray-500">{factor.round1Level}</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className={`px-1.5 py-0.5 rounded font-medium ${levelBadgeColor}`}>
              {factor.round2Level}
            </span>
          </span>
        ) : (
          <span className="text-gray-400">{factor.round1Level} 유지</span>
        )}
      </span>

      {/* 변화폭 막대 */}
      <div className="flex-1 min-w-0">
        <ChangeBar
          delta={factor.delta}
          maxDelta={maxDelta}
          direction={direction}
          isSecondary={isSecondary}
        />
      </div>

      {/* 점수 변화 값 */}
      <span className={`w-12 flex-shrink-0 text-right text-sm font-bold ${valueColor}`}>
        {factor.delta > 0 ? '+' : ''}{factor.delta.toFixed(0)}
      </span>
    </div>
  );
};

// ============================================================
// 요인 열 컴포넌트 (개선 또는 주의)
// ============================================================

interface FactorColumnProps {
  title: string;
  factors: FactorChange[];
  direction: ChangeDirection;
  showLevelChange: boolean;
  isSecondary?: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
}

const FactorColumn: React.FC<FactorColumnProps> = ({
  title,
  factors,
  direction,
  showLevelChange,
  isSecondary = false,
  expanded,
  onToggleExpand,
}) => {
  const displayCount = expanded ? factors.length : Math.min(DEFAULT_DISPLAY_COUNT, factors.length);
  const displayFactors = factors.slice(0, displayCount);
  const hiddenCount = factors.length - DEFAULT_DISPLAY_COUNT;
  const maxDelta = factors.length > 0 ? Math.max(...factors.map(f => Math.abs(f.delta))) : 0;

  const headerBg = direction === 'improved'
    ? (isSecondary ? 'bg-emerald-50/50' : 'bg-emerald-50')
    : (isSecondary ? 'bg-red-50/50' : 'bg-red-50');

  const headerTextColor = direction === 'improved' ? 'text-emerald-800' : 'text-red-800';
  const countBadgeColor = direction === 'improved'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-red-100 text-red-700';

  const Icon = direction === 'improved' ? TrendingUp : TrendingDownIcon;
  const iconColor = direction === 'improved' ? 'text-emerald-600' : 'text-red-600';

  const borderColor = isSecondary
    ? (direction === 'improved' ? 'border-emerald-100' : 'border-red-100')
    : 'border-gray-200';

  return (
    <div className={`rounded-xl border ${borderColor} overflow-hidden ${isSecondary ? 'bg-gray-50/30' : 'bg-white'}`}>
      {/* 열 헤더 */}
      <div className={`${headerBg} px-4 py-3 flex items-center gap-2`}>
        <div className={`w-6 h-6 rounded-full ${direction === 'improved' ? 'bg-emerald-100' : 'bg-red-100'} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h5 className={`text-sm font-semibold ${headerTextColor}`}>{title}</h5>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${countBadgeColor}`}>
          {factors.length}개
        </span>
      </div>

      {/* 요인 목록 */}
      {factors.length > 0 ? (
        <div>
          {displayFactors.map((factor) => (
            <FactorRow
              key={factor.index}
              factor={factor}
              maxDelta={maxDelta}
              direction={direction}
              showLevelChange={showLevelChange}
              isSecondary={isSecondary}
            />
          ))}

          {/* 더보기/접기 버튼 */}
          {hiddenCount > 0 && (
            <button
              onClick={onToggleExpand}
              className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  접기
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  {hiddenCount}개 더보기
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-gray-400">
          해당 요인 없음
        </div>
      )}
    </div>
  );
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export const SelfregStudentTrackingView: React.FC<SelfregStudentTrackingViewProps> = ({
  student,
  className,
  classId,
  onBack,
}) => {
  // AI 분석 결과
  const aiAnalysis = useMemo(() => generateAIAnalysis(student), [student]);

  // 더보기/접기 상태
  const [expandedState, setExpandedState] = useState({
    levelChanged: { improved: false, attention: false },
    noLevelChange: { improved: false, attention: false },
  });

  const toggleExpand = (block: 'levelChanged' | 'noLevelChange', column: 'improved' | 'attention') => {
    setExpandedState(prev => ({
      ...prev,
      [block]: {
        ...prev[block],
        [column]: !prev[block][column],
      },
    }));
  };

  // 주요 변화 요인 분석 (모두 긍정 요인)
  const significantChanges = useMemo(() => {
    if (!student.round1TScores || !student.round2TScores) {
      return {
        levelChanged: { improved: [] as FactorChange[], attention: [] as FactorChange[], total: 0 },
        noLevelChange: { improved: [] as FactorChange[], attention: [] as FactorChange[], total: 0 },
        hasAnyChanges: false,
      };
    }

    const allChanges: FactorChange[] = [];

    // 20개 요인별 변화 계산
    SELFREG_FACTOR_INFO.forEach((factor, idx) => {
      const round1 = student.round1TScores![idx];
      const round2 = student.round2TScores![idx];
      const delta = round2 - round1;
      const round1Level = getLevel(round1);
      const round2Level = getLevel(round2);
      const levelChanged = round1Level !== round2Level;
      const direction = getChangeDirection(delta);

      // 유의미한 변화만 필터링 (±5점 이상)
      if (Math.abs(delta) >= SIGNIFICANT_CHANGE_THRESHOLD) {
        allChanges.push({
          index: idx,
          name: factor.name,
          category: factor.category,
          domain: factor.domain,
          round1Score: round1,
          round2Score: round2,
          round1Level,
          round2Level,
          delta,
          levelChanged,
          direction,
        });
      }
    });

    // 구간 변화 O
    const levelChangedFactors = allChanges.filter(c => c.levelChanged);
    const levelChangedImproved = sortFactors(levelChangedFactors.filter(c => c.direction === 'improved'));
    const levelChangedAttention = sortFactors(levelChangedFactors.filter(c => c.direction === 'attention'));

    // 구간 변화 X
    const noLevelChangeFactors = allChanges.filter(c => !c.levelChanged);
    const noLevelChangeImproved = sortFactors(noLevelChangeFactors.filter(c => c.direction === 'improved'));
    const noLevelChangeAttention = sortFactors(noLevelChangeFactors.filter(c => c.direction === 'attention'));

    return {
      levelChanged: {
        improved: levelChangedImproved,
        attention: levelChangedAttention,
        total: levelChangedFactors.length,
      },
      noLevelChange: {
        improved: noLevelChangeImproved,
        attention: noLevelChangeAttention,
        total: noLevelChangeFactors.length,
      },
      hasAnyChanges: allChanges.length > 0,
    };
  }, [student.round1TScores, student.round2TScores]);

  // 2차 미응시 체크
  if (student.round2Score === null) {
    return (
      <div className="space-y-6">
        <StudentHeader
          studentNumber={student.number}
          studentName={student.name}
          lpaType=""
          className={className}
          onBack={onBack}
        />
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-center">
          <p className="text-amber-700">
            이 학생은 아직 2차 검사를 응시하지 않았습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 - LPA 유형 없음 */}
      <StudentHeader
        studentNumber={student.number}
        studentName={student.name}
        lpaType=""
        className={className}
        onBack={onBack}
      />

      {/* 1. AI 변화 분석 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">AI 변화 분석</h3>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-4">{aiAnalysis.summary}</p>

        {/* 태그 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {aiAnalysis.tags.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-white/70 border border-indigo-200 rounded-full text-xs font-medium text-indigo-700"
            >
              {tag}
            </span>
          ))}
        </div>

        <ul className="space-y-1.5">
          {aiAnalysis.details.map((detail, i) => (
            <li key={i} className="text-sm text-gray-600 leading-relaxed flex gap-2">
              <span className="text-indigo-400">•</span>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 2. 학습 현황 변화 */}
      {student.round1LearningStatus && student.round2LearningStatus && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">학습 현황 변화</h3>

          <div className="grid grid-cols-5 gap-3">
            <LearningStatusItem
              label="학업 성취도"
              round1Value={LEARNING_STATUS_LABELS.academicAchievement[student.round1LearningStatus.academicAchievement]}
              round2Value={LEARNING_STATUS_LABELS.academicAchievement[student.round2LearningStatus.academicAchievement]}
              hasChanged={student.round1LearningStatus.academicAchievement !== student.round2LearningStatus.academicAchievement}
            />
            <LearningStatusItem
              label="성적 만족도"
              round1Value={LEARNING_STATUS_LABELS.gradeSatisfaction[student.round1LearningStatus.gradeSatisfaction]}
              round2Value={LEARNING_STATUS_LABELS.gradeSatisfaction[student.round2LearningStatus.gradeSatisfaction]}
              hasChanged={student.round1LearningStatus.gradeSatisfaction !== student.round2LearningStatus.gradeSatisfaction}
            />
            <LearningStatusItem
              label="학습 동기"
              round1Value={LEARNING_STATUS_LABELS.learningMotivation[student.round1LearningStatus.learningMotivation]}
              round2Value={LEARNING_STATUS_LABELS.learningMotivation[student.round2LearningStatus.learningMotivation]}
              hasChanged={student.round1LearningStatus.learningMotivation !== student.round2LearningStatus.learningMotivation}
            />
            <LearningStatusItem
              label="혼자 공부 시간"
              round1Value={LEARNING_STATUS_LABELS.selfStudyTime[student.round1LearningStatus.selfStudyTime]}
              round2Value={LEARNING_STATUS_LABELS.selfStudyTime[student.round2LearningStatus.selfStudyTime]}
              hasChanged={student.round1LearningStatus.selfStudyTime !== student.round2LearningStatus.selfStudyTime}
            />
            <LearningStatusItem
              label="학습 고민 상담"
              round1Value={LEARNING_STATUS_LABELS.learningCounselor[student.round1LearningStatus.learningCounselor]}
              round2Value={LEARNING_STATUS_LABELS.learningCounselor[student.round2LearningStatus.learningCounselor]}
              hasChanged={student.round1LearningStatus.learningCounselor !== student.round2LearningStatus.learningCounselor}
            />
          </div>
        </div>
      )}

      {/* 3. 종합 해석 비교 */}
      {student.round1TScores && student.round2TScores && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">종합 해석 비교</h3>
          <SrlProfileTable
            selfregScores={student.round2TScores}
            sessions={[
              { round: 1, scores: student.round1TScores },
              { round: 2, scores: student.round2TScores },
            ]}
            viewMode="round2"
          />
        </div>
      )}

      {/* 4. 주요 변화 요인 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* 섹션 헤더 */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-bold text-gray-900">주요 변화 요인</h3>
          <span className="text-xs text-gray-400">
            1차 대비 2차 검사에서 5점 이상 변화 · 모두 긍정 요인이므로 상승=개선
          </span>
        </div>

        {!significantChanges.hasAnyChanges ? (
          <div className="py-8 text-center text-sm text-gray-500">
            5점 이상 변화한 요인이 없습니다.
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* 블록 1: 구간 변화 */}
            {significantChanges.levelChanged.total > 0 && (
              <div>
                {/* 블록 헤더 */}
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-gray-800">구간 변화</h4>
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">
                    {significantChanges.levelChanged.total}개
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    구간이 달라진 요인입니다.
                  </span>
                </div>

                {/* 2열 그리드 */}
                <div className="grid grid-cols-2 gap-4">
                  <FactorColumn
                    title="개선"
                    factors={significantChanges.levelChanged.improved}
                    direction="improved"
                    showLevelChange={true}
                    expanded={expandedState.levelChanged.improved}
                    onToggleExpand={() => toggleExpand('levelChanged', 'improved')}
                  />
                  <FactorColumn
                    title="주의"
                    factors={significantChanges.levelChanged.attention}
                    direction="attention"
                    showLevelChange={true}
                    expanded={expandedState.levelChanged.attention}
                    onToggleExpand={() => toggleExpand('levelChanged', 'attention')}
                  />
                </div>
              </div>
            )}

            {/* 블록 2: 구간 내 변화 */}
            {significantChanges.noLevelChange.total > 0 && (
              <div>
                {/* 블록 헤더 */}
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-gray-800">구간 내 변화</h4>
                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full font-semibold">
                    {significantChanges.noLevelChange.total}개
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    구간은 그대로지만 점수가 5점 이상 변화한 요인입니다.
                  </span>
                </div>

                {/* 2열 그리드 */}
                <div className="grid grid-cols-2 gap-4">
                  <FactorColumn
                    title="개선"
                    factors={significantChanges.noLevelChange.improved}
                    direction="improved"
                    showLevelChange={false}
                    isSecondary={true}
                    expanded={expandedState.noLevelChange.improved}
                    onToggleExpand={() => toggleExpand('noLevelChange', 'improved')}
                  />
                  <FactorColumn
                    title="주의"
                    factors={significantChanges.noLevelChange.attention}
                    direction="attention"
                    showLevelChange={false}
                    isSecondary={true}
                    expanded={expandedState.noLevelChange.attention}
                    onToggleExpand={() => toggleExpand('noLevelChange', 'attention')}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfregStudentTrackingView;
