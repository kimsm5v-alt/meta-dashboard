import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  Scissors,
  Send,
  X,
  LayoutGrid,
  Maximize2,
  PanelRight,
  Minus,
  ArrowRight,
  Monitor,
  Image as ImageIcon,
} from 'lucide-react';
import aiOwl from '@/assets/raon/ai-owl-icon.png';
import { MessageList } from '../MessageList';
import { CaptureOverlay, type CaptureData } from './CaptureOverlay';
import { Toast } from './Toast';
import { askAssistant } from '../../services/assistantService';
import { useScreenContext } from '../../utils/useScreenContext';
import { conversationStore } from '../../utils/conversationStore';
import { nextId } from '../../utils/id';
import type { ChatMessage, ChatbotViewMode, SuggestedQuestion } from '../../types';

const CORNER_MIN_W = 388;
const CORNER_MIN_H = 240;
const GNB_H = 58;

interface Geo {
  x: number;
  y: number;
  width: number;
  height: number;
}

const initialGeo = (): Geo => {
  const width = CORNER_MIN_W;
  const height = Math.max(CORNER_MIN_H, window.innerHeight - GNB_H - 36);
  return {
    width,
    height,
    x: window.innerWidth - width - 24,
    y: GNB_H + 12,
  };
};

type DragSession =
  | { type: 'move'; mx: number; my: number; geo: Geo }
  | { type: 'resize-top'; mx: number; my: number; geo: Geo }
  | { type: 'resize-left'; mx: number; my: number; geo: Geo }
  | null;

interface FloatingChatbotProps {
  /** LNB에서 학생이 선택되었는지 (결과보기·학생상담의 학생 단위 추천 질문 노출) */
  studentSelected?: boolean;
}

/**
 * A. 플로팅 챗봇
 * 서비스 화면 위에 떠서 현재 화면 맥락으로 질문하는 어시스턴트.
 * 4가지 보기 모드(버블/입력바/코너/전체화면) · 이동·리사이즈 · 화면 캡처 질문.
 */
