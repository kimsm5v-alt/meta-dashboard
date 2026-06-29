import React, { useState, useMemo } from 'react';
import { Card } from '@/shared/components';
import type { Class, Student } from '@/shared/types';
import { useClassProfile } from '../../hooks/useClassProfile';
import { SUB_CATEGORY_SCRIPTS } from '@/shared/data/subCategoryScripts';
import { DOMAIN_COLORS } from '@/shared/data/lpaProfiles';
import { FACTOR_DEFINITIONS, SUB_CATEGORY_FACTORS } from '@/shared/data/factors';
import { SELFREG_FACTOR_DEFINITIONS, SELFREG_DOMAIN_COLORS } from '@/shared/data/selfregFactors';
import { convertToSelfregScores, SELFREG_SUB_CATEGORY_INDICES } from '@/shared/utils/classComparisonUtils';
import { ProfileLineChart } from '../ProfileLineChart';

interface LearningDetailTabProps {
  classData: Class;
  testId: 'comprehensive' | 'selfreg';
}

// 중분류에 속한 요인 인덱스 매핑 (학습종합검사)
const SUB_CAT_FACTOR_INDICES: Record<string, number[]> = {};
FACTOR_DEFINITIONS.forEach((factor, idx) => {
  const subCat = factor.subCategory;
  if (!SUB_CAT_FACTOR_INDICES[subCat]) {
    SUB_CAT_FACTOR_INDICES[subCat] = [];
  }
  SUB_CAT_FACTOR_INDICES[subCat].push(idx);
});

// 자기조절학습검사용 중분류 인덱스 매핑
const SELFREG_SUB_CAT_FACTOR_INDICES: Record<string, number[]> = {};
SELFREG_FACTOR_DEFINITIONS.forEach((factor, idx) => {
  const subCat = factor.subCategory;
  if (!SELFREG_SUB_CAT_FACTOR_INDICES[subCat]) {
    SELFREG_SUB_CAT_FACTOR_INDICES[subCat] = [];
  }
  SELFREG_SUB_CAT_FACTOR_INDICES[subCat].push(idx);
});

