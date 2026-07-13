/* HSJ Dashboard — Comprehensive Test Charts
 * Widgets specific to 학습종합검사 (5 areas, 38 factors, LPA type).
 * Exports to window: AreasDrilldown, LPADistribution, LPAFlow, CompFactorMatrix, AreaRadar5
 */

const { useState: useStateC, useMemo: useMemoC, useRef: useRefC, useEffect: useEffectC } = React;

/* ============================================================
 * AreasDrilldown
 * 5 area bars with drilldown to 38 sub-factors.
 * Polarity-aware: 부적(부정) areas show with red theming + reverse hint.
 * ============================================================ */
function AreasDrilldown({ classData, agg, prevAgg, sessionNo }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.comprehensive;
  const [open, setOpen] = useStateC(null);

  return (
    <div className="strat-drill">
      {FM.areas.map(area => {
        const t = agg[area.id];
        const pt = prevAgg ? prevAgg[area.id] : null;
        const d = pt != null ? t - pt : null;
        const isOpen = open === area.id;
        // delta interpretation depends on polarity
        const isNeg = area.polarity === 'negative';
        const deltaGood = d != null && (isNeg ? d < 0 : d > 0);
        const deltaBad = d != null && (isNeg ? d > 0 : d < 0);
        return (
          <div key={area.id} className={'strat-block ' + (isOpen ? 'is-open' : '')}>
            <button
              className="strat-block__head"
              onClick={() => setOpen(isOpen ? null : area.id)}
              style={{ '--strat-color': area.color, '--strat-soft': area.colorSoft }}
            >
              <div className="strat-block__title-row">
                <div className="strat-block__dot" style={{ background: area.color }}></div>
                <span className="strat-block__name">{area.name}</span>
                <span className={'polarity-tag ' + (isNeg ? 'polarity-tag--neg' : 'polarity-tag--pos')}>
                  {isNeg ? '낮을수록 좋음' : '높을수록 좋음'}
                </span>
                <span className="strat-block__desc">{area.desc}</span>
              </div>
              <div className="strat-block__bar-wrap">
                <div className="strat-block__bar">
                  <div className="strat-block__bar-fill" style={{ width: pctOfTComp(t) + '%', background: area.color }}></div>
                  <div className="strat-block__bar-mark" style={{ left: '50%' }} title="전국 평균"></div>
                </div>
                <div className="strat-block__value tnum">
                  <span style={{ color: area.color }}>T {t}</span>
                  {d != null && (
                    <span className={'strat-block__delta delta--' + (deltaGood ? 'up' : deltaBad ? 'down' : 'flat')}>
                      {d > 0 ? '▲' : d < 0 ? '▼' : '–'} {Math.abs(d)}
                    </span>
                  )}
                </div>
                <span className="strat-block__chev">
                  {isOpen ? '▴ 접기' : '▾ ' + countFactors(area) + '개 요인 펼치기'}
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="strat-block__body" style={{ gridTemplateColumns: area.categories.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)' }}>
                {area.categories.map(cat => (
                  <div key={cat.id} className="strat-cat">
                    <div className="strat-cat__head">
                      <span className="strat-cat__name">{cat.name}</span>
                      <span className="strat-cat__val tnum" style={{ color: area.color }}>T {agg[cat.id]}</span>
                    </div>
                    <div className="strat-cat__factors">
                      {cat.factors.map(f => {
                        const ft = agg[f.id];
                        const fpt = prevAgg ? prevAgg[f.id] : null;
                        const fd = (fpt != null && ft != null) ? ft - fpt : null;
                        const lvl = levelOf(ft);
                        const fDeltaGood = fd != null && (isNeg ? fd < 0 : fd > 0);
                        const fDeltaBad = fd != null && (isNeg ? fd > 0 : fd < 0);
                        return (
                          <div key={f.id} className="fac-row">
                            <span className="fac-row__name">{f.name}</span>
                            <div className="fac-row__bar">
                              <div className="fac-row__bar-fill" style={{ width: pctOfTComp(ft) + '%', background: area.color, opacity: 0.85 }}></div>
                              <div className="fac-row__bar-mark"></div>
                            </div>
                            <span className="fac-row__t tnum">T {ft}</span>
                            <span className={'fac-row__lvl lvl-' + lvl}>{LEVEL_COLORS[lvl].label}</span>
                            <span className={'fac-row__delta tnum ' + (fDeltaGood ? 'delta--up' : fDeltaBad ? 'delta--down' : 'delta--flat')}>
                              {fd == null ? '' : (fd > 0 ? '▲' : fd < 0 ? '▼' : '–') + ' ' + Math.abs(fd)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function countFactors(area) {
  return area.categories.reduce((n, c) => n + c.factors.length, 0);
}
function pctOfTComp(t) {
  if (t == null) return 0;
  return Math.max(2, Math.min(98, t));
}

/* ============================================================
 * LPADistribution — single class stacked bar
 * size: 'sm' (used in cards) | 'lg' (used in class detail)
 * ============================================================ */
function LPADistribution({ classData, sessionNo, size = 'lg', showLabel = true }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.comprehensive;
  const dist = window.HSJ_DATA.classLPADist(classData, sessionNo);
  const total = dist.depleted + dist.balanced + dist.immersed;
  if (!total) {
    return <div className="lpa-dist lpa-dist--empty">{sessionNo}차 검사 데이터 없음</div>;
  }
  return (
    <div className={'lpa-dist lpa-dist--' + size}>
      <div className="lpa-dist__bar">
        {FM.lpaTypes.map(t => {
          const n = dist[t.id];
          if (!n) return null;
          const pct = n / total * 100;
          return (
            <div key={t.id}
              className="lpa-dist__seg"
              style={{ width: pct + '%', background: t.color }}
              title={`${t.name} ${n}명 (${Math.round(pct)}%)`}
            >
              {size === 'lg' && pct > 10 && (
                <span>{n}명 ({Math.round(pct)}%)</span>
              )}
            </div>
          );
        })}
      </div>
      {showLabel && (
        <div className="lpa-dist__legend">
          {FM.lpaTypes.map(t => (
            <span key={t.id} className="lpa-legend">
              <span className="lpa-legend__dot" style={{ background: t.color }}></span>
              <span className="lpa-legend__name">{t.name}</span>
              <span className="lpa-legend__count tnum">{dist[t.id]}명</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * LPAFlow — Sankey-like flow between 1차 and 2차 LPA types
 * For class detail. Simplified custom SVG.
 * ============================================================ */
function LPAFlow({ classData, width = 520, height = 280 }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.comprehensive;
  const flow = window.HSJ_DATA.classLPAFlow(classData);
  const d1 = window.HSJ_DATA.classLPADist(classData, 1);
  const d2 = window.HSJ_DATA.classLPADist(classData, 2);
  const total = Object.values(d1).reduce((a, b) => a + b, 0);
  if (!total) return <div className="muted" style={{ padding: 24, textAlign: 'center' }}>검사 데이터 없음</div>;

  const colX = 90, colW = 18, leftX = 80, rightX = width - 80;
  const pad = 28;
  const colH = height - pad * 2;

  // Stack types from depleted→balanced→immersed top-down
  const typeOrder = ['immersed', 'balanced', 'depleted'];
  const buildStack = (dist) => {
    const stack = {};
    let y = pad;
    typeOrder.forEach(id => {
      const n = dist[id];
      const h = total ? (n / total) * colH : 0;
      stack[id] = { y, h, n };
      y += h + (n ? 4 : 0);
    });
    return stack;
  };
  const s1 = buildStack(d1);
  const s2 = buildStack(d2);

  // Internal cursors to allocate flow heights within each column
  const cursor1 = {};
  const cursor2 = {};
  typeOrder.forEach(id => { cursor1[id] = s1[id].y; cursor2[id] = s2[id].y; });

  const ribbons = [];
  // iterate in stable order
  typeOrder.forEach(from => {
    typeOrder.forEach(to => {
      const n = flow[from + '→' + to];
      if (!n) return;
      const h = (n / total) * colH;
      const y1 = cursor1[from];
      const y2 = cursor2[to];
      cursor1[from] += h;
      cursor2[to] += h;
      ribbons.push({ from, to, n, y1, y2, h });
    });
  });

  return (
    <svg width={width} height={height} className="lpa-flow">
      {/* ribbons */}
      {ribbons.map((r, i) => {
        const x1 = leftX + colW;
        const x2 = rightX;
        const cx = (x1 + x2) / 2;
        const path = `M ${x1},${r.y1} C ${cx},${r.y1} ${cx},${r.y2} ${x2},${r.y2} L ${x2},${r.y2 + r.h} C ${cx},${r.y2 + r.h} ${cx},${r.y1 + r.h} ${x1},${r.y1 + r.h} Z`;
        const fromColor = FM.lpaTypes.find(t => t.id === r.from).color;
        const toColor = FM.lpaTypes.find(t => t.id === r.to).color;
        const stable = r.from === r.to;
        return (
          <path key={i} d={path}
            fill={stable ? fromColor : 'url(#flow-grad-' + i + ')'}
            fillOpacity={stable ? 0.22 : 0.35}
          >
            <title>{`${FM.lpaTypes.find(t => t.id === r.from).name} → ${FM.lpaTypes.find(t => t.id === r.to).name}: ${r.n}명`}</title>
          </path>
        );
      })}
      {/* gradients */}
      <defs>
        {ribbons.map((r, i) => {
          const fromColor = FM.lpaTypes.find(t => t.id === r.from).color;
          const toColor = FM.lpaTypes.find(t => t.id === r.to).color;
          return (
            <linearGradient key={i} id={'flow-grad-' + i} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={fromColor} />
              <stop offset="100%" stopColor={toColor} />
            </linearGradient>
          );
        })}
      </defs>
      {/* columns */}
      {[{ col: s1, x: leftX, dist: d1, label: '1차 검사' }, { col: s2, x: rightX - colW, dist: d2, label: '2차 검사' }].map((c, idx) => (
        <g key={idx}>
          <text x={c.x + colW / 2} y={16} textAnchor="middle" fontSize="12" fontWeight="800" fill="#27272A">{c.label}</text>
          {typeOrder.map(id => {
            const seg = c.col[id];
            if (!seg.h) return null;
            const tinfo = FM.lpaTypes.find(t => t.id === id);
            return (
              <g key={id}>
                <rect x={c.x} y={seg.y} width={colW} height={seg.h} fill={tinfo.color} rx="2" />
                <text
                  x={idx === 0 ? c.x - 8 : c.x + colW + 8}
                  y={seg.y + seg.h / 2 + 4}
                  textAnchor={idx === 0 ? 'end' : 'start'}
                  fontSize="11"
                  fontWeight="700"
                  fill="#27272A"
                >
                  {tinfo.name} {seg.n}명
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/* ============================================================
 * CompFactorMatrix
 * Polarity-aware classification of 38 factors into 강점/성장기대/보완.
 * ============================================================ */
function CompFactorMatrix({ agg }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.comprehensive;
  const flat = [];
  FM.areas.forEach(area => {
    area.categories.forEach(cat => {
      cat.factors.forEach(f => {
        flat.push({
          id: f.id, name: f.name,
          cat: cat.name, area: area.name,
          color: area.color, colorSoft: area.colorSoft,
          polarity: area.polarity,
          t: agg[f.id],
          klass: window.HSJ_DATA.classifyCompFactor(agg[f.id], area.polarity),
        });
      });
    });
  });
  const groups = {
    strength: { title: '강점', emoji: '✨', desc: '잘 살려나갈 영역', items: [], hint: '정적 T≥60 · 부적 T≤40' },
    growth:   { title: '성장기대', emoji: '🌱', desc: '조금 더 끌어올릴 영역', items: [], hint: 'T 41~59 보통권' },
    improvement: { title: '보완', emoji: '🔧', desc: '우선 보완할 영역', items: [], hint: '정적 T≤40 · 부적 T≥60' },
  };
  flat.forEach(f => {
    if (f.klass === 'strength') groups.strength.items.push(f);
    else if (f.klass === 'improvement') groups.improvement.items.push(f);
    else groups.growth.items.push(f);
  });
  groups.strength.items.sort((a, b) => (a.polarity === 'negative' ? a.t - b.t : b.t - a.t));
  groups.improvement.items.sort((a, b) => (a.polarity === 'negative' ? b.t - a.t : a.t - b.t));
  groups.growth.items.sort((a, b) => a.t - b.t);

  return (
    <div className="matrix">
      {['strength', 'growth', 'improvement'].map(k => {
        const g = groups[k];
        return (
          <div key={k} className={'matrix__col matrix__col--' + k}>
            <div className="matrix__head">
              <span className="matrix__emoji">{g.emoji}</span>
              <span className="matrix__title">{g.title}</span>
              <span className="matrix__count">{g.items.length}</span>
            </div>
            <div className="matrix__desc">{g.desc} <span style={{ opacity: 0.7 }}>· {g.hint}</span></div>
            <div className="matrix__list">
              {g.items.length === 0 && <div className="matrix__empty">해당 요인이 없습니다</div>}
              {g.items.map(f => (
                <div key={f.id} className="matrix__chip" style={{ background: f.colorSoft, color: f.color }}>
                  <span className="matrix__chip-name">{f.name}</span>
                  <span className="matrix__chip-t tnum">T {f.t}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
 * AreaRadar5 — 5-axis radar of the 5 areas
 * Replaces LPA distribution when hasLPAType=false.
 * Negative-polarity axes are inverted (so all 5 axes consistently
 * show "outward = better").
 * ============================================================ */
function AreaRadar5({ agg, prevAgg, size = 280 }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.comprehensive;
  const cx = size / 2, cy = size / 2 + 4;
  const r = size / 2 - 48;
  const angles = FM.areas.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI / FM.areas.length));

  // "Good-side" value: positive→T as is, negative→100-T (so high = good)
  const good = (sess, id, polarity) => {
    const t = sess[id];
    if (t == null) return null;
    return polarity === 'negative' ? 100 - t : t;
  };

  const polyPoints = (sess) => FM.areas.map((a, i) => {
    const v = (good(sess, a.id, a.polarity) || 50) / 100;
    const ax = cx + Math.cos(angles[i]) * r * v;
    const ay = cy + Math.sin(angles[i]) * r * v;
    return ax + ',' + ay;
  }).join(' ');

  return (
    <svg width={size} height={size} className="area-radar">
      {[0.25, 0.5, 0.75, 1].map(scale => (
        <polygon
          key={scale}
          points={FM.areas.map((_, i) => {
            const ax = cx + Math.cos(angles[i]) * r * scale;
            const ay = cy + Math.sin(angles[i]) * r * scale;
            return ax + ',' + ay;
          }).join(' ')}
          fill="none"
          stroke="#E5E5E7"
          strokeWidth={scale === 0.5 ? 1.5 : 1}
          strokeDasharray={scale === 0.5 ? '0' : '2 3'}
        />
      ))}
      {FM.areas.map((_, i) => {
        const ax = cx + Math.cos(angles[i]) * r;
        const ay = cy + Math.sin(angles[i]) * r;
        return <line key={i} x1={cx} y1={cy} x2={ax} y2={ay} stroke="#E5E5E7" />;
      })}
      {prevAgg && (
        <polygon
          points={polyPoints(prevAgg)}
          fill="rgba(160, 160, 170, 0.08)"
          stroke="#A1A1A8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      )}
      <polygon
        points={polyPoints(agg)}
        fill="rgba(157, 83, 225, 0.18)"
        stroke="var(--brand)"
        strokeWidth="2"
      />
      {FM.areas.map((a, i) => {
        const v = (good(agg, a.id, a.polarity) || 50) / 100;
        const ax = cx + Math.cos(angles[i]) * r * v;
        const ay = cy + Math.sin(angles[i]) * r * v;
        return <circle key={i} cx={ax} cy={ay} r="4" fill={a.color} stroke="#fff" strokeWidth="2" />;
      })}
      {FM.areas.map((a, i) => {
        const offset = 26;
        const ax = cx + Math.cos(angles[i]) * (r + offset);
        const ay = cy + Math.sin(angles[i]) * (r + offset);
        return (
          <g key={i}>
            <text
              x={ax} y={ay - 2}
              textAnchor="middle"
              fontSize="10.5" fontWeight="700"
              fill={a.color}
            >{a.name}</text>
            <text
              x={ax} y={ay + 11}
              textAnchor="middle"
              fontSize="11" fontWeight="700"
              fill="#27272A"
            >T {agg[a.id] ?? '-'}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
 * Mini area bars — used inside class cards on overview
 * ============================================================ */
function CompAreaMiniBars({ agg, prevAgg }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.comprehensive;
  return (
    <div className="cls-card__strats">
      {FM.areas.map(a => {
        const t = agg[a.id];
        const pt = prevAgg ? prevAgg[a.id] : null;
        const d = pt != null ? t - pt : null;
        const isNeg = a.polarity === 'negative';
        const deltaGood = d != null && (isNeg ? d < 0 : d > 0);
        const deltaBad = d != null && (isNeg ? d > 0 : d < 0);
        return (
          <div key={a.id} className="strat-row strat-row--5col">
            <span className="strat-row__label" style={{ color: a.color }}>{a.name}</span>
            <div className="strat-row__bar">
              <div className="strat-row__bar-fill" style={{ width: Math.max(2, Math.min(98, t)) + '%', background: a.color }}></div>
            </div>
            <span className="strat-row__val">T {t}</span>
            <span className={'strat-row__delta ' + (deltaGood ? 'delta--up' : deltaBad ? 'delta--down' : 'delta--flat')}>
              {d == null ? '–' : (d > 0 ? '▲' : d < 0 ? '▼' : '–') + Math.abs(d)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  AreasDrilldown, LPADistribution, LPAFlow, CompFactorMatrix, AreaRadar5, CompAreaMiniBars,
  GradeBandColumnChart, AreaColumnPanels, ProfileLineChart,
});

/* ============================================================
 * ProfileLineChart — vertical profile (꺾은선) like the PDF report.
 * Factors listed top→bottom; T-score plotted left→right over vertical
 * grade bands; dots connected by a zig-zag line. No horizontal scroll.
 * level 'category' | 'factor'
 * ============================================================ */
function ProfileLineChart({ agg, level = 'factor', prevAgg = null, sessionNo = 1, testId = 'comprehensive', onFactorClick }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL[testId];
  const [wrapRef, containerW] = useMeasureWidth();

  // Build rows with area + category grouping (for rowspan-like merged cells)
  const items = []; // { areaIdx, area, catIdx, cat, name, t, prev }
  FM.areas.forEach((a, ai) => {
    a.categories.forEach((c, ci) => {
      if (level === 'factor') {
        c.factors.forEach(f => items.push({ id: f.id, area: a, ai, cat: c, ci, name: f.name, t: agg[f.id], prev: prevAgg ? prevAgg[f.id] : null }));
      } else {
        items.push({ id: c.id, area: a, ai, cat: c, ci, name: c.name, t: agg[c.id], prev: prevAgg ? prevAgg[c.id] : null });
      }
    });
  });

  // Column geometry
  const areaW = 78, catW = 104, nameW = level === 'factor' ? 124 : 0;
  const scoreW = 46, changeW = 54;
  const labelW = areaW + catW + nameW;
  const headerH = 34;
  const rowH = 30;
  const W = Math.max(620, containerW);
  const chartX = labelW;
  const chartW = W - labelW - scoreW - changeW;
  const tMin = 10, tMax = 90;
  const xOf = (t) => chartX + ((Math.max(tMin, Math.min(tMax, t)) - tMin) / (tMax - tMin)) * chartW;

  const totalH = headerH + items.length * rowH + 6;

  // band: only 보통(40-60) shaded, like the reference
  const grayBand = { from: 40, to: 60 };

  // contiguous runs for area + category merged cells
  const runs = (key) => {
    const out = [];
    let start = 0;
    for (let i = 1; i <= items.length; i++) {
      if (i === items.length || items[i][key] !== items[start][key] || (key === 'cat' && items[i].ai !== items[start].ai)) {
        out.push({ start, end: i - 1 });
        start = i;
      }
    }
    return out;
  };
  const areaRuns = runs('area');
  const catRuns = (() => {
    const out = []; let start = 0;
    for (let i = 1; i <= items.length; i++) {
      if (i === items.length || items[i].cat !== items[start].cat) { out.push({ start, end: i - 1 }); start = i; }
    }
    return out;
  })();

  const yOfRow = (i) => headerH + i * rowH;

  // connecting line per area (don't cross areas)
  const segments = areaRuns.map(run => {
    const pts = [];
    for (let i = run.start; i <= run.end; i++) {
      pts.push({ x: xOf(items[i].t), y: yOfRow(i) + rowH / 2, color: items[i].area.color });
    }
    return pts;
  });

  return (
    <div className="profile-wrap" ref={wrapRef}>
      <svg width={W} height={totalH} className="profile-chart">
        {/* gray 보통 band */}
        <rect x={xOf(grayBand.from)} y={0} width={xOf(grayBand.to) - xOf(grayBand.from)} height={totalH} fill="#F2F3F5" />

        {/* header: grade labels + tick numbers */}
        <g>
          {[{l:'매우 낮음',c:20},{l:'낮음',c:35},{l:'보통',c:50},{l:'높음',c:65},{l:'매우 높음',c:80}].map(b => (
            <text key={b.l} x={xOf(b.c)} y={13} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#71717A">{b.l}</text>
          ))}
          {[10,20,30,40,50,60,70,80,90].map(t => (
            <text key={t} x={xOf(t)} y={27} textAnchor="middle" fontSize="9" fill="#A1A1A8">{t}</text>
          ))}
          <text x={labelW + chartW + scoreW/2} y={20} textAnchor="middle" fontSize="11" fontWeight="800" fill="#3F3F46">{sessionNo}차</text>
          <text x={labelW + chartW + scoreW + changeW/2} y={20} textAnchor="middle" fontSize="11" fontWeight="800" fill="#3F3F46">변화</text>
        </g>

        {/* grade band boundary lines at 30·40·60·70 (visible) */}
        {[30, 40, 60, 70].map(t => (
          <line key={'gb' + t} x1={xOf(t)} y1={headerH} x2={xOf(t)} y2={totalH} stroke="#D4D4D8" strokeWidth="1" strokeDasharray="3 3" />
        ))}

        {/* row separators (start after area+category columns so those appear cell-merged) */}
        {items.map((_, i) => (
          <line key={i} x1={areaW + catW} y1={yOfRow(i)} x2={W} y2={yOfRow(i)} stroke="#EFEFF1" strokeWidth="0.8" />
        ))}
        {/* category-run boundary lines across area+category label columns */}
        {catRuns.slice(1).map((run, i) => (
          <line key={'cb' + i} x1={0} y1={yOfRow(run.start)} x2={areaW + catW} y2={yOfRow(run.start)} stroke="#EFEFF1" strokeWidth="0.8" />
        ))}
        {/* clickable row hit areas (factor level) */}
        {level === 'factor' && onFactorClick && items.map((it, i) => (
          <rect key={'hit' + i} x={0} y={yOfRow(i)} width={W} height={rowH}
            className="chart-hitrow"
            fill="transparent" style={{ cursor: 'pointer' }}
            onClick={() => onFactorClick(it.id, it.name)}>
            <title>{`${it.name} · 클릭하여 학생별 점수 보기`}</title>
          </rect>
        ))}
        <line x1={0} y1={totalH} x2={W} y2={totalH} stroke="#E5E5E7" />

        {/* area merged cells */}
        {areaRuns.map((run, i) => {
          const a = items[run.start].area;
          const y0 = yOfRow(run.start), y1 = yOfRow(run.end + 1);
          const cy = (y0 + y1) / 2;
          return (
            <g key={'a' + i}>
              <rect x={0} y={y0} width={areaW} height={y1 - y0} fill={a.colorSoft} />
              <rect x={0} y={y0} width={3} height={y1 - y0} fill={a.color} />
              {(() => {
                const WRAP = { '학습 디딤돌': ['학습','디딤돌'], '긍정적 공부마음': ['긍정적','공부마음'], '학습 걸림돌': ['학습','걸림돌'], '부정적 공부마음': ['부정적','공부마음'] };
                const lines = WRAP[a.name] || [a.name];
                return (
                  <text x={areaW/2 + 1} y={cy - (lines.length > 1 ? 7 : 0)} textAnchor="middle" fontSize="13" fontWeight="800" fill={a.color}>
                    {lines.map((ln, li) => (
                      <tspan key={li} x={areaW/2 + 1} dy={li === 0 ? 0 : 15}>{ln}</tspan>
                    ))}
                  </text>
                );
              })()}
            </g>
          );
        })}

        {/* category merged cells */}
        {catRuns.map((run, i) => {
          const c = items[run.start].cat;
          const a = items[run.start].area;
          const y0 = yOfRow(run.start), y1 = yOfRow(run.end + 1);
          const cy = (y0 + y1) / 2;
          return (
            <g key={'c' + i}>
              <line x1={areaW} y1={y0} x2={areaW} y2={y1} stroke="#E5E5E7" />
              <text x={areaW + catW/2} y={cy + 4} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#52525B">{c.name}</text>
            </g>
          );
        })}
        <line x1={areaW + catW} y1={headerH} x2={areaW + catW} y2={totalH} stroke="#E5E5E7" />

        {/* factor names */}
        {level === 'factor' && items.map((it, i) => (
          <text key={'n' + i} x={areaW + catW + 12} y={yOfRow(i) + rowH/2 + 4} fontSize="12.5" fill="#3F3F46">{it.name}</text>
        ))}
        {level === 'factor' && <line x1={labelW} y1={headerH} x2={labelW} y2={totalH} stroke="#E5E5E7" />}

        {/* connecting lines */}
        {segments.map((pts, si) => {
          if (pts.length < 2) return null;
          const path = pts.map((p,i)=>(i===0?'M':'L')+p.x+','+p.y).join(' ');
          return <path key={si} d={path} fill="none" stroke={pts[0].color} strokeWidth="2" />;
        })}

        {/* dots */}
        {items.map((it, i) => (
          <circle key={'d'+i} cx={xOf(it.t)} cy={yOfRow(i)+rowH/2} r="4.5" fill={it.area.color} stroke="#fff" strokeWidth="1.5">
            <title>{`${it.name} T ${it.t}`}</title>
          </circle>
        ))}

        {/* score column */}
        <line x1={labelW + chartW} y1={0} x2={labelW + chartW} y2={totalH} stroke="#E5E5E7" />
        {items.map((it, i) => (
          <text key={'s'+i} x={labelW + chartW + scoreW/2} y={yOfRow(i)+rowH/2+4} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#27272A">{it.t}</text>
        ))}

        {/* change column */}
        <line x1={labelW + chartW + scoreW} y1={0} x2={labelW + chartW + scoreW} y2={totalH} stroke="#E5E5E7" />
        {items.map((it, i) => {
          if (it.prev == null) return <text key={'ch'+i} x={labelW+chartW+scoreW+changeW/2} y={yOfRow(i)+rowH/2+4} textAnchor="middle" fontSize="11" fill="#D4D4D8">–</text>;
          const d = it.t - it.prev;
          const isNeg = it.area.polarity === 'negative';
          const good = isNeg ? d < 0 : d > 0;
          const color = d === 0 ? '#A1A1A8' : good ? '#2ECC71' : '#E74C3C';
          return <text key={'ch'+i} x={labelW+chartW+scoreW+changeW/2} y={yOfRow(i)+rowH/2+4} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{d>0?'▲':d<0?'▼':'–'}{d!==0?Math.abs(d):''}</text>;
        })}
      </svg>
    </div>
  );
}

/* ============================================================
 * GradeBandColumnChart
 * Signature chart from the official 보고서: vertical columns with
 * grade-band backgrounds (매우낮음~매우높음), grouped by 5 areas.
 * - level 'category' (11 cols) / 'factor' (all 38)
 * - areaId set → render only that area's factors (for small-multiples)
 * - fluid: measures container width, fills it (no scroll for reasonable n)
 * ============================================================ */
function useMeasureWidth() {
  const ref = useRefC(null);
  const [w, setW] = useStateC(0);
  useEffectC(() => {
    let raf = 0;
    const read = () => {
      const el = ref.current;
      if (!el) return;
      const next = Math.round(el.getBoundingClientRect().width);
      setW(prev => (Math.abs(next - prev) > 2 ? next : prev));
    };
    read();
    const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(read); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  // fallback width until measured
  return [ref, w || 900];
}

function GradeBandColumnChart({ agg, level = 'category', areaId = null, height = 360, testId = 'comprehensive', onFactorClick }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL[testId];
  const [wrapRef, containerW] = useMeasureWidth();

  // Build column list grouped by area
  const areasToUse = areaId ? FM.areas.filter(a => a.id === areaId) : FM.areas;
  const groups = areasToUse.map(a => {
    let cols;
    if (level === 'factor' || areaId) {
      cols = a.categories.flatMap(c => c.factors.map(f => ({ id: f.id, name: f.name, t: agg[f.id] })));
    } else {
      cols = a.categories.map(c => ({ id: c.id, name: c.name, t: agg[c.id] }));
    }
    return { area: a, cols };
  });
  const allCols = groups.flatMap(g => g.cols);
  const n = allCols.length || 1;

  const pad = { l: 44, r: 16, t: 16, b: areaId ? 52 : 74 };
  const colGap = 10;
  const groupGap = 14; // gap between area groups
  const nGroupGaps = areaId ? 0 : Math.max(0, groups.length - 1);
  // Fluid: use container width; only scroll if columns would be < 22px
  const minColW = 22;
  const availW = Math.max(320, containerW) - pad.l - pad.r;
  const totalGaps = colGap * (n - groups.length) + groupGap * nGroupGaps; // within-group gaps + between-group gaps
  const fitColW = (availW - totalGaps) / n;
  const slotW = Math.max(minColW, fitColW); // slot fills full width
  const barW = Math.min(areaId ? 34 : 30, slotW); // bar centered in slot
  const colW = slotW;
  const innerW = colW * n + totalGaps;
  const needsScroll = fitColW < minColW;
  const W = innerW + pad.l + pad.r;
  const plotH = height - pad.t - pad.b;
  const yOf = (t) => pad.t + (1 - t / 100) * plotH;

  const bands = [
    { from: 70, to: 100, label: '매우높음', fill: '#EAF6EE' },
    { from: 60, to: 70,  label: '높음',     fill: '#F2FAF4' },
    { from: 40, to: 60,  label: '보통',     fill: '#F7F7F8' },
    { from: 30, to: 40,  label: '낮음',     fill: '#FEF4EC' },
    { from: 0,  to: 30,  label: '매우낮음', fill: '#FDEEEC' },
  ];

  return (
    <div className="gbc-wrap" ref={wrapRef} style={{ overflowX: needsScroll ? 'auto' : 'hidden' }}>
      <svg width={W} height={height} className="gbc" style={{ minWidth: needsScroll ? W : '100%', display: 'block' }}>
        {bands.map(b => {
          const y = yOf(b.to);
          const h = yOf(b.from) - yOf(b.to);
          return (
            <g key={b.label}>
              <rect x={pad.l} y={y} width={innerW} height={h} fill={b.fill} />
              <text x={pad.l + 6} y={y + 13} fontSize="10" fill="#A1A1A8" fontWeight="600">{b.label}</text>
            </g>
          );
        })}
        {[0, 20, 40, 50, 60, 80, 100].map(t => (
          <g key={t}>
            <line x1={pad.l} y1={yOf(t)} x2={pad.l + innerW} y2={yOf(t)}
              stroke={t === 50 ? '#9CA3AF' : '#E5E5E7'} strokeWidth={t === 50 ? 1.3 : 0.7}
              strokeDasharray={t === 50 ? '4 4' : '0'} />
            <text x={pad.l - 8} y={yOf(t) + 4} textAnchor="end" fontSize="10.5" fill="#71717A">{t}</text>
          </g>
        ))}

        {(() => {
          let x = pad.l;
          const out = [];
          groups.forEach((g, gi) => {
            const groupStart = x;
            g.cols.forEach((c, ci) => {
              const barH = (c.t / 100) * plotH;
              const y = yOf(c.t);
              const labelRot = colW < 50;
              const barX = x + (colW - barW) / 2;
              const clickable = onFactorClick && (level === 'factor' || areaId);
              out.push(
                <g key={c.id} style={clickable ? { cursor: 'pointer' } : undefined}
                  onClick={clickable ? () => onFactorClick(c.id, c.name) : undefined}>
                  {clickable && <rect x={x} y={pad.t} width={colW} height={plotH} className="chart-hitcol" fill="transparent" />}
                  <rect x={barX} y={y} width={barW} height={barH} rx="3" fill={g.area.color} opacity="0.9">
                    <title>{`${c.name} T ${c.t}${clickable ? ' · 클릭하여 학생별 점수 보기' : ''}`}</title>
                  </rect>
                  <text x={x + colW / 2} y={y - 5} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={g.area.color}>{c.t}</text>
                  <text x={x + colW / 2} y={height - pad.b + 14} textAnchor={labelRot ? 'end' : 'middle'} fontSize="10" fill="#52525B"
                    transform={labelRot ? `rotate(-40 ${x + colW / 2} ${height - pad.b + 14})` : ''}>{c.name}</text>
                </g>
              );
              x += colW + (ci < g.cols.length - 1 ? colGap : 0);
            });
            const groupEnd = x;
            if (!areaId) {
              out.push(
                <g key={'g' + gi}>
                  <line x1={groupStart} y1={height - pad.b + 40} x2={groupEnd} y2={height - pad.b + 40} stroke={g.area.color} strokeWidth="2" />
                  <text x={(groupStart + groupEnd) / 2} y={height - pad.b + 56} textAnchor="middle" fontSize="11" fontWeight="800" fill={g.area.color}>
                    {g.area.name}
                  </text>
                </g>
              );
            }
            if (gi < groups.length - 1) x += groupGap; // gap between area groups only
          });
          return out;
        })()}
      </svg>
      {FM.areas.some(a => a.polarity === 'negative') && !areaId && (
        <div className="gbc-note"><strong className="gbc-note__ref">참고!</strong> 학습 걸림돌·부정적 공부마음은 <strong>부적 요인</strong>으로, 점수가 <strong>낮을수록</strong> 좋습니다.</div>
      )}
    </div>
  );
}

/* Small-multiples: one fluid mini column chart per area, stacked full-width */
function AreaColumnPanels({ agg, testId = 'comprehensive', onFactorClick }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL[testId];
  return (
    <div className="area-panels">
      {FM.areas.map(a => (
        <div key={a.id} className="area-panel">
          <div className="area-panel__head">
            <span className="area-panel__dot" style={{ background: a.color }}></span>
            <span className="area-panel__name" style={{ color: a.color }}>{a.name}</span>
            {a.polarity === 'negative' && <span className="polarity-tag polarity-tag--neg">낮을수록 좋음</span>}
            <span className="area-panel__t tnum">반 평균 T {agg[a.id]}</span>
          </div>
          <GradeBandColumnChart agg={agg} areaId={a.id} height={240} testId={testId} onFactorClick={onFactorClick} />
        </div>
      ))}
    </div>
  );
}
