/**
 * 학생 상담 - 학생 선택 - 학생 상담 요약 헤더
 *
 * 학생 기본 정보, 상담 통계, LPA 유형
 */

import { Calendar, MessageSquare, AlertTriangle } from 'lucide-react';
import type { StudentCounselingSummary } from '../types';

interface StudentCounselingSummaryCardProps {
  summary: StudentCounselingSummary;
}

/** LPA 유형별 색상 */
const LPA_COLORS: Record<string, string> = {
  '자원소진형': '#EF4444',
  '안전 균형형': '#10B981',
  '몰입자원 풍부형': '#3B82F6',
  '냉소적 무기력형': '#EF4444',
  '정서조절 취약형': '#F59E0B',
  '자기주도 몰입형': '#3B82F6',
};

export const StudentCounselingSummaryCard: React.FC<StudentCounselingSummaryCardProps> = ({
  summary,
}) => {
  const lpaColor = LPA_COLORS[summary.lpaType] || '#6B7280';

  // 날짜 포맷팅
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // 마지막 상담일로부터 경과 일수
  const getDaysSinceLastCounseling = (): number | null => {
    if (!summary.lastCounselingDate) return null;
    const now = new Date();
    const diff = now.getTime() - summary.lastCounselingDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const daysSince = getDaysSinceLastCounseling();

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        {/* 학생 정보 */}
        <div className="flex items-start gap-4">
          {/* 번호 배지 */}
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-700">{summary.studentNumber}</span>
          </div>

          {/* 기본 정보 */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{summary.studentName}</h2>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: lpaColor }}
              >
                {summary.lpaType}
              </span>
              {summary.needsAttention && (
                <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  관심 필요
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                마지막 상담: {formatDate(summary.lastCounselingDate)}
                {daysSince !== null && (
                  <span className={`ml-1 ${daysSince > 30 ? 'text-amber-600' : 'text-gray-400'}`}>
                    ({daysSince}일 전)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 상담 통계 */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
        {/* 총 상담 횟수 */}
        <div className="px-4 py-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">총 상담</p>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            {summary.totalCounselingCount}
            <span className="text-sm font-medium text-gray-500">회</span>
          </p>
        </div>

        {/* 이번 학기 */}
        <div className="px-4 py-3 bg-primary-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">이번 학기</p>
          <p className="text-lg font-bold text-primary-700">
            {summary.thisTermCount}
            <span className="text-sm font-medium text-primary-500 ml-1">회</span>
          </p>
        </div>

        {/* 주요 상담 영역 */}
        <div className="px-4 py-3 bg-indigo-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">주요 영역</p>
          <p className="text-sm font-medium text-indigo-700 truncate">
            {summary.mainCounselingArea || '-'}
          </p>
        </div>

        {/* 평균 T점수 */}
        <div className={`px-4 py-3 rounded-xl ${summary.avgTScore >= 50 ? 'bg-green-50' : 'bg-orange-50'}`}>
          <p className="text-xs text-gray-500 mb-1">평균 T점수</p>
          <p className={`text-lg font-bold ${summary.avgTScore >= 50 ? 'text-green-700' : 'text-orange-700'}`}>
            {summary.avgTScore.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentCounselingSummaryCard;
