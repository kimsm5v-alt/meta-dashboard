/* HSJ Dashboard — Comprehensive Overview Page
 * One committed view: priority headline (text) + parallel-coords line chart.
 * No cards, no tables, no bars. Just lines + clickable legend ordered by risk.
 */

const { useMemo: useMemoCO, useState: useStateCO } = React;

function CompOverviewPage({ nav, setNav, tweaks, proposalMode = 'compare' }) {
  const data = window.HSJ_DATA;
  const testId = nav.test || 'comprehensive';
  const FM = data.FACTOR_MODEL[testId];
  const [level, setLevel] = useStateCO(testId === 'selfreg' ? 'areas' : '5areas');
  const [hoverId, setHoverId] = useStateCO(null);

  const sessionFor = (c) => data.progressOf(c, testId, 2) > 0 ? 2 : (data.progressOf(c, testId, 1) > 0 ? 1 : null);

  const classes = data.CLASSES.filter(c => c.size > 0);
  const completed = classes.filter(c => sessionFor(c) !== null);
  const goToClass = (id) => setNav({ ...nav, view: 'class', classId: id });

  // Ranked by risk (polarity-aware composite). Higher = more concerning.
  const ranked = useMemoCO(() => {
    return completed.map((c, ix) => {
      const sNo = sessionFor(c);
      const agg = data.classAggregate(c, sNo, testId);
      const posAreas = FM.areas.filter(a => a.polarity === 'positive');
      const negAreas = FM.areas.filter(a => a.polarity === 'negative');
      const pos = posAreas.reduce((s, a) => s + agg[a.id], 0) / (posAreas.length || 1);
      const neg = negAreas.length ? negAreas.reduce((s, a) => s + agg[a.id], 0) / negAreas.length : (100 - pos);
      return { cls: c, sNo, agg, risk: neg - pos, pos, neg };
    }).sort((a, b) => b.risk - a.risk);
  }, [completed, testId]);

  // Assign palette colors by rank
  const colorOf = (rank) => rank < 3
    ? ['#EF4444', '#F59E0B', '#F97316'][rank]
    : data.CLASS_COLORS[Math.min(rank, data.CLASS_COLORS.length - 1)];

  // Top 3 worst, best 1 — for headline
  const topConcerns = ranked.slice(0, 3);
  const bestCls = ranked[ranked.length - 1];

  // Build line chart inputs
  const { xLabels, xIds } = useMemoCO(() => {
    if (level === '5areas' || level === 'areas') return {
      xLabels: FM.areas.map(a => a.name),
      xIds: FM.areas.map(a => a.id),
    };
    if (level === '11categories' || level === 'categories') return {
      xLabels: FM.areas.flatMap(a => a.categories.map(c => c.name)),
      xIds: FM.areas.flatMap(a => a.categories.map(c => c.id)),
    };
    return {
      xLabels: FM.areas.flatMap(a => a.categories.flatMap(c => c.factors.map(f => f.name))),
      xIds: FM.areas.flatMap(a => a.categories.flatMap(c => c.factors.map(f => f.id))),
    };
  }, [level, testId]);

  const series = ranked.map((r, i) => ({
    id: r.cls.id,
    label: r.cls.label,
    color: colorOf(i),
    rank: i,
    data: xIds.map(id => r.agg[id]),
    dimmed: i >= 3, // non-top-3 → dimmed
  }));

  const totalStudents = classes.reduce((s, c) => s + c.size, 0);
  const N = completed.length;

  return (
    <div className="page page-overview-clean">
      <PageHeader
        title={<span>홍길동 선생님의 학급 분석</span>}
        crumb={['결과보기', FM.name]}
        meta={
          <span className="page-head__meta-row">
            <span className="test-tag" style={{ background: FM.color }}>{FM.shortName}검사</span>
            <span>담당 학급 {classes.length}개 반</span>
            <span className="dot-sep">·</span>
            <span>총 학생 {totalStudents}명</span>
          </span>
        }
        right={null}
      />

      {proposalMode === 'compare' && (
        <CompareOverview nav={nav} setNav={setNav} tweaks={tweaks} sessionFor={sessionFor} />
      )}

      {proposalMode === 'clean' && <>

      {/* Priority headline — 1 line answering "어느 반부터" */}
      <div className="priority-headline">
        <span className="priority-headline__lead">우선 살펴볼 반</span>
        <div className="priority-headline__chips">
          {topConcerns.map((r, i) => (
            <button key={r.cls.id} className="priority-headline__chip" onClick={() => goToClass(r.cls.id)}>
              <span className="priority-headline__rank" style={{ background: colorOf(i) }}>{i + 1}</span>
              <span className="priority-headline__name">{r.cls.label}</span>
              <span className="priority-headline__arrow">→</span>
            </button>
          ))}
        </div>
        <span className="priority-headline__sub">
          학습 자원 부족 + 부담 합산이 높은 순서 · {N}개 반 중 상위 3개
        </span>
      </div>

      {/* Drill level + helper */}
      <div className="overview-controls">
        <div className="seg">
          <button className={'seg__btn' + ((level === '5areas' || level === 'areas') ? ' is-active' : '')} onClick={() => setLevel(testId === 'selfreg' ? 'areas' : '5areas')}>{FM.areas.length}대 영역</button>
          <button className={'seg__btn' + ((level === '11categories' || level === 'categories') ? ' is-active' : '')} onClick={() => setLevel(testId === 'selfreg' ? 'categories' : '11categories')}>{FM.areas.reduce((n,a)=>n+a.categories.length,0)}개 요인</button>
          <button className={'seg__btn' + (level === '38factors' ? ' is-active' : '')} onClick={() => setLevel('38factors')}>{FM.areas.reduce((n,a)=>n+a.categories.reduce((m,c)=>m+c.factors.length,0),0)}개 세부요인</button>
        </div>
        <span className="overview-controls__hint">점선(T=50)은 전국 평균 · 점선 위로 올라간 부분이 평균 이상</span>
      </div>

      {/* Big line chart */}
      <div className="overview-chart">
        <PriorityLineChart
          series={series}
          xLabels={xLabels}
          hoverId={hoverId}
          height={460}
          scrollable={level === '38factors'}
          onSelect={(id) => setHoverId(prev => prev === id ? null : id)}
        />
        {hoverId && (() => {
          const r = ranked.find(x => x.cls.id === hoverId);
          if (!r) return null;
          const i = ranked.indexOf(r);
          return (
            <div className="line-popover">
              <div className="line-popover__head">
                <span className="line-popover__dot" style={{ background: colorOf(i) }}></span>
                <span className="line-popover__name">{r.cls.label}</span>
                <span className="line-popover__meta">{r.cls.grade}학년 {r.cls.classNo}반 · {r.cls.size}명</span>
                <button className="btn btn--sm btn--brand" style={{ marginLeft: 'auto' }} onClick={() => goToClass(r.cls.id)}>상세 보기 →</button>
              </div>
              <div className="line-popover__scores">
                {FM.areas.map(a => (
                  <div key={a.id} className="line-popover__score">
                    <span className="line-popover__score-name" style={{ color: a.color }}>{a.name}</span>
                    <span className="line-popover__score-t tnum">T {r.agg[a.id]}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 반별 상세 보기 바로가기 */}
      <div className="ranked-section-label">반별 상세 보기</div>
      <div className="goto-grid">
        {[...ranked].sort((a, b) => (a.cls.grade - b.cls.grade) || (a.cls.classNo - b.cls.classNo)).map((r) => {
          const i = ranked.indexOf(r);
          return (
          <button key={r.cls.id}
            className={'goto-card' + (hoverId === r.cls.id ? ' is-hover' : '')}
            onMouseEnter={() => setHoverId(r.cls.id)}
            onMouseLeave={() => setHoverId(null)}
            onClick={() => goToClass(r.cls.id)}
          >
            <span className="goto-card__dot" style={{ background: colorOf(i) }}></span>
            <span className="goto-card__body">
              <span className="goto-card__name">{r.cls.label}</span>
              <span className="goto-card__sub">{r.cls.size}명</span>
            </span>
            <span className="goto-card__arrow">상세 보기 →</span>
          </button>
          );
        })}
      </div>
      </>}
    </div>
  );
}

/* ============ PriorityLineChart — parallel coords with rank-aware coloring ============ */
function PriorityLineChart({ series, xLabels, hoverId, height = 440, scrollable = false, onSelect }) {
  const yMin = 20, yMax = 80;
  const pad = { l: 56, r: 30, t: 30, b: 70 };
  const [wrapRef, containerW] = useMeasureWidth();
  const minWidthPerLabel = scrollable ? 100 : 0;
  const naturalWidth = scrollable
    ? Math.max(820, xLabels.length * minWidthPerLabel + pad.l + pad.r)
    : Math.max(820, containerW);

  return (
    <div className="line-chart-wrap" ref={wrapRef} style={{ overflowX: scrollable ? 'auto' : 'visible' }}>
      <svg width={naturalWidth} height={height} className="line-chart"
        style={{ minWidth: scrollable ? naturalWidth : '100%' }}>
        {/* grid */}
        {[20, 35, 50, 65, 80].map(t => {
          const y = pad.t + (1 - (t - yMin) / (yMax - yMin)) * (height - pad.t - pad.b);
          return (
            <g key={t}>
              <line x1={pad.l} y1={y} x2={naturalWidth - pad.r} y2={y}
                stroke={t === 50 ? '#9CA3AF' : '#EEEEEF'}
                strokeWidth={t === 50 ? 1.5 : 1}
                strokeDasharray={t === 50 ? '5 5' : '0'} />
              <text x={pad.l - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#71717A">{t}</text>
            </g>
          );
        })}
        <text x={naturalWidth - pad.r - 4} y={pad.t + (1 - (50 - yMin) / (yMax - yMin)) * (height - pad.t - pad.b) - 6}
          textAnchor="end" fontSize="11" fill="#71717A" fontWeight="700">전국 평균</text>

        {/* X labels */}
        {xLabels.map((label, i) => {
          const x = pad.l + (i / Math.max(1, xLabels.length - 1)) * (naturalWidth - pad.l - pad.r);
          const isLong = label.length > 5;
          return (
            <text key={i}
              x={x}
              y={height - pad.b + 22}
              textAnchor={isLong && scrollable ? 'end' : 'middle'}
              fontSize="12"
              fontWeight="600"
              fill="#52525B"
              transform={isLong && scrollable ? `rotate(-32 ${x} ${height - pad.b + 22})` : ''}
            >
              {label}
            </text>
          );
        })}

        {/* Lines — render dimmed first, then bright, so bright is on top */}
        {series.map(s => {
          const isHover = hoverId === s.id;
          const isAnyHover = hoverId != null;
          const isDimmed = s.dimmed && !isHover;
          const opacity = isAnyHover ? (isHover ? 1 : 0.18) : (isDimmed ? 0.35 : 1);
          const strokeWidth = isHover ? 3 : (s.rank < 3 ? 2.4 : 1.5);
          const stroke = s.color;
          const pts = s.data.map((v, i) => {
            const x = pad.l + (i / Math.max(1, xLabels.length - 1)) * (naturalWidth - pad.l - pad.r);
            const y = pad.t + (1 - (v - yMin) / (yMax - yMin)) * (height - pad.t - pad.b);
            return { x, y, v };
          });
          const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
          return (
            <g key={s.id} style={{ opacity, cursor: onSelect ? 'pointer' : 'default' }}
              onClick={onSelect ? () => onSelect(s.id) : undefined}>
              <path d={path} stroke="transparent" strokeWidth="14" fill="none" />
              <path d={path} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={isHover ? 5 : (s.rank < 3 ? 4 : 3)}
                  fill="#fff" stroke={stroke} strokeWidth={isHover ? 2.5 : 2}>
                  <title>{`${s.label}: ${xLabels[i]} T ${p.v}`}</title>
                </circle>
              ))}
              {/* Hover: show value labels */}
              {isHover && pts.map((p, i) => (
                <text key={i} x={p.x} y={p.y - 11} textAnchor="middle"
                  fontSize="12" fontWeight="700" fill={stroke}>{p.v}</text>
              ))}
              {/* Top 3 worst: show class name at last point */}
              {s.rank < 3 && !isAnyHover && (
                <text x={pts[pts.length - 1].x + 8}
                  y={pts[pts.length - 1].y + 4}
                  fontSize="11" fontWeight="700" fill={stroke}>
                  {s.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

Object.assign(window, { CompOverviewPage });
