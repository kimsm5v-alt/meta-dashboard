/* HSJ Dashboard — Sidebar (LNB) + Header
 * Shared shell components.
 */

const { useState } = React;

/* ============ Sidebar (LNB) ============ */
function Sidebar({ nav, setNav }) {
  // nav: { area: 'result'|'test'|'counsel'|'ai', test?: 'comprehensive'|'selfreg', view?: 'overview'|'class', classId? }
  const [openResults, setOpenResults] = useState(true);
  const data = window.HSJ_DATA;

  const goto = (patch) => setNav({ ...nav, ...patch });
  const isResultActive = nav.area === 'result';
  const isTestActive = (t) => isResultActive && nav.test === t;

  return (
    <nav className="lnb">
      <div className="lnb__section">
        <div className="lnb__title">검사</div>
        <div
          className={'lnb__item' + (nav.area === 'test' ? ' is-active' : '')}
          onClick={() => goto({ area: 'test' })}
        >
          <IconCheck /> <span>검사하기</span>
        </div>
        <div
          className={'lnb__item' + (isResultActive ? ' is-active' : '') + (openResults ? ' is-open' : '')}
          onClick={() => setOpenResults(!openResults)}
        >
          <IconChart /> <span>결과보기</span>
          <ChevRight className="chev" />
        </div>
        {openResults && (
          <div className="lnb__sub">
            <div
              className={'lnb__item' + (isTestActive('comprehensive') ? ' is-active' : '')}
              style={{ '--brand': '#9D53E1', '--brand-soft': '#F3EAFB' }}
              onClick={() => goto({ area: 'result', test: 'comprehensive', view: 'overview', classId: null })}
            >
              <span className="dot" style={{ background: '#9D53E1' }}></span>
              <span>학습종합검사</span>
            </div>
            <div
              className={'lnb__item' + (isTestActive('selfreg') ? ' is-active' : '')}
              onClick={() => goto({ area: 'result', test: 'selfreg', view: 'overview', classId: null })}
            >
              <span className="dot" style={{ background: '#009F88' }}></span>
              <span>자기조절학습검사</span>
            </div>
          </div>
        )}
      </div>

      <div className="lnb__section">
        <div className="lnb__title">상담</div>
        <div
          className={'lnb__item' + (nav.area === 'counsel' ? ' is-active' : '')}
          onClick={() => goto({ area: 'counsel' })}
        >
          <IconCalendar /> <span>상담일정</span>
        </div>
      </div>

      <div className="lnb__section">
        <div className="lnb__title">AI</div>
        <div
          className={'lnb__item' + (nav.area === 'ai' ? ' is-active' : '')}
          onClick={() => goto({ area: 'ai' })}
        >
          <IconSpark /> <span>AI 어시스턴트</span>
        </div>
      </div>
    </nav>
  );
}

/* ============ Header ============ */
function Header({ teacherName = '나d', centerSlot }) {
  return (
    <div className="brand-row" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <div className="brand">
        <div className="brand__logo">v</div>
        <span>학습심리정서검사</span>
      </div>
      {centerSlot && <div className="header__center">{centerSlot}</div>}
      <div className="header__spacer"></div>
      <div className="header__profile">
        <button className="iconbtn" aria-label="알림"><IconBell /></button>
        <button className="iconbtn" aria-label="설정"><IconUser /></button>
        <span>{teacherName}</span>
        <span className="avatar">{teacherName.slice(0,1)}</span>
        <button className="iconbtn" aria-label="로그아웃"><IconLogout /></button>
      </div>
    </div>
  );
}

/* ============ Icons (inline SVG) ============ */
function IconCheck() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>;
}
function IconChart() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function IconCalendar() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
}
function IconSpark() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/></svg>;
}
function IconUsers({ className }) {
  return <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconBell() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
}
function IconUser() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function IconLogout() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function ChevRight({ className }) {
  return <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
function ChevLeft() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
function IconDownload() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function IconSearch() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function IconArrowUp() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 10h-5v6h-6v-6H4z"/></svg>;
}
function IconArrowDown() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l-8-10h5V4h6v6h5z"/></svg>;
}

function InfoTooltip({ title, children, label }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span className="info-tip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      <button className="info-tip__btn" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }} aria-label="설명">
        {label || 'ⓘ'}
      </button>
      {open && (
        <span className="info-tip__pop" onClick={e => e.stopPropagation()}>
          {title && <span className="info-tip__title">{title}</span>}
          <span className="info-tip__body">{children}</span>
        </span>
      )}
    </span>
  );
}

Object.assign(window, {
  Sidebar, Header, InfoTooltip,
  ChevLeft, ChevRight, IconDownload, IconSearch, IconArrowUp, IconArrowDown,
});
