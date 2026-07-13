/**
 * 학생 상담 - 학생 선택 - 학생 요약 (상단)
 *
 * 번호, 이름, LPA 유형, 검사 회차, 응시일, 상담 이유 태그
 */

import { Calendar, FileText, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import type { StudentCounselingSummary, CounselingReasonTag } from '../types';
import { COUNSELING_REASON_TAG_LABELS, COUNSELING_REASON_TAG_COLORS } from '../types';

interface StudentCounselingHeaderProps {
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

/** 태그 컴포넌트 */
const ReasonTag: React.FC<{ tag: CounselingReasonTag }> = ({ tag }) => {
  const colors = COUNSELING_REASON_TAG_COLORS[tag];
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
      {COUNSELING_REASON_TAG_LABELS[tag]}
    </span>
  );
};

/** 날짜 포맷팅 */
const formatDate = (date: Date | null | undefined): string => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const StudentCounselingHeader: React.FC<StudentCounselingHeaderProps> = ({ summary }) => {
  const lpaColor = LPA_COLORS[summary.lpaType] || '#6B7280';

  // 신뢰도 주의 여부 확인
  const hasReliabilityWarning = summary.reasonTags?.includes('reliability') ||
    (summary.reliability && summary.reliability.consistencyIndex < 0.7);

  // 상담 우선 여부 확인
  const needsPriorityCounseling = summary.needsAttention ||
    summary.reasonTags?.includes('burden') ||
    summary.reasonTags?.includes('obstacle');

  // 강점 활용 가능 여부 확인
  const hasStrength = summary.reasonTags?.includes('strength');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start gap-5">
        {/* 번호 배지 */}
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-gray-700">{summary.studentNumber}</span>
        </div>

        {/* 학생 정보 */}
        <div className="flex-1">
          {/* 이름 + LPA 유형 + 상태 배지 */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">{summary.studentName}</h2>
            <span
              className="px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: lpaColor }}
            >
              {summary.lpaType}
            </span>

            {/* 상태 배지들 */}
            {needsPriorityCounseling && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                상담 우선
              </span>
            )}
            {hasReliabilityWarning && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                <AlertCircle className="w-3.5 h-3.5" />
                신뢰도 주의
              </span>
            )}
            {hasStrength && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                <Sparkles className="w-3.5 h-3.5" />
                강점 활용
              </span>
            )}
          </div>

          {/* 검사 정보 */}
          <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>{summary.round || 1}차 검사</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>응시일: {formatDate(summary.assessedAt)}</span>
            </span>
          </div>

          {/* 상담 이유 태그 */}
          {summary.reasonTags && summary.reasonTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {summary.reasonTags.map((tag) => (
                <ReasonTag key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCounselingHeader;
