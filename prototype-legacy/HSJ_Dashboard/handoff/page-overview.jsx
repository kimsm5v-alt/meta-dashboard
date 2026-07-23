/* HSJ Dashboard — Overview Page (전체 반 보기)
 * For 자기조절학습검사. Lightweight; class cards drive the action.
 */

const { useMemo: useMemoOv, useState: useStateOv } = React;

function OverviewPage({ nav, setNav, tweaks }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL.selfreg;
  const [sessionNo, setSessionNo] = useStateOv(2); // 1차 or 2차

  const classes = data.CLASSES;
  const stats = useMemoOv(() => {
    const totalStudents = classes.reduce((s, c) => s + c.size, 0);
    const numClasses = classes.length;
    const completedS1 = classes.reduce((s, c) => s + c.progress[1], 0);
    const completedS2 = classes.reduce((s, c) => s + c.progress[2], 0);
    // 관심 필요: any student whose 동기, 인지, 행동 average <= 35 in current session
    let watchCount = 0;
    classes.forEach(c => c.students.forEach(s => {
      const ses = s.sessions[sessionNo];
      if (!ses) return;
      const avg = (ses.motivation + ses.cognition + ses.behavior) / 3;
      if (avg <= 38) watchCount++;
    }));
    return { totalStudents, numClasses, completedS1, completedS2, watchCount };
  }, [classes, sessionNo]);

  return (
    <div className="page page-overview">
      <PageHeader
        title={
          <span>
            나d님의 결과보기
            <span className="test-tag" style={{ background: FM.color }}>{FM.name}</span>
          </span>
        }
        crumb={['결과보기', '자기조절학습검사']}
        meta={`담당 학급 ${stats.numClasses}개  ·  총 학생 ${stats.totalStudents}명`}
        right={
          <SessionSwitcher value={sessionNo} onChange={setSessionNo} />
        }
      />

      {/* KPI strip */}
      <div className="kpi-row">
        <Kpi label="담당 학급" value={stats.numClasses + '개'} sub={`반 ${classes.map(c => c.label.replace('학년 ', '-')).join(', ')}`} />
        <Kpi label="전체 학생" value={stats.totalStudents + '명'} sub={`5학년 0명 / 6학년 ${stats.totalStudents}명`} />
        <Kpi
          label={`${sessionNo}차 검사 완료`}
          value={`${stats[sessionNo === 1 ? 'completedS1' : 'completedS2']} / ${stats.totalStudents}명`}
          sub={Math.round(stats[sessionNo === 1 ? 'completedS1' : 'completedS2'] / stats.totalStudents * 100) + '% 진행'}
        />
        <Kpi
          label="관심 필요 학생"
          value={stats.watchCount + '명'}
          sub="3대 전략 평균 T ≤ 38"
          chipColor="risk"
          chipText="주목"
        />
      </div>

      {/* AI Insight */}
      <div className="section">
        <InsightCard classes={classes} sessionNo={sessionNo} />
      </div>

      {/* Class cards */}
      <div className="section">
        <h2 className="section__title">반별 현황</h2>
        <p className="section__sub">반 카드를 클릭하면 해당 반의 자세한 결과를 볼 수 있습니다</p>
        <div className="grid-class-cards">
          {classes.map(c => (
            <ClassCard
              key={c.id}
              classData={c}
              sessionNo={sessionNo}
              onClick={() => setNav({ ...nav, view: 'class', classId: c.id })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PageHeader({ title, crumb, meta, right, onBack, tabs }) {
  return (
    <div className={'page-head' + (tabs ? ' page-head--with-tabs' : '')}>
      {crumb && (
        <div className="page-head__crumb page-head__crumb--top">
          {crumb.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="crumb-sep">›</span>}
              <span>{c}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="page-head__main">
        {onBack && (
          <button className="page-head__back" onClick={onBack} aria-label="뒤로 가기">
            <ChevLeft />
          </button>
        )}
        <div className="page-head__titles">
          <div className="page-head__title">{title}</div>
          {meta && <div className="page-head__meta">{meta}</div>}
        </div>
        {right && <div className="page-head__actions">{right}</div>}
      </div>
      {tabs && <div className="page-head__tabs">{tabs}</div>}
    </div>
  );
}

function SessionSwitcher({ value, onChange }) {
  return (
    <div className="seg seg--brand">
      <button className={'seg__btn' + (value === 1 ? ' is-active' : '')} onClick={() => onChange(1)}>1차 검사</button>
      <button className={'seg__btn' + (value === 2 ? ' is-active' : '')} onClick={() => onChange(2)}>2차 검사</button>
    </div>
  );
}

function Kpi({ label, value, sub, chipColor, chipText }) {
  return (
    <div className="kpi">
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{value}</div>
      <div className="kpi__sub">{sub}</div>
      {chipText && <span className={'kpi__chip chip--' + chipColor}>{chipText}</span>}
    </div>
  );
}

function InsightCard({ classes, sessionNo }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL.selfreg;
  // Aggregate across all students with completed sessions
  const allStudents = classes.flatMap(c => c.students.filter(s => s.sessions[sessionNo]));
  if (!allStudents.length) {
    return (
      <div className="insight">
        <div className="insight__head">💡 AI 인사이트</div>
        <div className="insight__body">{sessionNo}차 검사가 아직 진행 전입니다. 1차 검사 결과로 학생들의 출발선을 살펴보세요.</div>
      </div>
    );
  }
  const strats = FM.strategies.map(s => {
    const avg = Math.round(allStudents.reduce((sum, st) => sum + st.sessions[sessionNo][s.id], 0) / allStudents.length);
    return { ...s, avg };
  });
  const strongest = strats.reduce((a, b) => a.avg > b.avg ? a : b);
  const weakest = strats.reduce((a, b) => a.avg < b.avg ? a : b);
  // Class with weakest behavior
  const weakClass = classes
    .filter(c => c.students.some(s => s.sessions[sessionNo]))
    .reduce((acc, c) => {
      const avg = data.classAggregate(c, sessionNo);
      const score = avg[weakest.id];
      return (!acc || score < acc.score) ? { c, score } : acc;
    }, null);

  // Delta if 2차
  let deltaText = '';
  if (sessionNo === 2) {
    const s1Strats = FM.strategies.map(s => {
      const completed1 = classes.flatMap(c => c.students.filter(st => st.sessions[1]));
      const avg1 = Math.round(completed1.reduce((sum, st) => sum + st.sessions[1][s.id], 0) / completed1.length);
      return { id: s.id, name: s.name, delta: strats.find(x => x.id === s.id).avg - avg1 };
    });
    const biggest = s1Strats.reduce((a, b) => Math.abs(a.delta) > Math.abs(b.delta) ? a : b);
    if (biggest.delta > 1) {
      deltaText = `2차 검사에서 ${biggest.name}이 ${biggest.delta > 0 ? '+' : ''}${biggest.delta} 변화해 가장 큰 성장을 보였어요.`;
    } else if (biggest.delta < -1) {
      deltaText = `2차 검사에서 ${biggest.name}이 ${biggest.delta} 하락해 추가 관심이 필요해 보입니다.`;
    }
  }

  return (
    <div className="insight">
      <div className="insight__head">💡 AI 인사이트</div>
      <div className="insight__body">
        담당 4개 반의 학생들은 <strong style={{ color: strongest.color }}>{strongest.name}</strong>이 평균 T {strongest.avg}로 가장 강하고,
        <strong style={{ color: weakest.color }}> {weakest.name}</strong>이 평균 T {weakest.avg}로 가장 약합니다.
        {weakClass && <> 특히 <strong>{weakClass.c.label}</strong>의 {weakest.name}이 T {weakClass.score}로 우선 관심이 필요합니다.</>}
        {deltaText && <> {deltaText}</>}
      </div>
    </div>
  );
}

/* ============ Class Card ============ */
function ClassCard({ classData, sessionNo, onClick }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL.selfreg;
  const isPending = classData.progress[sessionNo] === 0;
  const agg = isPending ? null : data.classAggregate(classData, sessionNo);
  const prevAgg = sessionNo === 2 && classData.progress[1] > 0 ? data.classAggregate(classData, 1) : null;

  // watch students for current session
  let watchCount = 0;
  if (!isPending) {
    classData.students.forEach(s => {
      const ses = s.sessions[sessionNo];
      if (!ses) return;
      const avg = (ses.motivation + ses.cognition + ses.behavior) / 3;
      if (avg <= 38) watchCount++;
    });
  }

  // big mover
  let bigMover = null;
  if (prevAgg && agg) {
    let max = 0, name = null;
    FM.strategies.forEach(st => {
      const d = agg[st.id] - prevAgg[st.id];
      if (Math.abs(d) > Math.abs(max)) { max = d; name = st.name; }
    });
    bigMover = { d: max, name };
  }

  return (
    <div className="cls-card" onClick={onClick}>
      <div className="cls-card__head">
        <div>
          <div className="cls-card__name">{classData.label}</div>
          <div className="cls-card__meta">전체 학생 {classData.size}명</div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {isPending ? <span className="chip chip--neutral">{sessionNo}차 검사 전</span>
            : <span className="chip chip--good">{sessionNo}차 완료</span>}
        </div>
      </div>

      {isPending && (
        <div className="cls-card__row">
          <span style={{ color: 'var(--gray-400)' }}>{sessionNo}차 검사가 시작되지 않았습니다</span>
        </div>
      )}

      {!isPending && (
        <>
          <div className="cls-card__strats">
            {FM.strategies.map(s => {
              const t = agg[s.id];
              const pt = prevAgg ? prevAgg[s.id] : null;
              const d = pt != null ? t - pt : null;
              return (
                <div key={s.id} className="strat-row">
                  <span className="strat-row__label" style={{ color: s.color }}>{s.name}</span>
                  <div className="strat-row__bar">
                    <div className="strat-row__bar-fill" style={{ width: Math.max(2, Math.min(98, t)) + '%', background: s.color }}></div>
                  </div>
                  <span className="strat-row__val">T {t}</span>
                  <span className={'strat-row__delta delta--' + (d == null ? 'flat' : d > 0 ? 'up' : d < 0 ? 'down' : 'flat')}>
                    {d == null ? '–' : (d > 0 ? '▲' : d < 0 ? '▼' : '–') + Math.abs(d)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="cls-card__footer">
            {watchCount > 0
              ? <span className="chip chip--risk">⚠ 관심 필요 {watchCount}명</span>
              : <span className="chip chip--good">✓ 관심 학생 없음</span>}
            {bigMover && Math.abs(bigMover.d) >= 2 && (
              <span className={'chip ' + (bigMover.d > 0 ? 'chip--good' : 'chip--warn')}>
                {bigMover.name} {bigMover.d > 0 ? '↑' : '↓'} {Math.abs(bigMover.d)}
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>
              자세히 보기 →
            </span>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { OverviewPage, PageHeader, SessionSwitcher });
