/* HSJ Dashboard — Drawer Shell + Provider + Hook
 * Manages a single right-side overlay drawer that any page can summon
 * via useDrawer().openStudent(...) — no full-page nav.
 */

const { useState: useStateD, useEffect: useEffectD, useCallback: useCallbackD, useMemo: useMemoD, useRef: useRefD } = React;

const DrawerContext = React.createContext(null);
window.__DrawerContext = DrawerContext;
window.useDrawer = function useDrawer() { return React.useContext(DrawerContext); };

function DrawerProvider({ children }) {
  // shape: { kind: 'student'|'ai'|'tool', studentInfo?: {...}, toolId? }
  const [state, setState] = useStateD(null);

  const openStudent = useCallbackD((info) => {
    setState({ kind: 'student', studentInfo: info });
  }, []);
  const openAI = useCallbackD((seed) => {
    setState({ kind: 'ai', seed });
  }, []);
  const openTool = useCallbackD((toolId) => {
    setState({ kind: 'tool', toolId });
  }, []);
  const close = useCallbackD(() => setState(null), []);

  // Navigate between siblings
  const navigate = useCallbackD((dir) => {
    setState(prev => {
      if (!prev || prev.kind !== 'student') return prev;
      const sibs = prev.studentInfo.siblings || [];
      const idx = sibs.findIndex(s => s.num === prev.studentInfo.num && s.classId === prev.studentInfo.classId);
      if (idx < 0) return prev;
      const nextIdx = (idx + dir + sibs.length) % sibs.length;
      const next = sibs[nextIdx];
      return { ...prev, studentInfo: { ...prev.studentInfo, classId: next.classId, num: next.num } };
    });
  }, []);

  // Keyboard handlers
  useEffectD(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (state.kind === 'student') {
        if (e.key === 'ArrowLeft') { navigate(-1); }
        if (e.key === 'ArrowRight') { navigate(1); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, close, navigate]);

  // Push main content when a non-modal side panel is open
  useEffectD(() => {
    const nonModal = state && (state.kind === 'tool' || state.kind === 'ai');
    document.body.classList.toggle('has-side-panel', !!nonModal);
    return () => document.body.classList.remove('has-side-panel');
  }, [state]);

  return (
    <DrawerContext.Provider value={{ open: state, openStudent, openAI, openTool, close, navigate }}>
      {children}
      <DrawerHost state={state} close={close} navigate={navigate} />
    </DrawerContext.Provider>
  );
}

function DrawerHost({ state, close, navigate }) {
  if (!state) return null;
  const nonModal = state.kind === 'tool' || state.kind === 'ai';
  return (
    <>
      {!nonModal && <div className="drawer-backdrop" onClick={close}></div>}
      <aside className={'drawer ' + (state.kind === 'student' ? 'drawer--student' : 'drawer--ai') + (nonModal ? ' drawer--panel' : '')}>
        {state.kind === 'student' && (
          <StudentDrawer studentInfo={state.studentInfo} close={close} navigate={navigate} />
        )}
        {state.kind === 'ai' && (
          <AIDrawer seed={state.seed} close={close} />
        )}
        {state.kind === 'tool' && (
          <ToolDrawer toolId={state.toolId} close={close} />
        )}
      </aside>
    </>
  );
}

/* ============ Tool meta ============ */
const FAB_TOOLS = [
  { id: 'note',    label: '관찰 메모', icon: '📝', color: '#3498DB' },
  { id: 'consult', label: '상담',     icon: '💬', color: '#2ECC71' },
  { id: 'record',  label: '생기부',   icon: '📋', color: '#F39C12' },
  { id: 'ai',      label: 'AI 챗봇',  icon: '✨', color: '#9D53E1' },
];

/* ============ Tool Drawer (관찰 메모 / 상담 / 생기부 / AI) ============ */
function ToolDrawer({ toolId, close }) {
  const [tab, setTab] = useStateD(toolId || 'note');
  const tabs = [
    { id: 'ai', label: 'AI 챗봇', icon: '✨' },
    { id: 'note', label: '관찰', icon: '👁' },
    { id: 'consult', label: '상담', icon: '💬' },
    { id: 'record', label: '생기부', icon: '📋' },
  ];
  return (
    <>
      <div className="tool-panel__head">
        <div className="tool-panel__tabs">
          {tabs.map(t => (
            <button key={t.id}
              className={'tool-panel__tab' + (tab === t.id ? ' is-active' : '')}
              onClick={() => setTab(t.id)}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <button className="iconbtn tool-panel__close" onClick={close}>✕</button>
      </div>
      <div className="drawer__body">
        {tab === 'ai' && <AIChatBody />}
        {tab !== 'ai' && <QuickToolBody toolId={tab} key={tab} />}
      </div>
    </>
  );
}

/* AI 데이터 해석 도우미 — 대화창 + 추천 질문 칩 */
function AIChatBody() {
  const CHIPS = [
    '총평 상세히 알려줘',
    '11개 요인에 대해 자세히 알려줘',
    '이 학생의 강점은?',
    '이 학생의 보완점은?',
    '전체 유형별 특징 알려줘',
    '이 학생의 유형 세부특성 알려줘',
    '개인별 특성은 어떻게 알 수 있어?',
  ];
  const [messages, setMessages] = useStateD([
    { role: 'assistant', text: '안녕하세요! 이 학생의 검사 데이터를 기반으로 답변해 드립니다. 아래 추천 질문을 누르거나 직접 입력해 보세요.' },
  ]);
  const [input, setInput] = useStateD('');
  const [loading, setLoading] = useStateD(false);
  const bodyRef = useRefD(null);

  useEffectD(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading]);

  const send = (txt) => {
    if (!txt.trim()) return;
    setMessages(m => [...m, { role: 'user', text: txt }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: 'assistant', text: `"${txt}"에 대한 분석입니다. (목업) 학생의 검사 결과를 바탕으로 한 상세 해석이 여기에 표시됩니다.` }]);
      setLoading(false);
    }, 700);
  };

  return (
    <div className="aichat">
      <div className="aichat__body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={'chat__msg chat__msg--' + m.role}>
            {m.role === 'assistant' && <span className="chat__avatar">✨</span>}
            <div className="chat__bubble">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="chat__msg chat__msg--assistant">
            <span className="chat__avatar">✨</span>
            <div className="chat__bubble chat__bubble--loading"><span></span><span></span><span></span></div>
          </div>
        )}
      </div>
      <div className="aichat__chips">
        {CHIPS.map(q => (
          <button key={q} className="aichat__chip" onClick={() => send(q)}>{q}</button>
        ))}
      </div>
      <div className="chat__input-row">
        <input className="chat__input" placeholder="이 학생에 대해 질문해보세요..."
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)} />
        <button className="btn btn--brand" onClick={() => send(input)} disabled={!input.trim() || loading}>전송</button>
      </div>
    </div>
  );
}

