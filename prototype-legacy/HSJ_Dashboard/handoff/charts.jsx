/* HSJ Dashboard — Chart components (SVG, hand-built)
 * Exported to window: StrategyBarsDrilldown, StrategyTriangle, FactorMatrix, ChangeScatter, TScale
 */

const { useState, useMemo, useRef, useEffect } = React;

/* ---------- T-score level helpers ---------- */
const LEVEL_COLORS = {
  veryLow:  { bg: '#FFE2DC', text: '#C0392B', label: '매우 낮음' },
  low:      { bg: '#FFEFD5', text: '#D68910', label: '낮음' },
  normal:   { bg: '#E8E8EB', text: '#5F6368', label: '보통' },
  high:     { bg: '#D6F2E2', text: '#1E8449', label: '높음' },
  veryHigh: { bg: '#C8E9D2', text: '#0E6B3C', label: '매우 높음' },
};
function levelOf(t) {
  if (t == null) return null;
  if (t < 30) return 'veryLow';
  if (t < 40) return 'low';
  if (t < 60) return 'normal';
  if (t < 70) return 'high';
  return 'veryHigh';
}

/* ============================================================
 * StrategyBarsDrilldown
 * Main signature widget for 자기조절학습검사 반 결과:
 * Three big strategy bars; click to drill into 17/20 sub-factors.
 * ============================================================ */
