/**
 * AI 어시스턴트 페이지 (B) — 전체화면 단독 페이지
 * - 상단바: 로고 · 현재 대화 제목 · 대시보드로 돌아가기
 * - 좌측 LNB(240px): ＋새 대화 · 모드(AI 대화/생활기록부) · 대화 히스토리
 * - 본문: AI 대화 / 생활기록부 작성 탭
 * @see FEATURES 복사본.md - B
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, FileText, ArrowLeft, MessageCircle } from 'lucide-react';
import serviceLogo from '@/assets/logo_2.png';
import { AssistantChatTab } from './AssistantChatTab';
import { SchoolRecordTab } from './SchoolRecordTab';
import { askAssistant } from '../services/assistantService';
import { nextId } from '../utils/id';
import type { AssistantMode, ChatMessage, Conversation } from '../types';

const SEED_CONVERSATIONS: Conversation[] = [
  { id: 'c1', title: '우리 반 전체 경향 요약', group: '오늘', messages: [] },
  { id: 'c2', title: '고우진 코칭 전략 문의', group: '지난 7일', messages: [] },
  { id: 'c3', title: '학부모 상담 화법 정리', group: '이전', messages: [] },
];

const GROUP_ORDER: Conversation['group'][] = ['오늘', '지난 7일', '이전'];
const NEW_TITLE = '새 대화';
const truncate = (s: string, n = 22) => (s.length > n ? `${s.slice(0, n)}…` : s);

export const AIRoomPage = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>('c1');
  const [mode, setMode] = useState<AssistantMode>('chat');
  const [isTyping, setIsTyping] = useState(false);

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];

  const grouped = useMemo(() => {
    return GROUP_ORDER.map((g) => ({
      group: g,
      items: conversations.filter((c) => c.group === g),
    })).filter((x) => x.items.length > 0);
  }, [conversations]);

  // ＋ 새 대화 — 비어있는 "새 대화"가 있으면 재사용 (B-2)
  const handleNewConversation = () => {
    setMode('chat');
    const emptyNew = conversations.find((c) => c.title === NEW_TITLE && c.messages.length === 0);
    if (emptyNew) {
      setActiveId(emptyNew.id);
      return;
    }
    const conv: Conversation = { id: nextId('c'), title: NEW_TITLE, group: '오늘', messages: [] };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setMode('chat');
  };

  const handleSend = async (text: string, targets?: string) => {
    const userMsg: ChatMessage = { id: nextId('u'), role: 'user', content: text, targets };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeId) return c;
        const isFirst = c.messages.length === 0;
        return {
          ...c,
          title: isFirst && c.title === NEW_TITLE ? truncate(text) : c.title,
          messages: [...c.messages, userMsg],
        };
      }),
    );
    setIsTyping(true);

    const res = await askAssistant(text, targets);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, { id: nextId('b'), role: 'bot', content: res.content, isReference: res.isReference }] }
          : c,
      ),
    );
    setIsTyping(false);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* 상단바 (56px) */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img src={serviceLogo} alt="학습심리정서검사" className="h-5" />
          <div className="w-px h-4 bg-gray-200" />
          <span className="text-[14px] font-bold text-gray-800">AI 어시스턴트</span>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          대시보드로
        </button>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* 좌측 LNB (240px) */}
        <aside className="w-[240px] flex-shrink-0 bg-[#FAFAFD] border-r border-gray-200 flex flex-col">
          {/* ＋ 새 대화 */}
          <div className="p-3">
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center gap-2 text-[13.5px] font-semibold text-primary-600 bg-white border border-primary-200 hover:bg-primary-50 rounded-xl px-3 py-2.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 대화
            </button>
          </div>

          {/* 모드 내비 */}
          <nav className="px-3 space-y-1">
            <ModeButton
              active={mode === 'chat'}
              icon={<MessageSquare className="w-[18px] h-[18px]" />}
              label="AI 대화"
              onClick={() => setMode('chat')}
            />
            <ModeButton
              active={mode === 'record'}
              icon={<FileText className="w-[18px] h-[18px]" />}
              label="생활기록부 작성"
              onClick={() => setMode('record')}
            />
          </nav>

          <div className="border-t border-gray-200 mx-3 my-3" />

          {/* 대화 히스토리 */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {grouped.map(({ group, items }) => (
              <div key={group} className="mb-3">
                <div className="text-[11px] font-bold text-gray-400 tracking-wide px-2 mb-1">{group}</div>
                <ul className="space-y-0.5">
                  {items.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => handleSelectConversation(c.id)}
                        className={`w-full flex items-center gap-2 text-left px-2 py-2 rounded-lg text-[13px] transition-colors ${
                          activeId === c.id && mode === 'chat'
                            ? 'bg-primary-100 text-primary-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                        <span className="truncate">{c.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* 본문 */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* 현재 대화 제목 바 (50px) */}
          <div className="h-[50px] flex-shrink-0 flex items-center gap-2 px-6 border-b border-gray-100">
            {mode === 'chat' ? (
              <>
                <MessageSquare className="w-4 h-4 text-primary-500" />
                <span className="text-[14px] font-semibold text-gray-800">{active.title}</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-primary-500" />
                <span className="text-[14px] font-semibold text-gray-800">생활기록부 작성</span>
              </>
            )}
          </div>

          <div className="flex-1 min-h-0">
            {mode === 'chat' ? (
              <AssistantChatTab
                key={active.id}
                title={active.title}
                messages={active.messages}
                isTyping={isTyping}
                onSend={handleSend}
              />
            ) : (
              <SchoolRecordTab />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const ModeButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({
  active,
  icon,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] transition-colors ${
      active ? 'bg-primary-100 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {icon}
    {label}
  </button>
);
