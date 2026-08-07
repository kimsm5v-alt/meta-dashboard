/**
 * 검사 > 변화추적 > 반 선택 시 화면
 *
 * 화면 구성:
 * 1. 요인별 변화 비교 차트
 * 2. 유의미한 요인 변화
 * 3. 강점/보완점 Top3 순위 변화
 * 4. 유형 변화 학생
 * 5. 학생별 변화 테이블
 * 6. 개입 이력 타임라인
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, MessageSquare, BookOpen, Lightbulb, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import type { StudentChangeData, ClassChangeSummary, InterventionHistory } from '../types';
import { TYPE_COLORS } from '@/shared/data/lpaProfiles';

interface ClassTrackingViewProps {
  className: string;
  onBack: () => void;
  changeSummary: ClassChangeSummary;
  students: StudentChangeData[];
  interventions: InterventionHistory[];
  onStudentClick?: (studentId: string) => void;
}

// 11개 중분류 정보
const CATEGORY_ORDER = [
  { id: 'positiveSelf', name: '긍정적 자아', area: '자아강점', color: '#00D282', indices: [0, 1, 2, 3] },
  { id: 'interpersonal', name: '대인관계능력', area: '자아강점', color: '#00D282', indices: [4, 5, 6] },
  { id: 'metaCognition', name: '메타인지', area: '학습디딤돌', color: '#4BC1FF', indices: [7, 8, 9] },
  { id: 'learningSkill', name: '학습기술', area: '학습디딤돌', color: '#4BC1FF', indices: [10, 11, 12, 13] },
  { id: 'supportiveRelation', name: '지지적 관계', area: '학습디딤돌', color: '#4BC1FF', indices: [14, 15, 16] },
  { id: 'academicEngagement', name: '학업열의', area: '긍정적공부마음', color: '#67A7FF', indices: [17, 18, 19] },
  { id: 'growthPower', name: '성장력', area: '긍정적공부마음', color: '#67A7FF', indices: [20, 21, 22, 23, 24] },
  { id: 'academicStress', name: '학업스트레스', area: '학습걸림돌', color: '#FF849F', indices: [25, 26, 27] },
  { id: 'learningObstacle', name: '학습방해물', area: '학습걸림돌', color: '#FF849F', indices: [28, 29, 30] },
  { id: 'relationStress', name: '학업관계스트레스', area: '학습걸림돌', color: '#FF849F', indices: [31, 32] },
  { id: 'academicBurnout', name: '학업소진', area: '부정적공부마음', color: '#FF87D4', indices: [33, 34, 35, 36, 37] },
];

// 개입 타입 아이콘/색상
const INTERVENTION_STYLES = {
  counseling: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100', label: '상담' },
  lesson: { icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-100', label: '수업' },
  class_coaching: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-100', label: '학급 코칭' },
  individual_coaching: { icon: Lightbulb, color: 'text-purple-600', bg: 'bg-purple-100', label: '개별 코칭' },
};

// 5대 영역 색상 (대분류)
const DOMAIN_COLORS: Record<string, string> = {
  '자아강점': '#00D282',
  '학습디딤돌': '#4BC1FF',
  '긍정적공부마음': '#67A7FF',
  '학습걸림돌': '#FF849F',
  '부정적공부마음': '#FF87D4',
};

// 38개 요인 정보 (강점/보완점 계산용) - 13_학습요인_정의.md 기반
const FACTOR_INFO = [
  // 자아강점 > 긍정적 자아 (3개)
  { id: 1, name: '자아존중감', category: '자아강점', positive: true, definition: '자신의 능력과 가치에 대한 전반적인 평가와 태도' },
  { id: 2, name: '자기효능감', category: '자아강점', positive: true, definition: '자신이 어떤 일을 성공적으로 수행할 수 있는 능력이 있다고 믿는 기대와 신념' },
  { id: 3, name: '성장마인드셋', category: '자아강점', positive: true, definition: '지능이나 능력이 노력을 통해 변화하고 성장할 수 있다고 생각하는 정도' },
  // 자아강점 > 대인관계능력 (4개)
  { id: 4, name: '자기정서인식', category: '자아강점', positive: true, definition: '나의 정서적 상태를 알아차릴 수 있는 정도' },
  { id: 5, name: '자기정서조절', category: '자아강점', positive: true, definition: '자신의 감정을 상황에 맞게 조절하고 대처할 수 있는 정도' },
  { id: 6, name: '타인정서인식', category: '자아강점', positive: true, definition: '상대방의 기분이나 처한 상황에서 느끼는 감정을 이해할 수 있는 정도' },
  { id: 7, name: '타인공감능력', category: '자아강점', positive: true, definition: '상대방의 감정, 의견, 주장 등에 대하여 자신도 동일하게 느끼는 정도' },
  // 학습디딤돌 > 메타인지 (3개)
  { id: 8, name: '계획능력', category: '학습디딤돌', positive: true, definition: '공부 목표를 세우고, 목표에 따라 순차적으로 학습을 계획하는 능력' },
  { id: 9, name: '점검능력', category: '학습디딤돌', positive: true, definition: '공부 목표 달성 정도와 공부 방법이 적절했는지를 전반적으로 파악할 수 있는 능력' },
  { id: 10, name: '조절능력', category: '학습디딤돌', positive: true, definition: '공부 과정 중에 나타난 문제를 반복하지 않도록 더 나은 공부방법을 찾아 조정하는 능력' },
  // 학습디딤돌 > 학습기술 (5개)
  { id: 11, name: '공부환경', category: '학습디딤돌', positive: true, definition: '학습에 최적화된 공부환경이 될 수 있도록 정리, 정돈하는 습관' },
  { id: 12, name: '시간관리', category: '학습디딤돌', positive: true, definition: '규칙적으로 공부할 수 있는 시간을 계획하고, 관리하는 습관' },
  { id: 13, name: '수업태도', category: '학습디딤돌', positive: true, definition: '수업에 집중하여 선생님 말씀을 경청하고, 수업에 필요한 물품을 사전에 준비하는 습관' },
  { id: 14, name: '노트하기', category: '학습디딤돌', positive: true, definition: '학습한 핵심 내용을 정리하여 기록하고, 기억하기 위해 활용하는 공부습관' },
  { id: 15, name: '시험준비', category: '학습디딤돌', positive: true, definition: '수업에 집중하여 선생님 말씀을 경청하고, 수업에 필요한 물품을 사전에 준비하는 습관' },
  // 학습디딤돌 > 지지적관계 (4개)
  { id: 16, name: '부모 의사소통', category: '학습디딤돌', positive: true, definition: '부모님과 자신의 생활과 생각에 대해 편안하게 대화하는 정도' },
  { id: 17, name: '부모 학업지지', category: '학습디딤돌', positive: true, definition: '부모님이 공부와 관련하여 자신의 의견과 노력을 지지한다고 생각하는 정도' },
  { id: 18, name: '친구 정서지지', category: '학습디딤돌', positive: true, definition: '친구들이 자신의 의견과 고민을 잘 이해하고, 들어준다고 생각하는 정도' },
  { id: 19, name: '교사 정서지지', category: '학습디딤돌', positive: true, definition: '교사가 자신의 의견과 고민을 잘 이해하며, 격려한다고 생각하는 정도' },
  // 학습걸림돌 > 학업스트레스 (3개)
  { id: 20, name: '성적부담', category: '학습걸림돌', positive: false, definition: '기대와 목표에 비해 성적이 낮게 나올 수 있다는 부담을 느끼는 정도' },
  { id: 21, name: '공부부담', category: '학습걸림돌', positive: false, definition: '공부의 필요성과 공부 방법을 알지 못하거나, 공부 양이 많아 부담을 느끼는 정도' },
  { id: 22, name: '수업부담', category: '학습걸림돌', positive: false, definition: '수업 내용이 어렵거나 지루하여 답답함이나 부담을 느끼는 정도' },
  // 학습걸림돌 > 학습방해물 (2개)
  { id: 23, name: '스마트폰 의존', category: '학습걸림돌', positive: false, definition: '스마트폰 의존도가 높아서 일상생활과 공부에 방해 받는 정도' },
  { id: 24, name: '게임 과몰입', category: '학습걸림돌', positive: false, definition: '인터넷 게임 의존도가 높아서 일상생활과 공부에 방해 받는 정도' },
  // 학습걸림돌 > 학업관계스트레스 (5개)
  { id: 25, name: '부모 성적압력', category: '학습걸림돌', positive: false, definition: '성적과 관련된 부모님의 높은 기대나 꾸중에 대해 부담감을 느끼는 정도' },
  { id: 26, name: '부모 공부부담', category: '학습걸림돌', positive: false, definition: '공부와 관련된 부모님의 비교와 압박으로 인해 부담감을 느끼는 정도' },
  { id: 27, name: '친구 공부비교', category: '학습걸림돌', positive: false, definition: '친구에 비해 성적이 떨어지는 것을 불안해 하거나 열등감을 느끼는 정도' },
  { id: 28, name: '교사 성적압력', category: '학습걸림돌', positive: false, definition: '교사의 성적비교, 꾸중에 대한 불안감, 기대에 부응하지 못한 성적으로 인한 좌절감의 정도' },
  { id: 29, name: '교사 수업부담', category: '학습걸림돌', positive: false, definition: '수업 중 교사의 질문에 답을 못하거나 수업 내용을 잘 이해하지 못할까봐 부담을 느끼는 정도' },
  // 긍정적공부마음 > 학업열의 (3개)
  { id: 30, name: '활기', category: '긍정적공부마음', positive: true, definition: '공부를 할 때 힘이 나거나 재미와 즐거움을 느끼는 정도' },
  { id: 31, name: '몰두', category: '긍정적공부마음', positive: true, definition: '시간과 장소에 관계없이 공부에 집중할 수 있는 정도' },
  { id: 32, name: '의미감', category: '긍정적공부마음', positive: true, definition: '공부하는 의미와 목적을 알고, 보람을 느끼는 정도' },
  // 긍정적공부마음 > 성장력 (3개)
  { id: 33, name: '자율성', category: '긍정적공부마음', positive: true, definition: '자기 스스로의 원칙에 따라 어떤 일을 주체적으로 결정하는 특성' },
  { id: 34, name: '유능성', category: '긍정적공부마음', positive: true, definition: '어떤 일을 남들보다 잘하는 능력이 있다는 느낌' },
  { id: 35, name: '관계성', category: '긍정적공부마음', positive: true, definition: '사람들 사이에서 관심을 주고 받으며, 그 속에서 소속감을 느끼는 정도' },
  // 부정적공부마음 > 학업소진 (3개)
  { id: 36, name: '고갈', category: '부정적공부마음', positive: false, definition: '공부 때문에 지쳐서 아무 즐거움이나 흥미가 없는 피로 상태' },
  { id: 37, name: '무능감', category: '부정적공부마음', positive: false, definition: '노력해도 성적이 만족스럽지 않고, 노력한만큼 좋은 결과가 나오지 않아 실망감을 느끼는 상태' },
  { id: 38, name: '반감-냉소', category: '부정적공부마음', positive: false, definition: '공부 흥미가 줄거나 하기 싫다고 느끼며, 공부의 필요성을 느끼지 못하는 정도' },
];

export const ClassTrackingView: React.FC<ClassTrackingViewProps> = ({
  className,
  onBack,
  changeSummary,
  students,
  interventions,
  onStudentClick,
}) => {
  // 2차 응시 학생만 필터링
  const studentsWithRound2 = useMemo(() => {
    return students.filter(s => s.round2Score !== null);
  }, [students]);

  // 중분류별 평균 계산
  const categoryAverages = useMemo(() => {
    const round1Avgs: Record<string, number> = {};
    const round2Avgs: Record<string, number> = {};

    CATEGORY_ORDER.forEach(cat => {
      const round1Scores: number[] = [];
      const round2Scores: number[] = [];

      studentsWithRound2.forEach(s => {
        if (s.round1TScores) {
          const catScores = cat.indices.map(i => s.round1TScores![i]).filter(v => v != null);
          if (catScores.length > 0) {
            round1Scores.push(catScores.reduce((a, b) => a + b, 0) / catScores.length);
          }
        }
        if (s.round2TScores) {
          const catScores = cat.indices.map(i => s.round2TScores![i]).filter(v => v != null);
          if (catScores.length > 0) {
            round2Scores.push(catScores.reduce((a, b) => a + b, 0) / catScores.length);
          }
        }
      });

      round1Avgs[cat.id] = round1Scores.length > 0
        ? Math.round(round1Scores.reduce((a, b) => a + b, 0) / round1Scores.length)
        : 50;
      round2Avgs[cat.id] = round2Scores.length > 0
        ? Math.round(round2Scores.reduce((a, b) => a + b, 0) / round2Scores.length)
        : 50;
    });

    return { round1: round1Avgs, round2: round2Avgs };
  }, [studentsWithRound2]);

  // 반 전체 강점/보완점 변화 분석
  const factorChangeAnalysis = useMemo(() => {
    if (studentsWithRound2.length === 0) {
      return {
        significantChanges: [],
        strengthChanges: { kept: [], newIn: [], dropped: [] },
        weaknessChanges: { kept: [], newIn: [], dropped: [] }
      };
    }

    // 요인별 평균 점수 계산 (1차, 2차)
    const factorAvgs = FACTOR_INFO.map((factor, idx) => {
      const round1Scores: number[] = [];
      const round2Scores: number[] = [];

      studentsWithRound2.forEach(s => {
        if (s.round1TScores && s.round1TScores[idx] != null) {
          round1Scores.push(s.round1TScores[idx]);
        }
        if (s.round2TScores && s.round2TScores[idx] != null) {
          round2Scores.push(s.round2TScores[idx]);
        }
      });

      const round1Avg = round1Scores.length > 0
        ? Math.round(round1Scores.reduce((a, b) => a + b, 0) / round1Scores.length)
        : 50;
      const round2Avg = round2Scores.length > 0
        ? Math.round(round2Scores.reduce((a, b) => a + b, 0) / round2Scores.length)
        : 50;

      return {
        ...factor,
        round1Score: round1Avg,
        round2Score: round2Avg,
        change: round2Avg - round1Avg,
      };
    });

    // 1. 유의미하게 변화한 요인 (|변화량| >= 3)
    const significantChanges = [...factorAvgs]
      .filter(f => Math.abs(f.change) >= 3)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 6);

    // 2. 강점 Top3 변화 분석 (긍정 요인)
    const positiveFactors = factorAvgs.filter(f => f.positive);
    const round1Strengths = [...positiveFactors]
      .sort((a, b) => b.round1Score - a.round1Score)
      .slice(0, 3)
      .map(f => f.id);
    const round2Strengths = [...positiveFactors]
      .sort((a, b) => b.round2Score - a.round2Score)
      .slice(0, 3)
      .map(f => f.id);

    const strengthKept = positiveFactors.filter(f =>
      round1Strengths.includes(f.id) && round2Strengths.includes(f.id)
    );
    const strengthNewIn = positiveFactors.filter(f =>
      !round1Strengths.includes(f.id) && round2Strengths.includes(f.id)
    );
    const strengthDropped = positiveFactors.filter(f =>
      round1Strengths.includes(f.id) && !round2Strengths.includes(f.id)
    );

    // 3. 보완점 Top3 변화 분석 (부정 요인)
    const negativeFactors = factorAvgs.filter(f => !f.positive);
    const round1Weaknesses = [...negativeFactors]
      .sort((a, b) => b.round1Score - a.round1Score)
      .slice(0, 3)
      .map(f => f.id);
    const round2Weaknesses = [...negativeFactors]
      .sort((a, b) => b.round2Score - a.round2Score)
      .slice(0, 3)
      .map(f => f.id);

    const weaknessKept = negativeFactors.filter(f =>
      round1Weaknesses.includes(f.id) && round2Weaknesses.includes(f.id)
    );
    const weaknessNewIn = negativeFactors.filter(f =>
      !round1Weaknesses.includes(f.id) && round2Weaknesses.includes(f.id)
    );
    const weaknessDropped = negativeFactors.filter(f =>
      round1Weaknesses.includes(f.id) && !round2Weaknesses.includes(f.id)
    );

    return {
      significantChanges,
      strengthChanges: { kept: strengthKept, newIn: strengthNewIn, dropped: strengthDropped },
      weaknessChanges: { kept: weaknessKept, newIn: weaknessNewIn, dropped: weaknessDropped }
    };
  }, [studentsWithRound2]);

  // 유형 변화 학생 목록
  const typeChangedStudents = useMemo(() => {
    return studentsWithRound2.filter(s => s.typeChanged);
  }, [studentsWithRound2]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{className} 변화추적</h1>
        <p className="text-sm text-gray-500 mt-1">
          1차 검사와 2차 검사 결과를 비교하여 학생들의 변화를 확인합니다.
        </p>
      </div>

      {/* 1. 요인별 변화 비교 차트 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">요인별 변화 비교</h3>
        <p className="text-sm text-gray-500 mb-4">
          11개 중분류 하위요인의 1차/2차 평균 T점수 변화입니다.
        </p>
        <CategoryComparisonChart round1={categoryAverages.round1} round2={categoryAverages.round2} />
      </div>

      {/* 2.5 유의미한 요인 변화 */}
      {factorChangeAnalysis.significantChanges.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-2">유의미한 요인 변화</h3>
          <p className="text-sm text-gray-500 mb-4">T점수가 3점 이상 변화한 요인들입니다.</p>
          <div className="grid grid-cols-3 gap-3">
            {factorChangeAnalysis.significantChanges.map((item, index) => {
              const isImproved = item.positive ? item.change > 0 : item.change < 0;
              const domainColor = DOMAIN_COLORS[item.category] || '#9CA3AF';
              return (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-gray-50 border border-gray-200 relative overflow-hidden"
                >
                  {/* 왼쪽 포인트 바 */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isImproved ? 'bg-emerald-500' : 'bg-orange-500'
                    }`}
                  />
                  {/* 대분류 해시태그 */}
                  <span
                    className="text-[11px] font-semibold inline-block mb-1 ml-1"
                    style={{ color: domainColor }}
                  >
                    #{item.category}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mb-1 ml-1">{item.name}</p>
                  <div className="flex items-center justify-between ml-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>{item.round1Score}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className={`font-semibold ${isImproved ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {item.round2Score}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold ${
                      isImproved ? 'text-emerald-600' : 'text-orange-600'
                    }`}>
                      {item.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {item.change > 0 ? '+' : ''}{item.change}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2.6 강점/보완점 Top3 순위 변화 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">강점/보완점 Top 3 순위 변화</h3>

        <div className="flex gap-6">
          {/* 1차 검사 */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700 mb-3">1차 검사</p>

            {/* 1차 강점 */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3} />
                </span>
                <h4 className="text-xs font-bold text-emerald-700">주요 강점</h4>
              </div>
              <div className="space-y-2">
                {[...factorChangeAnalysis.strengthChanges.kept, ...factorChangeAnalysis.strengthChanges.dropped]
                  .sort((a, b) => b.round1Score - a.round1Score)
                  .slice(0, 3)
                  .map((item, idx) => {
                    const domainColor = DOMAIN_COLORS[item.category] || '#9CA3AF';
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border bg-emerald-50 border-emerald-200"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-emerald-700 w-4 mt-0.5">{idx + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                              <span className="text-[10px] font-medium" style={{ color: domainColor }}>
                                #{item.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">{item.definition}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 1차 보완점 */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-4 h-4 rounded bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-2.5 h-2.5 text-red-600" strokeWidth={2.5} />
                </span>
                <h4 className="text-xs font-bold text-red-700">주요 보완점</h4>
              </div>
              <div className="space-y-2">
                {[...factorChangeAnalysis.weaknessChanges.kept, ...factorChangeAnalysis.weaknessChanges.dropped]
                  .sort((a, b) => b.round1Score - a.round1Score)
                  .slice(0, 3)
                  .map((item, idx) => {
                    const domainColor = DOMAIN_COLORS[item.category] || '#9CA3AF';
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border bg-red-50 border-red-200"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-red-700 w-4 mt-0.5">{idx + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                              <span className="text-[10px] font-medium" style={{ color: domainColor }}>
                                #{item.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">{item.definition}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div className="w-px bg-gray-200 self-stretch" />

          {/* 2차 검사 */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700 mb-3">2차 검사</p>

            {/* 2차 강점 */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3} />
                </span>
                <h4 className="text-xs font-bold text-emerald-700">주요 강점</h4>
              </div>
              <div className="space-y-2">
                {[...factorChangeAnalysis.strengthChanges.kept, ...factorChangeAnalysis.strengthChanges.newIn]
                  .sort((a, b) => b.round2Score - a.round2Score)
                  .slice(0, 3)
                  .map((item, idx) => {
                    const domainColor = DOMAIN_COLORS[item.category] || '#9CA3AF';
                    const isNew = factorChangeAnalysis.strengthChanges.newIn.some(n => n.id === item.id);
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border ${isNew ? 'bg-emerald-100 border-emerald-400 border-2' : 'bg-emerald-50 border-emerald-200'}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-emerald-700 w-4 mt-0.5">{idx + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                              <span className="text-[10px] font-medium" style={{ color: domainColor }}>
                                #{item.category}
                              </span>
                              {isNew && (
                                <span className="px-1 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded">NEW</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">{item.definition}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 2차 보완점 */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-4 h-4 rounded bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-2.5 h-2.5 text-red-600" strokeWidth={2.5} />
                </span>
                <h4 className="text-xs font-bold text-red-700">주요 보완점</h4>
              </div>
              <div className="space-y-2">
                {[...factorChangeAnalysis.weaknessChanges.kept, ...factorChangeAnalysis.weaknessChanges.newIn]
                  .sort((a, b) => b.round2Score - a.round2Score)
                  .slice(0, 3)
                  .map((item, idx) => {
                    const domainColor = DOMAIN_COLORS[item.category] || '#9CA3AF';
                    const isNew = factorChangeAnalysis.weaknessChanges.newIn.some(n => n.id === item.id);
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border ${isNew ? 'bg-red-100 border-red-400 border-2' : 'bg-red-50 border-red-200'}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-red-700 w-4 mt-0.5">{idx + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                              <span className="text-[10px] font-medium" style={{ color: domainColor }}>
                                #{item.category}
                              </span>
                              {isNew && (
                                <span className="px-1 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded">NEW</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">{item.definition}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2.7 유형 변화 학생 */}
      {typeChangedStudents.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">유형 변화 학생</h3>
              <p className="text-xs text-gray-500">1차 → 2차 검사에서 LPA 유형이 변화한 학생 {typeChangedStudents.length}명</p>
            </div>
          </div>

          {/* 유형 변화 흐름 그룹화 */}
          <div className="space-y-3">
            {(() => {
              // 유형 변화별로 학생 그룹화
              const changeGroups: Record<string, typeof typeChangedStudents> = {};
              typeChangedStudents.forEach(student => {
                const key = `${student.round1Type}→${student.round2Type}`;
                if (!changeGroups[key]) changeGroups[key] = [];
                changeGroups[key].push(student);
              });

              return Object.entries(changeGroups).map(([key, students]) => {
                const [fromType, toType] = key.split('→');
                return (
                  <div key={key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    {/* 유형 변화 표시 */}
                    <div className="flex items-center gap-2 min-w-[180px]">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${TYPE_COLORS[fromType]}20`,
                          color: TYPE_COLORS[fromType],
                        }}
                      >
                        {fromType}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${TYPE_COLORS[toType]}20`,
                          color: TYPE_COLORS[toType],
                        }}
                      >
                        {toType}
                      </span>
                    </div>

                    {/* 학생 목록 */}
                    <div className="flex-1 flex flex-wrap gap-1.5">
                      {students.map(student => (
                        <button
                          key={student.id}
                          onClick={() => onStudentClick?.(student.id)}
                          className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                        >
                          {student.number}번 {student.name}
                        </button>
                      ))}
                    </div>

                    {/* 인원 수 */}
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                      {students.length}명
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* 3. 개입 이력 타임라인 */}
      {interventions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">개입 이력</h3>
          <div className="relative">
            {/* 타임라인 선 */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* 이력 아이템 */}
            <div className="space-y-4">
              {interventions.map((item) => {
                const style = INTERVENTION_STYLES[item.type];
                const Icon = style.icon;
                return (
                  <div key={item.id} className="relative flex gap-4 pl-10">
                    {/* 아이콘 */}
                    <div className={`absolute left-0 w-8 h-8 rounded-full ${style.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${style.color}`} />
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${style.color}`}>{style.label}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 중분류 비교 차트 컴포넌트
// 5대 영역 정보
const AREA_INFO: Record<string, { color: string; polarity: 'positive' | 'negative' }> = {
  '자아강점': { color: '#00D282', polarity: 'positive' },
  '학습디딤돌': { color: '#4BC1FF', polarity: 'positive' },
  '긍정적공부마음': { color: '#67A7FF', polarity: 'positive' },
  '학습걸림돌': { color: '#FF849F', polarity: 'negative' },
  '부정적공부마음': { color: '#FF87D4', polarity: 'negative' },
};

interface CategoryComparisonChartProps {
  round1: Record<string, number>;
  round2: Record<string, number>;
}

const CategoryComparisonChart: React.FC<CategoryComparisonChartProps> = ({ round1, round2 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const pad = { l: 70, r: 16, t: 16, b: 90 };
  const n = CATEGORY_ORDER.length;
  const colGap = 10;
  const innerW = containerWidth - pad.l - pad.r;
  const colW = Math.max(22, (innerW - colGap * (n - 1)) / n);
  const barW = Math.min(24, (colW - 4) / 2);
  const height = 360;
  const plotH = height - pad.t - pad.b;

  const yOf = (t: number) => pad.t + (1 - t / 100) * plotH;

  // 막대 색상 결정 (polarity 고려)
  const getBarTone = (t: number, polarity: 'positive' | 'negative') => {
    const isNormal = t >= 40 && t < 60;
    if (isNormal) {
      return { fill: '#EDEDF0', stroke: '#D4D4D8', labelColor: '#71717A' };
    }
    const isHigh = t >= 60;
    const isGood = polarity === 'negative' ? !isHigh : isHigh;
    if (isGood) {
      return { fill: '#E3F4E9', stroke: '#A9DCBC', labelColor: '#16A34A' };
    }
    return { fill: '#FDE7E4', stroke: '#F0B5AC', labelColor: '#DC2626' };
  };

  const bands = [
    { from: 70, to: 100, label: '매우높음', fill: '#FFFFFF' },
    { from: 60, to: 70, label: '높음', fill: '#FFFFFF' },
    { from: 40, to: 60, label: '보통', fill: '#F7F7F8' },
    { from: 30, to: 40, label: '낮음', fill: '#FFFFFF' },
    { from: 0, to: 30, label: '매우낮음', fill: '#FFFFFF' },
  ];

  // 영역별 그룹 생성
  const areaGroups = useMemo(() => {
    const groups: { area: string; color: string; cols: typeof CATEGORY_ORDER }[] = [];
    let currentArea = '';
    let currentGroup: typeof CATEGORY_ORDER = [];

    CATEGORY_ORDER.forEach((cat, idx) => {
      if (cat.area !== currentArea) {
        if (currentGroup.length > 0) {
          const info = AREA_INFO[currentArea];
          groups.push({ area: currentArea, color: info?.color || '#666', cols: currentGroup });
        }
        currentArea = cat.area;
        currentGroup = [cat];
      } else {
        currentGroup.push(cat);
      }
      if (idx === CATEGORY_ORDER.length - 1) {
        const info = AREA_INFO[currentArea];
        groups.push({ area: currentArea, color: info?.color || '#666', cols: currentGroup });
      }
    });

    return groups;
  }, []);

  const totalW = pad.l + innerW + pad.r;

  return (
    <div ref={containerRef} className="overflow-x-auto">
      <svg width={totalW} height={height} className="block">
        {/* 등급 배경 밴드 */}
        {bands.map((b) => {
          const y = yOf(b.to);
          const h = yOf(b.from) - yOf(b.to);
          return (
            <g key={b.label}>
              <rect x={pad.l} y={y} width={innerW} height={h} fill={b.fill} />
              <text x={pad.l - 32} y={y + h / 2 + 4} textAnchor="end" fontSize="10" fill="#A1A1A8" fontWeight="600">
                {b.label}
              </text>
            </g>
          );
        })}

        {/* 수평선 */}
        {[0, 20, 40, 50, 60, 80, 100].map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              y1={yOf(t)}
              x2={pad.l + innerW}
              y2={yOf(t)}
              stroke={t === 50 ? '#C9A4ED' : '#E5E5E7'}
              strokeWidth={t === 50 ? 1.3 : 0.7}
              strokeDasharray={t === 50 ? '4 4' : '0'}
            />
            <text x={pad.l - 8} y={yOf(t) + 4} textAnchor="end" fontSize="10.5" fill="#71717A">
              {t}
            </text>
          </g>
        ))}

        {/* 범례 */}
        <g>
          <rect x={totalW - 160} y={6} width={12} height={12} rx={2} fill="#EDEDF0" stroke="#D4D4D8" />
          <text x={totalW - 144} y={16} fontSize={11} fill="#52525B">1차</text>
          <rect x={totalW - 110} y={6} width={12} height={12} rx={2} fill="#D6D6DC" stroke="#B6B6BE" />
          <text x={totalW - 94} y={16} fontSize={11} fill="#52525B">2차</text>
        </g>

        {/* 막대 */}
        {CATEGORY_ORDER.map((cat, idx) => {
          const t1 = round1[cat.id] || 50;
          const t2 = round2[cat.id] || 50;
          const x = pad.l + idx * (colW + colGap);
          const barX1 = x + (colW / 2) - barW - 1;
          const barX2 = x + (colW / 2) + 1;
          const areaInfo = AREA_INFO[cat.area];
          const tone1 = getBarTone(t1, areaInfo?.polarity || 'positive');

          // 2차 막대 색상: 변화 방향 기준 (부적요인은 반대)
          const change = t2 - t1;
          const isImproved = areaInfo?.polarity === 'negative' ? change < 0 : change > 0;
          const tone2 = change === 0
            ? { fill: '#EDEDF0', stroke: '#D4D4D8', labelColor: '#71717A' }
            : isImproved
              ? { fill: '#E3F4E9', stroke: '#16A34A', labelColor: '#16A34A' }
              : { fill: '#FDE7E4', stroke: '#DC2626', labelColor: '#DC2626' };

          return (
            <g key={cat.id}>
              {/* 1차 막대 */}
              <rect
                x={barX1}
                y={yOf(t1)}
                width={barW}
                height={(t1 / 100) * plotH}
                rx="3"
                fill={tone1.fill}
                stroke={tone1.stroke}
                strokeWidth={1}
              >
                <title>{`${cat.name} 1차 T ${t1}`}</title>
              </rect>
              <text
                x={barX1 + barW / 2}
                y={yOf(t1) - 4}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill={tone1.labelColor}
              >
                {t1}
              </text>

              {/* 2차 막대 */}
              <rect
                x={barX2}
                y={yOf(t2)}
                width={barW}
                height={(t2 / 100) * plotH}
                rx="3"
                fill={tone2.fill}
                stroke={tone2.stroke}
                strokeWidth={2}
              >
                <title>{`${cat.name} 2차 T ${t2}`}</title>
              </rect>
              <text
                x={barX2 + barW / 2}
                y={yOf(t2) - 4}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={tone2.labelColor}
              >
                {t2}
              </text>

              {/* 카테고리 라벨 */}
              <text x={x + colW / 2} y={height - pad.b + 16} textAnchor="middle" fontSize="10" fill="#52525B">
                {cat.name.length > 5 ? (
                  <>
                    <tspan x={x + colW / 2} dy="0">{cat.name.slice(0, Math.ceil(cat.name.length / 2))}</tspan>
                    <tspan x={x + colW / 2} dy="12">{cat.name.slice(Math.ceil(cat.name.length / 2))}</tspan>
                  </>
                ) : (
                  cat.name
                )}
              </text>
            </g>
          );
        })}

        {/* 영역 라벨 (하단) */}
        {(() => {
          let colIdx = 0;
          return areaGroups.map((g) => {
            const startX = pad.l + colIdx * (colW + colGap);
            const endX = pad.l + (colIdx + g.cols.length - 1) * (colW + colGap) + colW;
            colIdx += g.cols.length;

            return (
              <g key={g.area}>
                <line
                  x1={startX}
                  y1={height - pad.b + 56}
                  x2={endX}
                  y2={height - pad.b + 56}
                  stroke={g.color}
                  strokeWidth="2"
                />
                <text
                  x={(startX + endX) / 2}
                  y={height - pad.b + 72}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill={g.color}
                >
                  {g.area}
                </text>
              </g>
            );
          });
        })()}
      </svg>
    </div>
  );
};

export default ClassTrackingView;
