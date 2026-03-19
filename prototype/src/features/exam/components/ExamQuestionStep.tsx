import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { ExamProgress } from './ExamProgress';
import { QuestionRow } from './QuestionRow';
import type { ExamQuestion } from '../types';

interface ExamQuestionStepProps {
  questions: ExamQuestion[];
  currentPage: number;
  totalPages: number;
  answeredCount: number;
  totalQuestions: number;
  answers: Record<number, string>;
  savingQuestionNo: number | null;
  onAnswer: (questionNo: number, answer: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSubmit: () => void;
  isLastPage: boolean;
  isSubmitting: boolean;
}

export const ExamQuestionStep: React.FC<ExamQuestionStepProps> = ({
  questions,
  currentPage,
  totalPages,
  answeredCount,
  totalQuestions,
  answers,
  savingQuestionNo,
  onAnswer,
  onPrevPage,
  onNextPage,
  onSubmit,
  isLastPage,
  isSubmitting,
}) => {
  // 현재 페이지의 모든 문항이 응답되었는지 확인
  const allCurrentPageAnswered = questions.every((q) => answers[q.NO]);

  // 마지막 페이지에서 제출 가능 여부:
  // - 현재 페이지 모든 문항 응답 완료
  // - 응답 수가 총 문항 수 이상 (API의 fullCount가 부정확할 수 있음)
  const canSubmit = allCurrentPageAnswered && (answeredCount >= totalQuestions || answeredCount >= 124);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 진행률 헤더 */}
      <ExamProgress
        currentPage={currentPage}
        totalPages={totalPages}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
      />

      {/* 문항 목록 */}
      <div className="flex-1 py-4 px-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {questions.map((question) => (
            <QuestionRow
              key={question.NO}
              questionNo={question.NO}
              questionText={question.QESITM_NM}
              selectedValue={answers[question.NO] || ''}
              onSelect={(value) => onAnswer(question.NO, value)}
              isSaving={savingQuestionNo === question.NO}
            />
          ))}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentPage === 0 || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            이전
          </button>

          {isLastPage ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  제출 중...
                </>
              ) : (
                <>
                  제출하기
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextPage}
              disabled={!allCurrentPageAnswered || isSubmitting}
              className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              다음
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 미응답 안내 */}
        {!allCurrentPageAnswered && (
          <p className="text-center text-sm text-amber-600 mt-2">
            모든 문항에 응답해야 다음으로 넘어갈 수 있습니다.
          </p>
        )}
      </div>
    </div>
  );
};
