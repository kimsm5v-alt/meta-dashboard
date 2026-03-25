import { ArrowLeft, Sparkles } from 'lucide-react';

interface DataHelperAnswerProps {
  question: string;
  answer: string;
  loading: boolean;
  onBack: () => void;
}

/**
 * 간단한 마크다운 렌더러
 * 볼드(**), 리스트(-), 소제목(###), 줄바꿈 처리
 */
const renderMarkdown = (content: string): React.ReactNode => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let keyIdx = 0;

  const formatInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const key = keyIdx++;

    if (!trimmed) {
      elements.push(<div key={key} className="h-2" />);
      continue;
    }

    // ### 소제목
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={key} className="text-sm font-bold text-primary-600 mt-3 mb-1">
          {formatInline(trimmed.slice(4))}
        </h4>
      );
      continue;
    }

    // ## 소제목
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={key} className="text-[15px] font-bold text-primary-600 mt-4 mb-1.5">
          {formatInline(trimmed.slice(3))}
        </h3>
      );
      continue;
    }

    // 숫자 리스트 (1. 2. 3.)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      elements.push(
        <div key={key} className="flex gap-2 ml-1 my-0.5">
          <span className="text-xs font-semibold text-primary-500 mt-0.5 flex-shrink-0 w-4 text-right">{numMatch[1]}.</span>
          <span className="text-sm text-gray-700 leading-relaxed">{formatInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // 불릿 리스트
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const indent = line.search(/\S/);
      const level = Math.floor(indent / 2);
      const text = trimmed.slice(2);
      elements.push(
        <div key={key} className="flex gap-2 my-0.5" style={{ marginLeft: `${level * 12}px` }}>
          <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-400" />
          <span className="text-sm text-gray-700 leading-relaxed">{formatInline(text)}</span>
        </div>
      );
      continue;
    }

    // 일반 텍스트
    elements.push(
      <p key={key} className="text-sm text-gray-700 leading-relaxed my-0.5">
        {formatInline(trimmed)}
      </p>
    );
  }

  return elements;
};

export const DataHelperAnswer: React.FC<DataHelperAnswerProps> = ({
  question,
  answer,
  loading,
  onBack,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* 질문 헤더 */}
      <div className="flex items-start gap-2 pb-3 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </button>
        <p className="text-sm font-semibold text-gray-800 leading-snug">{question}</p>
      </div>

      {/* 답변 영역 */}
      <div className="flex-1 overflow-y-auto pt-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            <p className="text-sm text-gray-500">AI가 분석 중입니다...</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-1 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-medium text-primary-500">AI 분석</span>
            </div>
            <div className="space-y-0">
              {renderMarkdown(answer)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
