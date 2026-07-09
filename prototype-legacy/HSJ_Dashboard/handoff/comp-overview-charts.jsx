/* HSJ Dashboard — Comparison charts for the overview page
 * AreaLineChart, LPAComparisonRow, OverviewSummaryPanel
 */

const { useState: useStateOC, useMemo: useMemoOC } = React;

/* ============================================================
 * AreaLineChart
 * Multi-series line chart with X = areas/categories, Y = T-score.
 * Supports "highlight" (mute non-selected lines + label points)
 * and horizontal scroll for many points.
 * ============================================================ */
function AreaLineChart({
  series,        // [{ id, label, color, data: number[] }]
  xLabels,       // [string]
  highlightId = null,
  height = 380,
  scrollable = false,
  onSelectClass,
}) {
  const yMin = 20, yMax = 80;
  const pad = { l: 56, r: 24, t: 26, b: 64 };
  const [wrapRef, containerW] = useMeasureWidth();
  const minWidthPerLabel = scrollable ? 100 : 0;
  const naturalWidth = scrollable
    ? Math.max(680, xLabels.length * minWidthPerLabel + pad.l + pad.r)
    : Math.max(680, containerW);

  return (
    <div className="line-chart-wrap" style={{ overflowX: scrollable ? 'auto' : 'visible' }}>
      <svg className="line-chart" width={naturalWidth} height={height}
        style={{ minWidth: scrollable ? naturalWidth : 'auto' }}>
        {/* grid lines */}
        {[20, 35, 50, 65, 80].map(t => {
          const y = pad.t + (1 - (t - yMin) / (yMax - yMin)) * (height - pad.t - pad.b);
          return (
            <g key={t}>
              <line
                x1={pad.l} y1={y}
                x2={naturalWidth - pad.r} y2={y}
                stroke={t === 50 ? '#A1A1A8' : '#EEEEEF'}
                strokeWidth={t === 50 ? 1.2 : 1}
                strokeDasharray={t === 50 ? '4 4' : '0'}
              />
              <text x={pad.l - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#71717A">{t}</text>
            </g>
          );
        })}
        {/* 전국평균 label on T=50 */}
        <text x={naturalWidth - pad.r} y={pad.t + (1 - (50 - yMin) / (yMax - yMin)) * (height - pad.t - pad.b) - 4}
          textAnchor="end" fontSize="11" fill="#71717A">전국평균</text>

        {/* X axis labels */}
        {xLabels.map((label, i) => {
          const x = pad.l + (i / Math.max(1, xLabels.length - 1)) * (naturalWidth - pad.l - pad.r);
          if (scrollable && label.length > 4) {
            return (
              <g key={i}>
                <text x={x} y={height - pad.b + 22} textAnchor="end" fontSize="11.5" fontWeight="600" fill="#52525B"
                  transform={`rotate(-32 ${x} ${height - pad.b + 22})`}>{label}</text>
              </g>
            );
          }
          const parts = label.includes(' ') ? label.split(' ') : [label];
          return (
            <g key={i}>
              <text x={x} y={height - pad.b + 20} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#52525B">
                {parts.map((p, pi) => <tspan key={pi} x={x} dy={pi === 0 ? 0 : 13}>{p}</tspan>)}
              </text>
            </g>
          );
        })}

        {/* Lines */}
        {series.map(s => {
          const isMuted = highlightId && s.id !== highlightId;
          const isHighlight = highlightId && s.id === highlightId;
          const stroke = isMuted ? '#D4D4D8' : s.color;
          const strokeWidth = isHighlight ? 2.5 : (highlightId ? 1.5 : 2);
          const opacity = isMuted ? 0.45 : 1;
          const pts = s.data.map((v, i) => {
            const x = pad.l + (i / Math.max(1, xLabels.length - 1)) * (naturalWidth - pad.l - pad.r);
            const y = pad.t + (1 - (v - yMin) / (yMax - yMin)) * (height - pad.t - pad.b);
            return { x, y, v };
          });
          const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
          return (
            <g key={s.id} style={{ opacity, cursor: onSelectClass ? 'pointer' : 'default' }}
              onClick={onSelectClass ? () => onSelectClass(s.id) : undefined}>
              <path d={path} stroke="transparent" strokeWidth="14" fill="none" />
              <path d={path} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={isHighlight ? 4.5 : 3.5}
                  fill="#fff" stroke={stroke} strokeWidth="2" />
              ))}
              {/* Value labels when highlighted */}
              {isHighlight && pts.map((p, i) => (
                <text key={i} x={p.x} y={p.y - 10} textAnchor="middle"
                  fontSize="11.5" fontWeight="700" fill={stroke}>{p.v}</text>
              ))}
            </g>
          );
        })}
      </svg>
      {scrollable && (
        <div className="line-chart__scroll-hint">← 좌우로 스크롤하여 모든 요인을 확인하세요 →</div>
      )}
    </div>
  );
}

/* ============================================================
 * OverviewSummaryPanel
 * Right side of the comparison chart card.
 * Shows overall comparison highlights OR a single class's summary.
 * ============================================================ */
