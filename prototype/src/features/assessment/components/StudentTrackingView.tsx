/**
 * 검사 > 변화추적 > 학생 선택 시 화면
 *
 * 화면 구성:
 * 1. AI 변화 분석
 * 2. 학습 현황 변화 (Q120~Q124 설문 응답 비교)
 * 3. 38개 요인 분석 (차수 비교)
 * 4. 주요 변화 요인 (구간 변화 / 구간 내 변화)
 * 5. 학습 유형 분류 (TypeClassification 비교 모드)
 * 6. 개입 이력
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Sparkles, ArrowRight, ChevronDown, ChevronUp, TrendingDownIcon, ExternalLink } from 'lucide-react';
import { StudentHeader } from '@/shared/components';
import type { StudentChangeData, InterventionHistory, InterventionType } from '../types';
import { LEARNING_STATUS_LABELS } from '../types';
import type { TLevel, StudentType } from '@/shared/types';
import { StudentFactorAnalysis } from './StudentFactorAnalysis';
import { TypeClassification } from './TypeClassification';
import { FACTOR_DEFINITIONS } from '@/shared/data/factors';
import { getLevel } from '@/shared/data/subCategoryScripts';

interface StudentTrackingViewProps {
  student: StudentChangeData;
  className: string;
  /** 반 ID (예: group-2) */
  classId: string;
  interventions: InterventionHistory[];
  onBack: () => void;
}

