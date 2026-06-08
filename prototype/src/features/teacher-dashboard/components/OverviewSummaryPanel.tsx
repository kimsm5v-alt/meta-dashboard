import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Class, ClassCategoryAverage, FactorCategory } from '@/shared/types';
import { TYPE_COLORS } from '@/shared/data/lpaProfiles';
import type { SelfregCategory } from '@/shared/data/selfregFactors';
import {
  calculateSelfregCategoryAverages,
  SELFREG_MAIN_CATEGORY_ORDER,
} from '@/shared/utils/classComparisonUtils';

type TestId = 'comprehensive' | 'selfreg';

interface OverviewSummaryPanelProps {
  classes: Class[];
  classAverages: ClassCategoryAverage[];
  selectedClassId: string | null;
  testId: TestId;
  onGoToClass: (classId: string) => void;
}

// 5대 영역 정보 (학습종합검사)
const AREA_INFO: Record<FactorCategory, { color: string; polarity: 'positive' | 'negative' }> = {
  '자아강점': { color: '#3B82F6', polarity: 'positive' },
  '학습디딤돌': { color: '#10B981', polarity: 'positive' },
  '긍정적공부마음': { color: '#8B5CF6', polarity: 'positive' },
  '학습걸림돌': { color: '#EF4444', polarity: 'negative' },
  '부정적공부마음': { color: '#F59E0B', polarity: 'negative' },
};

// 3대 전략 정보 (자기조절학습검사) - 모두 positive
const SELFREG_AREA_INFO: Record<SelfregCategory, { color: string; polarity: 'positive' | 'negative' }> = {
  '동기전략': { color: '#9F91F8', polarity: 'positive' },
  '인지전략': { color: '#4BC1FF', polarity: 'positive' },
  '행동전략': { color: '#FF8A94', polarity: 'positive' },
};

interface OutlierCell {
  cls: Class;
  category: string;
  t: number;
  delta: number;
  kind: 'warn' | 'good';
  strong: boolean;
}

