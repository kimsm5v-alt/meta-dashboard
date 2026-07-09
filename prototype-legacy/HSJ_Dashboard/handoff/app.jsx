/* HSJ Dashboard — Root App
 * Composes Sidebar + Header + Page; controls navigation state + Tweaks.
 */

const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "lpaToggle": true,
  "showInsightCard": true,
  "density": "regular",
  "selfregColor": "#009F88",
  "comprehensiveColor": "#9D53E1"
}/*EDITMODE-END*/;

function App() {
  const [nav, setNav] = useStateApp({
    area: 'result',
    test: 'comprehensive',
    view: 'overview',
    classId: null,
  });
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [proposalMode, setProposalMode] = useStateApp('compare');

  // Inject brand vars based on active test
  useEffectApp(() => {
    const root = document.documentElement;
    const brand = nav.test === 'comprehensive' ? tweaks.comprehensiveColor : tweaks.selfregColor;
    const isSelfreg = nav.test === 'selfreg';
    root.style.setProperty('--brand', brand);
    root.style.setProperty('--brand-soft', isSelfreg ? '#E5F6F3' : '#F3EAFB');
    root.style.setProperty('--brand-mid', isSelfreg ? '#80CFC4' : '#C9A4ED');
  }, [nav.test, tweaks.selfregColor, tweaks.comprehensiveColor]);

  const headerCenter = null;

  return (
    <DrawerProvider>
      <div className="app">
        <header className="app__header">
          <Header centerSlot={headerCenter} />
        </header>
        <aside className="app__lnb">
          <Sidebar nav={nav} setNav={setNav} />
        </aside>
        <main className="app__main">
          <PageRouter nav={nav} setNav={setNav} tweaks={tweaks} proposalMode={proposalMode} setProposalMode={setProposalMode} />
        </main>
      </div>
      <TweaksUI tweaks={tweaks} setTweak={setTweak} />
      {nav.area === 'result' && nav.view === 'student' && <FloatingAIButton />}
    </DrawerProvider>
  );
}

function PageRouter({ nav, setNav, tweaks, proposalMode, setProposalMode }) {
  if (nav.area === 'result' && nav.test === 'selfreg') {
    if (nav.view === 'student' && nav.classId && nav.studentNum != null) return <CompStudentPage nav={nav} setNav={setNav} tweaks={tweaks} />;
    if (nav.view === 'class' && nav.classId) return <CompClassPage nav={nav} setNav={setNav} tweaks={tweaks} />;
    return <CompOverviewPage nav={nav} setNav={setNav} tweaks={tweaks} proposalMode="compare" />;
  }
  if (nav.area === 'result' && nav.test === 'comprehensive') {
    if (nav.view === 'student' && nav.classId && nav.studentNum != null) return <CompStudentPage nav={nav} setNav={setNav} tweaks={tweaks} />;
    if (nav.view === 'class' && nav.classId) return <CompClassPage nav={nav} setNav={setNav} tweaks={tweaks} />;
    return <CompOverviewPage nav={nav} setNav={setNav} tweaks={tweaks} proposalMode="compare" />;
  }
  if (nav.area === 'test') return <PlaceholderPage title="검사하기" subtitle="검사 발급·진행 화면입니다." />;
  if (nav.area === 'counsel') return <PlaceholderPage title="상담일정" subtitle="상담 예약·이력 화면입니다." />;
  if (nav.area === 'ai') return <PlaceholderPage title="AI 어시스턴트" subtitle="AI 챗봇 화면입니다." />;
  return null;
}

function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="page">
      <PageHeader title={title} meta={subtitle} />
      <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🧪</div>
        <div className="muted">이번 단계에서는 결과보기 화면에 집중했습니다.</div>
      </div>
    </div>
  );
}

function TweaksUI({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="검사 메타 (스키마)" />
      <TweakToggle
        label="LPA 유형 사용 (학습종합검사)"
        value={tweaks.lpaToggle}
        onChange={v => setTweak('lpaToggle', v)}
      />
      <div style={{ fontSize: 11, color: 'var(--gray-500)', padding: '0 4px 8px', lineHeight: 1.5 }}>
        OFF 시 학습종합검사에서 "학생 유형 분포"·"유형 변화 흐름" 위젯이 자동으로 숨고, 그 자리에 5대 영역 균형 레이더가 노출됩니다. (고등 케이스 대응)
      </div>

      <TweakSection label="UI" />
      <TweakToggle
        label="AI 인사이트 카드"
        value={tweaks.showInsightCard}
        onChange={v => setTweak('showInsightCard', v)}
      />
      <TweakRadio
        label="정보 밀도"
        value={tweaks.density}
        options={['compact', 'regular', 'comfy']}
        onChange={v => setTweak('density', v)}
      />

      <TweakSection label="검사 색상" />
      <TweakColor
        label="자기조절학습검사"
        value={tweaks.selfregColor}
        options={['#009F88', '#0EA5A1', '#10B981', '#0EA5E9']}
        onChange={v => setTweak('selfregColor', v)}
      />
      <TweakColor
        label="학습종합검사"
        value={tweaks.comprehensiveColor}
        options={['#9D53E1', '#7C3AED', '#A855F7', '#8B5CF6']}
        onChange={v => setTweak('comprehensiveColor', v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
