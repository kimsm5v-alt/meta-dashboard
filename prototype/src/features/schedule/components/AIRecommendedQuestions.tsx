/**
 * 학생 상담 - 학생 선택 - AI 추천 질문
 *
 * 학생 상태 기반 AI 추천 질문 목록
 */

import { Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { RecommendedQuestion } from '../types';

interface AIRecommendedQuestionsProps {
  questions: RecommendedQuestion[];
  studentName: string;
}

export const AIRecommendedQuestions: React.FC<AIRecommendedQuestionsProps> = ({
  questions,
  studentName,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (question: string, index: number) => {
    try {
      await navigator.clipboard.writeText(question);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl border border-primary-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">AI 추천 질문</h3>
          <p className="text-xs text-gray-500">{studentName} 학생 맞춤 질문</p>
        </div>
      </div>

      {questions.length > 0 ? (
        <ul className="space-y-3">
          {questions.map((item, index) => (
            <li
              key={item.id}
              className="group flex items-start gap-3 p-3 bg-white/60 rounded-lg hover:bg-white transition-colors"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className="inline-block px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs rounded mb-1">
                  {item.category}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{item.question}</p>
                <p className="text-xs text-gray-500 mt-1">{item.purpose}</p>
              </div>
              <button
                onClick={() => handleCopy(item.question, index)}
                className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary-100 transition-all"
                title="복사하기"
              >
                {copiedIndex === index ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-6">
          <div className="animate-pulse flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <span className="text-primary-600">추천 질문을 생성 중입니다...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendedQuestions;