export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ studentSelected = false }) => {
  const { screenLabel, questions } = useScreenContext(studentSelected);

  const [view, setView] = useState<ChatbotViewMode>('bubble');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [geo, setGeo] = useState<Geo>(initialGeo);
  const [modeOpen, setModeOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [capture, setCapture] = useState<CaptureData | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dragRef = useRef<DragSession>(null);
  // 히스토리 공유용: 현재 챗봇 세션이 저장된 conversation id
  const chatbotConvIdRef = useRef<string | null>(null);
  const hasConversation = messages.length > 0;

  // ── 드래그 / 리사이즈 (코너 모드) ────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const s = dragRef.current;
      if (!s) return;
      const dx = e.clientX - s.mx;
      const dy = e.clientY - s.my;
      if (s.type === 'move') {
        const x = Math.min(Math.max(0, s.geo.x + dx), window.innerWidth - s.geo.width);
        const y = Math.min(Math.max(GNB_H, s.geo.y + dy), window.innerHeight - 80);
        setGeo((g) => ({ ...g, x, y }));
      } else if (s.type === 'resize-top') {
        // 하단 고정
        const bottom = s.geo.y + s.geo.height;
        const height = Math.max(CORNER_MIN_H, bottom - (s.geo.y + dy));
        const y = bottom - height;
        setGeo((g) => ({ ...g, y, height }));
      } else if (s.type === 'resize-left') {
        // 우측 고정
        const right = s.geo.x + s.geo.width;
        const width = Math.max(CORNER_MIN_W, right - (s.geo.x + dx));
        const x = right - width;
        setGeo((g) => ({ ...g, x, width }));
      }
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startDrag = (type: NonNullable<DragSession>['type']) => (e: React.MouseEvent) => {
    if (view !== 'corner') return;
    // 헤더 버튼 위에서는 드래그 시작하지 않음
    if (type === 'move' && (e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = { type, mx: e.clientX, my: e.clientY, geo };
    document.body.style.userSelect = 'none';
  };

  // ── ESC로 캡처/전체화면 취소 ────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (capturing) setCapturing(false);
      else if (modeOpen) setModeOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [capturing, modeOpen]);

  // ── 전송 ───────────────────────────────────────────────────
  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: ChatMessage = {
        id: nextId('u'),
        role: 'user',
        content: trimmed,
        hasCapture: capture ? true : undefined,
      };
      setMessages((prev) => [...prev, userMsg]);

      // 히스토리 저장 (어시스턴트 페이지와 공유) — 첫 질문 시 화면 태그로 대화 생성
      let convId = chatbotConvIdRef.current;
      if (convId == null) {
        convId = nextId('cf');
        chatbotConvIdRef.current = convId;
        const title = trimmed.length > 22 ? `${trimmed.slice(0, 22)}…` : trimmed;
        conversationStore.update((prev) => [
          { id: convId as string, title, group: '오늘', screen: screenLabel, messages: [userMsg] },
          ...prev,
        ]);
      } else {
        conversationStore.update((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, userMsg] } : c)),
        );
      }

      setInput('');
      setCapture(null);
      // 버블/입력바에서 전송 시 코너로 전환
      setView((v) => (v === 'bubble' || v === 'inputbar' ? 'corner' : v));
      setIsTyping(true);

      const res = await askAssistant(trimmed, screenLabel);
      const botMsg: ChatMessage = { id: nextId('b'), role: 'bot', content: res.content, isReference: res.isReference };
      setMessages((prev) => [...prev, botMsg]);
      conversationStore.update((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, botMsg] } : c)),
      );
      setIsTyping(false);
    },
    [capture, isTyping, screenLabel],
  );

  const handleCaptureComplete = (data: CaptureData) => {
    setCapturing(false);
    setCapture(data);
    setView((v) => (v === 'bubble' || v === 'inputbar' ? 'corner' : v));
  };

  const closeToButtonBubble = () => {
    setView('bubble');
    setModeOpen(false);
    // 세션 종료: 히스토리에는 이미 저장됨. 로컬 대화는 비워 다음 열림 시 새로 시작
    setMessages([]);
    setInput('');
    setCapture(null);
    chatbotConvIdRef.current = null;
  };

  // ── 렌더 ───────────────────────────────────────────────────
  return (
    <>
      <Keyframes />

      {/* 래퍼: pointer-events none → 호스트 화면 클릭 허용 (F-2) */}
      <div className="fixed inset-0 z-[80] pointer-events-none">
        {view === 'bubble' && (
          <button
            onClick={() => setView('corner')}
            className="pointer-events-auto absolute right-6 bottom-6 w-[52px] h-[52px] rounded-[14px] bg-primary-500 hover:bg-primary-600 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-[1.06]"
            title="AI 어시스턴트"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        )}

        {view === 'inputbar' && (
          <InputBar
            value={input}
            onChange={setInput}
            onSend={() => send(input)}
            onCapture={() => setCapturing(true)}
            onExpand={() => setView('corner')}
            onClose={closeToButtonBubble}
          />
        )}

        {(view === 'corner' || view === 'fullscreen') && (
          <ChatPanel
            view={view}
            geo={geo}
            screenLabel={screenLabel}
            questions={questions}
            messages={messages}
            isTyping={isTyping}
            input={input}
            capture={capture}
            hasConversation={hasConversation}
            modeOpen={modeOpen}
            onInput={setInput}
            onSend={send}
            onCapture={() => setCapturing(true)}
            onToggleMode={() => setModeOpen((v) => !v)}
            onSelectMode={(m) => {
              setView(m);
              setModeOpen(false);
            }}
            onClose={closeToButtonBubble}
            onClearCapture={() => setCapture(null)}
            startDrag={startDrag}
          />
        )}
      </div>

      {capturing && (
        <CaptureOverlay onComplete={handleCaptureComplete} onCancel={() => setCapturing(false)} />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
};

// ============================================================
// 입력바 모드
// ============================================================
interface InputBarProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onCapture: () => void;
  onExpand: () => void;
  onClose: () => void;
}
const InputBar: React.FC<InputBarProps> = ({ value, onChange, onSend, onCapture, onExpand, onClose }) => (
  <div
    className="pointer-events-auto absolute right-6 bottom-6 w-[388px] bg-white rounded-[14px] shadow-xl border border-gray-200 flex items-center gap-1.5 pl-3 pr-2 py-2 animate-[airoom-slideup_0.28s_cubic-bezier(0.16,1,0.3,1)]"
  >
    <img src={aiOwl} alt="AI 어시스턴트" className="w-[26px] h-[26px] object-contain flex-shrink-0" />
    <button
      onClick={onCapture}
      className="p-1.5 rounded-lg text-primary-500 bg-primary-50 hover:bg-primary-100 flex-shrink-0"
      title="화면 캡처해서 질문"
    >
      <Scissors className="w-[17px] h-[17px]" />
    </button>
    <input
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSend()}
      placeholder="화면에 대해 물어보세요"
      className="flex-1 min-w-0 text-[13.5px] outline-none placeholder:text-gray-400"
    />
    <button
      onClick={onSend}
      className="w-7 h-7 rounded-lg bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center flex-shrink-0"
      title="전송"
    >
      <Send className="w-3.5 h-3.5" />
    </button>
    <button onClick={onExpand} className="p-1.5 text-gray-400 hover:text-gray-600" title="패널 열기">
      <LayoutGrid className="w-[17px] h-[17px]" />
    </button>
    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600" title="닫기">
      <X className="w-[17px] h-[17px]" />
    </button>
  </div>
);

