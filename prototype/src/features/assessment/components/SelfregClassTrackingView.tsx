/**
 * 자기조절학습검사 > 변화추적 > 반 선택 시 화면
 *
 * 화면 구성:
 * 1. 종합 해석 비교 (SrlProfileTable)
 * 2. 유의미한 요인 변화
 * 3. 강점/보완점 Top3 순위 변화
 */

import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Check, AlertTriangle, ArrowRight, ChevronRight, Search } from 'lucide-react';
import type { LearningStatus } from '../types';
import { SrlProfileTable } from './SrlProfileTable';

// ============================================================
// 자기조절학습검사용 학생 변화 데이터 타입
// ============================================================

export interface SelfregStudentChangeData {
  id: string;
  number: number;
  name: string;
  round1Score: number | null;
  round2Score: number | null;
  change: number | null;
  changeDirection: 'up' | 'same' | 'down';
  round1TScores: number[] | null;
  round2TScores: number[] | null;
  round1LearningStatus: LearningStatus | null;
  round2LearningStatus: LearningStatus | null;
}

export interface SelfregClassChangeSummary {
  classId: string;
  className: string;
  round1Avg: number;
  round2Avg: number;
  avgChange: number;
  upCount: number;
  sameCount: number;
  downCount: number;
  totalCount: number;
  round2Count: number;
}

interface SelfregClassTrackingViewProps {
  className: string;
  onBack: () => void;
  changeSummary: SelfregClassChangeSummary;
  students: SelfregStudentChangeData[];
  onStudentClick?: (studentId: string) => void;
}

// 3개 대분류 색상
const SELFREG_DOMAIN_COLORS: Record<string, string> = {
  '동기전략': '#9F91F8',
  '인지전략': '#4AC1FF',
  '행동전략': '#FF8993',
};

// 20개 요인 정보 (정확한 조작적 정의)
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

// ============================================================
// 메인 컴포넌트
// ============================================================

