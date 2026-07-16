/**
 * 결과보기 > 학생 - 학생 결과 화면
 *
 * 38개 요인 T점수 + 학습 유형 분류 표시
 * - ClassResultView에서 학생 클릭 시 표시
 * - 1차/2차/차수비교 모드 지원
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md - 화면 5번
 */

import { useState } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { StudentFactorAnalysis } from './StudentFactorAnalysis';
import { TypeClassification } from './TypeClassification';
import type { StudentExamResult } from '../types';
import { StudentHeader } from '@/shared/components';

type ViewMode = 'round1' | 'round2' | 'compare';

interface StudentResultViewProps {
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

export const StudentResultView: React.FC<StudentResultViewProps> = ({
  result,
  className,
  onBack,
  prevStudent,
  nextStudent,
  onNavigateStudent,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('round1');

  const hasRound2 = result.round === 2 && result.prevResult;
  const isCompare = viewMode === 'compare';

  // 현재 표시할 데이터 결정
  const currentData = viewMode === 'round1' && result.prevResult
    ? result.prevResult
    : result;

  const tScores = currentData.tScores;
  const predictedType = currentData.predictedType;
  const typeProbabilities = currentData.typeProbabilities;

  // 비교 모드용 이전 데이터
  const prevTScores = isCompare && result.prevResult ? result.prevResult.tScores : undefined;
  const prevType = isCompare && result.prevResult ? result.prevResult.predictedType : undefined;
  const prevTypeProbabilities = isCompare && result.prevResult ? result.prevResult.typeProbabilities : undefined;

  // 우측 컨텐츠: 학생 네비게이션 + 보고서 다운로드
  const rightContent = (
    <>
      {/* 학생 네비게이션 */}
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

      {/* 보고서 다운로드 */}
      <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
        <Download className="w-4 h-4" />
        보고서
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <StudentHeader
        studentNumber={result.number}
        studentName={result.name}
        lpaType={result.predictedType}
        className={className}
        onBack={onBack}
        rightContent={rightContent}
      />

      {/* 회차 선택 탭 */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('round1')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'round1'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          1차 검사
        </button>
        {hasRound2 && (
          <>
            <button
              onClick={() => setViewMode('round2')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'round2'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              2차 검사
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'compare'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              차수 변화
            </button>
          </>
        )}
      </div>

      {/* 관심 필요 안내 */}
      {result.needsAttention && result.attentionReason && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">관심 필요 학생</p>
            <p className="text-sm text-amber-700 mt-0.5">{result.attentionReason}</p>
          </div>
        </div>
      )}

      {/* 38개 요인 분석 */}
      <StudentFactorAnalysis
        tScores={tScores}
        prevTScores={prevTScores}
        showCompare={isCompare}
      />

      {/* 학습 유형 분류 */}
      <TypeClassification
        predictedType={predictedType}
        typeProbabilities={typeProbabilities}
        schoolLevel={result.schoolLevel}
        showCompare={isCompare}
        prevType={prevType}
        prevTypeProbabilities={prevTypeProbabilities}
      />
    </div>
  );
};

export default StudentResultView;
