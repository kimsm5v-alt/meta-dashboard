import { useState } from 'react';
import { Plus, Send, X, Users } from 'lucide-react';
import { MessageList } from '../components/MessageList';
import { TargetPicker, type TargetSelection } from '../components/TargetPicker';
import { emptySelection, hasTarget, targetChips, targetLabel } from '../utils/targets';
import type { ChatMessage } from '../types';

interface AssistantChatTabProps {
  title: string;
  messages: ChatMessage[];
  isTyping: boolean;
  onSend: (text: string, targets?: string) => void;
}

/** B-3. 탭 1 — AI 대화 */
export const AssistantChatTab: React.FC<AssistantChatTabProps> = ({ title, messages, isTyping, onSend }) => {
  const [input, setInput] = useState('');
  const [selection, setSelection] = useState<TargetSelection>(emptySelection());
  const [pickerOpen, setPickerOpen] = useState(false);

  const hasConversation = messages.length > 0;
  const chips = targetChips(selection);

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, hasTarget(selection) ? targetLabel(selection) : undefined);
    setInput('');
  };

  const handleInputChange = (v: string) => {
    // @ 멘션: 입력 시 피커 열고 @ 제거 (B-3)
    if (v.endsWith('@')) {
      setPickerOpen(true);
      setInput(v.slice(0, -1));
      return;
    }
    setInput(v);
  };

  const removeChip = (studentId?: string) => {
    if (!studentId) {
      setSelection((s) => ({ ...s, wholeClass: false, studentIds: [] }));
    } else {
      setSelection((s) => ({
        ...s,
        wholeClass: false,
        studentIds: s.studentIds.filter((id) => id !== studentId),
      }));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 대화 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-6 py-6">
          {!hasConversation ? (
            <div className="text-center py-16">
              <h2 className="text-[22px] font-bold text-gray-900">무엇을 도와드릴까요?</h2>
              <p className="text-[14px] text-gray-400 mt-2">
                대상을 고르면 해당 학급·학생 기준으로 답합니다. 궁금한 점을 입력해 보세요.
              </p>
            </div>
          ) : (
            <MessageList messages={messages} isTyping={isTyping} variant="page" />
          )}
        </div>
      </div>

      {/* 하단 컴포저 */}
      <div className="border-t border-gray-100 bg-white">
        <div className="max-w-[760px] mx-auto px-6 py-4">
          {/* 대상 칩 + ＋대상 */}
          <div className="relative flex flex-wrap items-center gap-1.5 mb-2">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-white bg-primary-500 hover:bg-primary-600 px-3 py-1.5 rounded-full"
            >
              <Plus className="w-3.5 h-3.5" />
              대상
            </button>
            {chips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 text-[12.5px] text-primary-700 bg-primary-50 border border-primary-200 px-2.5 py-1.5 rounded-full"
              >
                <Users className="w-3 h-3" />
                {chip.label}
                <button onClick={() => removeChip(chip.studentId)} className="text-primary-400 hover:text-primary-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {!hasTarget(selection) && (
              <span className="text-[12px] text-gray-400 ml-1">
                대상을 고르면 해당 학급·학생 기준으로 답합니다 (선택)
              </span>
            )}
            {pickerOpen && (
              <TargetPicker
                selection={selection}
                onChange={setSelection}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </div>

          {/* 입력창 */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-200 focus-within:border-primary-300">
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              rows={1}
              placeholder={`${title}에 이어서 질문하거나 @로 대상을 지정하세요`}
              className="flex-1 min-w-0 bg-transparent text-[14px] leading-6 outline-none resize-none max-h-32 placeholder:text-gray-400"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-gray-200 text-white flex items-center justify-center flex-shrink-0 transition-colors"
              title="전송"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