// ============================================================
// 코너 / 전체화면 패널
// ============================================================
interface ChatPanelProps {
  view: ChatbotViewMode;
  geo: Geo;
  screenLabel: string;
  questions: SuggestedQuestion[];
  messages: ChatMessage[];
  isTyping: boolean;
  input: string;
  capture: CaptureData | null;
  hasConversation: boolean;
  modeOpen: boolean;
  onInput: (v: string) => void;
  onSend: (text: string) => void;
  onCapture: () => void;
  onToggleMode: () => void;
  onSelectMode: (m: ChatbotViewMode) => void;
  onClose: () => void;
  onClearCapture: () => void;
  startDrag: (type: 'move' | 'resize-top' | 'resize-left') => (e: React.MouseEvent) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  view,
  geo,
  screenLabel,
  questions,
  messages,
  isTyping,
  input,
  capture,
  hasConversation,
  modeOpen,
  onInput,
  onSend,
  onCapture,
  onToggleMode,
  onSelectMode,
  onClose,
  onClearCapture,
  startDrag,
}) => {
  const isFull = view === 'fullscreen';

  // 이미 물어본 추천 질문은 "이어서 물어보기"에서 제외
  const askedTexts = new Set(messages.filter((m) => m.role === 'user').map((m) => m.content));
  const remainingQuestions = questions.filter((q) => !askedTexts.has(q.text));

  const panelStyle: React.CSSProperties = isFull
    ? {}
    : { left: geo.x, top: geo.y, width: geo.width, height: geo.height };

  const panel = (
    <div
      className={`pointer-events-auto bg-white border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-[airoom-slideup_0.28s_cubic-bezier(0.16,1,0.3,1)] ${
        isFull ? 'w-[min(920px,92vw)] h-[94vh] rounded-[18px]' : 'fixed rounded-2xl'
      }`}
      style={panelStyle}
    >
      {/* 리사이즈 핸들 (코너 전용) */}
      {!isFull && (
        <>
          <div
            onMouseDown={startDrag('resize-top')}
            className="absolute top-0 left-2.5 right-2.5 h-1.5 cursor-ns-resize z-20"
          />
          <div
            onMouseDown={startDrag('resize-left')}
            className="absolute left-0 top-2.5 bottom-2.5 w-1.5 cursor-ew-resize z-20"
          />
        </>
      )}

      {/* 헤더 (코너: 드래그 핸들) */}
      <div
        onMouseDown={startDrag('move')}
        className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0 relative ${
          isFull ? '' : 'cursor-move'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <img src={aiOwl} alt="AI 어시스턴트" className="w-7 h-7 object-contain flex-shrink-0" />
          <span className="text-[14px] font-bold text-gray-900 flex-shrink-0">AI 어시스턴트</span>
          <span
            className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-primary-600 bg-primary-50 border border-primary-100 px-2 py-[3px] rounded-full max-w-[120px]"
            title={`현재 화면: ${screenLabel}`}
          >
            <Monitor className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{screenLabel}</span>
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onToggleMode}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            title="보기 모드"
          >
            <LayoutGrid className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            title="닫기"
          >
            <X className="w-[18px] h-[18px]" />
          </button>

          {/* 모드 선택 팝오버 (헤더 아래, overflow 대응 F-1) */}
          {modeOpen && <ModePopover current={view} onSelect={onSelectMode} />}
        </div>
      </div>

      {/* 본문 */}
      <div className={`flex-1 overflow-y-auto ${isFull ? 'px-0' : 'px-4'} py-4`}>
        <div className={isFull ? 'max-w-[760px] mx-auto px-4' : ''}>
          {!hasConversation ? (
            <EmptyState questions={questions} onPick={onSend} onCapture={onCapture} />
          ) : (
            <MessageList messages={messages} isTyping={isTyping} variant="floating" />
          )}
        </div>
      </div>

      {/* 컴포저 */}
      <div className={`border-t border-gray-100 flex-shrink-0 ${isFull ? 'px-0' : ''}`}>
        <div className={isFull ? 'max-w-[760px] mx-auto w-full' : ''}>
          {hasConversation && remainingQuestions.length > 0 && (
            <FollowUpPills questions={remainingQuestions} onPick={onSend} />
          )}
          <Composer
            input={input}
            capture={capture}
            onInput={onInput}
            onSend={() => onSend(input)}
            onCapture={onCapture}
            onClearCapture={onClearCapture}
          />
        </div>
      </div>
    </div>
  );

  if (isFull) {
    return (
      <div className="pointer-events-auto fixed inset-0 flex items-start justify-center pt-[3vh] animate-[airoom-fadein_0.2s_ease]" style={{ background: 'rgba(28,22,58,0.42)' }}>
        {panel}
      </div>
    );
  }
  return panel;
};