function OverviewSummaryPanel({ classes, sessionNo, level, selectedClassId, onGoToClass, testId = 'comprehensive' }) {
  // level: '5areas' | '11categories'
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL[testId];
  const completed = classes.filter(c => data.progressOf(c, testId, sessionNo) > 0);

  if (selectedClassId) {
    const cls = classes.find(c => c.id === selectedClassId);
    return <ClassSummaryPanel cls={cls} sessionNo={sessionNo} onGoToClass={onGoToClass} testId={testId} />;
  }

  // 정책: 반×영역 셀의 학년 평균 대비 편차(아웃라이어) 추출
  const dims = level === '11categories'
    ? FM.areas.flatMap(a => a.categories.map(c => ({ id: c.id, name: c.name, areaColor: a.color, polarity: a.polarity })))
    : FM.areas.map(a => ({ id: a.id, name: a.name, areaColor: a.color, polarity: a.polarity }));

  const aggs = completed.map(cls => ({ cls, agg: data.classAggregate(cls, sessionNo, testId) }));
  const cells = [];
  dims.forEach(dim => {
    const vals = aggs.map(x => x.agg[dim.id]).filter(v => v != null);
    if (!vals.length) return;
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    aggs.forEach(({ cls, agg }) => {
      const t = agg[dim.id];
      if (t == null) return;
      const delta = Math.round(t - mean);
      const positiveSignal = dim.polarity === 'negative' ? delta < 0 : delta > 0;
      cells.push({ cls, dim, t, delta, kind: positiveSignal ? 'good' : 'warn', strong: Math.abs(delta) >= 3 });
    });
  });
  // 주의 우선, 그 다음 편차 절댓값 큰 순
  cells.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'warn' ? -1 : 1) || 0);
  cells.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'warn' ? -1 : 1;
    return Math.abs(b.delta) - Math.abs(a.delta);
  });
  const ranked = cells.filter(c => c.strong);
  const pool = ranked.length ? ranked : cells;
  const callouts = pool.slice(0, 4).map(c => ({
    kind: c.kind,
    cls: c.cls,
    title: `${c.dim.name} — ${c.cls.label}`,
    body: `학년 평균보다 ${c.delta > 0 ? '+' : ''}${c.delta || 1} ${c.delta >= 0 ? '높음' : '낮음'}`,
    color: c.dim.areaColor,
  }));
  // 데이터가 전혀 없을 때 목업 채움
  if (callouts.length === 0) {
    const a0 = dims[Math.min(3, dims.length - 1)] || dims[0];
    const a1 = dims[0];
    const c0 = completed[0] || classes[0];
    if (a0 && c0) callouts.push({ kind: 'warn', cls: c0, title: `${a0.name} — ${c0.label}`, body: '학년 평균보다 +8 높음', color: a0.areaColor });
    if (a1 && c0) callouts.push({ kind: 'good', cls: c0, title: `${a1.name} — ${c0.label}`, body: '학년 평균보다 +6 높음', color: a1.areaColor });
  }

  return (
    <div className="osp">
      <div className="osp__head">
        <div className="osp__title">전체 비교 요약</div>
        <div className="osp__sub">학년 평균과 가장 차이 나는 지점이에요</div>
      </div>
      <div className="osp__callouts">
        {callouts.length === 0 && <div className="muted" style={{ fontSize: 12 }}>모든 반이 영역별로 고른 분포예요.</div>}
        {callouts.map((c, i) => (
          <button key={i} className={'osp__callout osp__callout--' + c.kind} onClick={() => c.cls && onGoToClass(c.cls.id)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: 0, fontFamily: 'inherit' }}>
            <span className="osp__callout-icon">
              {c.kind === 'warn' ? '🔻' : '🔺'}
            </span>
            <div className="osp__callout-body">
              <div className="osp__callout-title">{c.title}</div>
              <div className="osp__callout-desc">{c.body}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="osp__class-buttons" style={{ display: 'none' }}>
        {completed.map(c => (
          <button key={c.id} className="btn btn--xs" onClick={() => onGoToClass(c.id)}>
            <span className="dot" style={{ background: '#A78BFA', width: 6, height: 6, borderRadius: '50%' }}></span>
            {c.label} 상세
          </button>
        ))}
      </div>
    </div>
  );
}

function ClassSummaryPanel({ cls, sessionNo, onGoToClass, testId = 'comprehensive' }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL[testId];
  const lpaOn = FM.hasLPAType;
  const agg = data.classAggregate(cls, sessionNo, testId);
  const avgT = Math.round((FM.areas.filter(a => a.polarity === 'positive').map(a => agg[a.id]).reduce((s, v) => s + v, 0)
    + FM.areas.filter(a => a.polarity === 'negative').map(a => 100 - agg[a.id]).reduce((s, v) => s + v, 0)) / FM.areas.length);
  const dist = lpaOn ? data.classLPADist(cls, sessionNo) : { depleted: 0, balanced: 0, immersed: 0 };
  const total = dist.depleted + dist.balanced + dist.immersed;
  // Areas of concern
  const concerns = FM.areas
    .map(a => ({ ...a, t: agg[a.id], score: a.polarity === 'negative' ? a.t - 50 : 50 - a.t }))
    .filter(a => a.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  const dominant = lpaOn ? Object.entries(dist).sort((a, b) => b[1] - a[1])[0] : null;
  const dominantType = dominant ? FM.lpaTypes.find(t => t.id === dominant[0]) : null;

  return (
    <div className="osp">
      <div className="osp__head">
        <div className="osp__title row" style={{ gap: 6 }}>
          <span className="dot" style={{ background: 'var(--brand)', width: 8, height: 8, borderRadius: '50%' }}></span>
          {cls.label} 분석 요약
        </div>
        <div className="osp__sub">학생 {cls.size}명 · {sessionNo}차 검사 완료</div>
      </div>
      <div className="osp__kpis">
        <div className="osp__kpi">
          <div className="osp__kpi-label">평균 T점수</div>
          <div className="osp__kpi-value tnum">{avgT}.0</div>
          <div className="osp__kpi-sub">전국 대비 {avgT - 50 >= 0 ? '+' : ''}{avgT - 50}</div>
        </div>
        <div className="osp__kpi">
          <div className="osp__kpi-label">관심 필요</div>
          <div className="osp__kpi-value tnum" style={{ color: 'var(--status-risk)' }}>{lpaOn ? dist.depleted + '명' : '-'}</div>
          <div className="osp__kpi-sub">{lpaOn && total ? Math.round(dist.depleted / total * 100) + '%' : ''}</div>
        </div>
      </div>
      {concerns.length > 0 && (
        <>
          <div className="osp__section-label">관심 영역 ({concerns.length})</div>
          <div className="osp__concerns">
            {concerns.map(a => (
              <div key={a.id} className="osp__concern" style={{ borderColor: a.color }}>
                <span className="osp__concern-name" style={{ color: a.color }}>{a.name}</span>
                <span className="osp__concern-t tnum">T {a.t} {a.polarity === 'negative' ? '↑' : '↓'}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {lpaOn && (<>
      <div className="osp__section-label">유형 분포</div>
      <LPADistribution classData={cls} sessionNo={sessionNo} size="sm" showLabel={false} />
      <div className="osp__lpa-counts">
        {FM.lpaTypes.map(t => (
          <span key={t.id} className="osp__lpa-pill">
            <span className="osp__lpa-pill-dot" style={{ background: t.color }}></span>
            <span>{dist[t.id]}</span>
            <span className="osp__lpa-pill-name">{t.name.split(/\s/)[0]}</span>
          </span>
        ))}
      </div>
      <div className="osp__section-label" style={{ marginTop: 12 }}>우세 유형</div>
      <div className="osp__dominant">
        {dominantType && <span className="chip" style={{ background: dominantType.colorSoft, color: dominantType.color }}>{dominantType.name}</span>}
      </div>
      </>)}
      <button className="btn btn--brand mt-12" style={{ width: '100%', justifyContent: 'center', padding: '10px 14px' }}
        onClick={() => onGoToClass(cls.id)}>
        {cls.label} 상세 분석 보기 →
      </button>
    </div>
  );
}

/* ============================================================
 * LPAComparisonRow — bottom card showing per-class LPA stacked bars
 * ============================================================ */
function LPAComparisonRow({ cls, onDetail }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL.comprehensive;
  const renderBar = (sessionNo) => {
    const done = data.progressOf(cls, 'comprehensive', sessionNo) > 0;
    const dist = done ? data.classLPADist(cls, sessionNo) : { depleted: 0, balanced: 0, immersed: 0 };
    const total = dist.depleted + dist.balanced + dist.immersed;
    return (
      <div className="lpa-compare-cell">
        <span className="lpa-compare-cell__tag">{sessionNo}차</span>
        {total === 0 ? (
          <div className="lpa-compare-empty">{sessionNo}차 검사 미실시</div>
        ) : (
          <div className="lpa-dist__bar" style={{ height: 26, borderRadius: 6, flex: 1 }}>
            {FM.lpaTypes.map(t => {
              const n = dist[t.id];
              if (!n) return null;
              const pct = n / total * 100;
              return (
                <div key={t.id} className="lpa-dist__seg"
                  style={{ width: pct + '%', background: t.color, fontSize: 12 }}
                  title={`${t.name} ${n}명 (${Math.round(pct)}%)`}>
                  {pct > 14 && <span>{n}명</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="lpa-compare-row lpa-compare-row--split">
      <div className="lpa-compare-row__label">
        <button className="lpa-compare-row__name" onClick={() => onDetail(cls.id)}>{cls.label}</button>
        <span className="lpa-compare-row__count">({cls.size}명)</span>
      </div>
      {renderBar(1)}
      {renderBar(2)}
      <button className="btn btn--sm" onClick={() => onDetail(cls.id)}>상세 →</button>
    </div>
  );
}

Object.assign(window, { AreaLineChart, OverviewSummaryPanel, LPAComparisonRow });
