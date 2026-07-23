/**
 * 결과보기 - 반 전체 종합 결과 요약 카드
 *
 * 반 평균 T점수, 응시 현황, 주요 지표
 */

import { Users, TrendingUp, AlertTriangle } from 'lucide-react';
import type { ClassResultSummary } from '../types';

interface ClassSummaryCardProps {
  summary: ClassResultSummary;
}

export const ClassSummaryCard: React.FC<ClassSummaryCardProps> = ({ summary }) => {
  const assessmentRate = Math.round((summary.assessedCount / summary.totalCount) * 100);

  // 평균 T점수 등급
  const getTScoreLevel = (score: number) => {
    if (score >= 60) return { label: '높음', color: 'text-green-600' };
    if (score >= 40) return { label: '보통', color: 'text-gray-600' };
    return { label: '낮음', color: 'text-red-600' };
  };

  const scoreLevel = getTScoreLevel(summary.avgTScore);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{summary.className} 종합 결과</h2>
          <p className="text-sm text-gray-500 mt-1">{summary.round}차 검사 · META 학습심리정서검사</p>
        </div>
        <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
          응시 완료
        </span>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 응시 현황 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">응시 현황</p>
            <p className="text-xl font-bold text-gray-900">
              {summary.assessedCount} / {summary.totalCount}명
              <span className="text-sm font-medium text-gray-500 ml-2">({assessmentRate}%)</span>
            </p>
          </div>
        </div>

        {/* 평균 T점수 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">반 평균 T점수</p>
            <p className="text-xl font-bold text-gray-900">
              {summary.avgTScore.toFixed(1)}
              <span className={`text-sm font-medium ml-2 ${scoreLevel.color}`}>
                ({scoreLevel.label})
              </span>
            </p>
          </div>
        </div>

        {/* 관심 필요 학생 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">관심 필요 학생</p>
            <p className="text-xl font-bold text-gray-900">
              {summary.riskStudents.filter(s => s.type === 'attention').length}명
              <span className="text-sm font-medium text-gray-500 ml-2">
                (신뢰도 주의 {summary.riskStudents.filter(s => s.type === 'reliability').length}명)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassSummaryCard;
