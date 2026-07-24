/**
 * AI 어시스턴트 페이지 (B) — GNB 유지, 전체폭 렌더 (LayoutV2 content 영역)
 * - 좌측 LNB(240px): ＋새 대화 · 모드(AI 대화/생활기록부) · 대화 히스토리(제목편집·삭제·화면배지)
 * - 본문: AI 대화 / 생활기록부 작성 탭, 대화 내용 내보내기
 * - 히스토리는 플로팅 챗봇과 공유 (conversationStore)
 * @see FEATURES 복사본.md - B
 */
import { useMemo, useState } from 'react';
import { Plus, MessageSquare, FileText, MessageCircle, MoreVertical, Pencil, Trash2, Download, Monitor } from 'lucide-react';
import { AssistantChatTab } from './AssistantChatTab';
import { SchoolRecordView } from '../schoolRecord/SchoolRecordView';
import { askAssistant } from '../services/assistantService';
import { nextId } from '../utils/id';
import { conversationStore, useConversations } from '../utils/conversationStore';
import type { AssistantMode, ChatMessage, Conversation } from '../types';

const GROUP_ORDER: Conversation['group'][] = ['오늘', '지난 7일', '이전'];
const NEW_TITLE = '새 대화';
const truncate = (s: string, n = 22) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** 대화 내용을 마크다운 텍스트로 변환 */
const buildExport = (conv: Conversation): string => {
  const lines = [`# ${conv.title}`, ''];
  if (conv.screen) lines.push(`_질의 화면: ${conv.screen}_`, '');
  conv.messages.forEach((m) => {
    lines.push(m.role === 'user' ? '## 질문' : '## 답변');
    if (m.targets) lines.push(`> 대상: ${m.targets}`, '');
    lines.push(m.content, '');
  });
  return lines.join('\n');
};
const sanitizeFilename = (s: string) => s.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 50) || 'conversation';

/** 화면 배지 (플로팅 챗봇에서 시작된 대화의 질의 화면 표시) */
const ScreenBadge: React.FC<{ screen: string; className?: string }> = ({ screen, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1 text-[10px] font-semibold text-primary-600 bg-primary-50 border border-primary-100 px-1.5 py-px rounded-full flex-shrink-0 ${className}`}
    title={`질의 화면: ${screen}`}
  >
    <Monitor className="w-2.5 h-2.5 flex-shrink-0" />
    {screen}
  </span>
);

export const AIRoomPage = () => {
  const conversations = useConversations();
  const setConversations = conversationStore.update;

  const [activeId, setActiveId] = useState<string>('c1');
  const [mode, setMode] = useState<AssistantMode>('chat');
  const [isTyping, setIsTyping] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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

  // 제목 편집
  const startEdit = (c: Conversation) => {
    setEditingId(c.id);
    setEditValue(c.title);
    setMenuId(null);
  };
  const commitEdit = () => {
    if (editingId) {
      const v = editValue.trim();
      if (v) setConversations((prev) => prev.map((c) => (c.id === editingId ? { ...c, title: v } : c)));
    }
    setEditingId(null);
  };

  // 대화 삭제
  const handleDelete = (id: string) => {
    setMenuId(null);
    const next = conversations.filter((c) => c.id !== id);
    if (next.length === 0) {
      const fresh: Conversation = { id: nextId('c'), title: NEW_TITLE, group: '오늘', messages: [] };
      setConversations([fresh]);
      setActiveId(fresh.id);
      setMode('chat');
      return;
    }
    setConversations(next);
    if (activeId === id) setActiveId(next[0].id);
  };

  // 대화 내용 내보내기 (.md 다운로드)
  const handleExport = () => {
    if (!active || active.messages.length === 0) return;
    const blob = new Blob([buildExport(active)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(active.title)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
    <div className="flex flex-col h-full bg-white">
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
                  {items.map((c) => {
                    const isActive = activeId === c.id && mode === 'chat';
                    if (editingId === c.id) {
                      return (
                        <li key={c.id}>
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitEdit();
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                              }
                            }}
                            className="w-full text-[13px] px-2 py-[7px] rounded-lg border border-primary-300 outline-none bg-white"
                          />
                        </li>
                      );
                    }
                    return (
                      <li key={c.id} className="relative">
                        <div
                          className={`group flex items-center rounded-lg ${
                            isActive ? 'bg-primary-100' : 'hover:bg-gray-100'
                          }`}
                        >
                          <button
                            onClick={() => handleSelectConversation(c.id)}
                            className={`flex-1 min-w-0 flex items-center gap-2 text-left px-2 py-2 text-[13px] ${
                              isActive ? 'text-primary-700 font-semibold' : 'text-gray-600'
                            }`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                            <span className="truncate">{c.title}</span>
                          </button>
                          <button
                            onClick={() => setMenuId((v) => (v === c.id ? null : c.id))}
                            className={`p-1 mr-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 flex-shrink-0 transition-opacity ${
                              menuId === c.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            title="더보기"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {menuId === c.id && (
                          <div className="absolute right-1 top-full z-30 mt-0.5 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                            <button
                              onClick={() => startEdit(c)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              제목 편집
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              삭제
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* 본문 */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* 현재 대화 제목 바 (50px) */}
          <div className="h-[50px] flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-100">
            <div className="flex items-center gap-2 min-w-0">
              {mode === 'chat' ? (
                <>
                  <MessageSquare className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span className="text-[14px] font-semibold text-gray-800 truncate">{active.title}</span>
                  {active.screen && <ScreenBadge screen={active.screen} />}
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span className="text-[14px] font-semibold text-gray-800">생활기록부 작성</span>
                </>
              )}
            </div>
            {mode === 'chat' && (
              <button
                onClick={handleExport}
                disabled={active.messages.length === 0}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-600 hover:text-primary-600 border border-gray-200 hover:border-primary-300 px-2.5 py-1.5 rounded-lg disabled:opacity-40 disabled:hover:text-gray-600 disabled:hover:border-gray-200 transition-colors flex-shrink-0"
                title="대화 내용 내보내기"
              >
                <Download className="w-3.5 h-3.5" />
                내보내기
              </button>
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
              <SchoolRecordView />
            )}
          </div>
        </main>
      </div>

      {/* 더보기 메뉴 바깥 클릭 닫기 */}
      {menuId && <div className="fixed inset-0 z-20" onClick={() => setMenuId(null)} />}
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