export const SelfregClassTrackingView: React.FC<SelfregClassTrackingViewProps> = ({
  className,
  students,
  onStudentClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // 2차 응시 학생만 필터링
  const studentsWithRound2 = useMemo(() => {
    return students.filter(s => s.round2Score !== null);
  }, [students]);

  // 반 평균 점수 계산 (20개 요인)
  const classAverageScores = useMemo(() => {
    if (studentsWithRound2.length === 0) return Array(20).fill(50);

    const sums = Array(20).fill(0);
    let count = 0;

    studentsWithRound2.forEach(s => {
      if (s.round1TScores && s.round1TScores.length === 20) {
        s.round1TScores.forEach((score, idx) => {
          sums[idx] += score;
        });
        count++;
      }
    });

    return count > 0 ? sums.map(sum => Math.round(sum / count)) : Array(20).fill(50);
  }, [studentsWithRound2]);

  // 2차 반 평균 점수 계산
  const classAverageScoresRound2 = useMemo(() => {
    if (studentsWithRound2.length === 0) return Array(20).fill(50);

    const sums = Array(20).fill(0);
    let count = 0;

    studentsWithRound2.forEach(s => {
      if (s.round2TScores && s.round2TScores.length === 20) {
        s.round2TScores.forEach((score, idx) => {
          sums[idx] += score;
        });
        count++;
      }
    });

    return count > 0 ? sums.map(sum => Math.round(sum / count)) : Array(20).fill(50);
  }, [studentsWithRound2]);

  // 요인별 변화 분석
  const factorChangeAnalysis = useMemo(() => {
    if (studentsWithRound2.length === 0) {
      return {
        significantChanges: [],
        strengthChanges: { round1Top3: [], round2Top3: [] },
        weaknessChanges: { round1Top3: [], round2Top3: [] },
      };
    }

    const factorAvgs = SELFREG_FACTOR_INFO.map((factor, idx) => {
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

    const significantChanges = [...factorAvgs]
      .filter(f => Math.abs(f.change) >= 3)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 6);

    const round1Sorted = [...factorAvgs].sort((a, b) => b.round1Score - a.round1Score);
    const round2Sorted = [...factorAvgs].sort((a, b) => b.round2Score - a.round2Score);

    const round1Top3Strengths = round1Sorted.slice(0, 3);
    const round2Top3Strengths = round2Sorted.slice(0, 3);

    const round1Top3Weaknesses = [...factorAvgs].sort((a, b) => a.round1Score - b.round1Score).slice(0, 3);
    const round2Top3Weaknesses = [...factorAvgs].sort((a, b) => a.round2Score - b.round2Score).slice(0, 3);

    return {
      significantChanges,
      strengthChanges: { round1Top3: round1Top3Strengths, round2Top3: round2Top3Strengths },
      weaknessChanges: { round1Top3: round1Top3Weaknesses, round2Top3: round2Top3Weaknesses },
    };
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

      {/* 1. 종합 해석 비교 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">종합 해석 비교</h3>
        <SrlProfileTable
          selfregScores={classAverageScoresRound2}
          sessions={[
            { round: 1, scores: classAverageScores },
            { round: 2, scores: classAverageScoresRound2 },
          ]}
          viewMode="round2"
        />
      </div>

      {/* 2. 유의미한 요인 변화 */}
      {factorChangeAnalysis.significantChanges.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-2">유의미한 요인 변화</h3>
          <p className="text-sm text-gray-500 mb-4">T점수가 3점 이상 변화한 요인들입니다.</p>
          <div className="grid grid-cols-3 gap-3">
            {factorChangeAnalysis.significantChanges.map((item, index) => {
              const isImproved = item.change > 0;
              const domainColor = SELFREG_DOMAIN_COLORS[item.domain] || '#9CA3AF';
              return (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-gray-50 border border-gray-200 relative overflow-hidden"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isImproved ? 'bg-emerald-500' : 'bg-orange-500'
                    }`}
                  />
                  <span
                    className="text-[11px] font-semibold inline-block mb-1 ml-1"
                    style={{ color: domainColor }}
                  >
                    #{item.domain}
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

      {/* 3. 강점/보완점 Top3 순위 변화 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">강점/보완점 Top 3 순위 변화</h3>

        <div className="flex gap-6">
          {/* 1차 검사 */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700 mb-3">1차 검사</p>

            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3} />
                </span>
                <h4 className="text-xs font-bold text-emerald-700">주요 강점</h4>
              </div>
              <div className="space-y-2">
                {factorChangeAnalysis.strengthChanges.round1Top3.map((item, idx) => {
                  const domainColor = SELFREG_DOMAIN_COLORS[item.domain] || '#9CA3AF';
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
                              #{item.domain}
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

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-4 h-4 rounded bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-2.5 h-2.5 text-red-600" strokeWidth={2.5} />
                </span>
                <h4 className="text-xs font-bold text-red-700">주요 보완점</h4>
              </div>
              <div className="space-y-2">
                {factorChangeAnalysis.weaknessChanges.round1Top3.map((item, idx) => {
                  const domainColor = SELFREG_DOMAIN_COLORS[item.domain] || '#9CA3AF';
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
                              #{item.domain}
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

          <div className="w-px bg-gray-200 self-stretch" />

          {/* 2차 검사 */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700 mb-3">2차 검사</p>

            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3} />
                </span>
                <h4 className="text-xs font-bold text-emerald-700">주요 강점</h4>
              </div>
              <div className="space-y-2">
                {factorChangeAnalysis.strengthChanges.round2Top3.map((item, idx) => {
                  const domainColor = SELFREG_DOMAIN_COLORS[item.domain] || '#9CA3AF';
                  const isNew = !factorChangeAnalysis.strengthChanges.round1Top3.some(r1 => r1.id === item.id);
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
                              #{item.domain}
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

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-4 h-4 rounded bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-2.5 h-2.5 text-red-600" strokeWidth={2.5} />
                </span>
                <h4 className="text-xs font-bold text-red-700">주요 보완점</h4>
              </div>
              <div className="space-y-2">
                {factorChangeAnalysis.weaknessChanges.round2Top3.map((item, idx) => {
                  const domainColor = SELFREG_DOMAIN_COLORS[item.domain] || '#9CA3AF';
                  const isNew = !factorChangeAnalysis.weaknessChanges.round1Top3.some(r1 => r1.id === item.id);
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
                              #{item.domain}
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

      {/* 4. 학생별 변화 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">학생별 변화</h3>
            <p className="text-sm text-gray-500 mt-0.5">학생을 클릭하면 상세 변화추적 화면으로 이동합니다.</p>
          </div>
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="학생 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 학생 목록 테이블 */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">번호</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">이름</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">1차</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">2차</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">변화</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students
                .filter(s =>
                  searchTerm === '' ||
                  s.name.includes(searchTerm) ||
                  String(s.number).includes(searchTerm)
                )
                .sort((a, b) => a.number - b.number)
                .map((student) => {
                  const changeColor = student.changeDirection === 'up'
                    ? 'text-emerald-600'
                    : student.changeDirection === 'down'
                      ? 'text-red-600'
                      : 'text-gray-600';
                  const changeBg = student.changeDirection === 'up'
                    ? 'bg-emerald-50'
                    : student.changeDirection === 'down'
                      ? 'bg-red-50'
                      : 'bg-gray-50';

                  return (
                    <tr
                      key={student.id}
                      onClick={() => onStudentClick?.(student.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-600">{student.number}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {student.round1Score ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">
                        {student.round2Score ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {student.change !== null ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${changeBg} ${changeColor}`}>
                            {student.changeDirection === 'up' && <TrendingUp className="w-3 h-3" />}
                            {student.changeDirection === 'down' && <TrendingDown className="w-3 h-3" />}
                            {student.change > 0 ? '+' : ''}{student.change}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SelfregClassTrackingView;
