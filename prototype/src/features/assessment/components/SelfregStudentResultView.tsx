/**
 * 자기조절학습검사 > 결과보기 > 학생 결과 화면
 *
 * 레이아웃:
 * 1. 학습 현황 (설문 응답)
 * 2. 종합결과 (레이더 차트 + 탭 테이블)
 * 3. 종합 해석 (프로파일 테이블)
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md
 */

import { useState, useMemo, useCallback } from 'react';
import { Sparkles, Calendar, FileText, ChevronRight } from 'lucide-react';
import { SelfregOverviewChart } from './SelfregOverviewChart';
import { SrlProfileTable } from './SrlProfileTable';
import type { StudentExamResult, LearningStatus } from '../types';
import { LEARNING_STATUS_LABELS } from '../types';
import { StudentHeader } from '@/shared/components';

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
 */
const generateMockLearningStatus = (): LearningStatus => ({
  academicAchievement: 'mid',
  gradeSatisfaction: 'mid',
  learningMotivation: 'future',
  selfStudyTime: '1-2h',
  learningCounselor: 'family',
});

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

  // 1차 점수 (prevResult가 있으면 prevResult, 없으면 현재 result)
  const round1Scores = useMemo(() => {
    const round1TScores = result.prevResult ? result.prevResult.tScores : result.tScores;
    return generateSelfregScores(round1TScores);
  }, [result]);

  // 2차 점수 (prevResult가 있으면 현재 result가 2차)
  const round2Scores = useMemo(() => {
    if (hasRound2) {
      return generateSelfregScores(result.tScores);
    }
    return undefined;
  }, [result, hasRound2]);

  // sessions 배열 구성
  const sessions = useMemo(() => {
    const arr = [{ round: 1, scores: round1Scores }];
    if (round2Scores) {
      arr.push({ round: 2, scores: round2Scores });
    }
    return arr;
  }, [round1Scores, round2Scores]);

  // 개인 학습 현황
  const learningStatus = useMemo(() => generateMockLearningStatus(), []);

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
  const handleDownloadReport = useCallback((round: 1 | 2) => {
    alert(`${round}차 보고서 다운로드 기능은 프로토타입에서 구현되지 않았습니다.`);
    setReportDropdownOpen(false);
  }, []);

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
      {/* 헤더 */}
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

      {/* AI 분석 총평 */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">AI 분석 총평</h2>
          </div>
          <p className="text-xs text-gray-500 ml-8">AI가 분석한 학습 특성 요약입니다</p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-100 p-6">
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
      </section>

      {/* 회차 선택 탭 */}
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
      </div>

      {/* ================================================================ */}
      {/* 섹션 1: 학습 현황 */}
      {/* ================================================================ */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            <h2 className="text-lg font-bold text-gray-900">학습 현황</h2>
          </div>
          <p className="text-xs text-gray-500 ml-8">학생이 직접 응답한 학습 상황입니다</p>
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
      </section>

      {/* ================================================================ */}
      {/* 섹션 2: 종합결과 (레이더 차트 + 탭 테이블) */}
      {/* ================================================================ */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            <h2 className="text-lg font-bold text-gray-900">종합 결과</h2>
          </div>
          <p className="text-xs text-gray-500 ml-8">자기조절학습 관련 동기·인지·행동전략의 전체 수준을 확인합니다</p>
        </div>

        <SelfregOverviewChart
          studentName={result.name}
          selfregScores={selfregScores}
        />
      </section>

      {/* ================================================================ */}
      {/* 섹션 3: 종합 해석 (프로파일 테이블) */}
      {/* ================================================================ */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            <h2 className="text-lg font-bold text-gray-900">종합 해석</h2>
          </div>
          <p className="text-xs text-gray-500 ml-8">전체 요인의 T점수를 선형 눈금으로 비교합니다</p>
        </div>

        <SrlProfileTable
          selfregScores={round1Scores}
          sessions={sessions}
          viewMode={viewMode === 'round2' ? 'round2' : 'round1'}
        />
      </section>
    </div>
  );
};

export default SelfregStudentResultView;