// ============================================================
// 빈 화면 (empty state) - 세로 리스트
// ============================================================
const EmptyState: React.FC<{
  questions: SuggestedQuestion[];
  onPick: (t: string) => void;
  onCapture: () => void;
}> = ({ questions, onPick, onCapture }) => (
  <div>
    <div className="text-center mb-5 mt-2">
      <img src={aiOwl} alt="AI 어시스턴트" className="w-16 h-16 mx-auto mb-3 object-contain" />
      <h3 className="text-[16px] font-bold text-gray-900">무엇이 궁금하세요?</h3>
      <p className="text-[13px] text-gray-400 mt-1">화면의 데이터에 대해 물어보세요</p>
    </div>

    {/* 화면 캡처 질문 - 강조 CTA */}
    <button
      onClick={onCapture}
      className="group w-full flex items-center gap-3 px-3.5 py-3 mb-3 rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-primary-50/40 hover:from-primary-100 hover:to-primary-50 transition-colors"
    >
      <span className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Scissors className="w-[18px] h-[18px] text-white" />
      </span>
      <span className="flex-1 text-left min-w-0">
        <span className="block text-[13px] font-bold text-primary-700">화면 캡처해서 질문하기</span>
        <span className="block text-[11px] text-gray-500 break-keep">궁금한 영역을 드래그하면 그 부분을 짚어 답해드려요</span>
      </span>
      <ArrowRight className="w-4 h-4 flex-shrink-0 text-primary-400 group-hover:translate-x-0.5 transition-transform" />
    </button>

    <div className="flex items-center gap-2 my-3">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[10.5px] text-gray-400">또는 추천 질문</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>

    <div className="space-y-2">
      {questions.map((q) => (
        <button
          key={q.text}
          onClick={() => onPick(q.text)}
          className="group w-full min-h-[58px] flex items-center gap-3 text-left px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/60 transition-colors"
        >
          <span className="text-[15px] flex-shrink-0">{q.emoji}</span>
          <span className="flex-1 text-[13px] leading-[1.45] text-gray-700 group-hover:text-primary-700 break-keep">
            {q.text}
          </span>
          <ArrowRight className="w-4 h-4 flex-shrink-0 text-gray-300 group-hover:text-primary-400" />
        </button>
      ))}
    </div>
  </div>
);