export const LearningDetailTab: React.FC<LearningDetailTabProps> = ({
  classData,
  testId,
}) => {
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);
  // 'detail' = 38요인(학습종합) 또는 20요인(자기조절), 'summary' = 11중분류(학습종합) 또는 6중분류(자기조절)
  const [viewMode, setViewMode] = useState<'summary' | 'detail'>('detail');

  // 현재 테스트 유형에 맞는 요인 정의
  const currentFactorDefs = testId === 'selfreg' ? SELFREG_FACTOR_DEFINITIONS : FACTOR_DEFINITIONS;
  const factorCount = testId === 'selfreg' ? 20 : 38;
  const subCategoryCount = testId === 'selfreg' ? 6 : 11;
  const [factorModal, setFactorModal] = useState<{
    id: string;
    name: string;
    classAvg: number;
    isPositive: boolean;
    domainColor: string;
    students: { student: Student; score: number; hasReliabilityWarning: boolean }[];
  } | null>(null);

  const hasRound1 = classData.students.some(s =>
    s.assessments.some(a => a.round === 1)
  );
  const hasRound2 = classData.students.some(s =>
    s.assessments.some(a => a.round === 2)
  );

  const profile = useClassProfile(classData, selectedRound, testId);
  const prevProfile = useClassProfile(classData, selectedRound === 2 ? 1 : null, testId);

  // 요인별 평균 T점수 계산
  const factorScores = useMemo(() => {
    const reliableStudents = classData.students.filter(s => {
      const assessment = s.assessments.find(a => a.round === selectedRound);
      return assessment && assessment.reliabilityWarnings.length === 0;
    });

    const students = reliableStudents.length > 0 ? reliableStudents : classData.students;
    const scores: Record<string, number> = {};

    if (testId === 'selfreg') {
      // 자기조절학습검사: 20개 요인
      SELFREG_FACTOR_DEFINITIONS.forEach((factor, idx) => {
        let sum = 0;
        let count = 0;

        students.forEach(student => {
          const assessment = student.assessments.find(a => a.round === selectedRound);
          if (assessment?.tScores) {
            const selfregScores = convertToSelfregScores(assessment.tScores);
            if (selfregScores[idx] != null) {
              sum += selfregScores[idx];
              count++;
            }
          }
        });

        scores[factor.name] = count > 0 ? Math.round(sum / count) : 50;
      });

      // 자기조절학습검사 중분류별 평균
      Object.entries(SELFREG_SUB_CAT_FACTOR_INDICES).forEach(([subCat, indices]) => {
        const subScores = indices.map(idx => scores[SELFREG_FACTOR_DEFINITIONS[idx].name]).filter(s => s != null);
        scores[subCat] = subScores.length > 0 ? Math.round(subScores.reduce((a, b) => a + b, 0) / subScores.length) : 50;
      });
    } else {
      // 학습종합검사: 38개 요인
      FACTOR_DEFINITIONS.forEach((factor, idx) => {
        let sum = 0;
        let count = 0;

        students.forEach(student => {
          const assessment = student.assessments.find(a => a.round === selectedRound);
          if (assessment?.tScores?.[idx] != null) {
            sum += assessment.tScores[idx];
            count++;
          }
        });

        scores[factor.name] = count > 0 ? Math.round(sum / count) : 50;
      });

      // 학습종합검사 중분류별 평균
      Object.entries(SUB_CAT_FACTOR_INDICES).forEach(([subCat, indices]) => {
        const subScores = indices.map(idx => scores[FACTOR_DEFINITIONS[idx].name]).filter(s => s != null);
        scores[subCat] = subScores.length > 0 ? Math.round(subScores.reduce((a, b) => a + b, 0) / subScores.length) : 50;
      });
    }

    return scores;
  }, [classData.students, selectedRound, testId]);

  // 이전 차수 점수 (변화량 표시용)
  const prevFactorScores = useMemo(() => {
    if (selectedRound !== 2 || !hasRound1) return null;

    const reliableStudents = classData.students.filter(s => {
      const assessment = s.assessments.find(a => a.round === 1);
      return assessment && assessment.reliabilityWarnings.length === 0;
    });

    const students = reliableStudents.length > 0 ? reliableStudents : classData.students;
    const scores: Record<string, number> = {};

    if (testId === 'selfreg') {
      SELFREG_FACTOR_DEFINITIONS.forEach((factor, idx) => {
        let sum = 0;
        let count = 0;

        students.forEach(student => {
          const assessment = student.assessments.find(a => a.round === 1);
          if (assessment?.tScores) {
            const selfregScores = convertToSelfregScores(assessment.tScores);
            if (selfregScores[idx] != null) {
              sum += selfregScores[idx];
              count++;
            }
          }
        });

        scores[factor.name] = count > 0 ? Math.round(sum / count) : 50;
      });

      Object.entries(SELFREG_SUB_CAT_FACTOR_INDICES).forEach(([subCat, indices]) => {
        const subScores = indices.map(idx => scores[SELFREG_FACTOR_DEFINITIONS[idx].name]).filter(s => s != null);
        scores[subCat] = subScores.length > 0 ? Math.round(subScores.reduce((a, b) => a + b, 0) / subScores.length) : 50;
      });
    } else {
      FACTOR_DEFINITIONS.forEach((factor, idx) => {
        let sum = 0;
        let count = 0;

        students.forEach(student => {
          const assessment = student.assessments.find(a => a.round === 1);
          if (assessment?.tScores?.[idx] != null) {
            sum += assessment.tScores[idx];
            count++;
          }
        });

        scores[factor.name] = count > 0 ? Math.round(sum / count) : 50;
      });

      Object.entries(SUB_CAT_FACTOR_INDICES).forEach(([subCat, indices]) => {
        const subScores = indices.map(idx => scores[FACTOR_DEFINITIONS[idx].name]).filter(s => s != null);
        scores[subCat] = subScores.length > 0 ? Math.round(subScores.reduce((a, b) => a + b, 0) / subScores.length) : 50;
      });
    }

    return scores;
  }, [classData.students, selectedRound, hasRound1, testId]);

  // T점수 레벨 판정 (polarity 고려)
  // - 정적 요인(isPositive=true): 낮음/매우낮음이 위험 → 빨강
  // - 부적 요인(isPositive=false): 높음/매우높음이 위험 → 빨강
  const getTScoreLevel = (
    score: number,
    isPositive: boolean,
    domainColor: string
  ): { label: string; color: string; bgColor: string; barColor: string; markerColor: string } => {
    const isRisk = isPositive
      ? score < 40 // 정적 요인: 낮음/매우낮음이 위험
      : score >= 60; // 부적 요인: 높음/매우높음이 위험

    // 레벨 판정
    let label: string;
    if (score >= 70) label = '매우높음';
    else if (score >= 60) label = '높음';
    else if (score >= 40) label = '보통';
    else if (score >= 30) label = '낮음';
    else label = '매우낮음';

    if (isRisk) {
      return {
        label,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        barColor: 'bg-red-400',
        markerColor: 'bg-red-500',
      };
    }

    // 위험하지 않으면 대분류 색상 사용
    return {
      label,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      barColor: '', // 동적으로 domainColor 사용
      markerColor: '', // 동적으로 domainColor 사용
    };
  };

  // 요인 클릭 시 학생별 점수 보기
  const handleFactorClick = (factorId: string, factorName: string) => {
    // 요인명으로 인덱스 찾기
    const factorDef = FACTOR_DEFINITIONS.find(f => f.name === factorName);
    const factorIdx = factorDef?.index;

    let totalScore = 0;
    let count = 0;

    const students = classData.students
      .map(student => {
        const assessment = student.assessments.find(a => a.round === selectedRound);
        if (!assessment || !assessment.tScores) return null;

        const score = factorIdx != null ? assessment.tScores[factorIdx] : null;
        if (score == null) return null;

        totalScore += score;
        count++;

        return {
          student,
          score,
          hasReliabilityWarning: assessment.reliabilityWarnings.length > 0,
        };
      })
      .filter((item): item is { student: Student; score: number; hasReliabilityWarning: boolean } => item !== null)
      .sort((a, b) => a.student.number - b.student.number); // 번호순 정렬

    setFactorModal({
      id: factorId,
      name: factorName,
      classAvg: count > 0 ? Math.round(totalScore / count) : 50,
      isPositive: factorDef?.isPositive ?? true,
      domainColor: DOMAIN_COLORS[factorDef?.category ?? ''] ?? '#6B7280',
      students,
    });
  };

  return (
    <div className="space-y-6">
      {/* 차수 선택 바 */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setSelectedRound(1)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedRound === 1
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          1차 검사
        </button>
        {hasRound2 && (
          <button
            onClick={() => setSelectedRound(2)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedRound === 2
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            2차 검사
          </button>
        )}
      </div>

      {/* 강점/약점 TOP 3 (HSJ Dashboard FeatureTopBoxes 스타일) */}
      {profile && (
        <div className="grid grid-cols-2 gap-6">
          {/* 강점 TOP 3 */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-extrabold px-3 py-2 rounded-lg mb-3 bg-emerald-50 text-emerald-600">
              <span className="w-[18px] h-[18px] rounded-full bg-white text-emerald-600 grid place-items-center text-[11px] font-extrabold">
                ✓
              </span>
              우리 반의 강점 TOP 3
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {profile.strengths.slice(0, 3).map((item) => {
                const domainColor = testId === 'selfreg'
                  ? (SELFREG_DOMAIN_COLORS as Record<string, string>)[item.category] || '#10B981'
                  : DOMAIN_COLORS[item.category];
                return (
                  <div
                    key={item.factorName}
                    className="rounded-xl p-3 border bg-[#F2FBF6] border-[#C8E9D2]"
                  >
                    <div
                      className="text-[10.5px] font-bold mb-1"
                      style={{ color: domainColor }}
                    >
                      #{item.category?.replace(/\s/g, '')}
                    </div>
                    <div className="text-sm font-extrabold tracking-tight text-gray-900 mb-1">
                      {item.factorName}
                    </div>
                    <div className="text-[11.5px] text-gray-600 leading-relaxed">
                      {item.definition || '학년 평균을 상회하는 강점 영역입니다'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 약점 TOP 3 */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-extrabold px-3 py-2 rounded-lg mb-3 bg-red-50 text-red-500">
              <span className="w-[18px] h-[18px] rounded-full bg-white text-red-500 grid place-items-center text-[11px] font-extrabold">
                !
              </span>
              우리 반의 보완점 TOP 3
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {profile.weaknesses.slice(0, 3).map((item) => {
                const domainColor = testId === 'selfreg'
                  ? (SELFREG_DOMAIN_COLORS as Record<string, string>)[item.category] || '#EF4444'
                  : DOMAIN_COLORS[item.category];
                return (
                  <div
                    key={item.factorName}
                    className="rounded-xl p-3 border bg-[#FFF5F3] border-[#FFD5CC]"
                  >
                    <div
                      className="text-[10.5px] font-bold mb-1"
                      style={{ color: domainColor }}
                    >
                      #{item.category?.replace(/\s/g, '')}
                    </div>
                    <div className="text-sm font-extrabold tracking-tight text-gray-900 mb-1">
                      {item.factorName}
                    </div>
                    <div className="text-[11.5px] text-gray-600 leading-relaxed">
                      {item.definition || (testId === 'selfreg' ? '학년 평균보다 낮아 보완이 필요한 영역입니다' : '학년 평균보다 높아 주의가 필요한 영역입니다')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 요인 전체 T점수 (ProfileLineChart) */}
      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {viewMode === 'detail'
                ? `${factorCount}개 요인 전체 T점수`
                : `${subCategoryCount}개 중분류 T점수`}
            </h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              {testId === 'selfreg'
                ? '자기조절학습검사의 모든 요인은 정적 요인으로, 점수가 높을수록 학습에 긍정적인 영향을 의미합니다.'
                : '정적 요인(자아강점·학습 디딤돌·긍정적 공부마음)은 점수가 높을수록, 부적 요인(학습 걸림돌·부정적 공부마음)은 점수가 낮을수록 학습에 긍정적인 영향을 의미합니다.'}
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 mt-2 px-2 py-1 bg-primary-50 rounded-md">
              <span className="w-1 h-1 rounded-full bg-primary-500" />
              요인 행을 클릭하면 학생별 점수를 확인할 수 있습니다
            </p>
          </div>
          {/* 보기 모드 토글 */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('detail')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'detail'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              세부 요인 ({factorCount})
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'summary'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              영역 요약 ({subCategoryCount})
            </button>
          </div>
        </div>

        <div className="p-4">
          <ProfileLineChart
            scores={factorScores}
            prevScores={prevFactorScores}
            level={viewMode === 'detail' ? 'factor' : 'category'}
            sessionNo={selectedRound}
            onFactorClick={handleFactorClick}
            testId={testId}
          />
        </div>
      </Card>

      {/* 요인별 학생 점수 모달 */}
      {factorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setFactorModal(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-medium">요인별 학생 점수</p>
                <button
                  onClick={() => setFactorModal(null)}
                  className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{factorModal.name}</h3>
              <p className="text-sm text-gray-500">
                {classData.grade}학년 {classData.classNumber}반 · {selectedRound}차 검사 · 반 평균 T {factorModal.classAvg} · {factorModal.students.length}명
              </p>
            </div>

            {/* 테이블 헤더 */}
            <div className="px-5 py-2 bg-gray-50 border-b border-gray-200 grid grid-cols-[48px_80px_1fr_80px_56px] gap-2 text-xs font-semibold text-gray-500">
              <span>번호</span>
              <span>이름</span>
              <span className="text-center">T점수 분포</span>
              <span className="text-center">수준</span>
              <span className="text-right">T점수</span>
            </div>

            {/* 학생 목록 */}
            <div className="overflow-y-auto max-h-[55vh]">
              {factorModal.students.map(({ student, score, hasReliabilityWarning }) => {
                const level = getTScoreLevel(score, factorModal.isPositive, factorModal.domainColor);
                // 막대 위치 계산 (T점수 20~80 범위를 0~100%로 매핑)
                const barPosition = Math.max(0, Math.min(100, ((score - 20) / 60) * 100));

                // 위험 상태인지 판정
                const isRisk = factorModal.isPositive
                  ? score < 40 // 정적 요인: 낮음/매우낮음
                  : score >= 60; // 부적 요인: 높음/매우높음

                return (
                  <div
                    key={student.id}
                    className="px-5 py-3 border-b border-gray-100 grid grid-cols-[48px_80px_1fr_80px_56px] gap-2 items-center hover:bg-gray-50"
                  >
                    {/* 번호 */}
                    <span className="text-sm text-gray-500">{student.number}</span>

                    {/* 이름 + 신뢰도 경고 */}
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-900 truncate">{student.name}</span>
                      {hasReliabilityWarning && (
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-100 text-red-500 text-[10px] font-bold flex items-center justify-center" title="신뢰도 주의">
                          !
                        </span>
                      )}
                    </div>

                    {/* 막대 그래프 (0부터 시작) */}
                    <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
                      {/* 점수 막대 (0부터 시작) */}
                      <div
                        className={`absolute left-0 top-1 bottom-1 rounded-full transition-all ${isRisk ? 'bg-red-400' : ''}`}
                        style={{
                          width: `${barPosition}%`,
                          backgroundColor: isRisk ? undefined : factorModal.domainColor,
                          opacity: isRisk ? undefined : 0.7,
                        }}
                      />

                      {/* 점수 위치 마커 */}
                      <div
                        className={`absolute top-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${isRisk ? 'bg-red-500' : ''}`}
                        style={{
                          left: `${barPosition}%`,
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: isRisk ? undefined : factorModal.domainColor,
                        }}
                      />
                    </div>

                    {/* 수준 */}
                    <div className="flex justify-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${level.color} ${level.bgColor}`}>
                        {level.label}
                      </span>
                    </div>

                    {/* T점수 */}
                    <span
                      className="text-sm font-bold text-right"
                      style={{ color: isRisk ? '#DC2626' : factorModal.domainColor }}
                    >
                      T {Math.round(score)}
                    </span>
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
