/**
 * 자기조절학습검사 > 결과보기 > 학생 결과 화면
 *
 * 학습종합검사(StudentResultView)와 유사하나 다음 차이점 있음:
 * - LPA 유형 분류 섹션 없음 (자기조절학습검사는 LPA 유형 미지원)
 * - 20개 요인 분석 (SelfregFactorAnalysis)
 * - 강점/보완점 Top 3 (20개 요인 기준)
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md
 */

import { useState, useMemo, useCallback } from 'react';
import { Sparkles, Check, AlertTriangle, Calendar, FileText, ChevronRight } from 'lucide-react';
import { useLayoutContext } from '@/app/LayoutV2';
import { SelfregFactorAnalysis } from '@/features/student-dashboard/components';
import { SelfregOverviewChart } from './SelfregOverviewChart';
import type { StudentExamResult, LearningStatus } from '../types';
import { LEARNING_STATUS_LABELS } from '../types';
import { StudentHeader } from '@/shared/components';
import { CounselingMemoEditor, ObservationMemoEditor, UnifiedHistoryList } from '@/features/schedule/components';
import type { CounselingMemoData } from '@/features/schedule/components/CounselingMemoEditor';
import type { ObservationMemoData } from '@/features/schedule/components/ObservationMemoEditor';
import type { CounselingRecord, ObservationRecord } from '@/features/schedule/types';
import {
  SELFREG_FACTOR_DEFINITIONS,
  SELFREG_DOMAIN_COLORS,
  type SelfregCategory,
} from '@/shared/data/selfregFactors';

type ViewMode = 'round1' | 'round2' | 'compare';

interface SelfregStudentResultViewProps {
  /** 학생 결과 데이터 */
  result: StudentExamResult;
  /** 반 이름 */
  className: string;
  /** 뒤로가기 핸들러 */
  onBack: () => void;
  /** 이전/다음 학생 */
  prevStudent?: { id: string; name: string };
  nextStudent?: { id: string; name: string };
  /** 학생 이동 핸들러 */
  onNavigateStudent?: (studentId: string) => void;
}

// ============================================================
// Mock 데이터
// ============================================================

/** AI 총평 Mock - 자기조절학습검사용 */
const MOCK_AI_SUMMARY = {
  summary: '이 학생은 자기조절학습 역량이 전반적으로 양호한 편입니다. 동기전략 영역에서 학습 원동력과 정서조절 능력이 고르게 발달되어 있으며, 인지전략 영역의 메타인지 능력도 잘 갖추고 있습니다. 다만 행동전략 영역에서 시간관리와 노트하기 기술의 보완이 필요해 보입니다. 학습 계획 수립과 실행에 있어 구체적인 시간 배분 연습과 효과적인 노트 정리법 안내가 도움이 될 것입니다.',
  keywords: ['메타인지 강점', '시간관리 보완', '노트 정리법', '학습 계획'],
};

/**
 * Mock 학습 현황 생성 (types.ts의 LearningStatus, LEARNING_STATUS_LABELS 사용)
 *
 * 실제 설문 문항 (Q120~Q124):
 * 120. 내 학업 성적은 어느 정도인지 체크해 주세요.
 * 121. 나의 성적에 어느 정도 만족하는지 체크해 주세요.
 * 122. 다음 중 내가 공부하는 가장 중요한 이유 1가지를 체크해 주세요.
 * 123. 학교 다닐 때, 혼자 공부하는 시간(온라인 학습 제외)이 하루 평균 어느 정도인지 체크해 보세요.
 * 124. 공부와 관련된 고민이 있을 때, 가장 많이 상담하는 사람 1명을 체크해 주세요.
 */
const generateMockLearningStatus = (): LearningStatus => ({
  academicAchievement: 'mid',
  gradeSatisfaction: 'mid',
  learningMotivation: 'future',
  selfStudyTime: '1-2h',
  learningCounselor: 'family',
});

