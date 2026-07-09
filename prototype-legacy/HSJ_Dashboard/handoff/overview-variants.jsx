/* HSJ Dashboard — Comprehensive Overview Variants (B, C)
 * Two alternative overview designs activated via header tabs.
 * The default (A · 호기심 카드) lives in page-comp-overview.jsx as LiteOverview.
 */

const { useMemo: useMemoOV, useState: useStateOV } = React;

/* ============================================================
 * Variant B · 비교 분석
 * UX team's classic line chart + side summary + LPA stacked rows.
 * Single snapshot (no 1·2 comparison).
 * ============================================================ */
function CompareOverview({ nav, setNav, tweaks, sessionFor }) {
  const data = window.HSJ_DATA;
  const testId = nav.test || 'comprehensive';
  const FM = data.FACTOR_MODEL[testId];
  const lpaOn = tweaks.lpaToggle && FM.hasLPAType;
  const [level, setLevel] = useStateOV('5areas'); // '5areas' | '11categories'
  const [selectedClassId, setSelectedClassId] = useStateOV(null);
  const [lpaSess, setLpaSess] = useStateOV(1);

  const classes = data.CLASSES.filter(c => c.size > 0);
  const completed = classes.filter(c => sessionFor(c) !== null);

  const xLabels = level === '5areas'
    ? FM.areas.map(a => a.name)
    : FM.areas.flatMap(a => a.categories.map(c => c.name));
  const xIds = level === '5areas'
    ? FM.areas.map(a => a.id)
    : FM.areas.flatMap(a => a.categories.map(c => c.id));

  const classColors = data.CLASS_COLORS;
  const series = completed.map((c, i) => ({
    id: c.id,
    label: c.label,
    color: data.classColor(i),
    data: xIds.map(id => data.classAggregate(c, sessionFor(c), testId)[id]),
  }));

  const goToClass = (id) => setNav({ ...nav, view: 'class', classId: id });

  const totalStudents = classes.reduce((s, c) => s + c.size, 0);

  return (
    <>
      <div className="section">
        <div className="card card--padless">
          <div className="bigchart__head">
            <div>
              <div className="card__title">반별 비교 분석</div>
              <div className="card__sub">
                {level === '5areas'
                  ? `각 반의 ${FM.areas.length}대 영역별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.`
                  : `각 반의 ${FM.areas.reduce((n,a)=>n+a.categories.length,0)}개 요인별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.`}
              </div>
            </div>
            <div className="seg">
              <button className={'seg__btn' + (level === '5areas' ? ' is-active' : '')} onClick={() => setLevel('5areas')}>{FM.areas.length}대 영역</button>
              <button className={'seg__btn' + (level === '11categories' ? ' is-active' : '')} onClick={() => setLevel('11categories')}>{FM.areas.reduce((n,a)=>n+a.categories.length,0)}개 요인</button>
            </div>
          </div>
          <div className="bigchart__body">
            <div className="bigchart__chart">
              <div className="bigchart__chips">
                <button
                  className={'filterchip' + (selectedClassId === null ? ' is-active' : '')}
                  onClick={() => setSelectedClassId(null)}
                >
                  <span className="dot" style={{ background: '#A1A1A8', width: 6, height: 6, borderRadius: '50%', display: 'inline-block', marginRight: 4 }}></span>
                  전체 ({totalStudents}명)
                </button>
                {completed.map((c, i) => (
                  <button
                    key={c.id}
                    className={'filterchip' + (selectedClassId === c.id ? ' is-active' : '')}
                    onClick={() => setSelectedClassId(c.id)}
                  >
                    <span className="dot" style={{ background: classColors[i], width: 6, height: 6, borderRadius: '50%', display: 'inline-block', marginRight: 4 }}></span>
                    {c.label} ({c.size}명)
                  </button>
                ))}
              </div>
              <AreaLineChart
                series={series}
                xLabels={xLabels}
                highlightId={selectedClassId}
                onSelectClass={(id) => setSelectedClassId(prev => prev === id ? null : id)}
                height={400}
                scrollable={level === '11categories'}
              />
              <div className="bigchart__legend">
                {completed.map((c, i) => (
                  <span key={c.id} className="bigchart__legend-item">
                    <span className="bigchart__legend-dot" style={{ background: classColors[i] }}></span>
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="bigchart__side">
              <OverviewSummaryPanel
                classes={classes}
                testId={testId}
                sessionNo={sessionFor(completed[0] || classes[0])}
                level={level}
                selectedClassId={selectedClassId}
                onGoToClass={goToClass}
              />
            </div>
          </div>
        </div>
      </div>

      {lpaOn && (
        <div className="section">
          <div className="card">
            <div className="card__head">
              <div>
                <div className="card__title">학생 유형 분포 비교 <InfoTooltip title="LPA 유형이란?">{LPA_TIP}</InfoTooltip></div>
                <div className="card__sub">1차·2차 검사 결과를 나란히 비교합니다. 반 이름을 클릭하면 반 상세 분석으로 이동합니다.</div>
              </div>
              <div className="lpa-dist__legend" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                {FM.lpaTypes.map(t => (
                  <span key={t.id} className="lpa-legend">
                    <span className="lpa-legend__dot" style={{ background: t.color }}></span>
                    <span className="lpa-legend__name">{t.name}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="lpa-compare-table">
              {classes.map(c => (
                <LPAComparisonRow key={c.id} cls={c} onDetail={goToClass} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
 * Variant C · AI 액션 카드
 * Decision-first entry. Big AI-curated action cards drive everything.
 * ============================================================ */
function ActionOverview({ nav, setNav, tweaks, sessionFor }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL.comprehensive;
  const drawer = window.useDrawer();
  const classes = data.CLASSES.filter(c => c.size > 0);
  const completed = classes.filter(c => sessionFor(c) !== null);

  const goToClass = (id) => setNav({ ...nav, view: 'class', classId: id });
  const openStudent = (cls, s) => drawer.openStudent({
    classId: cls.id, num: s.num, test: 'comprehensive',
    sessionNo: sessionFor(cls),
    siblings: cls.students.map(st => ({ classId: cls.id, num: st.num, name: st.name })),
  });

  const actions = useMemoOV(() => {
    const out = [];
    // High-priority: classes with many depleted
    completed.forEach(c => {
      const dist = data.classLPADist(c, sessionFor(c));
      const total = dist.depleted + dist.balanced + dist.immersed;
      if (total && dist.depleted >= Math.max(4, total / 2)) {
        const dstudents = c.students
          .filter(s => s.compSessions[sessionFor(c)]._lpa === 'depleted')
          .slice(0, 5);
        out.push({
          urgency: 'high',
          icon: '🚨',
          tag: '긴급',
          title: `${c.label} 자원소진형 ${dist.depleted}명`,
          desc: `학생 ${total}명 중 ${Math.round(dist.depleted/total*100)}% — 정서적 지지와 학부모 상담이 시급합니다`,
          students: dstudents.map(s => ({ s, cls: c })),
          primary: { label: `${c.label} 분석 보기 →`, kind: 'class', id: c.id },
        });
      }
    });
    // Medium: high stress students
    const stressed = classes.flatMap(c => c.students.map(s => ({ ...s, cls: c, cur: s.compSessions[sessionFor(c)] })))
      .filter(s => s.cur && s.cur.aStress >= 65)
      .sort((a, b) => b.cur.aStress - a.cur.aStress)
      .slice(0, 5);
    if (stressed.length > 0) {
      out.push({
        urgency: 'medium',
        icon: '⚠️',
        tag: '주의',
        title: `학업스트레스 높은 학생 ${stressed.length}명`,
        desc: `T 65 이상인 학생들 — 상담 우선순위로 두세요`,
        students: stressed.map(s => ({ s, cls: s.cls })),
        primary: { label: '학생 확인하기 →', kind: 'student', firstStudent: stressed[0] },
      });
    }
    // Strength: positive finding
    let bestCls = null, bestArea = null, bestT = -Infinity;
    completed.forEach(c => {
      const agg = data.classAggregate(c, sessionFor(c), 'comprehensive');
      FM.areas.filter(a => a.polarity === 'positive').forEach(a => {
        if (agg[a.id] > bestT) { bestT = agg[a.id]; bestArea = a; bestCls = c; }
      });
    });
    if (bestT >= 55) {
      out.push({
        urgency: 'positive',
        icon: '🌟',
        tag: '강점',
        title: `${bestCls.label} ${bestArea.name} T ${bestT}`,
        desc: `학년 최고 — 이 반의 비결을 다른 반에도 적용해보세요`,
        students: [],
        primary: { label: `${bestCls.label} 들여다보기 →`, kind: 'class', id: bestCls.id },
      });
    }
    // Pending tests
    classes.filter(c => c.compProgress[2] === 0 && c.compProgress[1] > 0).forEach(c => {
      out.push({
        urgency: 'low',
        icon: '📅',
        tag: '진행',
        title: `${c.label} 2차 검사 미시행`,
        desc: `${c.size}명 — 1차 결과와 비교하려면 2차 검사가 필요합니다`,
        students: [],
        primary: { label: '검사 발급하기 →', kind: 'none' },
      });
    });
    return out;
  }, [classes, completed]);

  const onActionClick = (a) => {
    if (a.primary.kind === 'class') goToClass(a.primary.id);
    else if (a.primary.kind === 'student') {
      const s = a.primary.firstStudent;
      openStudent(s.cls, s);
    }
  };

  return (
    <>
      <div className="action-grid">
        {actions.map((a, i) => (
          <div key={i} className={'action-card action-card--' + a.urgency}>
            <div className="action-card__head">
              <span className="action-card__icon">{a.icon}</span>
              <span className={'action-card__tag action-card__tag--' + a.urgency}>{a.tag}</span>
            </div>
            <div className="action-card__title">{a.title}</div>
            <div className="action-card__desc">{a.desc}</div>
            {a.students.length > 0 && (
              <div className="action-card__students">
                {a.students.map((sw, j) => (
                  <button key={j} className="action-card__student" onClick={(e) => { e.stopPropagation(); openStudent(sw.cls, sw.s); }}>
                    {sw.s.num}번 {sw.s.name}
                  </button>
                ))}
              </div>
            )}
            <button
              className={'action-card__cta ' + (a.urgency === 'high' ? 'is-primary' : '')}
              onClick={() => onActionClick(a)}
            >
              {a.primary.label}
            </button>
          </div>
        ))}
      </div>
      <div className="action-hint">
        💡 액션 카드는 검사 데이터 변화에 따라 자동 업데이트됩니다. 카드 클릭으로 관련 반·학생에 바로 진입할 수 있습니다.
      </div>
    </>
  );
}

Object.assign(window, { CompareOverview, ActionOverview, IndicatorOverview });

/* ============================================================
 * Variant D · 지표별 비교 (Indicator-by-class)
 * Per-indicator rows: bars for each class side-by-side + AI insight per row.
 * Drill levels: 5대 영역 / 11개 요인 / 38개 요인.
 * ============================================================ */
function IndicatorOverview({ nav, setNav, tweaks, sessionFor }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL.comprehensive;
  const [level, setLevel] = useStateOV('5areas');
  const [sort, setSort] = useStateOV('natural');

  const classes = data.CLASSES.filter(c => c.size > 0);
  const completed = classes.filter(c => sessionFor(c) !== null);
  const goToClass = (id) => setNav({ ...nav, view: 'class', classId: id });

  // Layout mode based on class count
  const N = completed.length;
  // 'single' = 1 class · 'bars' = 2-4 classes side-by-side · 'dots' = 5+ condensed
  const layoutMode = N <= 1 ? 'single' : N <= 4 ? 'bars' : 'dots';

  const indicators = useMemoOV(() => {
    if (level === '5areas') {
      return FM.areas.map(a => ({ id: a.id, name: a.name, color: a.color, polarity: a.polarity, parent: null }));
    }
    if (level === '11categories') {
      return FM.areas.flatMap(a => a.categories.map(c => ({
        id: c.id, name: c.name, color: a.color, polarity: a.polarity, parent: a.name,
      })));
    }
    return FM.areas.flatMap(a => a.categories.flatMap(c => c.factors.map(f => ({
      id: f.id, name: f.name, color: a.color, polarity: a.polarity, parent: a.name + ' · ' + c.name,
    }))));
  }, [level]);

  const rows = useMemoOV(() => indicators.map(ind => {
    const values = completed.map((c, i) => ({
      cls: c, idx: i, color: data.classColor(i),
      t: data.classAggregate(c, sessionFor(c), 'comprehensive')[ind.id],
    }));
    const ts = values.map(v => v.t);
    const min = ts.length ? Math.min(...ts) : 0;
    const max = ts.length ? Math.max(...ts) : 0;
    const avg = ts.length ? Math.round(ts.reduce((a, b) => a + b, 0) / ts.length) : 0;
    const gap = max - min;
    const concernT = ind.polarity === 'negative' ? max : min;
    const concernScore = ind.polarity === 'negative' ? (concernT - 50) : (50 - concernT);
    return { ind, values, min, max, avg, gap, concernT, concernScore };
  }), [indicators, completed]);

  const sortedRows = useMemoOV(() => {
    const r = [...rows];
    if (sort === 'gap') r.sort((a, b) => b.gap - a.gap);
    if (sort === 'concern') r.sort((a, b) => b.concernScore - a.concernScore);
    return r;
  }, [rows, sort]);

  // Per-row insight generator
  const insightFor = (r) => {
    const { ind, gap, values, max, min, avg } = r;
    const maxV = values.find(v => v.t === max);
    const minV = values.find(v => v.t === min);
    // Single class case: compare to national avg
    if (N === 1) {
      const t = values[0].t;
      const diff = ind.polarity === 'negative' ? t - 50 : 50 - t;
      if (diff >= 5) return { text: `전국 평균 대비 ${ind.polarity === 'negative' ? '+' : '-'}${diff} ${ind.polarity === 'negative' ? '높음' : '낮음'} — 우선 ${ind.polarity === 'negative' ? '관리' : '강화'}`, kind: 'warn', cls: null };
      if (-diff >= 5) return { text: `전국 평균 대비 ${-diff > 0 ? '+' : ''}${Math.abs(diff)} ${ind.polarity === 'negative' ? '낮음' : '높음'} — 강점`, kind: 'good', cls: null };
      return { text: '전국 평균과 유사', kind: 'neutral', cls: null };
    }
    if (gap >= 7) {
      if (ind.polarity === 'negative') return { text: `${maxV.cls.label}에 부담 집중 (T${max})`, kind: 'risk', cls: maxV.cls };
      return { text: `${minV.cls.label}이 ${gap}점 낮음 — 우선 강화`, kind: 'warn', cls: minV.cls };
    }
    if (ind.polarity === 'positive' && values.every(v => v.t >= 55)) return { text: '모든 반 강점 영역', kind: 'good', cls: null };
    if (ind.polarity === 'positive' && values.every(v => v.t <= 45)) return { text: '학년 전체 보완 필요', kind: 'risk', cls: null };
    if (ind.polarity === 'negative' && values.every(v => v.t >= 55)) return { text: '학년 전체 부담 신호', kind: 'risk', cls: null };
    if (gap <= 2) return { text: '반 간 차이가 거의 없음', kind: 'neutral', cls: null };
    return { text: ind.polarity === 'negative'
      ? `${maxV.cls.label} 주의 (T${max})`
      : `${minV.cls.label} 보완 (T${min})`, kind: 'warn', cls: maxV.cls };
  };

  return (
    <>
      <div className="ind-controls">
        <div className="seg">
          <button className={'seg__btn' + (level === '5areas' ? ' is-active' : '')} onClick={() => setLevel('5areas')}>5대 영역</button>
          <button className={'seg__btn' + (level === '11categories' ? ' is-active' : '')} onClick={() => setLevel('11categories')}>11개 요인</button>
          <button className={'seg__btn' + (level === '38factors' ? ' is-active' : '')} onClick={() => setLevel('38factors')}>38개 요인</button>
        </div>
        <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>
          담당 {N}개 반 · {layoutMode === 'single' ? '단일 반 보기' : layoutMode === 'bars' ? '막대 비교' : '분포도 비교'}
        </span>
        <div className="seg">
          <button className={'seg__btn' + (sort === 'natural' ? ' is-active' : '')} onClick={() => setSort('natural')}>기본순</button>
          {N >= 2 && <button className={'seg__btn' + (sort === 'gap' ? ' is-active' : '')} onClick={() => setSort('gap')}>차이 큰 순</button>}
          <button className={'seg__btn' + (sort === 'concern' ? ' is-active' : '')} onClick={() => setSort('concern')}>관심 영역 순</button>
        </div>
      </div>

      {N >= 2 && (
        <div className="ind-classlegend">
          {completed.map((c, i) => (
            <button key={c.id} className="ind-classlegend__item" onClick={() => goToClass(c.id)}>
              <span className="ind-classlegend__dot" style={{ background: data.classColor(i) }}></span>
              <span>{c.label}</span>
              <span className="muted">({c.size}명)</span>
            </button>
          ))}
        </div>
      )}

      <div className={'ind-table ind-table--' + layoutMode + ' card card--padless'}
        style={{ '--cls-count': layoutMode === 'bars' ? N : 1 }}>
        <div className="ind-table__head">
          <div className="ind-table__col-name">지표</div>
          {layoutMode === 'bars' && completed.map((c, i) => (
            <div key={c.id} className="ind-table__col-cls">
              <span className="ind-table__dot" style={{ background: data.classColor(i) }}></span>
              <button onClick={() => goToClass(c.id)} className="ind-table__cls-name">{c.label}</button>
            </div>
          ))}
          {layoutMode === 'dots' && <div className="ind-table__col-dots">반별 분포 (T 20 ─ 50 ─ 80)</div>}
          {layoutMode === 'single' && <div className="ind-table__col-single">{completed[0]?.label || '단일 반'} T 점수</div>}
          {N >= 2 && <div className="ind-table__col-gap">차이</div>}
          <div className="ind-table__col-insight">인사이트</div>
        </div>

        {sortedRows.map(r => {
          const insight = insightFor(r);
          return (
            <div key={r.ind.id} className="ind-row">
              <div className="ind-row__name">
                {r.ind.parent && <span className="ind-row__parent">{r.ind.parent}</span>}
                <span className="ind-row__main" style={{ color: r.ind.color }}>
                  <span className="ind-row__color-bullet" style={{ background: r.ind.color }}></span>
                  {r.ind.name}
                </span>
                {r.ind.polarity === 'negative' && <span className="polarity-tag polarity-tag--neg">낮을수록 좋음</span>}
              </div>

              {layoutMode === 'bars' && completed.map((c, i) => {
                const v = r.values.find(vv => vv.cls.id === c.id);
                if (!v) return <div key={c.id} className="ind-row__cell">-</div>;
                const isWorst = r.ind.polarity === 'negative' ? v.t === r.max : v.t === r.min;
                const isBest = r.ind.polarity === 'negative' ? v.t === r.min : v.t === r.max;
                return (
                  <div key={c.id} className={'ind-row__cell' + (isWorst ? ' is-worst' : '') + (isBest ? ' is-best' : '')}>
                    <div className="ind-row__bar" title={c.label + ' T ' + v.t}>
                      <div className="ind-row__bar-fill" style={{
                        width: Math.max(2, Math.min(98, v.t)) + '%',
                        background: data.classColor(i),
                      }}></div>
                      <div className="ind-row__bar-mark" style={{ left: '50%' }}></div>
                    </div>
                    <span className="ind-row__t tnum">{v.t}</span>
                  </div>
                );
              })}

              {layoutMode === 'single' && r.values[0] && (
                <div className="ind-row__cell">
                  <div className="ind-row__bar">
                    <div className="ind-row__bar-fill" style={{
                      width: Math.max(2, Math.min(98, r.values[0].t)) + '%',
                      background: r.values[0].color,
                    }}></div>
                    <div className="ind-row__bar-mark" style={{ left: '50%' }}></div>
                  </div>
                  <span className="ind-row__t tnum">T {r.values[0].t}</span>
                </div>
              )}

              {layoutMode === 'dots' && (
                <div className="ind-row__cell ind-row__cell--dots">
                  <IndDots values={r.values} polarity={r.ind.polarity} />
                </div>
              )}

              {N >= 2 && (
                <div className="ind-row__cell ind-row__cell--gap">
                  <span className={'chip ' + (r.gap >= 7 ? 'chip--warn' : r.gap >= 4 ? 'chip--info' : 'chip--neutral')}>
                    ±{r.gap}
                  </span>
                </div>
              )}

              <div className={'ind-row__cell ind-row__cell--insight ind-row__cell--insight-' + insight.kind}>
                <span className="ind-row__insight-text">{insight.text}</span>
                {insight.cls && (
                  <button className="ind-row__insight-go" onClick={() => goToClass(insight.cls.id)}>→</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* Inline dot distribution for "dots" mode */
function IndDots({ values, polarity }) {
  const width = 260, height = 28;
  const pad = 14;
  const tMin = 20, tMax = 80;
  const xS = (t) => pad + ((t - tMin) / (tMax - tMin)) * (width - pad * 2);
  return (
    <svg width={width} height={height} className="ind-dots">
      {/* axis line */}
      <line x1={pad} y1={height/2} x2={width - pad} y2={height/2} stroke="#E5E5E7" strokeWidth="1.5" />
      {/* T=50 reference */}
      <line x1={xS(50)} y1={6} x2={xS(50)} y2={height - 6} stroke="#A1A1A8" strokeDasharray="2 2" />
      {/* T axis markers */}
      {[30, 50, 70].map(t => (
        <line key={t} x1={xS(t)} y1={height/2 - 3} x2={xS(t)} y2={height/2 + 3} stroke="#D4D4D8" />
      ))}
      {/* class dots */}
      {values.map((v, i) => (
        <circle key={i}
          cx={xS(v.t)} cy={height/2}
          r="5"
          fill={v.color}
          fillOpacity="0.85"
          stroke="#fff"
          strokeWidth="1.5"
        >
          <title>{`${v.cls.label} T ${v.t}`}</title>
        </circle>
      ))}
    </svg>
  );
}
