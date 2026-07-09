/* HSJ Dashboard — Comprehensive Student Full Page
 * Replaces the side drawer with a full-page student detail view.
 * Sections: header + nav, AI 총평, 38요인 분석(area tabs + column chart),
 *           학습 유형 분류(donut), 유형별 특이점, 코칭 전략(accordion).
 */

const { useState: useStateSP, useMemo: useMemoSP } = React;

function CompStudentPage({ nav, setNav, tweaks }) {
  const data = window.HSJ_DATA;
  const testId = nav.test || 'comprehensive';
  const FM = data.FACTOR_MODEL[testId];
  const lpaOn = tweaks.lpaToggle && FM.hasLPAType;
  const classData = data.getClass(nav.classId);
  if (!classData) return <div className="page">반을 찾을 수 없습니다.</div>;

  const siblings = classData.students;
  const idx = siblings.findIndex(s => s.num === nav.studentNum);
  const student = siblings[idx];
  if (!student) return <div className="page">학생을 찾을 수 없습니다.</div>;

  const has1 = data.progressOf(classData, testId, 1) > 0;
  const has2 = data.progressOf(classData, testId, 2) > 0;
  const [sessionNo, setSessionNo] = useStateSP(nav.sessionNo || (has2 ? 2 : 1));
  const sess1 = data.sessionOf(student, testId, 1);
  const sess2 = data.sessionOf(student, testId, 2);
  const hasBoth = !!(sess1 && sess2);
  const effSession = sessionNo === 'change' ? (has2 ? 2 : 1) : ((sessionNo === 2 && !has2) ? 1 : sessionNo);
  const cur = data.sessionOf(student, testId, effSession) || data.sessionOf(student, testId, 1);
  const lpa = cur && cur._lpa ? FM.lpaTypes.find(t => t.id === cur._lpa) : null;
  const reliability = cur && cur._reliability === '주의';

  const goStudent = (dir) => {
    const next = siblings[(idx + dir + siblings.length) % siblings.length];
    setNav({ ...nav, studentNum: next.num });
  };
  const backToClass = () => setNav({ ...nav, view: 'class' });

  const [areaTab, setAreaTab] = useStateSP(FM.areas[0].id);
  const [reportOpen, setReportOpen] = useStateSP(false);
  const dlReport = (r, fmt) => {
    setReportOpen(false);
    alert(`${student.name} 학생 ${r}차 ${fmt === 'detail' ? '상세' : '요약'} 보고서를 다운로드합니다 (데모)`);
  };

  return (
    <div className="page page-student">
      {/* breadcrumb */}
      <div className="page-head__crumb page-head__crumb--top" style={{ marginBottom: 14 }}>
        <span style={{ cursor: 'pointer' }} onClick={() => setNav({ ...nav, view: 'overview', classId: null })}>결과보기</span>
        <span className="crumb-sep">›</span>
        <span>{FM.name}</span>
        <span className="crumb-sep">›</span>
        <span style={{ cursor: 'pointer' }} onClick={backToClass}>{classData.label} 검사 분석</span>
        <span className="crumb-sep">›</span>
        <span>{student.num}번 {student.name}</span>
      </div>

      {/* header */}
      <div className="stu-page__head">
        <button className="page-head__back" onClick={backToClass} aria-label="뒤로"><ChevLeft /></button>
        <div className="stu-page__id">
          <div className="stu-page__name-row">
            <span className="stu-page__name">{student.num}번 {student.name}</span>
            {lpaOn && lpa && <span className="chip" style={{ background: lpa.colorSoft, color: lpa.color }}>● {lpa.name}</span>}
            {cur && (cur._lpa === 'depleted') && <span className="chip chip--warn">⚠ 관심 필요</span>}
            {reliability && <span className="chip chip--warn">⚠ 신뢰도 주의</span>}
          </div>
          <div className="stu-page__meta">
            2026.03.15 응시 · {effSession}차 검사 · 검사 완료 {data.progressOf(classData, testId, effSession)}명 / {classData.size}명
            {reliability && <span> · 📊 검사 신뢰도 주의</span>}
          </div>
        </div>
        <div className="stu-page__actions">
          <div className="stu-page__nav-btns">
            <button className="btn btn--sm" onClick={() => goStudent(-1)}>‹ 이전</button>
            <span className="stu-page__nav-count tnum">{idx + 1} / {siblings.length}</span>
            <button className="btn btn--sm" onClick={() => goStudent(1)}>다음 ›</button>
          </div>
          <div className="stu-report-wrap">
            <button className="btn btn--sm btn--brand" onClick={() => setReportOpen(o => !o)}><IconDownload /> 보고서 다운로드</button>
            {reportOpen && (
              <>
                <div className="stu-report-backdrop" onClick={() => setReportOpen(false)}></div>
                <div className="stu-report-menu">
                  <div className="stu-report-menu__group">
                    <div className="stu-report-menu__label">1차 검사 {!has1 && <span className="muted">(미실시)</span>}</div>
                    <button className="stu-report-menu__item" disabled={!has1} onClick={() => dlReport(1, 'detail')}>🗂 1차 상세 보고서</button>
                    <button className="stu-report-menu__item" disabled={!has1} onClick={() => dlReport(1, 'summary')}>🗒 1차 요약 보고서</button>
                  </div>
                  <div className="stu-report-menu__group">
                    <div className="stu-report-menu__label">2차 검사 {!has2 && <span className="muted">(예정)</span>}</div>
                    <button className="stu-report-menu__item" disabled={!has2} onClick={() => dlReport(2, 'detail')}>🗂 2차 상세 보고서</button>
                    <button className="stu-report-menu__item" disabled={!has2} onClick={() => dlReport(2, 'summary')}>🗒 2차 요약 보고서</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* student nav */}
      <div className="stu-page__nav stu-page__nav--left">
        <div className="row" style={{ gap: 12 }}>
          <div className="seg seg--brand">
            <button className={'seg__btn' + (sessionNo === 1 ? ' is-active' : '')} onClick={() => setSessionNo(1)}>1차 검사</button>
            <button className={'seg__btn' + (sessionNo === 2 ? ' is-active' : '') + (!has2 ? ' is-disabled' : '')} onClick={() => has2 && setSessionNo(2)}>2차 검사 {!has2 && '예정'}</button>
            <button className={'seg__btn' + (sessionNo === 'change' ? ' is-active' : '') + (!hasBoth ? ' is-disabled' : '')} onClick={() => hasBoth && setSessionNo('change')}>차수 변화</button>
          </div>
        </div>
      </div>

      {/* AI 총평 */}
      <div className="stu-ai">
        <div className="stu-ai__icon">✨</div>
        <div className="stu-ai__body">
          <div className="stu-ai__head">AI 분석 총평 <span className="stu-ai__badge">표준</span></div>
          <div className="stu-ai__text">{aiSummary(student, cur, lpa, FM)}</div>
        </div>
      </div>

      {/* 38개 요인 분석 */}
      <div className="card stu-section">
        <div className="card__head">
          <div>
            <div className="card__title">{(() => { let n = 0; FM.areas.forEach(a => a.categories.forEach(c => n += c.factors.length)); return n; })()}개 요인 분석</div>
          </div>
        </div>
        <div className="stu-area-tabs">
          {FM.areas.map(a => {
            const cnt = a.categories.reduce((n, c) => n + c.factors.length, 0);
            return (
              <button key={a.id}
                className={'stu-area-tab' + (areaTab === a.id ? ' is-active' : '')}
                style={areaTab === a.id ? { background: a.color, borderColor: a.color, color: '#fff' } : { color: a.color }}
                onClick={() => setAreaTab(a.id)}>
                <span>{a.name}</span>
                <span className="stu-area-tab__cnt">{cnt}</span>
              </button>
            );
          })}
        </div>
        {(() => {
          const a = FM.areas.find(x => x.id === areaTab);
          return (
            <div className="stu-area-note" style={{ background: a.colorSoft, color: a.color }}>
              {a.polarity === 'negative'
                ? '부적 요인 · 점수가 낮을수록 학습에 긍정적인 영향을 의미합니다.'
                : '정적 요인 · 점수가 높을수록 학습에 긍정적인 영향을 의미합니다.'}
            </div>
          );
        })()}
        <StudentFactorColumns cur={cur} areaId={areaTab} testId={testId} showBoth={sessionNo === 'change'} sess1={sess1} sess2={sess2} />
      </div>

      {/* 학습 유형 분류 (LPA ON only) */}
      {lpaOn && lpa && (
        <div className="card stu-section">
          <div className="card__head">
            <div>
              <div className="card__title">학습 유형 분류 <InfoTooltip title="LPA 유형이란?">{LPA_TIP}</InfoTooltip></div>
            </div>
          </div>
          {sessionNo === 'change'
            ? <StudentLpaCompare sess1={sess1} sess2={sess2} FM={FM} />
            : <StudentLpaSection lpa={lpa} cur={cur} FM={FM} />}
        </div>
      )}

      {/* 유형별 특이점 */}
      {lpaOn && lpa && (
        <div className="card stu-section">
          <div className="card__head">
            <div>
              <div className="card__title">유형별 특이점</div>
              <div className="card__sub">같은 {lpa.name} 학생들과 비교한 이 학생의 두드러진 특성입니다.</div>
            </div>
          </div>
          <StudentOutliers student={student} cur={cur} lpa={lpa} FM={FM} />
        </div>
      )}

      {/* 코칭 전략 (학습종합검사만) */}
      {testId !== 'selfreg' && (
        <div className="card stu-section">
          <div className="card__head">
            <div>
              <div className="card__title">추천 코칭 전략</div>
              <div className="card__sub">{lpaOn && lpa ? lpa.name + '의' : '학생'} 데이터를 분석해 관련도 순으로 정렬했습니다. 경로를 클릭하면 근거와 실행 단계가 펼쳐집니다.</div>
            </div>
          </div>
          <CoachingPaths cur={cur} FM={FM} />
        </div>
      )}
    </div>
  );
}

/* ============ AI summary text ============ */
function aiSummary(student, cur, lpa, FM) {
  if (!cur) return `${student.name} 학생의 검사 결과를 분석 중입니다.`;
  const negAreas = FM.areas.filter(a => a.polarity === 'negative');
  const posAreas = FM.areas.filter(a => a.polarity === 'positive');
  const lowPos = posAreas.map(a => ({ a, t: cur[a.id] })).sort((x, y) => x.t - y.t)[0];
  const highArea = posAreas.map(a => ({ a, t: cur[a.id] })).sort((x, y) => y.t - x.t)[0];
  if (negAreas.length === 0) {
    // selfreg (모두 정적)
    return `${student.name} 학생은 ${highArea.a.name}이(가) T${highArea.t}로 가장 강하고, ${lowPos.a.name}이(가) T${lowPos.t}로 상대적으로 낮습니다. ${lowPos.a.name} 영역의 학습 습관을 함께 살펴보면 좋겠습니다.`;
  }
  const neg = negAreas.map(a => ({ a, t: cur[a.id] })).sort((x, y) => y.t - x.t)[0];
  const typeText = lpa ? `${lpa.name}입니다` : '분석되었어요';
  return `${student.name} 학생은 ${neg.a.name.replace('적공부마음', '')}이(가) 높고 ${lowPos.a.name}이(가) 낮은 ${typeText}.`;
}

/* ============ 차수 변화 (1차 → 2차) ============ */
function ChangeView({ sess1, sess2, hasBoth, testId = 'comprehensive' }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL[testId];
  if (!hasBoth) {
    return (
      <div className="change-empty">
        <div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>2차 검사 결과가 아직 없습니다</div>
        <div className="muted" style={{ fontSize: 13 }}>1차와 2차 검사가 모두 완료되면 차수별 변화를 볼 수 있습니다.</div>
      </div>
    );
  }
  return (
    <div className="change-view">
      <div className="change-view__note">1차 검사 대비 2차 검사의 변화입니다. 정적 요인은 <strong>오를수록</strong>, 부적 요인은 <strong>내릴수록</strong> 긍정적 변화로 표시됩니다.</div>
      {FM.areas.map(area => (
        <div key={area.id} className="change-area">
          <div className="change-area__head">
            <span className="change-area__dot" style={{ background: area.color }}></span>
            <span className="change-area__name" style={{ color: area.color }}>{area.name}</span>
            {area.polarity === 'negative' && <span className="polarity-tag polarity-tag--neg">낮을수록 좋음</span>}
            {(() => {
              const d = sess2[area.id] - sess1[area.id];
              const good = area.polarity === 'negative' ? d < 0 : d > 0;
              return (
                <span className={'change-area__delta ' + (d === 0 ? 'is-flat' : good ? 'is-good' : 'is-bad')}>
                  {sess1[area.id]} → {sess2[area.id]} ({d > 0 ? '+' : ''}{d})
                </span>
              );
            })()}
          </div>
          <div className="change-factors">
            {area.categories.flatMap(c => c.factors).map(f => {
              const t1 = sess1[f.id], t2 = sess2[f.id];
              const d = t2 - t1;
              const good = area.polarity === 'negative' ? d < 0 : d > 0;
              return (
                <div key={f.id} className="change-row">
                  <span className="change-row__name">{f.name}</span>
                  <span className="change-row__track">
                    <span className="change-row__seg" style={{ left: Math.min(t1, t2) + '%', width: Math.abs(t2 - t1) + '%', background: d === 0 ? 'var(--gray-300)' : good ? 'var(--status-good)' : 'var(--status-risk)' }}></span>
                    <span className="change-row__dot change-row__dot--from" style={{ left: t1 + '%' }}></span>
                    <span className="change-row__dot change-row__dot--to" style={{ left: t2 + '%', background: d === 0 ? 'var(--gray-400)' : good ? 'var(--status-good)' : 'var(--status-risk)' }}></span>
                  </span>
                  <span className="change-row__vals tnum">{t1}→{t2}</span>
                  <span className={'change-row__delta tnum ' + (d === 0 ? 'is-flat' : good ? 'is-good' : 'is-bad')}>{d > 0 ? '▲' : d < 0 ? '▼' : '–'}{d !== 0 ? Math.abs(d) : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============ 38 factor columns (per area) ============ */
function StudentFactorColumns({ cur, areaId, testId = 'comprehensive', showBoth = false, sess1, sess2 }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL[testId];
  const [wrapRef, containerW] = useMeasureWidth();
  const area = FM.areas.find(a => a.id === areaId);
  // group by 2뎁스 (category); each group holds its 3뎁스 factors
  const groups = area.categories.map(c => ({
    id: c.id, name: c.name,
    cols: c.factors.map(f => ({ id: f.id, name: f.name, t: cur[f.id], t1: sess1 ? sess1[f.id] : null, t2: sess2 ? sess2[f.id] : null })),
  }));
  const n = groups.reduce((s, g) => s + g.cols.length, 0);

  const height = 320;
  const pad = { l: 20, r: 20, t: 30, b: 76 };
  const groupGap = 28;
  const nGroupGaps = Math.max(0, groups.length - 1);
  const availW = Math.max(320, containerW) - pad.l - pad.r;
  const colGap = 12;
  const totalGaps = colGap * (n - groups.length) + groupGap * nGroupGaps;
  const slotW = (availW - totalGaps) / n;
  const barW = Math.min(48, slotW);
  const innerW = slotW * n + totalGaps;
  const W = innerW + pad.l + pad.r;
  const plotH = height - pad.t - pad.b;
  const yOf = (t) => pad.t + (1 - t / 100) * plotH;

  const gradeOf = (t) => t < 30 ? '매우 낮음' : t < 40 ? '낮음' : t < 60 ? '보통' : t < 70 ? '높음' : '매우 높음';
  const isLow = (t) => t < 40;
  const barTone = (t, polarity) => {
    if (t >= 40 && t < 60) return { fill: '#EDEDF0', stroke: '#D4D4D8', lab: '#71717A' }; // 보통 = 회색 베이스
    const high = t >= 60;
    const good = (polarity === 'negative') ? !high : high; // 부적요인은 높을수록 나쁨
    return good
      ? { fill: '#E3F4E9', stroke: '#A9DCBC', lab: '#2ECC71' }
      : { fill: '#FDE7E4', stroke: '#F0B5AC', lab: '#E74C3C' };
  };
  // 차수 변화: 보통은 회색(1차 연함/2차 진함), 튀는 구간은 초록/빨강
  const changeTone = (t, polarity, isFirst) => {
    if (t >= 40 && t < 60) {
      return isFirst
        ? { fill: '#F0F0F2', stroke: '#DADADE', lab: '#9499A0' }
        : { fill: '#D6D6DC', stroke: '#B6B6BE', lab: '#6B7280' };
    }
    return barTone(t, polarity);
  };
  const baseY = height - pad.b; // x-axis baseline

  return (
    <div className="stu-factor-wrap" ref={wrapRef}>
      <svg width={W} height={height} style={{ display: 'block', minWidth: '100%' }}>
        {/* 전국 평균 line */}
        <line x1={pad.l} y1={yOf(50)} x2={pad.l + innerW} y2={yOf(50)} stroke="#C9A4ED" strokeWidth="1.3" strokeDasharray="5 5" />
        <text x={pad.l + innerW} y={pad.t - 14} textAnchor="end" fontSize="10.5" fill="#9CA3AF">점선: T=50 (전국 평균)</text>
        {showBoth && (
          <g>
            <rect x={pad.l} y={pad.t - 22} width={11} height={11} rx="2" fill="#F0F0F2" stroke="#DADADE" />
            <text x={pad.l + 16} y={pad.t - 13} fontSize="10.5" fill="#52525B">1차</text>
            <rect x={pad.l + 44} y={pad.t - 22} width={11} height={11} rx="2" fill="#D6D6DC" stroke="#B6B6BE" />
            <text x={pad.l + 60} y={pad.t - 13} fontSize="10.5" fill="#52525B">2차</text>
          </g>
        )}
        {(() => {
          let x = pad.l;
          const out = [];
          groups.forEach((g, gi) => {
            const groupStart = x;
            g.cols.forEach((c, ci) => {
              if (showBoth && c.t1 != null && c.t2 != null) {
                const pairGap = 6;
                const pw = Math.min(38, (slotW - pairGap) / 2);
                const totalPair = pw * 2 + pairGap;
                const px = x + (slotW - totalPair) / 2;
                [{ t: c.t1, ...changeTone(c.t1, area.polarity, true), tag: '1차' }, { t: c.t2, ...changeTone(c.t2, area.polarity, false), tag: '2차' }].forEach((b, bi) => {
                  const bx = px + bi * (pw + pairGap);
                  const y = yOf(b.t);
                  const barH = (b.t / 100) * plotH;
                  out.push(
                    <g key={c.id + b.tag}>
                      <text x={bx + pw / 2} y={y - 6} textAnchor="middle" fontSize="10.5" fontWeight="800" fill={b.lab}>{b.t}</text>
                      <rect x={bx} y={y} width={pw} height={barH} rx="5" fill={b.fill} stroke={b.stroke} strokeWidth="1.2" />
                      {barH > 22 && (() => {
                        const g = gradeOf(b.t);
                        const lines = g.includes(' ') ? g.split(' ') : [g];
                        const cy0 = y + Math.min(barH / 2 + 4, barH - 7) - (lines.length > 1 ? 5 : 0);
                        return (
                          <text x={bx + pw / 2} y={cy0} textAnchor="middle" fontSize="9" fontWeight="700" fill={b.lab}>
                            {lines.map((ln, li) => <tspan key={li} x={bx + pw / 2} dy={li === 0 ? 0 : 10}>{ln}</tspan>)}
                          </text>
                        );
                      })()}
                    </g>
                  );
                });
                out.push(<text key={c.id + 'n'} x={x + slotW / 2} y={baseY + 16} textAnchor="middle" fontSize="10.5" fill="#52525B">{c.name}</text>);
                x += slotW + (ci < g.cols.length - 1 ? colGap : 0);
                return;
              }
              const bx = x + (slotW - barW) / 2;
              const tone = barTone(c.t, area.polarity);
              const fill = tone.fill;
              const stroke = tone.stroke;
              const labelColor = tone.lab;
              const y = yOf(c.t);
              const barH = (c.t / 100) * plotH;
              out.push(
                <g key={c.id}>
                  <text x={bx + barW / 2} y={y - 8} textAnchor="middle" fontSize="12" fontWeight="800" fill={labelColor}>{c.t}</text>
                  <rect x={bx} y={y} width={barW} height={barH} rx="7" fill={fill} stroke={stroke} strokeWidth="1.2" />
                  <text x={bx + barW / 2} y={y + Math.min(barH / 2 + 4, barH - 8)} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={labelColor}>{gradeOf(c.t)}</text>
                  <text x={bx + barW / 2} y={baseY + 16} textAnchor="middle" fontSize="10.5" fill="#52525B">{c.name}</text>
                </g>
              );
              x += slotW + (ci < g.cols.length - 1 ? colGap : 0);
            });
            const groupEnd = x;
            // 2뎁스 그룹 라벨 + 구분 브래킷
            out.push(
              <g key={'g' + gi}>
                <line x1={groupStart + 2} y1={baseY + 30} x2={groupEnd - 2} y2={baseY + 30} stroke={area.color} strokeWidth="2" />
                <text x={(groupStart + groupEnd) / 2} y={baseY + 48} textAnchor="middle" fontSize="11.5" fontWeight="800" fill={area.color}>{g.name}</text>
              </g>
            );
            if (gi < groups.length - 1) {
              // 그룹 사이 점선 세로 구분
              const sepX = groupEnd + groupGap / 2;
              out.push(<line key={'sep' + gi} x1={sepX} y1={pad.t} x2={sepX} y2={baseY + 24} stroke="#E5E5E7" strokeWidth="1" strokeDasharray="3 3" />);
              x += groupGap;
            }
          });
          return out;
        })()}
      </svg>
    </div>
  );
}

/* ============ 차수 비교 도넛 (1차/2차) ============ */
function LpaDonutMini({ sessLpa, FM, label }) {
  const probsMap = {
    depleted: { depleted: 65, balanced: 25, immersed: 10 },
    immersed: { immersed: 64, balanced: 26, depleted: 10 },
    balanced: { balanced: 60, immersed: 22, depleted: 18 },
  };
  const probs = probsMap[sessLpa] || probsMap.balanced;
  const order = ['depleted', 'balanced', 'immersed'];
  const size = 168, stroke = 28, r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  const segs = order.map(id => { const t = FM.lpaTypes.find(x => x.id === id); const seg = { id, t, pct: probs[id], off: acc }; acc += probs[id]; return seg; });
  const top = FM.lpaTypes.find(t => t.id === sessLpa) || FM.lpaTypes.find(t => t.id === 'balanced');
  return (
    <div className="stu-lpa__left">
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{label}</div>
      <svg width={size} height={size}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {segs.map(s => (
            <circle key={s.id} cx={cx} cy={cy} r={r} fill="none" stroke={s.t.color} strokeWidth={stroke}
              strokeDasharray={`${circ * s.pct / 100} ${circ}`} strokeDashoffset={-circ * s.off / 100} />
          ))}
        </g>
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={top.color}>{top.name}</text>
      </svg>
      <div className="stu-lpa__legend">
        {order.map(id => {
          const t = FM.lpaTypes.find(x => x.id === id);
          return (
            <span key={id} className="stu-lpa__legend-row">
              <span className="stu-lpa__legend-dot" style={{ background: t.color }}></span>
              <span>{t.name} {probs[id]}%</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function StudentLpaCompare({ sess1, sess2, FM }) {
  return (
    <div className="stu-lpa stu-lpa--compare">
      <LpaDonutMini sessLpa={sess1 && sess1._lpa} FM={FM} label="1차 검사" />
      <LpaDonutMini sessLpa={sess2 && sess2._lpa} FM={FM} label="2차 검사" />
    </div>
  );
}

/* ============ 학습 유형 분류 (donut + description) ============ */
function StudentLpaSection({ lpa, cur, FM }) {
  // mock distribution probabilities biased to the student's type
  const probs = lpa.id === 'depleted' ? { depleted: 65, balanced: 25, immersed: 10 }
    : lpa.id === 'immersed' ? { immersed: 64, balanced: 26, depleted: 10 }
    : { balanced: 60, immersed: 22, depleted: 18 };
  const order = ['depleted', 'balanced', 'immersed'];
  const size = 188, stroke = 30, r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  const segs = order.map(id => {
    const t = FM.lpaTypes.find(x => x.id === id);
    const pct = probs[id];
    const seg = { id, t, pct, off: acc };
    acc += pct;
    return seg;
  });
  const desc = {
    depleted: { line: '심리·정서적 자원이 전반적으로 낮고, 스트레스가 높으며, 디지털 기기 의존 위험이 있습니다.', bullets: ['⚠ 자기효능감·정서조절 모두 낮아 내적 동기 부족', '😟 부모·교사 기대와 비교로 부담·불안 증가', '📱 스마트폰·게임 몰입 위험'] },
    balanced: { line: '심리·정서적 자원이 균형적이며 큰 위험 신호는 없습니다.', bullets: ['🙂 자아·관계·동기가 또래 수준', '📘 학습 전략을 안정적으로 활용', '✨ 강점을 키울 여지가 있습니다'] },
    immersed: { line: '심리·정서적 자원이 풍부하고 학습 몰입도가 높습니다.', bullets: ['🌟 높은 효능감·자율성으로 주도적 학습', '💪 스트레스 대처가 안정적', '🚀 도전적 과제로 성장 가속 가능'] },
  }[lpa.id];

  return (
    <div className="stu-lpa">
      <div className="stu-lpa__left">
        <svg width={size} height={size}>
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {segs.map(s => (
              <circle key={s.id} cx={cx} cy={cy} r={r} fill="none"
                stroke={s.t.color} strokeWidth={stroke}
                strokeDasharray={`${circ * s.pct / 100} ${circ}`}
                strokeDashoffset={-circ * s.off / 100} />
            ))}
          </g>
        </svg>
        <div className="stu-lpa__legend">
          {order.map(id => {
            const t = FM.lpaTypes.find(x => x.id === id);
            return (
              <span key={id} className="stu-lpa__legend-row">
                <span className="stu-lpa__legend-dot" style={{ background: t.color }}></span>
                <span>{t.name} {probs[id]}%</span>
              </span>
            );
          })}
        </div>
      </div>
      <div className="stu-lpa__right">
        <div className="stu-lpa__hero">
          <div className="stu-lpa__prob" style={{ background: lpa.color }}>{probs[lpa.id]}%</div>
          <div className="stu-lpa__type">{lpa.name}</div>
        </div>
        <div className="stu-lpa__card">
          <div className="stu-lpa__card-title">📋 유형 설명</div>
          <div className="stu-lpa__line">{desc.line}</div>
        </div>
        <div className="stu-lpa__card">
          <div className="stu-lpa__card-title">✨ 주요 특성</div>
          <ul className="stu-lpa__bullets">
            {desc.bullets.map((b, i) => <li key={i}>{b.replace(/^[^\uAC00-\uD7A3a-zA-Z]+/, '').trim()}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ============ 유형별 특이점 ============ */
function StudentOutliers({ student, cur, lpa, FM }) {
  // pick 3 factors where student deviates most from a mock type-average
  const candidates = [
    { id: 'gradeBurden', name: '성적부담', typeAvg: 57 },
    { id: 'phoneAddict', name: '스마트폰의존', typeAvg: 57.5 },
    { id: 'vigor', name: '활기', typeAvg: 52.7 },
    { id: 'cynicism', name: '반감-냉소', typeAvg: 55 },
    { id: 'selfEsteem', name: '자아존중감', typeAvg: 45 },
  ];
  const scored = candidates.map(c => ({ ...c, t: cur[c.id] ?? 50, diff: (cur[c.id] ?? 50) - c.typeAvg }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 3);
  const top = scored;
  const summary = top.map(s => `${s.name}이 특히 ${s.diff > 0 ? '높고' : '낮고'} (${s.diff > 0 ? '+' : ''}${s.diff.toFixed(1)})`).join(', ');

  return (
    <>
      <div className="stu-outliers">
        {top.map(s => (
          <div key={s.id} className="stu-outlier">
            <div className="stu-outlier__arrow" style={{ color: s.diff > 0 ? '#E74C3C' : '#3498DB' }}>{s.diff > 0 ? '↑' : '↓'}</div>
            <div className="stu-outlier__name">{s.name}</div>
            <div className="stu-outlier__diff" style={{ color: s.diff > 0 ? '#E74C3C' : '#3498DB' }}>{s.diff > 0 ? '+' : ''}{s.diff.toFixed(1)}</div>
            <div className="stu-outlier__detail">학생 T={s.t} / 유형평균 T={s.typeAvg}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ============ 코칭 전략 (accordion) ============ */
function CoachingPaths({ cur, FM }) {
  const [open, setOpen] = useStateSP(0);
  const paths = [
    { a: '자기효능감', b: '자아존중감', target: '성적만족도', rel: 79, ta: 25, tb: 27,
      why: '할 수 있다는 신념이 나는 가치있는 사람이라는 평가로 확장될 때 성적만족 형성 (간접효과 β=0.220)',
      steps: ['쉬운 과제로 작은 성공 경험 축적 (1주일)', '과정 피드백으로 노력 인정 → 존재 가치에 대한 정서적 지지 추가', '압박 없이 효능감이 안정적으로 상승하도록 순차적 자원 구축'] },
    { a: '점검능력', b: '교사정서지지', target: '성적만족도', rel: 78, ta: 29, tb: 30,
      why: '스스로 학습을 점검하는 습관이 교사의 정서적 지지와 만날 때 성취 만족으로 이어집니다.',
      steps: ['학습 후 5분 회고 루틴 도입', '교사가 점검 결과에 구체적 피드백 제공', '점검→피드백→조정 사이클 정착'] },
    { a: '자기효능감', b: '자아존중감', target: '학업성취도', rel: 77, ta: 25, tb: 27,
      why: '효능감과 자존감이 함께 상승하면 실제 학업 성취로 연결될 가능성이 높아집니다.',
      steps: ['달성 가능한 학습 목표 설정', '성취 시 즉시 인정', '점진적 난이도 상승'] },
    { a: '조절능력', b: '교사정서지지', target: '성적만족도', rel: 75, ta: 32, tb: 30,
      why: '학습 전략을 조절하는 능력이 교사 지지와 결합할 때 만족도가 높아집니다.',
      steps: ['공부법 점검·교체 코칭', '교사의 정서적 격려', '조절 성공 경험 기록'] },
    { a: '수업부담', b: '교사정서지지', target: '학업성취도', rel: 72, ta: 27, tb: 30,
      why: '수업 부담을 교사의 지지로 완화하면 성취로 전환될 수 있습니다.',
      steps: ['부담 요인 파악 면담', '수업 난이도 조정·보충', '정서적 안전감 제공'] },
  ];

  return (
    <div className="coach-paths">
      {paths.map((p, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={'coach-path' + (isOpen ? ' is-open' : '')}>
            <button className="coach-path__head" onClick={() => setOpen(isOpen ? -1 : i)}>
              <span className="coach-path__rank">{i + 1}</span>
              <div className="coach-path__title-wrap">
                <div className="coach-path__title">{p.a} × {p.b} → {p.target}</div>
              </div>
              <span className="coach-path__chev">{isOpen ? '⌃' : '⌄'}</span>
            </button>
            {isOpen && (
              <div className="coach-path__body">
                <div className="coach-path__col">
                  <div className="coach-path__col-label">왜 이 경로가 중요한가요?</div>
                  <div className="coach-path__why">{p.why}</div>
                </div>
                <div className="coach-path__col">
                  <div className="coach-path__col-label">구체적 실행 전략</div>
                  {p.steps.map((s, si) => (
                    <div key={si} className="coach-path__step">
                      <span className="coach-path__step-num">{si + 1}</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { CompStudentPage });
