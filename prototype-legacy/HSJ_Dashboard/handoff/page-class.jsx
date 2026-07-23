/* HSJ Dashboard — Class Detail Page (반 결과)
 * The deep dashboard for one class, with the signature widgets:
 *  - 3대 전략 균형 삼각형 (LPA 자리 대체)
 *  - 3대 전략 막대 + 17개 요인 드릴다운
 *  - 강점·보완·성장기대 매트릭스
 *  - 학생 목록 테이블
 */

const { useMemo: useMemoCls, useState: useStateCls } = React;

function ClassPage({ nav, setNav, tweaks }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL.selfreg;
  const classData = data.getClass(nav.classId);
  const drawer = window.useDrawer();
  const [sessionNo, setSessionNo] = useStateCls(2);
  const [studentFilter, setStudentFilter] = useStateCls('all');
  const [search, setSearch] = useStateCls('');

  if (!classData) {
    return <div className="page">반을 찾을 수 없습니다.</div>;
  }

  const openStudent = (s) => drawer.openStudent({
    classId: classData.id,
    num: s.num,
    test: 'selfreg',
    sessionNo,
    siblings: classData.students.map(st => ({ classId: classData.id, num: st.num, name: st.name })),
  });

  const isPending = classData.progress[sessionNo] === 0;
  const agg = isPending ? null : data.classAggregate(classData, sessionNo);
  const prevAgg = sessionNo === 2 && classData.progress[1] > 0 ? data.classAggregate(classData, 1) : null;

  return (
    <div className="page page-class">
      <PageHeader
        onBack={() => setNav({ ...nav, view: 'overview', classId: null })}
        title={
          <span>
            {classData.label}
            <span className="test-tag" style={{ background: FM.color }}>{FM.name}</span>
          </span>
        }
        crumb={['결과보기', '자기조절학습검사', classData.label]}
        meta={`학생 ${classData.size}명  ·  ${sessionNo}차 검사 완료 ${classData.progress[sessionNo]}명`}
        right={
          <div className="row" style={{ gap: 8 }}>
            <SessionSwitcher value={sessionNo} onChange={setSessionNo} />
            <button className="btn"><IconDownload /> 반 보고서</button>
          </div>
        }
      />

      {isPending && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{sessionNo}차 검사가 아직 진행되지 않았습니다</div>
          <div className="muted">검사가 시작되면 결과를 확인할 수 있습니다</div>
        </div>
      )}

      {!isPending && (
        <>
          {/* ============ SECTION 1: 한 줄 요약 ============ */}
          <div className="section">
            <h2 className="section__title">1. 이 반 한 눈에 보기</h2>
            <div className="grid-2" style={{ gridTemplateColumns: '1fr 320px' }}>
              <div className="card">
                <ClassInsight classData={classData} agg={agg} prevAgg={prevAgg} sessionNo={sessionNo} />
              </div>
              <div className="card">
                <div className="card__head" style={{ marginBottom: 8 }}>
                  <div>
                    <div className="card__title">3대 전략 균형</div>
                    <div className="card__sub">동기·인지·행동의 균형 지형</div>
                  </div>
                </div>
                <StrategyTriangle agg={agg} prevAgg={prevAgg} size={260} />
                {prevAgg && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 11, color: 'var(--gray-500)', marginTop: 6 }}>
                    <span><svg width="14" height="6"><line x1="0" y1="3" x2="14" y2="3" stroke="#A1A1A8" strokeWidth="1.5" strokeDasharray="3 3"/></svg> 1차</span>
                    <span><svg width="14" height="6"><line x1="0" y1="3" x2="14" y2="3" stroke="var(--brand)" strokeWidth="2"/></svg> 2차</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============ SECTION 2: 누구를 봐야 하나 ============ */}
          <div className="section">
            <h2 className="section__title">2. 누구를 봐야 하나</h2>
            <p className="section__sub">학생 카드를 클릭하면 학생 결과로 이동합니다</p>
            <WatchRows classData={classData} sessionNo={sessionNo} setNav={setNav} nav={nav} />
          </div>

          {/* ============ SECTION 3: 이 반의 전략 지형 ============ */}
          <div className="section">
            <h2 className="section__title">3. 이 반의 전략 지형</h2>
            <p className="section__sub">큰 막대를 클릭하면 하위 17개 요인이 펼쳐집니다. 변화량은 1차 대비 2차 점수입니다.</p>
            <div className="card">
              <StrategyBarsDrilldown classData={classData} agg={agg} prevAgg={prevAgg} sessionNo={sessionNo} />
            </div>
            <div className="card mt-16">
              <div className="card__head" style={{ marginBottom: 8 }}>
                <div>
                  <div className="card__title">강점·보완·성장기대 요인 분류</div>
                  <div className="card__sub">17개 요인을 반 평균 T 점수 기준으로 자동 분류 ({sessionNo}차 검사 기준)</div>
                </div>
              </div>
              <FactorMatrix agg={agg} />
            </div>
            {prevAgg && (
              <div className="card mt-16">
                <div className="card__head" style={{ marginBottom: 8 }}>
                  <div>
                    <div className="card__title">차수 변화 산점도</div>
                    <div className="card__sub">대각선 위는 성장 · 아래는 퇴보 (전략별 학생 분포)</div>
                  </div>
                </div>
                <ScatterTabs classData={classData} />
              </div>
            )}
          </div>

          {/* ============ SECTION 4: 학생 목록 ============ */}
          <div className="section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 className="section__title" style={{ marginBottom: 0 }}>4. 학생 목록</h2>
              <button className="btn btn--sm"><IconDownload /> {sessionNo}차 보고서 전체</button>
            </div>
            <div className="card">
              <StudentTable
                classData={classData}
                sessionNo={sessionNo}
                filter={studentFilter}
                setFilter={setStudentFilter}
                search={search}
                setSearch={setSearch}
                onStudentClick={openStudent}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============ Class Insight ============ */
function ClassInsight({ classData, agg, prevAgg, sessionNo }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL.selfreg;
  const strats = FM.strategies.map(s => ({
    id: s.id, name: s.name, color: s.color,
    t: agg[s.id], prev: prevAgg ? prevAgg[s.id] : null,
  }));
  strats.sort((a, b) => b.t - a.t);
  const top = strats[0], bottom = strats[strats.length - 1];

  return (
    <>
      <div className="insight" style={{ marginBottom: 14 }}>
        <div className="insight__head">💡 AI 학급 분석</div>
        <div className="insight__body">
          {classData.label}은 <strong style={{ color: top.color }}>{top.name}</strong>이 평균 T {top.t}로 가장 강하고,
          <strong style={{ color: bottom.color }}> {bottom.name}</strong>이 평균 T {bottom.t}로 가장 약합니다.
          {prevAgg && (() => {
            const big = strats.map(s => ({ ...s, delta: s.t - s.prev })).reduce((a, b) => Math.abs(a.delta) > Math.abs(b.delta) ? a : b);
            return Math.abs(big.delta) >= 2
              ? <> 2차에서 <strong>{big.name}</strong>이 {big.delta > 0 ? '+' : ''}{big.delta} {big.delta > 0 ? '성장' : '퇴보'}했습니다.</>
              : <> 1차 대비 큰 변화는 보이지 않습니다.</>;
          })()}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {FM.strategies.map(s => {
          const t = agg[s.id];
          const pt = prevAgg ? prevAgg[s.id] : null;
          const d = pt != null ? t - pt : null;
          const lvl = levelOf(t);
          return (
            <div key={s.id} style={{
              padding: 14,
              borderRadius: 10,
              background: s.colorSoft,
              borderTop: '3px solid ' + s.color,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>T {t}</span>
                {d != null && (
                  <span className={'chip chip--' + (d > 0 ? 'good' : d < 0 ? 'warn' : 'neutral')}>
                    {d > 0 ? '▲' : d < 0 ? '▼' : '–'} {Math.abs(d)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-600)', marginTop: 4, fontWeight: 600 }}>
                {LEVEL_COLORS[lvl].label} 수준
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ============ Watch Rows (3 cards: 긴급 / 성장 / 퇴보) ============ */
function WatchRows({ classData, sessionNo, setNav, nav }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL.selfreg;
  const drawer = window.useDrawer();
  const openStudent = (s) => drawer.openStudent({
    classId: classData.id,
    num: s.num,
    test: 'selfreg',
    sessionNo,
    siblings: classData.students.map(st => ({ classId: classData.id, num: st.num, name: st.name })),
  });

  const items = classData.students.map(s => {
    const cur = s.sessions[sessionNo];
    const prev = sessionNo === 2 ? s.sessions[1] : null;
    const curAvg = Math.round((cur.motivation + cur.cognition + cur.behavior) / 3);
    const prevAvg = prev ? Math.round((prev.motivation + prev.cognition + prev.behavior) / 3) : null;
    const delta = prevAvg != null ? curAvg - prevAvg : null;
    // Count weak factors (<= 35)
    let weakCount = 0;
    FM.strategies.forEach(st => st.categories.forEach(cat => cat.factors.forEach(f => {
      if (cur[f.id] <= 35) weakCount++;
    })));
    return { ...s, curAvg, prevAvg, delta, weakCount, reliability: cur._reliability };
  });

  const risk = items.filter(s => s.curAvg <= 38 || s.weakCount >= 6).sort((a, b) => a.curAvg - b.curAvg).slice(0, 5);
  const grown = items.filter(s => s.delta != null && s.delta >= 5).sort((a, b) => b.delta - a.delta).slice(0, 5);
  const regressed = items.filter(s => s.delta != null && s.delta <= -3).sort((a, b) => a.delta - b.delta).slice(0, 5);

  const renderItem = (s, kind) => (
    <div key={s.num} className="watch-card__item" onClick={() => openStudent(s)}>
      <span className="watch-card__num">{s.num}번</span>
      <span className="watch-card__name">{s.name}</span>
      <div className="watch-card__body">
        <span className="watch-card__t">T {s.curAvg}</span>
        <span className="watch-card__hint">
          {kind === 'risk' && `약점 요인 ${s.weakCount}개`}
          {kind === 'growth' && `▲ +${s.delta} 성장`}
          {kind === 'regress' && `▼ ${s.delta} 하락`}
        </span>
      </div>
    </div>
  );

  return (
    <div className="watch-row">
      <div className="watch-card watch-card--risk">
        <div className="watch-card__head">
          <span>🚨 긴급 관심 필요</span>
          <span className="count">{risk.length}명</span>
        </div>
        <div className="watch-card__list">
          {risk.length === 0 && <div className="matrix__empty">관심 필요 학생이 없습니다</div>}
          {risk.map(s => renderItem(s, 'risk'))}
        </div>
      </div>
      <div className="watch-card watch-card--growth">
        <div className="watch-card__head">
          <span>🌱 큰 성장 보임</span>
          <span className="count">{grown.length}명</span>
        </div>
        <div className="watch-card__list">
          {grown.length === 0 && <div className="matrix__empty">2차 검사 후 표시됩니다</div>}
          {grown.map(s => renderItem(s, 'growth'))}
        </div>
      </div>
      <div className="watch-card watch-card--regress">
        <div className="watch-card__head">
          <span>📉 하락 추세</span>
          <span className="count">{regressed.length}명</span>
        </div>
        <div className="watch-card__list">
          {regressed.length === 0 && <div className="matrix__empty">하락한 학생이 없습니다</div>}
          {regressed.map(s => renderItem(s, 'regress'))}
        </div>
      </div>
    </div>
  );
}

/* ============ Scatter Tabs ============ */
function ScatterTabs({ classData }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.selfreg;
  const [dim, setDim] = useStateCls('overall');
  return (
    <div>
      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={'seg__btn' + (dim === 'overall' ? ' is-active' : '')} onClick={() => setDim('overall')}>전체 평균</button>
        {FM.strategies.map(s => (
          <button key={s.id} className={'seg__btn' + (dim === s.id ? ' is-active' : '')} onClick={() => setDim(s.id)}>
            {s.name}
          </button>
        ))}
      </div>
      <ChangeScatter classData={classData} dimension={dim} width={760} height={320} />
    </div>
  );
}

/* ============ Student Table ============ */
function StudentTable({ classData, sessionNo, filter, setFilter, search, setSearch, onStudentClick }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.selfreg;
  const [sort, setSort] = useStateCls({ col: 'num', dir: 'asc' });

  const enriched = classData.students.map(s => {
    const cur = s.sessions[sessionNo];
    const prev = sessionNo === 2 ? s.sessions[1] : null;
    const curAvg = Math.round((cur.motivation + cur.cognition + cur.behavior) / 3);
    const prevAvg = prev ? Math.round((prev.motivation + prev.cognition + prev.behavior) / 3) : null;
    const delta = prevAvg != null ? curAvg - prevAvg : null;
    return { ...s, ...cur, _avg: curAvg, _delta: delta, _reliability: cur._reliability };
  });

  let filtered = enriched;
  if (filter === 'risk') filtered = filtered.filter(s => s._avg <= 38);
  if (filter === 'reliability') filtered = filtered.filter(s => s._reliability === '주의');
  if (filter === 'big_change') filtered = filtered.filter(s => s._delta != null && Math.abs(s._delta) >= 5);

  if (search.trim()) {
    const q = search.trim();
    filtered = filtered.filter(s => s.name.includes(q) || String(s.num).includes(q));
  }

  const sortFn = (a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return ((a[sort.col] ?? 0) - (b[sort.col] ?? 0)) * dir;
  };
  filtered = [...filtered].sort(sortFn);

  const setSortBy = col => {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: col === 'num' ? 'asc' : 'desc' });
  };

  const sortIcon = col => sort.col !== col ? null : (sort.dir === 'asc' ? <IconArrowUp /> : <IconArrowDown />);

  return (
    <>
      <div className="filterbar">
        <span className="filterbar__label">필터:</span>
        <button className={'filterchip' + (filter === 'all' ? ' is-active' : '')} onClick={() => setFilter('all')}>전체 {enriched.length}</button>
        <button className={'filterchip' + (filter === 'risk' ? ' is-active' : '')} onClick={() => setFilter('risk')}>관심 필요</button>
        <button className={'filterchip' + (filter === 'big_change' ? ' is-active' : '')} onClick={() => setFilter('big_change')}>큰 변화</button>
        <button className={'filterchip' + (filter === 'reliability' ? ' is-active' : '')} onClick={() => setFilter('reliability')}>신뢰도 주의</button>
        <div className="searchbox">
          <IconSearch />
          <input placeholder="이름/번호 검색" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <table className="stu-table">
        <thead>
          <tr>
            <th className="col-num" onClick={() => setSortBy('num')}><span className="row" style={{gap:4}}>번호 {sortIcon('num')}</span></th>
            <th onClick={() => setSortBy('name')}>이름</th>
            <th onClick={() => setSortBy('motivation')} style={{ width: 110 }}><span className="row" style={{gap:4}}>동기전략 {sortIcon('motivation')}</span></th>
            <th onClick={() => setSortBy('cognition')} style={{ width: 110 }}><span className="row" style={{gap:4}}>인지전략 {sortIcon('cognition')}</span></th>
            <th onClick={() => setSortBy('behavior')} style={{ width: 110 }}><span className="row" style={{gap:4}}>행동전략 {sortIcon('behavior')}</span></th>
            <th onClick={() => setSortBy('_avg')} style={{ width: 90 }}><span className="row" style={{gap:4}}>종합 {sortIcon('_avg')}</span></th>
            <th onClick={() => setSortBy('_delta')} style={{ width: 80 }}><span className="row" style={{gap:4}}>변화 {sortIcon('_delta')}</span></th>
            <th style={{ width: 80 }}>상태</th>
            <th style={{ width: 60, textAlign: 'right' }}>보고서</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 30 }}>해당하는 학생이 없습니다</td></tr>
          )}
          {filtered.map(s => (
            <tr key={s.num} onClick={() => onStudentClick(s)}>
              <td className="col-num">{s.num}</td>
              <td className="col-name">{s.name}</td>
              <td><MiniBar t={s.motivation} color={FM.strategies[0].color} /></td>
              <td><MiniBar t={s.cognition} color={FM.strategies[1].color} /></td>
              <td><MiniBar t={s.behavior} color={FM.strategies[2].color} /></td>
              <td className="col-t">T {s._avg}</td>
              <td>
                {s._delta != null ? (
                  <span className={s._delta > 0 ? 'delta--up' : s._delta < 0 ? 'delta--down' : 'delta--flat'}
                    style={{ fontSize: 12, fontWeight: 700 }}>
                    {s._delta > 0 ? '▲' : s._delta < 0 ? '▼' : '–'} {Math.abs(s._delta)}
                  </span>
                ) : <span className="muted">–</span>}
              </td>
              <td>
                {s._avg <= 38 && <span className="chip chip--risk">⚠ 관심</span>}
                {s._reliability === '주의' && <span className="chip chip--warn">신뢰도</span>}
                {s._avg > 38 && s._reliability === '양호' && <span className="chip chip--neutral">양호</span>}
              </td>
              <td style={{ textAlign: 'right' }}>
                <button className="btn btn--xs" onClick={(e) => { e.stopPropagation(); alert('PDF 다운로드'); }}>
                  <IconDownload /> PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function MiniBar({ t, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 60, height: 5, background: 'var(--gray-100)', borderRadius: 999, position: 'relative' }}>
        <div style={{ width: Math.max(2, Math.min(98, t)) + '%', height: '100%', background: color, borderRadius: 999 }}></div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--gray-800)', minWidth: 28 }}>{t}</span>
    </div>
  );
}

Object.assign(window, { ClassPage });