// ============================================================
// 이어서 물어보기 - 가로 스크롤 알약 칩
// ============================================================
const FollowUpPills: React.FC<{ questions: SuggestedQuestion[]; onPick: (t: string) => void }> = ({
  questions,
  onPick,
}) => (
  <div className="px-4 pt-3">
    <div className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">이어서 물어보기</div>
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      {questions.map((q) => (
        <button
          key={q.text}
          onClick={() => onPick(q.text)}
          className="flex-shrink-0 whitespace-nowrap text-[12px] text-gray-600 bg-gray-100 hover:bg-primary-50 hover:text-primary-600 px-3 py-1.5 rounded-full transition-colors"
        >
          {q.emoji} {q.text.length > 18 ? `${q.text.slice(0, 18)}…` : q.text}
        </button>
      ))}
    </div>
  </div>
);

// ============================================================
// 컴포저 (입력창)
// ============================================================
interface ComposerProps {
  input: string;
  capture: CaptureData | null;
  onInput: (v: string) => void;
  onSend: () => void;
  onCapture: () => void;
  onClearCapture: () => void;
}
const Composer: React.FC<ComposerProps> = ({ input, capture, onInput, onSend, onCapture, onClearCapture }) => {
  // 선택 영역 비율에 맞춘 썸네일 폭 (높이 44 고정, 40~92 clamp)
  const thumbW = capture ? Math.round(Math.min(92, Math.max(40, 44 * (capture.w / capture.h)))) : 0;

  return (
    <div className="p-3">
      {/* 캡처 첨부 미리보기 카드 */}
      {capture && (
        <div className="flex items-center gap-2.5 mb-2 p-1.5 pr-2 bg-white border border-primary-200 rounded-xl w-fit max-w-full shadow-sm">
          <div
            className="relative rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200/70 border border-primary-200 flex-shrink-0"
            style={{ height: 44, width: thumbW }}
          >
            <ImageIcon className="w-4 h-4 text-primary-500/80" />
            <span className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-0.5 bg-black/45 text-white text-[8px] py-px">
              <Scissors className="w-2 h-2" /> 캡처
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-primary-700">화면 캡처 첨부됨</div>
            <div className="text-[11px] text-gray-500">
              {capture.w}×{capture.h}px 영역
            </div>
          </div>
          <button
            onClick={onClearCapture}
            className="ml-1 p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 flex-shrink-0"
            title="첨부 제거"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-primary-300">
        {!capture && (
          <button
            onClick={onCapture}
            className="flex items-center gap-1 text-[11.5px] font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2 py-1 rounded-lg flex-shrink-0 self-end mb-0.5"
            title="화면 캡처해서 질문"
          >
            <Scissors className="w-3.5 h-3.5" />
            캡처
          </button>
        )}
        <textarea
          value={input}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={1}
          placeholder={capture ? '이 영역에 대해 무엇이 궁금하세요?' : '메시지를 입력하세요'}
          className="flex-1 min-w-0 bg-transparent text-[13.5px] outline-none resize-none max-h-24 py-1 placeholder:text-gray-400"
        />
        <button
          onClick={onSend}
          className="w-8 h-8 rounded-lg bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center flex-shrink-0"
          title="전송"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// 모드 선택 팝오버 (버블 제외)
// ============================================================
const ModePopover: React.FC<{ current: ChatbotViewMode; onSelect: (m: ChatbotViewMode) => void }> = ({
  current,
  onSelect,
}) => {
  const modes: { key: ChatbotViewMode; label: string; icon: React.ReactNode }[] = [
    { key: 'inputbar', label: '입력바', icon: <Minus className="w-4 h-4" /> },
    { key: 'corner', label: '코너 패널', icon: <PanelRight className="w-4 h-4" /> },
    { key: 'fullscreen', label: '전체화면', icon: <Maximize2 className="w-4 h-4" /> },
  ];
  return (
    <div className="absolute top-full right-0 mt-1 w-[150px] bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-30">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => onSelect(m.key)}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-gray-50 ${
            current === m.key ? 'text-primary-600 font-semibold' : 'text-gray-600'
          }`}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================
// 스코프 keyframes (shared globals 미수정)
// ============================================================
const Keyframes = () => (
  <style>{`
    @keyframes airoom-slideup { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
    @keyframes airoom-fadein { from { opacity:0; } to { opacity:1; } }
    @keyframes airoom-toast { from { opacity:0; transform: translate(-50%, 10px); } to { opacity:1; transform: translate(-50%, 0); } }
  `}</style>
);
