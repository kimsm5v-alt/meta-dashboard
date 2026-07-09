import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { getDataHelperAnswer, type StudentData, type QuestionId } from '../services/dataHelperService';
import type { StudentType, SchoolLevel, FactorDeviation } from '@/shared/types';

interface AIHelperPanelProps {
  tScores: number[];
  predictedType: StudentType;
  typeProbabilities: Record<string, number>;
  schoolLevel: SchoolLevel;
  deviations: FactorDeviation[];
}

// 추천 질문 칩
const SUGGESTION_CHIPS = [
  { id: 'diagnosis-1', label: '총평 상세히 알려줘' },
  { id: 'diagnosis-2', label: '11개 요인에 대해 자세히 알려줘' },
  { id: 'diagnosis-3', label: '이 학생의 강점은?' },
  { id: 'diagnosis-4', label: '이 학생의 보완점은?' },
  { id: 'type-1', label: '전체 유형별 특징 알려줘' },
  { id: 'type-2', label: '이 학생의 유형 세부특성 알려줘' },
  { id: 'type-3', label: '개인별 특성은 어떻게 알 수 있어?' },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export const AIHelperPanel: React.FC<AIHelperPanelProps> = ({
  tScores,
  predictedType,
  typeProbabilities,
  schoolLevel,
  deviations,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: '안녕하세요! 이 학생의 검사 데이터를 기반으로 답변해 드립니다. 아래 추천 질문을 누르거나 직접 입력해 보세요.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // 학생이 변경되면 대화 초기화
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text: '안녕하세요! 이 학생의 검사 데이터를 기반으로 답변해 드립니다. 아래 추천 질문을 누르거나 직접 입력해 보세요.',
      },
    ]);
    setInput('');
  }, [tScores, predictedType]);

  // 메시지 추가 시 스크롤
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text: string, questionId?: string) => {
    if (!text.trim() || loading) return;

    // 사용자 메시지 추가
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const studentData: StudentData = {
        tScores,
        predictedType,
        typeProbabilities,
        schoolLevel,
        deviations,
      };

      // questionId가 있으면 해당 질문으로 API 호출, 없으면 자유 입력 처리
      const qId = questionId || findMatchingQuestionId(text);
      const result = qId
        ? await getDataHelperAnswer(qId as QuestionId, studentData)
        : `"${text}"에 대한 분석입니다. 현재 자유 입력은 미리 정의된 질문만 지원됩니다. 추천 질문을 선택해 주세요.`;

      setMessages((prev) => [...prev, { role: 'assistant', text: result }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '답변을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 자유 입력이 기존 질문과 매칭되는지 확인
  const findMatchingQuestionId = (text: string): string | null => {
    const normalized = text.toLowerCase().replace(/\s+/g, '');
    for (const chip of SUGGESTION_CHIPS) {
      const chipNormalized = chip.label.toLowerCase().replace(/\s+/g, '');
      if (normalized.includes(chipNormalized) || chipNormalized.includes(normalized)) {
        return chip.id;
      }
    }
    return null;
  };

  const handleChipClick = (chip: { id: string; label: string }) => {
    sendMessage(chip.label, chip.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 메시지 영역 */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 px-4 py-3 rounded-xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 추천 질문 칩 */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => handleChipClick(chip)}
              disabled={loading}
              className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="px-4 py-2 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="이 학생에 대해 질문해보세요..."
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIHelperPanel;
