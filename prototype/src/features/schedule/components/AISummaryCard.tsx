/**
 * 학생 상담 - 학생 선택 - AI 분석 총평
 *
 * 종합 소견 (2-3문장) + 핵심 키워드
 */

import { Sparkles } from 'lucide-react';
import type { StudentCounselingSummary } from '../types';

interface AISummaryCardProps {
  summary: StudentCounselingSummary;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({ summary }) => {
  const aiSummary = summary.aiSummary || '분석 결과가 없습니다.';
  const keywords = summary.keywords || [];

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">AI 분석 총평</h3>
      </div>

      {/* 종합 소견 */}
      <p className="text-sm text-gray-700 leading-relaxed mb-4">{aiSummary}</p>

      {/* 핵심 키워드 */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/70 border border-indigo-200 rounded-full text-xs font-medium text-indigo-700"
            >
              #{keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AISummaryCard;
