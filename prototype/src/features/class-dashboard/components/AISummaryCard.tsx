/**
 * 결과보기 - AI 총평 카드
 *
 * AI 생성 분석 요약
 */

import { Sparkles } from 'lucide-react';

interface AISummaryCardProps {
  summary: string | undefined;
  studentName: string;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  summary,
  studentName,
}) => {
  return (
    <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl border border-primary-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">AI 분석 총평</h3>
      </div>

      {summary ? (
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="animate-pulse flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <span className="text-primary-600">{studentName} 학생의 검사 결과를 분석 중입니다...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISummaryCard;