function StrategyBarsDrilldown({ classData, agg, sessionNo, prevAgg }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.selfreg;
  const [openStrat, setOpenStrat] = useState(null);

  return (
    <div className="strat-drill">
      {FM.strategies.map((strat) => {
        const t = agg[strat.id];
        const prevT = prevAgg ? prevAgg[strat.id] : null;
        const delta = (prevT != null && t != null) ? t - prevT : null;
        const isOpen = openStrat === strat.id;
        return (
          <div key={strat.id} className={'strat-block ' + (isOpen ? 'is-open' : '')}>
            <button
              className="strat-block__head"
              onClick={() => setOpenStrat(isOpen ? null : strat.id)}
              style={{ '--strat-color': strat.color, '--strat-soft': strat.colorSoft }}
            >
              <div className="strat-block__title-row">
                <div className="strat-block__dot" style={{ background: strat.color }}></div>
                <span className="strat-block__name">{strat.name}</span>
                <span className="strat-block__desc">{strat.desc}</span>
              </div>
              <div className="strat-block__bar-wrap">
                <div className="strat-block__bar">
                  <div className="strat-block__bar-fill" style={{ width: pctOfT(t) + '%', background: strat.color }}></div>
                  <div className="strat-block__bar-mark" style={{ left: '50%' }} title="전국 평균"></div>
                </div>
                <div className="strat-block__value tnum">
                  <span style={{ color: strat.color }}>T {t}</span>
                  {delta != null && (
                    <span className={'strat-block__delta delta--' + (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat')}>
                      {delta > 0 ? '▲' : delta < 0 ? '▼' : '–'} {Math.abs(delta)}
                    </span>
                  )}
                </div>
                <span className="strat-block__chev">{isOpen ? '▴ 접기' : '▾ 17개 요인 펼치기'}</span>
              </div>
            </button>

            {isOpen && (
              <div className="strat-block__body">
                {strat.categories.map((cat) => (
                  <div key={cat.id} className="strat-cat">
                    <div className="strat-cat__head">
                      <span className="strat-cat__name">{cat.name}</span>
                      <span className="strat-cat__val tnum" style={{ color: strat.color }}>T {agg[cat.id]}</span>
                    </div>
                    <div className="strat-cat__factors">
                      {cat.factors.map(f => {
                        const ft = agg[f.id];
                        const fpt = prevAgg ? prevAgg[f.id] : null;
                        const fd = (fpt != null && ft != null) ? ft - fpt : null;
                        const lvl = levelOf(ft);
                        return (
                          <div key={f.id} className="fac-row">
                            <span className="fac-row__name">{f.name}</span>
                            <div className="fac-row__bar">
                              <div className="fac-row__bar-fill" style={{ width: pctOfT(ft) + '%', background: strat.color, opacity: 0.85 }}></div>
                              <div className="fac-row__bar-mark"></div>
                            </div>
                            <span className="fac-row__t tnum">T {ft}</span>
                            <span className={'fac-row__lvl lvl-' + lvl}>{LEVEL_COLORS[lvl].label}</span>
                            <span className={'fac-row__delta tnum ' + (fd > 0 ? 'delta--up' : fd < 0 ? 'delta--down' : 'delta--flat')}>
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

function pctOfT(t) {
  if (t == null) return 0;
  return Math.max(2, Math.min(98, t));
}

/* ============================================================
 * StrategyTriangle
 * Replaces LPA type distribution for 자기조절학습검사.
 * Shows 동기/인지/행동 balance as a triangular radar.
 * ============================================================ */
function StrategyTriangle({ agg, prevAgg, size = 240 }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.selfreg;
  const cx = size / 2, cy = size / 2 + 6;
  const r = size / 2 - 36;
  // 3 points: motivation top, cognition bottom-right, behavior bottom-left
  const angles = [-Math.PI / 2, Math.PI / 6, Math.PI - Math.PI / 6];
  const labels = ['동기', '인지', '행동'];
  const colors = FM.strategies.map(s => s.color);
  const ids = FM.strategies.map(s => s.id);

  const polyPoints = (vals, scale = 1) => ids.map((id, i) => {
    const v = (vals[id] || 50) / 100;
    const ax = cx + Math.cos(angles[i]) * r * v * scale;
    const ay = cy + Math.sin(angles[i]) * r * v * scale;
    return ax + ',' + ay;
  }).join(' ');

  return (
    <svg width={size} height={size} className="strat-triangle">
      {/* concentric guides */}
      {[0.25, 0.5, 0.75, 1].map(scale => (
        <polygon
          key={scale}
          points={ids.map((_, i) => {
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
      {/* axes */}
      {ids.map((_, i) => {
        const ax = cx + Math.cos(angles[i]) * r;
        const ay = cy + Math.sin(angles[i]) * r;
        return <line key={i} x1={cx} y1={cy} x2={ax} y2={ay} stroke="#E5E5E7" strokeWidth="1" />;
      })}
      {/* prev (1차) polygon */}
      {prevAgg && (
        <polygon
          points={polyPoints(prevAgg)}
          fill="rgba(160, 160, 170, 0.08)"
          stroke="#A1A1A8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      )}
      {/* current polygon */}
      <polygon
        points={polyPoints(agg)}
        fill="rgba(0, 159, 136, 0.16)"
        stroke="var(--brand)"
        strokeWidth="2"
      />
      {/* current points */}
      {ids.map((id, i) => {
        const v = (agg[id] || 50) / 100;
        const ax = cx + Math.cos(angles[i]) * r * v;
        const ay = cy + Math.sin(angles[i]) * r * v;
        return <circle key={i} cx={ax} cy={ay} r="4" fill={colors[i]} stroke="#fff" strokeWidth="2" />;
      })}
      {/* labels */}
      {ids.map((id, i) => {
        const offset = 22;
        const ax = cx + Math.cos(angles[i]) * (r + offset);
        const ay = cy + Math.sin(angles[i]) * (r + offset);
        return (
          <g key={i}>
            <text
              x={ax} y={ay - 4}
              textAnchor="middle"
              fontSize="12" fontWeight="700"
              fill={colors[i]}
            >{labels[i]}</text>
            <text
              x={ax} y={ay + 11}
              textAnchor="middle"
              fontSize="13" fontWeight="800"
              fill="#27272A"
            >T {agg[id] || '-'}</text>
          </g>
        );
      })}
      {/* center label */}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fill="#71717A">T 50 (평균)</text>
    </svg>
  );
}

/* ============================================================
 * FactorMatrix
 * Classifies factors into 강점(strength) / 보완(improvement) / 성장기대(growth).
 * Shown as 3-column board with factor chips per strategy color.
 * ============================================================ */
function FactorMatrix({ agg }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.selfreg;
  const flat = [];
  FM.strategies.forEach(strat => {
    strat.categories.forEach(cat => {
      cat.factors.forEach(f => {
        flat.push({
          id: f.id,
          name: f.name,
          cat: cat.name,
          strat: strat.name,
          color: strat.color,
          colorSoft: strat.colorSoft,
          t: agg[f.id],
        });
      });
    });
  });

  const groups = {
    strength: { title: '강점', emoji: '✨', desc: 'T ≥ 60 — 잘 살려나갈 영역', items: [], color: 'var(--status-good)' },
    growth:   { title: '성장기대', emoji: '🌱', desc: 'T 41~59 — 조금 더 끌어올릴 영역', items: [], color: 'var(--brand)' },
    improvement: { title: '보완', emoji: '🔧', desc: 'T ≤ 40 — 우선 보완할 영역', items: [], color: 'var(--status-risk)' },
  };
  flat.forEach(f => {
    if (f.t >= 60) groups.strength.items.push(f);
    else if (f.t <= 40) groups.improvement.items.push(f);
    else groups.growth.items.push(f);
  });
  // sort: strength desc T, improvement asc T (worst first), growth balanced
  groups.strength.items.sort((a, b) => b.t - a.t);
  groups.improvement.items.sort((a, b) => a.t - b.t);
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
            <div className="matrix__desc">{g.desc}</div>
            <div className="matrix__list">
              {g.items.length === 0 && (
                <div className="matrix__empty">해당 요인이 없습니다</div>
              )}
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
 * ChangeScatter
 * 1차 vs 2차 scatter. Diagonal = no change. Above = growth.
 * Shows per-student dots colored by 동기/인지/행동 strategy.
 * ============================================================ */
function ChangeScatter({ classData, dimension = 'overall', width = 380, height = 280 }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.selfreg;
  const pad = { l: 36, r: 16, t: 18, b: 30 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const min = 20, max = 80;
  const xS = t => pad.l + (t - min) / (max - min) * w;
  const yS = t => pad.t + (1 - (t - min) / (max - min)) * h;

  const dim = dimension; // 'motivation' | 'cognition' | 'behavior' | 'overall'
  const dotsPerStrat = FM.strategies.map(s => s.id);

  function dimValue(s, dimId, sess) {
    if (dimId === 'overall') {
      const vals = dotsPerStrat.map(id => s.sessions[sess][id]);
      return Math.round(vals.reduce((a,b)=>a+b,0) / vals.length);
    }
    return s.sessions[sess][dimId];
  }

  const strat = FM.strategies.find(s => s.id === dim);
  const color = strat ? strat.color : 'var(--brand)';

  const items = (classData?.students || []).map(s => ({
    name: s.name,
    num: s.num,
    a: dimValue(s, dim, 1),
    b: dimValue(s, dim, 2),
  }));

  return (
    <svg width={width} height={height} className="scatter">
      {/* axis grid */}
      {[30, 40, 50, 60, 70].map(t => (
        <g key={t}>
          <line x1={xS(t)} y1={pad.t} x2={xS(t)} y2={pad.t + h} stroke="#F0F0F2" />
          <line x1={pad.l} y1={yS(t)} x2={pad.l + w} y2={yS(t)} stroke="#F0F0F2" />
        </g>
      ))}
      {/* T=50 reference */}
      <line x1={xS(50)} y1={pad.t} x2={xS(50)} y2={pad.t + h} stroke="#D4D4D8" strokeDasharray="3 3" />
      <line x1={pad.l} y1={yS(50)} x2={pad.l + w} y2={yS(50)} stroke="#D4D4D8" strokeDasharray="3 3" />
      {/* diagonal */}
      <line x1={xS(min)} y1={yS(min)} x2={xS(max)} y2={yS(max)} stroke="#A1A1A8" strokeWidth="1.25" />
      <text x={xS(75)} y={yS(78)} fontSize="10.5" fill="#2ECC71" fontWeight="700">↗ 성장</text>
      <text x={xS(35)} y={yS(28)} fontSize="10.5" fill="#E74C3C" fontWeight="700">↘ 퇴보</text>
      {/* dots */}
      {items.map((it, i) => (
        <g key={i}>
          <circle cx={xS(it.a)} cy={yS(it.b)} r="5" fill={color} fillOpacity="0.7" stroke="#fff" strokeWidth="1.5">
            <title>{`${it.num}번 ${it.name} · 1차 T${it.a} → 2차 T${it.b}`}</title>
          </circle>
        </g>
      ))}
      {/* axis labels */}
      {[30, 50, 70].map(t => (
        <g key={'x' + t}>
          <text x={xS(t)} y={pad.t + h + 16} fontSize="10.5" fill="#71717A" textAnchor="middle">{t}</text>
        </g>
      ))}
      {[30, 50, 70].map(t => (
        <g key={'y' + t}>
          <text x={pad.l - 8} y={yS(t) + 3} fontSize="10.5" fill="#71717A" textAnchor="end">{t}</text>
        </g>
      ))}
      <text x={pad.l + w/2} y={height - 6} fontSize="11" fill="#52525B" textAnchor="middle">1차 검사 T</text>
      <text x={12} y={pad.t + h/2} fontSize="11" fill="#52525B" textAnchor="middle" transform={`rotate(-90 12 ${pad.t + h/2})`}>2차 검사 T</text>
    </svg>
  );
}

/* ============================================================
 * TScale — small inline T score scale (0-100 bar with marker)
 * ============================================================ */
function TScale({ t, color }) {
  const pct = Math.max(0, Math.min(100, t || 0));
  return (
    <div className="tscale">
      <div className="tscale__bar">
        <div className="tscale__fill" style={{ width: pct + '%', background: color || 'var(--brand)' }}></div>
        <div className="tscale__mark" style={{ left: '50%' }}></div>
      </div>
    </div>
  );
}

// expose
Object.assign(window, {
  StrategyBarsDrilldown,
  StrategyTriangle,
  FactorMatrix,
  ChangeScatter,
  TScale,
  levelOf,
  LEVEL_COLORS,
});
