import { useState, useEffect, useRef } from 'react';
import { MessageCircleQuestion, X, Sparkles } from 'lucide-react';
import { DataHelperQuestions } from './DataHelperQuestions';
import { DataHelperAnswer } from './DataHelperAnswer';
import { getDataHelperAnswer, type StudentData, type QuestionId } from '../services/dataHelperService';
import type { StudentType, SchoolLevel, FactorDeviation } from '@/shared/types';

interface DataHelperChatbotProps {
  tScores: number[];
  predictedType: StudentType;
  typeProbabilities: Record<string, number>;
  schoolLevel: SchoolLevel;
  deviations: FactorDeviation[];
}

const QUESTION_LABELS: Record<string, string> = {
  'diagnosis-1': '총평 상세히 알려줘',
  'diagnosis-2': '11개 요인에 대해 자세히 알려줘',
  'diagnosis-3': '이 학생의 강점은?',
  'diagnosis-4': '이 학생의 보완점은?',
  'type-1': '전체 유형별 특징 알려줘',
  'type-2': '이 학생의 유형 세부특성 알려줘',
  'type-3': '개인별 특성은 어떻게 알 수 있어?',
};

export const DataHelperChatbot: React.FC<DataHelperChatbotProps> = ({
  tScores,
  predictedType,
  typeProbabilities,
  schoolLevel,
  deviations,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 학생이 변경되면 캐시 초기화
  useEffect(() => {
    setAnswers({});
    setSelectedQuestion(null);
  }, [tScores, predictedType]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const fab = document.getElementById('data-helper-fab');
        if (fab && fab.contains(e.target as Node)) return;
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectQuestion = async (questionId: string) => {
    setSelectedQuestion(questionId);

    // 이미 캐시된 답변이 있으면 API 호출 안 함
    if (answers[questionId]) return;

    setLoading(true);
    try {
      const studentData: StudentData = {
        tScores,
        predictedType,
        typeProbabilities,
        schoolLevel,
        deviations,
      };
      const result = await getDataHelperAnswer(questionId as QuestionId, studentData);
      setAnswers(prev => ({ ...prev, [questionId]: result }));
    } catch {
      setAnswers(prev => ({
        ...prev,
        [questionId]: '답변을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedQuestion(null);
  };

  return (
    <>
      {/* FAB 버튼 */}
      <button
        id="data-helper-fab"
        onClick={() => setIsOpen(prev => !prev)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-primary-500 hover:bg-primary-600'
        }`}
        title="데이터 해석 도우미"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircleQuestion className="w-6 h-6 text-white" />
        )}
      </button>

      {/* 챗봇 창 */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-6 z-50 w-[420px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* 헤더 */}
          <div className="px-5 py-4 bg-primary-500 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold text-[15px]">데이터 해석 도우미</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedQuestion ? (
              <DataHelperAnswer
                question={QUESTION_LABELS[selectedQuestion] || ''}
                answer={answers[selectedQuestion] || ''}
                loading={loading && !answers[selectedQuestion]}
                onBack={handleBack}
              />
            ) : (
              <DataHelperQuestions
                onSelect={handleSelectQuestion}
                answeredQuestions={Object.keys(answers)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};