export const OverviewSummaryPanel: React.FC<OverviewSummaryPanelProps> = ({
  classes,
  classAverages,
  selectedClassId,
  testId,
  onGoToClass,
}) => {
  // 선택된 반 정보
  const selectedClass = selectedClassId
    ? classes.find((c) => c.id === selectedClassId)
    : null;
  const selectedAverage = selectedClassId
    ? classAverages.find((a) => a.classId === selectedClassId)
    : null;

  // 자기조절학습검사용 classAverages 계산 (항상 호출 - Hooks 규칙)
  const selfregAverages = useMemo(() => {
    if (testId !== 'selfreg') return [];
    return classes.map(cls => calculateSelfregCategoryAverages(cls));
  }, [classes, testId]);

  // 선택된 반의 자기조절학습검사 평균 (항상 호출 - Hooks 규칙)
  const selectedSelfregAvg = useMemo(() => {
    if (testId !== 'selfreg' || !selectedClass) return null;
    return calculateSelfregCategoryAverages(selectedClass);
  }, [testId, selectedClass]);

  // 선택된 반 요약: 평균 T점수 계산 (항상 호출 - Hooks 규칙)
  const avgT = useMemo(() => {
    if (!selectedAverage) return 50;
    if (testId === 'selfreg' && selectedSelfregAvg) {
      // 자기조절학습검사: 3대 전략 평균 (모두 positive)
      const values = Object.values(selectedSelfregAvg.categoryAverages);
      return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
    }
    // 학습종합검사: 5대 영역 평균 (부적 요인 역산)
    return Math.round(
      Object.entries(selectedAverage.categoryAverages).reduce((sum, [cat, val]) => {
        const { polarity } = AREA_INFO[cat as FactorCategory];
        return sum + (polarity === 'negative' ? 100 - val : val);
      }, 0) / 5
    );
  }, [testId, selectedAverage, selectedSelfregAvg]);

  // 관심 영역 (항상 호출 - Hooks 규칙)
  const concerns = useMemo(() => {
    if (!selectedAverage) return [];
    if (testId === 'selfreg' && selectedSelfregAvg) {
      // 자기조절학습검사: 3대 전략 (모두 positive - 낮을수록 관심)
      return Object.entries(selectedSelfregAvg.categoryAverages)
        .map(([cat, t]) => {
          const { polarity, color } = SELFREG_AREA_INFO[cat as SelfregCategory];
          const score = 50 - t; // positive이므로 낮을수록 관심
          return { category: cat, t, score, polarity, color };
        })
        .filter((a) => a.score >= 3)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);
    }
    // 학습종합검사: 5대 영역
    return Object.entries(selectedAverage.categoryAverages)
      .map(([cat, t]) => {
        const { polarity, color } = AREA_INFO[cat as FactorCategory];
        const score = polarity === 'negative' ? t - 50 : 50 - t;
        return { category: cat as FactorCategory, t, score, polarity, color };
      })
      .filter((a) => a.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
  }, [testId, selectedAverage, selectedSelfregAvg]);

  // 전체 비교 요약 (아웃라이어 추출)
  if (!selectedClass || !selectedAverage) {
    // 학년 평균 대비 편차 계산
    const outliers: OutlierCell[] = [];

    if (testId === 'selfreg') {
      // 자기조절학습검사: 3대 전략
      const categories = SELFREG_MAIN_CATEGORY_ORDER;

      categories.forEach((category) => {
        const values = selfregAverages.map((a) => a.categoryAverages[category]);
        const mean = values.reduce((s, v) => s + v, 0) / values.length;

        selfregAverages.forEach((avg, idx) => {
          const cls = classes[idx];
          const t = avg.categoryAverages[category];
          const delta = Math.round(t - mean);
          const { polarity } = SELFREG_AREA_INFO[category];
          const positiveSignal = polarity === 'negative' ? delta < 0 : delta > 0;

          outliers.push({
            cls,
            category,
            t,
            delta,
            kind: positiveSignal ? 'good' : 'warn',
            strong: Math.abs(delta) >= 3,
          });
        });
      });
    } else {
      // 학습종합검사: 5대 영역
      const categories = Object.keys(AREA_INFO) as FactorCategory[];

      categories.forEach((category) => {
        const values = classAverages.map((a) => a.categoryAverages[category]);
        const mean = values.reduce((s, v) => s + v, 0) / values.length;

        classAverages.forEach((avg, idx) => {
          const cls = classes[idx];
          const t = avg.categoryAverages[category];
          const delta = Math.round(t - mean);
          const { polarity } = AREA_INFO[category];
          const positiveSignal = polarity === 'negative' ? delta < 0 : delta > 0;

          outliers.push({
            cls,
            category,
            t,
            delta,
            kind: positiveSignal ? 'good' : 'warn',
            strong: Math.abs(delta) >= 3,
          });
        });
      });
    }

    // 주의 우선, 편차 절댓값 큰 순 정렬
    outliers.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'warn' ? -1 : 1;
      return Math.abs(b.delta) - Math.abs(a.delta);
    });

    const strongOutliers = outliers.filter((o) => o.strong);
    const callouts = (strongOutliers.length ? strongOutliers : outliers).slice(0, 4);

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">전체 비교 요약</h3>
          <p className="text-sm text-gray-500 mt-1">학년 평균과 가장 차이 나는 지점이에요</p>
        </div>

        <div className="space-y-2">
          {callouts.length === 0 ? (
            <p className="text-sm text-gray-400">모든 반이 영역별로 고른 분포예요.</p>
          ) : (
            callouts.map((c, i) => (
              <button
                key={i}
                onClick={() => onGoToClass(c.cls.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                  c.kind === 'warn'
                    ? 'bg-red-50 hover:bg-red-100'
                    : 'bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <span className={`text-lg ${c.kind === 'warn' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {c.kind === 'warn' ? '▼' : '▲'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {c.cls.grade}학년 {c.cls.classNumber}반 : {c.category}
                  </p>
                  <p className={`text-xs mt-0.5 ${c.kind === 'warn' ? 'text-red-600' : 'text-emerald-600'}`}>
                    학년 평균보다 {c.delta > 0 ? '+' : ''}{c.delta || 1} {c.delta >= 0 ? '높음' : '낮음'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // LPA 유형 분포
  // TODO: 고등학교(schoolLevel === '고등')일 경우 LPA 유형이 없으므로 hasLPA를 false로 처리해야 함
  //       백엔드에서 그룹별 교과급 분류 작업 완료 후 조건 추가 필요
  //       예: testId === 'comprehensive' && typeDistribution && selectedClass.schoolLevel !== '고등'
  const typeDistribution = selectedClass.stats?.typeDistribution;
  const hasLPA = testId === 'comprehensive' && typeDistribution;
  const needAttentionCount = selectedClass.stats?.needAttentionCount || 0;
  const totalStudents = selectedClass.stats?.totalStudents || 0;

  return (
    <div className="space-y-5">
      {/* 반 이름 */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <h3 className="text-base font-semibold text-gray-900">
            {selectedClass.grade}학년 {selectedClass.classNumber}반 분석 요약
          </h3>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          학생 {selectedClass.stats?.assessedStudents || 0}명 · 검사 완료
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">평균 T점수</p>
          <p className="text-xl font-bold text-gray-900 tabular-nums">{avgT}.0</p>
          <p className="text-xs text-gray-500">전국 대비 {avgT - 50 >= 0 ? '+' : ''}{avgT - 50}</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">관심 필요</p>
          <p className="text-xl font-bold text-red-600 tabular-nums">
            {needAttentionCount}명
          </p>
          <p className="text-xs text-gray-500">
            {totalStudents > 0 ? Math.round((needAttentionCount / totalStudents) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* 관심 영역 */}
      {concerns.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            관심 영역 ({concerns.length})
          </p>
          <div className="space-y-2">
            {concerns.map((a) => (
              <div
                key={a.category}
                className="flex items-center justify-between px-3 py-2.5 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: a.color }}
                  />
                  <span className="text-sm font-medium text-gray-800">
                    {a.category}
                  </span>
                </div>
                <span className="text-sm text-gray-500 tabular-nums">
                  T {a.t} <span className={a.polarity === 'negative' ? 'text-red-500' : 'text-blue-500'}>{a.polarity === 'negative' ? '↑' : '↓'}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LPA 유형 분포 (학습종합검사만) */}
      {hasLPA && typeDistribution && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              유형 분포
            </p>
            <span className="text-[10px] text-gray-400">
              {selectedClass.stats?.round2Completed ? '2차' : '1차'} 검사 기준
            </span>
          </div>
          <div className="flex h-6 rounded-lg overflow-hidden bg-gray-100">
            {Object.entries(typeDistribution).map(([type, data]) => {
              const color = TYPE_COLORS[type] || '#9CA3AF';
              if (data.percentage === 0) return null;
              return (
                <div
                  key={type}
                  className="flex items-center justify-center text-[10px] text-white font-medium"
                  style={{
                    width: `${data.percentage}%`,
                    backgroundColor: color,
                  }}
                  title={`${type}: ${data.count}명 (${data.percentage}%)`}
                >
                  {data.percentage > 15 && `${data.count}명`}
                </div>
              );
            })}
          </div>
          <div className="space-y-1.5 mt-2">
            {Object.entries(typeDistribution).map(([type, data]) => {
              const color = TYPE_COLORS[type] || '#9CA3AF';
              return (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span>{type}</span>
                  </span>
                  <span className="text-gray-500 tabular-nums">{data.count}명</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 상세 보기 버튼 */}
      <button
        onClick={() => onGoToClass(selectedClass.id)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        {selectedClass.grade}학년 {selectedClass.classNumber}반 상세 분석 보기
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
