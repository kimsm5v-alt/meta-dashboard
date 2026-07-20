import { useEffect, useRef } from 'react';
import { Info, Scissors, Users } from 'lucide-react';
import { RaonAvatar } from '@/shared/components';
import { Markdown } from './Markdown';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessage } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  isTyping?: boolean;
  /** 'floating': 봇 전체폭 블록 / 'page': 봇 아바타 + 카드 */
  variant?: 'floating' | 'page';
}

/** 참고용 배지 */
const ReferenceBadge = () => (
  <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-400">
    <Info className="w-3 h-3" />
    <span>AI 분석 · 참고용</span>
  </div>
);

/** 대상 / 캡처 표기 (사용자 메시지 위) */
const MessageMeta: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  if (!msg.targets && !msg.hasCapture) return null;
  return (
    <div className="flex items-center justify-end gap-2 mb-1">
      {msg.targets && (
        <span className="inline-flex items-center gap-1 text-[11px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
          <Users className="w-3 h-3" />
          {msg.targets}
        </span>
      )}
      {msg.hasCapture && (
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          <Scissors className="w-3 h-3" />
          캡처 포함
        </span>
      )}
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ messages, isTyping, variant = 'floating' }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isTyping]);

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        if (msg.role === 'user') {
          return (
            <div key={msg.id}>
              <MessageMeta msg={msg} />
              <div className="flex justify-end">
                <div className="max-w-[78%] bg-primary-500 text-white text-[13.5px] leading-relaxed px-3.5 py-2.5 rounded-[14px_14px_4px_14px] whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        }

        // bot
        if (variant === 'page') {
          return (
            <div key={msg.id} className="flex gap-3">
              <RaonAvatar state="answering" variant="head" size={34} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-4 py-3">
                <Markdown content={msg.content} />
                {msg.isReference && <ReferenceBadge />}
              </div>
            </div>
          );
        }
        // floating: 전체폭 블록
        return (
          <div key={msg.id} className="-mx-4 px-4 py-3 bg-[#FAFAFD] border-y border-gray-100">
            <Markdown content={msg.content} />
            {msg.isReference && <ReferenceBadge />}
          </div>
        );
      })}

      {isTyping && (
        <div className={variant === 'page' ? 'flex gap-3 items-center' : '-mx-4 px-4 py-3'}>
          {variant === 'page' && <RaonAvatar state="thinking" variant="head" size={34} className="flex-shrink-0" />}
          <TypingIndicator />
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
};