/** Mock 상담 기록 생성 */
const generateMockCounselingRecords = (studentId: string, studentName: string, classId: string, className: string): CounselingRecord[] => {
  const studentNum = parseInt(studentId.replace(/\D/g, ''), 10) || 1;
  if (studentNum % 3 === 0) return [];

  return [
    {
      id: `cr-${studentId}-1`,
      studentId, studentName, studentNumber: studentNum, classId, className,
      scheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      duration: 30, type: 'regular', area: 'academic', status: 'completed',
      reason: '자기조절학습 전략 상담',
      summary: '시간 관리와 학습 계획 수립에 대해 안내함. 주간 학습 계획표 작성 방법 연습.',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];
};

/** Mock 관찰 기록 생성 */
const generateMockObservationRecords = (studentId: string, studentName: string, classId: string, className: string): ObservationRecord[] => {
  const studentNum = parseInt(studentId.replace(/\D/g, ''), 10) || 1;
  if (studentNum % 4 === 0) return [];

  return [
    {
      id: `or-${studentId}-1`, studentId, studentName, studentNumber: studentNum, classId, className,
      category: 'academic',
      title: '자습 시간 관찰',
      content: '자습 시간에 계획표를 보며 공부하는 모습 확인. 집중력 향상됨.',
      observedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ];
};

// 영역별 색상 (자기조절학습검사용)
const DOMAIN_COLORS: Record<SelfregCategory, string> = SELFREG_DOMAIN_COLORS;

// 강점/보완점 카드 스타일
const ACCENT_STYLES = {
  emerald: {
    cardBg: 'rgba(16, 185, 129, 0.05)',
    cardBorder: '#a7f3d0',
    rank: '#10b981',
  },
  red: {
    cardBg: 'rgba(239, 68, 68, 0.05)',
    cardBorder: '#fecaca',
    rank: '#ef4444',
  },
} as const;

// 자기조절검사용 20개 요인 목업 T점수 생성
const generateSelfregScores = (comprehensiveTScores: number[]): number[] => {
  const mapping: Array<number | number[]> = [
    2, 1, [19, 20], 25, 26, [35, 36],
    7, 8, 9, [7, 8, 9], [0, 1], [19, 20, 21],
    22, [17, 18], [19, 21], 10, 11, 12, 13, 14,
  ];

  return mapping.map((source) => {
    if (typeof source === 'number') {
      const val = comprehensiveTScores[source] ?? 50;
      if ([25, 26].includes(source)) return Math.round(100 - val);
      return Math.round(val);
    } else {
      const avg = source.reduce((sum, i) => sum + (comprehensiveTScores[i] ?? 50), 0) / source.length;
      if (source.includes(35) || source.includes(36)) return Math.round(100 - avg);
      return Math.round(avg);
    }
  });
};

export const SelfregStudentResultView: React.FC<SelfregStudentResultViewProps> = ({
  result,
  className,
  onBack,
  prevStudent,
  nextStudent,
  onNavigateStudent,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('round1');
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);

  const hasRound2 = result.round === 2 && result.prevResult;
  const isCompare = viewMode === 'compare';

  // 현재 표시할 데이터 결정
  const currentData = viewMode === 'round1' && result.prevResult ? result.prevResult : result;
  const tScores = currentData.tScores;

  // 비교 모드용 이전 데이터
  const prevTScores = isCompare && result.prevResult ? result.prevResult.tScores : undefined;

  // 20개 요인으로 변환된 점수
  const selfregScores = useMemo(() => generateSelfregScores(tScores), [tScores]);
  const prevSelfregScores = useMemo(
    () => prevTScores ? generateSelfregScores(prevTScores) : undefined,
    [prevTScores]
  );

  // 개인 학습 현황
  const learningStatus = useMemo(() => generateMockLearningStatus(), []);

  // 강점/보완점 Top 3 계산 (20개 요인 기준 - 모두 positive)
  const { strengths, weaknesses } = useMemo(() => {
    if (!selfregScores || selfregScores.length === 0) return { strengths: [], weaknesses: [] };

    const factorsWithScores = SELFREG_FACTOR_DEFINITIONS.map((factor, idx) => ({
      ...factor,
      score: selfregScores[idx] || 50,
    }));

    // 모든 요인이 positive이므로 점수 높은 것 = 강점, 낮은 것 = 보완점
    const sorted = [...factorsWithScores].sort((a, b) => b.score - a.score);
    const strengthFactors = sorted.slice(0, 3);
    const weaknessFactors = sorted.slice(-3).reverse();

    return { strengths: strengthFactors, weaknesses: weaknessFactors };
  }, [selfregScores]);

  // 상담 기록 (Mock)
  const counselingRecords = useMemo(() => {
    const classNum = className.match(/(\d+)-(\d+)/)?.[2] || '1';
    const classId = `group-${classNum}`;
    return generateMockCounselingRecords(result.id, result.name, classId, className);
  }, [result.id, result.name, className]);

  // 관찰 기록 (Mock)
  const observationRecords = useMemo(() => {
    const classNum = className.match(/(\d+)-(\d+)/)?.[2] || '1';
    const classId = `group-${classNum}`;
    return generateMockObservationRecords(result.id, result.name, classId, className);
  }, [result.id, result.name, className]);

  // 상담 저장 핸들러
  const handleSaveCounseling = useCallback((data: CounselingMemoData) => {
    console.log('상담 저장:', data);
  }, []);

  // 관찰 저장 핸들러
  const handleSaveObservation = useCallback((data: ObservationMemoData) => {
    console.log('관찰 메모 저장:', data);
  }, []);

  // 응시일 포맷
  const formatDate = (date?: Date): string => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // 보고서 다운로드 핸들러
  const handleDownloadReport = (round: 1 | 2) => {
    alert(`${round}차 보고서 다운로드 기능은 프로토타입에서 구현되지 않았습니다.`);
    setReportDropdownOpen(false);
  };

  // 우측 컨텐츠: 학생 네비게이션 + 보고서 다운로드
  const rightContent = (
    <>
      {onNavigateStudent && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => prevStudent && onNavigateStudent(prevStudent.id)}
            disabled={!prevStudent}
            className="px-2.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ‹ 이전
          </button>
          <button
            onClick={() => nextStudent && onNavigateStudent(nextStudent.id)}
            disabled={!nextStudent}
            className="px-2.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            다음 ›
          </button>
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setReportDropdownOpen(!reportDropdownOpen)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          보고서 다운로드
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${reportDropdownOpen ? 'rotate-90' : ''}`} />
        </button>

        {reportDropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setReportDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2">
              <button
                onClick={() => handleDownloadReport(1)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
                1차 보고서
              </button>
              {hasRound2 && (
                <button
                  onClick={() => handleDownloadReport(2)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  2차 보고서
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {/* 1. 헤더 */}
      <div className="space-y-3">
        <StudentHeader
          studentNumber={result.number}
          studentName={result.name}
          className={className}
          onBack={onBack}
          rightContent={rightContent}
          showTypeBadge={false}
        />
        <div className="flex items-center gap-6 ml-14 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>1차 검사: {formatDate(result.assessedAt)}</span>
          </div>
          {hasRound2 && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>2차 검사: {formatDate(result.assessedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. AI 분석 총평 */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">AI 분석 총평</h3>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">{MOCK_AI_SUMMARY.summary}</p>
        <div className="flex flex-wrap gap-2">
          {MOCK_AI_SUMMARY.keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/70 border border-teal-200 rounded-full text-xs font-medium text-teal-700"
            >
              #{keyword}
            </span>
          ))}
        </div>
      </div>

      {/* 3. 회차 선택 탭 */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('round1')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'round1'
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          1차 검사
        </button>
        <button
          onClick={() => hasRound2 && setViewMode('round2')}
          disabled={!hasRound2}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'round2'
              ? 'bg-teal-600 text-white'
              : hasRound2
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          2차 검사 {!hasRound2 && '(예정)'}
        </button>
        {hasRound2 && (
          <button
            onClick={() => setViewMode('compare')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'compare'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            차수 변화
          </button>
        )}
      </div>

      {/* ================================================================ */}
      {/* 섹션 1: 학습 현황 */}
      {/* ================================================================ */}
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            1
          </div>
          <div className="w-px bg-gray-300 flex-1 my-2" />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">학습 현황</h2>
            <p className="text-xs text-gray-500">학생이 직접 응답한 학습 상황입니다</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-base font-semibold text-gray-900">개인 학습 현황</h3>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500">설문 응답</span>
            </div>
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">학업 성취도</p>
                <p className="text-sm font-semibold text-gray-900">
                  {LEARNING_STATUS_LABELS.academicAchievement[learningStatus.academicAchievement]}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">성적 만족도</p>
                <p className="text-sm font-semibold text-gray-900">
                  {LEARNING_STATUS_LABELS.gradeSatisfaction[learningStatus.gradeSatisfaction]}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">학습 동기</p>
                <p className="text-sm font-semibold text-gray-900">
                  {LEARNING_STATUS_LABELS.learningMotivation[learningStatus.learningMotivation]}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">혼자 공부 시간</p>
                <p className="text-sm font-semibold text-gray-900">
                  {LEARNING_STATUS_LABELS.selfStudyTime[learningStatus.selfStudyTime]}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">학습 고민 상담</p>
                <p className="text-sm font-semibold text-gray-900">
                  {LEARNING_STATUS_LABELS.learningCounselor[learningStatus.learningCounselor]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 섹션 2: 종합결과 (레이더 차트 + 도넛 차트) */}
      {/* ================================================================ */}
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            2
          </div>
          <div className="w-px bg-gray-300 flex-1 my-2" />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">종합결과</h2>
            <p className="text-xs text-gray-500">자기조절학습 관련 동기·인지·행동전략의 전체 수준을 확인합니다</p>
          </div>

          <SelfregOverviewChart
            studentName={result.name}
            selfregScores={selfregScores}
          />
        </div>
      </div>

      {/* ================================================================ */}
      {/* 섹션 3: 요인 분석 (20개 요인) */}
      {/* ================================================================ */}
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            3
          </div>
          <div className="w-px bg-gray-300 flex-1 my-2" />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">요인 분석</h2>
            <p className="text-xs text-gray-500">20개 자기조절학습 요인의 세부 점수를 분석합니다</p>
          </div>

          {/* 20개 요인 분석 */}
          <SelfregFactorAnalysis
            tScores={tScores}
            prevTScores={prevTScores}
            showCompare={isCompare}
          />

          {/* 강점/보완점 Top 3 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">강점 / 보완점 Top 3</h3>

            <div className="flex gap-6">
              {/* 강점 */}
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                  </span>
                  <h4 className="text-sm font-bold text-emerald-800">주요 강점</h4>
                </div>
                <div className="flex gap-2">
                  {strengths.map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 p-3 rounded-lg border"
                      style={{
                        backgroundColor: ACCENT_STYLES.emerald.cardBg,
                        borderColor: ACCENT_STYLES.emerald.cardBorder,
                      }}
                    >
                      <span
                        className="text-[11px] font-semibold inline-block mb-1"
                        style={{ color: DOMAIN_COLORS[item.category] || '#9CA3AF' }}
                      >
                        #{item.category}
                      </span>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="text-xs font-bold"
                          style={{ color: ACCENT_STYLES.emerald.rank }}
                        >
                          {index + 1}
                        </span>
                        <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.subCategory}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-px bg-gray-200 self-stretch" />

              {/* 보완점 */}
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-5 h-5 rounded bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-red-600" strokeWidth={2.5} />
                  </span>
                  <h4 className="text-sm font-bold text-red-800">주요 보완점</h4>
                </div>
                <div className="flex gap-2">
                  {weaknesses.map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 p-3 rounded-lg border"
                      style={{
                        backgroundColor: ACCENT_STYLES.red.cardBg,
                        borderColor: ACCENT_STYLES.red.cardBorder,
                      }}
                    >
                      <span
                        className="text-[11px] font-semibold inline-block mb-1"
                        style={{ color: DOMAIN_COLORS[item.category] || '#9CA3AF' }}
                      >
                        #{item.category}
                      </span>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="text-xs font-bold"
                          style={{ color: ACCENT_STYLES.red.rank }}
                        >
                          {index + 1}
                        </span>
                        <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.subCategory}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 섹션 4: 상담 & 관찰 (LPA 유형 섹션 없음) */}
      {/* ================================================================ */}
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            4
          </div>
          <div className="w-px bg-gray-300 flex-1 my-2" />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">상담 & 관찰</h2>
            <p className="text-xs text-gray-500">상담 기록과 관찰 메모를 작성하고 이력을 확인합니다</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <CounselingMemoEditor
                studentId={result.id}
                studentName={result.name}
                onSave={handleSaveCounseling}
              />
              <ObservationMemoEditor
                studentId={result.id}
                studentName={result.name}
                onSave={handleSaveObservation}
              />
            </div>

            <UnifiedHistoryList
              counselingRecords={counselingRecords}
              observationRecords={observationRecords}
              studentName={result.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfregStudentResultView;