function QuickToolBody({ toolId }) {
  const lsKey = 'hsj_quick_' + toolId;
  const [items, setItems] = useStateD(() => {
    try { return JSON.parse(localStorage.getItem(lsKey) || '[]'); } catch { return []; }
  });
  const [text, setText] = useStateD('');
  const [date, setDate] = useStateD(() => new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));

  const save = () => {
    if (!text.trim()) return;
    const entry = toolId === 'consult'
      ? { id: Date.now(), at: new Date().toISOString(), date, text: text.trim() }
      : { id: Date.now(), at: new Date().toISOString(), text: text.trim() };
    const next = [entry, ...items];
    setItems(next);
    localStorage.setItem(lsKey, JSON.stringify(next));
    setText('');
  };
  const remove = (id) => {
    const next = items.filter(n => n.id !== id);
    setItems(next);
    localStorage.setItem(lsKey, JSON.stringify(next));
  };
  const fmt = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const placeholder = toolId === 'note' ? '관찰한 내용을 입력하세요'
    : toolId === 'consult' ? '상담 요청 사항을 입력하세요'
    : '생기부에 참고할 내용을 입력하세요';

  return (
    <div className="drawer-body__pad">
      <div className="card" style={{ padding: 12 }}>
        {toolId === 'consult' && (
          <div className="form-row">
            <label className="form-row__label">상담 날짜</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" />
          </div>
        )}
        <textarea className="note-textarea" placeholder={placeholder} value={text} onChange={e => setText(e.target.value)} />
        <div className="row row--end mt-12">
          <button className="btn btn--brand btn--sm" onClick={save} disabled={!text.trim()}>+ 저장</button>
        </div>
      </div>
      <div className="mt-16">
        <div className="card__title" style={{ fontSize: 13, marginBottom: 8 }}>저장된 항목 ({items.length})</div>
        {items.length === 0 && (
          <div className="muted" style={{ fontSize: 12, padding: 14, textAlign: 'center' }}>아직 저장된 항목이 없습니다</div>
        )}
        {items.map(n => (
          <div key={n.id} className="note-item">
            <div className="note-item__head">
              <span className="note-item__date">{n.date ? '상담 ' + n.date : fmt(n.at)}</span>
              <button className="btn btn--xs btn--ghost" onClick={() => remove(n.id)}>삭제</button>
            </div>
            <div className="note-item__body">{n.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Floating speed-dial button (global) ============ */
function FloatingAIButton() {
  const drawer = window.useDrawer();
  const [open, setOpen] = useStateD(false);
  if (!drawer) return null;

  const pick = (id) => { setOpen(false); drawer.openTool(id); };

  return (
    <div className={'fab-stack' + (open ? ' is-open' : '')}>
      {open && <div className="fab-stack__backdrop" onClick={() => setOpen(false)}></div>}
      <div className="fab-stack__items">
        {FAB_TOOLS.map((t, i) => (
          <button key={t.id} className="fab-item" style={{ transitionDelay: (open ? (FAB_TOOLS.length - 1 - i) * 35 : 0) + 'ms' }}
            onClick={() => pick(t.id)}>
            <span className="fab-item__icon" style={{ background: t.color }}>{t.icon}</span>
            <span className="fab-item__label">{t.label}</span>
          </button>
        ))}
      </div>
      <button className={'fab-ai' + (open ? ' is-open' : '')} onClick={() => setOpen(o => !o)} aria-label="빠른 작업">
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
            <circle cx="12" cy="12" r="3.5"/>
          </svg>
        )}
        <span>{open ? '닫기' : 'AI'}</span>
      </button>
    </div>
  );
}

Object.assign(window, { DrawerProvider, DrawerHost, FloatingAIButton });