// AI 변화 분석 생성 (Mock)
const generateAIAnalysis = (student: StudentChangeData) => {
  const { change, changeDirection, typeChanged, round1Type, round2Type } = student;

  if (changeDirection === 'up') {
    return {
      summary: '긍정적인 변화가 관찰됩니다.',
      details: [
        `평균 T점수가 ${Math.abs(change || 0).toFixed(1)}점 상승하여 전반적인 학습심리 상태가 개선되었습니다.`,
        typeChanged
          ? `학습 유형이 '${round1Type}'에서 '${round2Type}'로 변화하며 더 긍정적인 학습 패턴을 보이고 있습니다.`
          : '학습 유형은 유지되었으나, 세부 요인에서 개선이 나타났습니다.',
        '현재의 긍정적 변화를 유지하기 위해 지속적인 관심과 격려가 필요합니다.',
      ],
      recommendations: [
        '강점 요인을 활용한 심화 학습 기회 제공',
        '성취 경험을 공유할 수 있는 또래 활동 연계',
      ],
    };
  }

  if (changeDirection === 'down') {
    return {
      summary: '주의가 필요한 변화가 관찰됩니다.',
      details: [
        `평균 T점수가 ${Math.abs(change || 0).toFixed(1)}점 하락하여 학습심리 상태에 주의가 필요합니다.`,
        typeChanged
          ? `학습 유형이 '${round1Type}'에서 '${round2Type}'로 변화하였습니다. 변화 원인에 대한 파악이 필요합니다.`
          : '학습 유형은 유지되었으나, 세부 요인에서 하락이 나타났습니다.',
        '학생과의 개별 상담을 통해 변화 원인을 파악하는 것을 권장합니다.',
      ],
      recommendations: [
        '개별 상담을 통한 심층 원인 파악',
        '부담 완화 및 정서적 지지 강화',
        '단기 목표 설정을 통한 작은 성공 경험 제공',
      ],
    };
  }

  return {
    summary: '안정적인 상태를 유지하고 있습니다.',
    details: [
      '1차와 2차 검사 결과가 유사하게 유지되고 있습니다.',
      '현재 상태가 안정적이므로, 강점을 더 발전시킬 수 있는 기회를 제공해주세요.',
    ],
    recommendations: [
      '현재 강점을 활용한 성장 기회 제공',
      '새로운 도전 목표 설정으로 동기 부여',
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

// 유의미한 변화 임계값 (±5점 이상)
const SIGNIFICANT_CHANGE_THRESHOLD = 5;

// 기본 표시 개수
const DEFAULT_DISPLAY_COUNT = 5;

// 변화 방향 (개선/주의)
type ChangeDirection = 'improved' | 'attention';

// 변화 요인 분석 결과 타입
interface FactorChange {
  index: number;
  name: string;
  category: string;
  round1Score: number;
  round2Score: number;
  round1Level: TLevel;
  round2Level: TLevel;
  delta: number; // 원래 변화값 (부호 유지)
  isPositive: boolean; // 요인의 원래 극성 (긍정/부정)
  levelChanged: boolean; // 구간 변화 여부
  direction: ChangeDirection; // 개선/주의 판정
}

/**
 * 개선/주의 판정 함수 (가장 중요한 규칙 - 한 곳에서 관리)
 * 정적 요인(positive): delta > 0 → 개선, delta < 0 → 주의
 * 부적 요인(negative): delta < 0 → 개선, delta > 0 → 주의
 */
const getChangeDirection = (isPositive: boolean, delta: number): ChangeDirection => {
  if (isPositive) {
    return delta > 0 ? 'improved' : 'attention';
  } else {
    return delta < 0 ? 'improved' : 'attention';
  }
};

/**
 * 구간 이동 폭 계산 (정렬용)
 */
const LEVEL_ORDER: TLevel[] = ['매우낮음', '낮음', '보통', '높음', '매우높음'];
const getLevelDiff = (from: TLevel, to: TLevel): number => {
  return Math.abs(LEVEL_ORDER.indexOf(to) - LEVEL_ORDER.indexOf(from));
};

/**
 * 정렬: 1순위 변화폭 절대값 내림차순 → 2순위 구간 이동 폭 → 3순위 요인명
 */
const sortFactors = (factors: FactorChange[]): FactorChange[] => {
  return [...factors].sort((a, b) => {
    // 1순위: 변화폭 절대값 내림차순
    const deltaCompare = Math.abs(b.delta) - Math.abs(a.delta);
    if (deltaCompare !== 0) return deltaCompare;

    // 2순위: 구간 이동 폭 내림차순
    const levelDiffA = getLevelDiff(a.round1Level, a.round2Level);
    const levelDiffB = getLevelDiff(b.round1Level, b.round2Level);
    if (levelDiffB !== levelDiffA) return levelDiffB - levelDiffA;

    // 3순위: 요인명 오름차순
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
  isSecondary?: boolean; // 블록 2용 연한 톤
}

const ChangeBar: React.FC<ChangeBarProps> = ({ delta, maxDelta, direction, isSecondary = false }) => {
  const ratio = maxDelta > 0 ? Math.abs(delta) / maxDelta : 0;
  const widthPercent = Math.min(ratio * 100, 100);

  const barColor = direction === 'improved'
    ? (isSecondary ? 'bg-emerald-300' : 'bg-emerald-500')
    : (isSecondary ? 'bg-red-300' : 'bg-red-500');

  const trackColor = isSecondary ? 'bg-gray-100' : 'bg-gray-200';

  return (
    <div
      className={`w-full h-2 ${trackColor} rounded-full overflow-hidden`}
      role="progressbar"
      aria-valuenow={Math.abs(delta)}
      aria-valuemax={maxDelta}
      aria-label={`${direction === 'improved' ? '개선' : '주의'} ${Math.abs(delta)}점`}
    >
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
  showLevelChange: boolean; // 구간 변화 표시 여부
  isSecondary?: boolean; // 블록 2용 연한 스타일
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

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-default`}
    >
      {/* 요인명 (최대 6글자 기준 고정 폭) */}
      <span className="w-[80px] flex-shrink-0 text-sm font-semibold text-gray-900">
        {factor.name}
      </span>

      {/* 부적 태그 (정적 요인은 빈 공간) */}
      <span className="w-9 flex-shrink-0">
        {!factor.isPositive && (
          <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded font-semibold">
            부적
          </span>
        )}
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

      {/* 변화폭 막대 - flex-grow로 남은 공간 활용 */}
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
// 개입 이력 카드 컴포넌트 (호버 시 바로가기 링크)
// ============================================================
interface InterventionCardProps {
  item: InterventionHistory;
  onNavigate: () => void;
  linkLabel: string;
}

const InterventionCard: React.FC<InterventionCardProps> = ({ item, onNavigate, linkLabel }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-white rounded-lg p-3 border border-gray-100 relative group cursor-pointer hover:border-primary-200 hover:shadow-sm transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onNavigate}
    >
      <p className="text-sm font-medium text-gray-900 mb-1">{item.title}</p>
      {item.description && (
        <p className="text-xs text-gray-500 mb-2 leading-relaxed">{item.description}</p>
      )}
      {item.date && <p className="text-xs text-gray-400">{item.date}</p>}

      {/* 호버 시 바로가기 링크 */}
      {isHovered && (
        <div className="absolute inset-0 bg-primary-50/90 rounded-lg flex items-center justify-center">
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary-700">
            <ExternalLink className="w-3.5 h-3.5" />
            {linkLabel}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 메인 컴포넌트
// ============================================================
export const StudentTrackingView: React.FC<StudentTrackingViewProps> = ({
  student,
  className,
  classId,
  interventions,
  onBack,
}) => {
  const navigate = useNavigate();

  // AI 분석 결과
  const aiAnalysis = useMemo(() => generateAIAnalysis(student), [student]);

  // 바로가기 네비게이션 핸들러
  const handleNavigate = (type: InterventionType, _itemId?: string) => {
    // LNB 학생 ID 형태로 변환 (s1, s2, ...)
    const lnbStudentId = `s${student.number}`;

    switch (type) {
      case 'counseling':
        // 검사 > 결과보기 > 해당 학생 > 상담&관찰 섹션으로 스크롤
        navigate(`/exam/result?class=${classId}&student=${student.id}&scrollTo=counseling`);
        break;
      case 'lesson':
        // 수업 > 수업 결과보기 페이지로 이동
        navigate(`/lesson?class=${classId}&tab=result`);
        break;
      case 'class_coaching':
        // 해당 반 학급 코칭 페이지
        navigate(`/coaching/class?class=${classId}`);
        break;
      case 'individual_coaching':
        // 해당 학생 개별 코칭 페이지
        navigate(`/coaching/individual?class=${classId}&student=${lnbStudentId}`);
        break;
    }
    window.scrollTo(0, 0);
  };

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

  // 주요 변화 요인 분석
  const significantChanges = useMemo(() => {
    if (!student.round1TScores || !student.round2TScores) {
      return {
        levelChanged: { improved: [] as FactorChange[], attention: [] as FactorChange[], total: 0 },
        noLevelChange: { improved: [] as FactorChange[], attention: [] as FactorChange[], total: 0 },
        hasAnyChanges: false,
      };
    }

    const allChanges: FactorChange[] = [];

    // 38개 요인별 변화 계산
    FACTOR_DEFINITIONS.forEach((factor, idx) => {
      const round1 = student.round1TScores![idx];
      const round2 = student.round2TScores![idx];
      const delta = round2 - round1;
      const round1Level = getLevel(round1);
      const round2Level = getLevel(round2);
      const levelChanged = round1Level !== round2Level;
      const direction = getChangeDirection(factor.isPositive, delta);

      // 유의미한 변화만 필터링 (±5점 이상)
      if (Math.abs(delta) >= SIGNIFICANT_CHANGE_THRESHOLD) {
        allChanges.push({
          index: idx,
          name: factor.name,
          category: factor.category,
          round1Score: round1,
          round2Score: round2,
          round1Level,
          round2Level,
          delta,
          isPositive: factor.isPositive,
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
          lpaType={student.round1Type || ''}
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
      {/* 헤더 */}
      <StudentHeader
        studentNumber={student.number}
        studentName={student.name}
        lpaType={student.round2Type || ''}
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

        <ul className="space-y-1.5 mb-4">
          {aiAnalysis.details.map((detail, i) => (
            <li key={i} className="text-sm text-gray-600 leading-relaxed flex gap-2">
              <span className="text-indigo-400">•</span>
              <span>{detail}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          {aiAnalysis.recommendations.map((rec, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-white/70 border border-indigo-200 rounded-full text-xs font-medium text-indigo-700"
            >
              #{rec}
            </span>
          ))}
        </div>
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

      {/* 3. 38개 요인 분석 (차수 비교) */}
      {student.round1TScores && student.round2TScores && (
        <StudentFactorAnalysis
          tScores={student.round2TScores}
          prevTScores={student.round1TScores}
          showCompare={true}
        />
      )}

      {/* 4. 주요 변화 요인 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* 섹션 헤더 */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-bold text-gray-900">주요 변화 요인</h3>
          <span className="text-xs text-gray-400">
            1차 대비 2차 검사에서 5점 이상 변화 · 부적 요인은 점수가 낮아질수록 개선
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

      {/* 5. 학습 유형 분류 */}
      {student.round1Type && student.round2Type && student.round1TypeProbabilities && student.round2TypeProbabilities && (
        <TypeClassification
          predictedType={student.round2Type as StudentType}
          typeProbabilities={student.round2TypeProbabilities}
          schoolLevel="중등"
          showCompare={true}
          prevType={student.round1Type as StudentType}
          prevTypeProbabilities={student.round1TypeProbabilities}
        />
      )}

      {/* 6. 개입 이력 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-base font-bold text-gray-900">개입 이력</h3>
          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
            총 {interventions.length}건
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            각 항목에 마우스를 올리면 바로가기 링크가 표시됩니다
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* 상담 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">상담</p>
              <span className="text-xs text-gray-500">
                {interventions.filter(i => i.type === 'counseling').length}회
              </span>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {interventions.filter(i => i.type === 'counseling').length > 0 ? (
                interventions
                  .filter(i => i.type === 'counseling')
                  .map(item => (
                    <InterventionCard
                      key={item.id}
                      item={item}
                      onNavigate={() => handleNavigate('counseling', item.id)}
                      linkLabel="상담 기록 보기"
                    />
                  ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-3">기록 없음</p>
              )}
            </div>
          </div>

          {/* 수업 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">수업</p>
              <span className="text-xs text-gray-500">
                {interventions.filter(i => i.type === 'lesson').length}회
              </span>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {interventions.filter(i => i.type === 'lesson').length > 0 ? (
                interventions
                  .filter(i => i.type === 'lesson')
                  .map(item => (
                    <InterventionCard
                      key={item.id}
                      item={item}
                      onNavigate={() => handleNavigate('lesson', item.id)}
                      linkLabel="수업 리포트 보기"
                    />
                  ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-3">기록 없음</p>
              )}
            </div>
          </div>

          {/* 학급 코칭 - 검사 시행 시 항상 제공됨 (바로가기만 표시) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-900">학급 코칭</p>
            </div>
            <p className="text-[10px] text-gray-400 mb-3">학급 대표 전략 코칭</p>
            <button
              onClick={() => handleNavigate('class_coaching')}
              className="w-full bg-white rounded-lg p-3 border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center justify-center gap-1.5 text-sm font-medium text-primary-600"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              학급 코칭 보기
            </button>
          </div>

          {/* 개별 코칭 - 검사 시행 시 항상 제공됨 (바로가기만 표시) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-900">개별 코칭</p>
            </div>
            <p className="text-[10px] text-gray-400 mb-3">유형 강점 확인, 맞춤 코칭 제안</p>
            <button
              onClick={() => handleNavigate('individual_coaching')}
              className="w-full bg-white rounded-lg p-3 border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center justify-center gap-1.5 text-sm font-medium text-primary-600"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              개별 코칭 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTrackingView;
