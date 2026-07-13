/**
 * 학생 상담 - 학생 선택 - 진단 검사 결과 확인
 *
 * 1. LPA 유형 및 퍼센트 비율 + 개인 학습 현황
 * 2. 강점/보완점 Top 3 (별도 섹션)
 * 3. 1차/2차 회차 전환 버튼
 */

import { useState } from 'react';
import { Check, AlertTriangle, Info } from 'lucide-react';
import type { StudentCounselingSummary } from '../types';
import {
  ACADEMIC_ACHIEVEMENT_LABELS,
  GRADE_SATISFACTION_LABELS,
  LEARNING_MOTIVATION_LABELS,
  SELF_STUDY_TIME_LABELS,
  LEARNING_COUNSELOR_LABELS,
} from '../types';

interface DiagnosisResultCardProps {
  summary: StudentCounselingSummary;
}

/** 회차 탭 컴포넌트 */
const RoundTabs: React.FC<{
  currentRound: 1 | 2;
  hasRound2: boolean;
  onRoundChange: (round: 1 | 2) => void;
}> = ({ currentRound, hasRound2, onRoundChange }) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onRoundChange(1)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          currentRound === 1
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        1차 검사
      </button>
      <button
        onClick={() => onRoundChange(2)}
        disabled={!hasRound2}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          currentRound === 2
            ? 'bg-white text-gray-900 shadow-sm'
            : hasRound2
            ? 'text-gray-500 hover:text-gray-700'
            : 'text-gray-300 cursor-not-allowed'
        }`}
      >
        2차 검사
      </button>
    </div>
  );
};

/** LPA 유형별 색상 */
const LPA_TYPE_COLORS: Record<string, string> = {
  // 중등
  '냉소적 무기력형': '#EF4444',
  '정서조절 취약형': '#F59E0B',
  '자기주도 몰입형': '#10B981',
  // 초등
  '자원소진형': '#EF4444',
  '안전 균형형': '#F59E0B',
  '몰입자원 풍부형': '#10B981',
};

/** LPA 유형별 설명 (툴팁용) */
const LPA_TYPE_DESCRIPTIONS: Record<string, string> = {
  // 초등
  '자원소진형':
    '학습에 필요한 심리·정서적 자원이 상대적으로 낮고, 기대나 부담은 크게 느끼는 유형입니다. 먼저 부담을 낮추고 작은 성공 경험을 통해 학습 회복감을 키워주세요.',
  '안전 균형형':
    '전반적으로 안정적인 학습 상태를 보이지만, 스스로 점검하고 조절하는 힘은 더 키워야 할 수 있습니다. 계획·점검 습관을 함께 길러주세요.',
  '몰입자원 풍부형':
    '긍정적 학습 자원이 풍부하고 몰입 가능성이 높은 유형입니다. 강점을 유지하면서 도전 목표와 깊이 있는 학습 경험으로 확장해주세요.',
  // 중등
  '냉소적 무기력형':
    '심리·정서적 자원이 상대적으로 낮고, 성적과 공부 부담을 크게 느끼는 유형입니다. 먼저 부담을 낮추고 정서적 회복감과 작은 성취 경험을 만들어주세요.',
  '정서조절 취약형':
    '학습 자원은 일정 수준 있으나, 성적 압박과 소진을 크게 느끼는 유형입니다. 학습 전략뿐 아니라 감정 조절과 부담 관리 방법을 함께 지원해주세요.',
  '자기주도 몰입형':
    '심리·정서적 자원이 풍부하고 자기주도적 몰입 가능성이 높은 유형입니다. 현재의 강점을 유지하면서 도전 목표와 심화 학습 기회를 제공해주세요.',
};

/** 영역별 색상 */
const AREA_COLORS: Record<string, string> = {
  '자아강점': '#00D282',
  '학습디딤돌': '#4BC1FF',
  '긍정적공부마음': '#67A7FF',
  '학습걸림돌': '#FF849F',
  '부정적공부마음': '#FF87D4',
};

export const DiagnosisResultCard: React.FC<DiagnosisResultCardProps> = ({ summary }) => {
  // 현재 보고 있는 회차 (기본값은 summary의 round)
  const [viewingRound, setViewingRound] = useState<1 | 2>((summary.round || 1) as 1 | 2);

  // 2차 검사 데이터 존재 여부 (history에 round2TScore가 있으면 2차 검사 완료)
  const hasRound2 = !!(summary.history?.round2TScore || (summary.round && summary.round >= 2));

  // 현재 보고 있는 회차의 데이터
  const isViewingRound1 = viewingRound === 1;

  // 1차 데이터와 2차 데이터 (Mock)
  const round1StrengthDetails = summary.strengthDetails || [];
  const round1WeaknessDetails = summary.weaknessDetails || [];

  // 2차 데이터 (Mock - 실제 구현에서는 API에서 별도로 받아옴)
  const round2StrengthDetails = hasRound2 ? [
    { factorName: '자기효능감', parentCategory: '자아강점', avgT: 58, definition: '자신이 어떤 일을 성공적으로 수행할 수 있다는 믿음' },
    { factorName: '성장마인드셋', parentCategory: '긍정적공부마음', avgT: 55, definition: '능력이 노력을 통해 성장할 수 있다는 믿음' },
    { factorName: '회복탄력성', parentCategory: '자아강점', avgT: 53, definition: '어려운 상황에서도 다시 일어서는 능력' },
  ] : [];

  const round2WeaknessDetails = hasRound2 ? [
    { factorName: '학업스트레스', parentCategory: '학습걸림돌', avgT: 62, definition: '공부와 관련된 심리적 부담감' },
    { factorName: '시험불안', parentCategory: '부정적공부마음', avgT: 58, definition: '시험에 대한 불안감' },
  ] : [];

  const strengthDetails = isViewingRound1 ? round1StrengthDetails : round2StrengthDetails;
  const weaknessDetails = isViewingRound1 ? round1WeaknessDetails : round2WeaknessDetails;
  const learningStatus = summary.learningStatus;

  // LPA 유형 정보 (회차에 따라 다를 수 있음)
  const lpaType = summary.lpaType;
  const lpaColor = LPA_TYPE_COLORS[lpaType] || '#6B7280';

  // Mock 유형 확률 (실제로는 API에서 받아옴)
  const typeProbabilities = {
    [lpaType]: 72,
    ...(lpaType === '자기주도 몰입형'
      ? { '정서조절 취약형': 18, '냉소적 무기력형': 10 }
      : lpaType === '정서조절 취약형'
      ? { '자기주도 몰입형': 16, '냉소적 무기력형': 12 }
      : { '정서조절 취약형': 17, '자기주도 몰입형': 11 }),
  };

  return (
    <div className="space-y-4">
      {/* 섹션 1: LPA 유형 및 개인 학습 현황 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">진단 검사 결과 요약</h3>
          <RoundTabs
            currentRound={viewingRound}
            hasRound2={hasRound2}
            onRoundChange={setViewingRound}
          />
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* 좌측: LPA 유형 및 확률 */}
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="flex items-center gap-1.5 mb-4">
                <h4 className="text-sm font-medium text-gray-700">학습 유형 분류</h4>
                <div className="relative group">
                  <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                  <div className="absolute left-0 top-full mt-2 w-[400px] p-4 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
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
                </div>
              </div>

              {/* 메인 유형 */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: lpaColor }}
                >
                  {typeProbabilities[lpaType]}%
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-lg font-bold text-gray-900">{lpaType}</p>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                        <p className="font-bold text-yellow-400 mb-1">{lpaType}</p>
                        <p className="leading-relaxed text-gray-300">{LPA_TYPE_DESCRIPTIONS[lpaType]}</p>
                        <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">가장 높은 확률의 유형</p>
                </div>
              </div>

              {/* 유형별 확률 바 */}
              <div className="space-y-2">
                {Object.entries(typeProbabilities)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, prob]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className="relative group w-28 flex-shrink-0">
                        <span className="text-xs text-gray-600 cursor-help hover:text-gray-900">{type}</span>
                        {/* 유형별 툴팁 */}
                        <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg pointer-events-none">
                          <p className="font-bold text-yellow-400 mb-1">{type}</p>
                          <p className="leading-relaxed text-gray-300">{LPA_TYPE_DESCRIPTIONS[type]}</p>
                          <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
                        </div>
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${prob}%`,
                            backgroundColor: LPA_TYPE_COLORS[type] || '#6B7280',
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-8 text-right">{prob}%</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* 우측: 개인 학습 현황 */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h4 className="text-sm font-medium text-gray-700 mb-4">개인 학습 현황</h4>

              {learningStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">학업 성취도</span>
                    <span className="text-sm font-medium text-gray-900">
                      {ACADEMIC_ACHIEVEMENT_LABELS[learningStatus.academicAchievement]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">성적 만족도</span>
                    <span className="text-sm font-medium text-gray-900">
                      {GRADE_SATISFACTION_LABELS[learningStatus.gradeSatisfaction]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">학습 동기</span>
                    <span className="text-sm font-medium text-gray-900">
                      {LEARNING_MOTIVATION_LABELS[learningStatus.learningMotivation]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">혼자 공부 시간</span>
                    <span className="text-sm font-medium text-gray-900">
                      {SELF_STUDY_TIME_LABELS[learningStatus.selfStudyTime]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">학습 고민 상담</span>
                    <span className="text-sm font-medium text-gray-900">
                      {LEARNING_COUNSELOR_LABELS[learningStatus.learningCounselor]}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-sm text-gray-400">
                  학습 현황 정보 없음
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 섹션 2: 강점/보완점 Top 3 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">강점 / 보완점 Top 3</h3>
          <RoundTabs
            currentRound={viewingRound}
            hasRound2={hasRound2}
            onRoundChange={setViewingRound}
          />
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* 강점 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                </span>
                <h4 className="text-sm font-semibold text-gray-900">강점</h4>
              </div>

              <div className="space-y-2">
                {strengthDetails.length > 0 ? (
                  strengthDetails.map((item, index) => (
                    <div key={index} className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: AREA_COLORS[item.parentCategory] || '#6B7280' }}
                        >
                          {item.parentCategory}
                        </span>
                        <span className="font-medium text-gray-900 text-sm">{item.factorName}</span>
                        <span className="ml-auto text-sm font-bold text-emerald-600">T{item.avgT}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{item.definition}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">강점 정보 없음</div>
                )}
              </div>
            </div>

            {/* 보완점 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded bg-rose-100 flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-rose-600" strokeWidth={2.5} />
                </span>
                <h4 className="text-sm font-semibold text-gray-900">보완점</h4>
              </div>

              <div className="space-y-2">
                {weaknessDetails.length > 0 ? (
                  weaknessDetails.map((item, index) => (
                    <div key={index} className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: AREA_COLORS[item.parentCategory] || '#6B7280' }}
                        >
                          {item.parentCategory}
                        </span>
                        <span className="font-medium text-gray-900 text-sm">{item.factorName}</span>
                        <span className="ml-auto text-sm font-bold text-rose-600">T{item.avgT}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{item.definition}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">보완점 정보 없음</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisResultCard;
