import { useRef, useEffect } from 'react';
import { Bot, User, Sparkles } from 'lucide-react';
import type { ChatMessage, StudentAliasMap } from '../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  aliasMap: StudentAliasMap;
  isLoading?: boolean;
}

// student_A, student_B 등을 실제 이름으로 치환
const replaceAliases = (content: string, aliasMap: StudentAliasMap): string => {
  let result = content;
  Object.entries(aliasMap).forEach(([alias, name]) => {
    const regex = new RegExp(alias, 'g');
    result = result.replace(regex, name);
  });
  return result;
};

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, aliasMap, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        const displayContent =
          msg.role === 'assistant'
            ? replaceAliases(msg.content, aliasMap)
            : msg.content;

        return (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* 아바타 */}
            <div className="relative flex-shrink-0">
              {msg.role === 'user' ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* 메시지 */}
            <div
              className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-900 rounded-tl-sm'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1 mb-2 text-xs text-primary-500 font-medium">
                  <Sparkles className="w-3 h-3" />
                  <span>AI 분석</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {displayContent}
              </p>
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-md flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
            <div className="flex items-center gap-1 mb-2 text-xs text-primary-500 font-medium">
              <Sparkles className="w-3 h-3" />
              <span>분석 중...</span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
              <span
                className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              />
              <span
                className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
