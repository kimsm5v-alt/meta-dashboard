/**
 * 결과보기 - 학생 요약 (상단)
 *
 * 이름, 번호, LPA 유형, 검사일, 주요 지표 요약
 */

import { Calendar, AlertTriangle, MessageSquare, Lightbulb } from 'lucide-react';
import type { StudentResult } from '../types';
import { LPA_TYPE_COLORS } from '../types';

interface StudentSummaryHeaderProps {
  student: StudentResult;
  onCounselingClick: () => void;
  onCoachingClick: () => void;
}

export const StudentSummaryHeader: React.FC<StudentSummaryHeaderProps> = ({
  student,
  onCounselingClick,
  onCoachingClick,
}) => {
  const typeColor = LPA_TYPE_COLORS[student.lpaType];

  // 날짜 포맷팅
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // T점수 등급
  const getTScoreLevel = (score: number) => {
    if (score >= 60) return { label: '높음', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 40) return { label: '보통', color: 'text-gray-600', bg: 'bg-gray-50' };
    return { label: '낮음', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const scoreLevel = getTScoreLevel(student.avgTScore);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        {/* 학생 정보 */}
        <div className="flex items-start gap-4">
          {/* 번호 배지 */}
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-700">{student.number}</span>
          </div>

          {/* 기본 정보 */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: typeColor }}
              >
                {student.lpaType}
              </span>
              {student.needsAttention && (
                <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  관심 필요
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(student.assessedAt)} ({student.round}차 검사)
              </span>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCounselingClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium rounded-xl transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            상담하기
          </button>
          <button
            onClick={onCoachingClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-xl transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            코칭 전략
          </button>
        </div>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
        {/* 평균 T점수 */}
        <div className={`px-4 py-3 rounded-xl ${scoreLevel.bg}`}>
          <p className="text-xs text-gray-500 mb-1">평균 T점수</p>
          <p className={`text-lg font-bold ${scoreLevel.color}`}>
            {student.avgTScore.toFixed(1)}
            <span className="text-sm font-medium ml-1">({scoreLevel.label})</span>
          </p>
        </div>

        {/* 강점 요인 */}
        <div className="px-4 py-3 bg-green-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">강점 요인</p>
          <p className="text-sm font-medium text-green-700 truncate">
            {student.strengths[0]?.name || '-'}
          </p>
        </div>

        {/* 보완 요인 */}
        <div className="px-4 py-3 bg-orange-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">보완 필요</p>
          <p className="text-sm font-medium text-orange-700 truncate">
            {student.weaknesses[0]?.name || '-'}
          </p>
        </div>

        {/* 신뢰도 */}
        <div className={`px-4 py-3 rounded-xl ${student.reliabilityWarnings.length > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
          <p className="text-xs text-gray-500 mb-1">검사 신뢰도</p>
          <p className={`text-sm font-medium ${student.reliabilityWarnings.length > 0 ? 'text-amber-700' : 'text-green-700'}`}>
            {student.reliabilityWarnings.length > 0 ? '주의 필요' : '양호'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentSummaryHeader;
