/* HSJ Dashboard — Class Detail Page (학습종합검사 반 결과)
 * Matches UX team design: 5 tabs + 4 KPIs + 검사별 유형 분포 +
 * 학급 특성 + 추천 활동 + 학생 목록 (카드/리스트 toggle).
 */

const { useState: useStateCC, useMemo: useMemoCC } = React;

const CLASS_TABS = [
  { id: 'summary', label: '핵심 요약' },
  { id: 'features', label: '학습 상세' },
  { id: 'students', label: '학생 목록' },
];

function CompClassPage({ nav, setNav, tweaks }) {
  const data = window.HSJ_DATA;
  const testId = nav.test || 'comprehensive';
  const FM = data.FACTOR_MODEL[testId];
  const lpaOn = tweaks.lpaToggle && FM.hasLPAType;
  const classData = data.getClass(nav.classId);
  const drawer = window.useDrawer();
  const [tab, setTab] = useStateCC('summary');
  const [sessionNo, setSessionNo] = useStateCC(1);
  const [listMode, setListMode] = useStateCC('card');
  const [featLevel, setFeatLevel] = useStateCC('factor');
  const [featChart, setFeatChart] = useStateCC('profile');
  const [reportOpen, setReportOpen] = useStateCC(false);
  const [badgeInfoOpen, setBadgeInfoOpen] = useStateCC(false);
  const [factorModal, setFactorModal] = useStateCC(null); // { id, name }

  if (!classData) return <div className="page">반을 찾을 수 없습니다.</div>;

  const prog = (n) => data.progressOf(classData, testId, n);
  const sess = (student, n) => data.sessionOf(student, testId, n);
  const has1 = prog(1) > 0;
  const has2 = prog(2) > 0;
  const hasBoth = has1 && has2;
  const isPending = !has1 && !has2;
  const effectiveSession = sessionNo === 2 && !has2 ? 1 : sessionNo;
  const agg = (has1 || has2) ? data.classAggregate(classData, effectiveSession, testId) : null;

  const openStudent = (s) => setNav({
    ...nav, view: 'student', classId: classData.id, studentNum: s.num, sessionNo: effectiveSession,
  });

  // KPI calculations
  const kpi = useMemoCC(() => {
    if (!agg) return null;
    const dist = lpaOn ? data.classLPADist(classData, effectiveSession) : { depleted: 0, balanced: 0, immersed: 0 };
    const total = dist.depleted + dist.balanced + dist.immersed;
    // class avg T: average of all areas (polarity-aware flip for negative)
    const areaVals = FM.areas.map(a => a.polarity === 'negative' ? (100 - agg[a.id]) : agg[a.id]);
    const avgT = Math.round((areaVals.reduce((s, v) => s + v, 0) / areaVals.length) * 10) / 10;
    const watchCount = classData.students.filter(s => {
      const ses = sess(s, effectiveSession);
      if (!ses) return false;
      if (lpaOn) return ses._lpa === 'depleted' || ses._reliability === '주의';
      // no-LPA: concern = many weak factors or reliability
      let weak = 0;
      FM.areas.forEach(a => a.categories.forEach(c => c.factors.forEach(f => {
        const t = ses[f.id]; if (a.polarity === 'negative' ? t >= 60 : t <= 40) weak++;
      })));
      return weak >= 5 || ses._reliability === '주의';
    }).length;
    const reliabilityCount = classData.students.filter(s => {
      const ses = sess(s, effectiveSession);
      return ses && ses._reliability === '주의';
    }).length;
    let dominantLabel = '-', dominantCounts = '', top = ['', 0];
    if (lpaOn) {
      const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]);
      top = sorted[0];
      const dominantTypes = sorted.filter(([_, v]) => v === top[1]);
      dominantLabel = dominantTypes.map(([id]) => FM.lpaTypes.find(t => t.id === id).name).join(' / ');
      dominantCounts = dominantTypes.map(([_, v]) => v).join(':');
    } else {
      // 대표 강점 영역
      const topArea = FM.areas.filter(a => a.polarity === 'positive').map(a => ({ a, t: agg[a.id] })).sort((x, y) => y.t - x.t)[0];
      dominantLabel = topArea ? topArea.a.name : '-';
    }
    const completion = Math.round(prog(1) / classData.size * 100);
    return { avgT, dist, total, watchCount, reliabilityCount, dominantLabel, dominantCounts, top, completion };
  }, [classData, effectiveSession, agg, lpaOn]);

  return (
    <div className="page page-class-v2">
      <PageHeader
        onBack={() => setNav({ ...nav, view: 'overview', classId: null })}
        title={<span>{classData.label} 검사 분석</span>}
        crumb={['결과보기', FM.name, classData.label + ' 검사 분석']}
        meta={
          <span className="page-head__meta-row">
            <span>서울초등학교</span>
            <span className="dot-sep">·</span>
            <span>초등 {classData.grade}학년</span>
            <span className="dot-sep">·</span>
            <span>학생 <strong>{classData.size}명</strong></span>
            <span className="dot-sep">·</span>
            <span>검사 완료 {prog(effectiveSession)}명</span>
            <span className="dot-sep">·</span>
            <span className="muted">초대 코드 <strong style={{ color: 'var(--brand)' }}>BC0B78</strong></span>
          </span>
        }
        right={
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn--sm" onClick={() => setReportOpen(true)}><IconDownload /> 보고서 다운로드</button>
          </div>
        }
      />

      {/* 전원 신뢰도 주의 경고 배너 */}
      {!isPending && (() => {
        const taken = classData.students.filter(s => sess(s, effectiveSession));
        const allWarn = taken.length > 0 && taken.every(s => sess(s, effectiveSession)._reliability === '주의');
        if (!allWarn) return null;
        return (
          <div className="class-warning-banner">
            <span className="class-warning-banner__icon">⚠️</span>
            <div>
              <strong>이 반은 전체 학생이 검사 신뢰도 주의 상태입니다.</strong>
              <span> 평소 신뢰도 주의 학생은 집계에서 제외되지만, 전원 주의인 경우 부득이 모두 포함해 평균·분포를 계산했습니다. 결과 해석에 특히 유의해 주세요.</span>
            </div>
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="class-tabs">
        {CLASS_TABS.filter(t => lpaOn || t.id !== 'types').map(t => (
          <button key={t.id}
            className={'class-tabs__btn' + (tab === t.id ? ' is-active' : '')}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {isPending && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>검사가 아직 진행되지 않았습니다</div>
          <div className="muted">1차 검사를 발급하면 결과를 확인할 수 있습니다</div>
        </div>
      )}

      {!isPending && kpi && (
        <>
          {/* 4 KPI cards (always visible) */}
          <div className="class-kpis">
            <div className="class-kpi class-kpi--purple">
              <div className="class-kpi__label">학급 평균 점수</div>
              <div className="class-kpi__value">{kpi.avgT}<span className="class-kpi__unit"> / 50</span></div>
              <div className="class-kpi__sub">전국 평균 대비 {kpi.avgT - 50 >= 0 ? '+' : ''}{(kpi.avgT - 50).toFixed(1)}</div>
            </div>
            <div className="class-kpi class-kpi--amber">
              <div className="class-kpi__label">{lpaOn ? '우세 유형' : '대표 강점 영역'}</div>
              <div className="class-kpi__value class-kpi__value--small">{kpi.dominantLabel}</div>
              <div className="class-kpi__sub">{lpaOn && kpi.total ? `${kpi.top[1]}명 (${Math.round(kpi.top[1]/kpi.total*100)}%)` : '반 평균 최상위'}</div>
            </div>
            <div className="class-kpi class-kpi--red">
              <div className="class-kpi__label">관심 필요 학생</div>
              <div className="class-kpi__value">{kpi.watchCount}<span className="class-kpi__unit">명</span></div>
              <div className="class-kpi__sub">신뢰도 주의 {kpi.reliabilityCount}명 포함</div>
            </div>
            <div className="class-kpi class-kpi--green">
              <div className="class-kpi__label">검사 완료율</div>
              <div className="class-kpi__value">{kpi.completion}<span className="class-kpi__unit">%</span></div>
              <div className="class-kpi__sub">1차 · {hasBoth ? '2차 완료' : has2 ? '2차 진행' : '2차 예정'}</div>
            </div>
          </div>

          {/* 유형 분포 section (핵심 요약 · LPA 있을 때만) */}
          {lpaOn && tab === 'summary' && (
            <div className="section">
              <div className="card">
                <div className="card__head">
                  <div>
                    <div className="card__title">검사별 유형 분포 <InfoTooltip title="LPA 유형이란?">{LPA_TIP}</InfoTooltip></div>
                    <div className="card__sub">1차와 2차 검사 결과를 비교하여 학생들의 유형 변화를 확인하세요. 조각·범례 클릭시 해당 유형 학생 목록이 나타납니다.</div>
                  </div>
                </div>
                <DistributionBars classData={classData} onStudentClick={openStudent} onGoTest={() => setNav({ ...nav, area: 'test', view: undefined, classId: undefined })} />
              </div>
            </div>
          )}

          {/* 영역 요약 막대 (핵심 요약 only) */}
          {tab === 'summary' && (
            <div className="section">
              <div className="card">
                <div className="card__head">
                  <div>
                    <div className="card__title">종합 결과 요약</div>
                    <div className="card__sub">{FM.areas.length}개 영역 하위요인의 반 평균 T점수입니다. 자세한 분석은 <strong>학습 상세</strong> 탭에서 볼 수 있습니다.</div>
                  </div>
                  <div className="seg seg--brand">
                    <button className={'seg__btn' + (sessionNo === 1 ? ' is-active' : '')} onClick={() => setSessionNo(1)}>1차 검사</button>
                    <button className={'seg__btn' + (sessionNo === 2 ? ' is-active' : '') + (!has2 ? ' is-disabled' : '')} onClick={() => has2 && setSessionNo(2)}>2차 검사 {!has2 && '예정'}</button>
                  </div>
                </div>
                <GradeBandColumnChart agg={agg} level="category" height={360} testId={testId} />
              </div>
            </div>
          )}

          {/* 학습 상세 (강점·약점 + 38요인 프로파일) */}
          {tab === 'features' && (
            <div className="section">
              <div className="card">
                <div className="card__head">
                  <div>
                    <div className="card__title">강점·약점 분석</div>
                    <div className="card__sub">우리 반 학생들의 학습 특성을 영역별로 분석했습니다.</div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <div className="seg seg--brand">
                      <button className={'seg__btn' + (sessionNo === 1 ? ' is-active' : '')} onClick={() => setSessionNo(1)}>1차 검사</button>
                      <button className={'seg__btn' + (sessionNo === 2 ? ' is-active' : '') + (!has2 ? ' is-disabled' : '')} onClick={() => has2 && setSessionNo(2)}>2차 검사 {!has2 && '예정'}</button>
                    </div>
                  </div>
                </div>
                <FeatureTopBoxes agg={agg} testId={testId} />
                <div className="feat-divider"></div>
                <div className="feat-drilldown-head feat-drilldown-head--row">
                  <div>
                    <div className="card__title" style={{ fontSize: 14 }}>{FM.areas.reduce((n,a)=>n+a.categories.reduce((m,c)=>m+c.factors.length,0),0)}개 요인 전체 T점수</div>
                    <div className="card__sub">정적 요인(자아강점·학습 디딤돌·긍정적 공부마음)은 점수가 높을수록, 부적 요인(학습 걸림돌·부정적 공부마음)은 점수가 낮을수록 학습에 긍정적인 영향을 의미합니다.</div>
                    <div className="click-hint">👆 요인을 클릭하면 그 요인의 <strong>학생별 점수</strong>를 볼 수 있습니다</div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <div className="seg">
                      <button className={'seg__btn' + (featLevel === 'factor' ? ' is-active' : '')} onClick={() => setFeatLevel('factor')}>세부 요인</button>
                      <button className={'seg__btn' + (featLevel === 'category' ? ' is-active' : '')} onClick={() => setFeatLevel('category')}>영역 요약</button>
                    </div>
                  </div>
                </div>
                <ProfileLineChart agg={agg} level={featLevel} sessionNo={effectiveSession} testId={testId} onFactorClick={(id, name) => setFactorModal({ id, name })} prevAgg={hasBoth && effectiveSession === 2 ? data.classAggregate(classData, 1, testId) : null} />
              </div>
            </div>
          )}

          {/* 운영 전략 (핵심 요약) */}
          {tab === 'summary' && (
            <div className="section">
              <div className="card">
                <div className="card__head">
                  <div>
                    <div className="card__title">추천 학급 운영 활동</div>
                    <div className="card__sub">{classData.label}의 학습 특성에 맞춰 AI가 추천한 활동입니다. 활동마다 바로 쓸 수 있는 자료가 함께 제공됩니다.</div>
                  </div>
                  <button className="btn btn--sm">📚 전체 자료실</button>
                </div>
                <Strategies agg={agg} testId={testId} />
              </div>
            </div>
          )}

          {/* 학생 목록 (학생 목록 탭) */}
          {tab === 'students' && (
            <div className="section">
              <div className="card">
                <div className="card__head">
                  <div>
                    <div className="card__title">
                      학생 목록 <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>{classData.size}명</span>
                      <button className="help-badge-btn" onClick={() => setBadgeInfoOpen(true)}>
                        <span className="help-badge-btn__q">?</span>
                        배지 기준 안내
                      </button>
                    </div>
                    <div className="card__sub">학생 이름을 클릭하면 개별 상세 분석으로 이동합니다.</div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <div className="searchbox">
                      <IconSearch />
                      <input placeholder="이름/번호 검색" />
                    </div>
                    <button className="btn btn--sm btn--brand" onClick={() => setReportOpen(true)}><IconDownload /> 보고서 다운로드</button>
                  </div>
                </div>
                <StudentListV2 classData={classData} listMode="card" onStudentClick={openStudent} lpaOn={lpaOn} effectiveSession={effectiveSession} testId={testId} />
              </div>
            </div>
          )}
        </>
      )}

      {badgeInfoOpen && <BadgeInfoModal onClose={() => setBadgeInfoOpen(false)} />}
      {factorModal && (
        <FactorStudentsModal
          classData={classData}
          testId={testId}
          sessionNo={effectiveSession}
          factorId={factorModal.id}
          factorName={factorModal.name}
          onClose={() => setFactorModal(null)}
          onStudentClick={(s) => { setFactorModal(null); openStudent(s); }}
        />
      )}

      {reportOpen && (
        <ReportModal
          classData={classData}
          has1={has1}
          has2={has2}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}

/* ============ 보고서 다운로드 모달 ============ */
function ReportModal({ classData, has1, has2, onClose }) {
  const completed = classData.students.filter(s => (s.compSessions && (s.compSessions[1] || s.compSessions[2])) || (s.sessions && (s.sessions[1] || s.sessions[2])));
  const [kind, setKind] = useStateCC('student'); // 'student' | 'teacher'
  const [round, setRound] = useStateCC(has2 ? 2 : 1);
  const [format, setFormat] = useStateCC('detail');
  const [selected, setSelected] = useStateCC(() => new Set(completed.map(s => s.num)));

  const toggle = (num) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(num)) next.delete(num); else next.add(num);
    return next;
  });
  const allSelected = selected.size === completed.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(completed.map(s => s.num)));

  const isTeacher = kind === 'teacher';
  // 교사용 반 보고서는 1차/2차 단일만 (1+2 합본 없음)
  const teacherRound = round === 3 ? (has2 ? 2 : 1) : round;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        <div className="report-modal__head">
          <div>
            <div className="report-modal__title">보고서 다운로드</div>
            <div className="report-modal__sub">{classData.label} · {isTeacher ? '반 전체 종합 보고서를 PDF로 받습니다' : '검사 완료 학생 보고서를 PDF로 받습니다'}</div>
          </div>
          <button className="iconbtn" onClick={onClose}>✕</button>
        </div>

        <div className="report-modal__body">
          <div className="report-field">
            <div className="report-field__label">보고서 종류</div>
            <div className="report-seg">
              <button className={'report-seg__btn' + (kind === 'student' ? ' is-active' : '')} onClick={() => { setKind('student'); }}>👤 학생 개별 보고서</button>
              <button className={'report-seg__btn' + (kind === 'teacher' ? ' is-active' : '')} onClick={() => { setKind('teacher'); if (round === 3) setRound(has2 ? 2 : 1); }}>🏫 교사용 반 보고서</button>
            </div>
          </div>

          <div className="report-field">
            <div className="report-field__label">차수</div>
            <div className="report-seg">
              <button className={'report-seg__btn' + (round === 1 ? ' is-active' : '')} onClick={() => setRound(1)}>1차 검사</button>
              <button className={'report-seg__btn' + (round === 2 ? ' is-active' : '') + (!has2 ? ' is-disabled' : '')}
                onClick={() => has2 && setRound(2)}>2차 검사 {!has2 && '(예정)'}</button>
              {!isTeacher && (
                <button className={'report-seg__btn' + (round === 3 ? ' is-active' : '') + (!has2 ? ' is-disabled' : '')}
                  onClick={() => has2 && setRound(3)}>1차 + 2차</button>
              )}
            </div>
          </div>

          {!isTeacher && (
            <div className="report-field">
              <div className="report-field__label">형식</div>
              <div className="report-seg">
                <button className={'report-seg__btn' + (format === 'detail' ? ' is-active' : '')} onClick={() => setFormat('detail')}>🗂 상세 보고서</button>
                <button className={'report-seg__btn' + (format === 'summary' ? ' is-active' : '')} onClick={() => setFormat('summary')}>🗒 요약 보고서</button>
              </div>
            </div>
          )}

          {!isTeacher && (
            <div className="report-field">
              <div className="report-field__label report-field__label--row">
                <span>대상 학생 <strong>{selected.size}명</strong> 선택됨</span>
                <button className="report-selectall" onClick={toggleAll}>{allSelected ? '전체 해제' : '전체 선택'}</button>
              </div>
              <div className="report-students">
                {completed.map(s => {
                  const checked = selected.has(s.num);
                  return (
                    <label key={s.num} className={'report-student' + (checked ? ' is-checked' : '')}>
                      <input type="checkbox" checked={checked} onChange={() => toggle(s.num)} />
                      <span className="report-student__check">{checked && '✓'}</span>
                      <span className="report-student__num">{s.num}</span>
                      <span className="report-student__name">{s.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {isTeacher && (
            <div className="report-teacher-note">
              <span className="report-teacher-note__icon">🏫</span>
              <div>
                <div className="report-teacher-note__title">{classData.label} · {teacherRound}차 교사용 보고서</div>
                <div className="report-teacher-note__desc">반 전체 유형 분포·강약점·운영 전략이 담긴 종합 분석 보고서입니다. 학생 개별 결과지는 포함되지 않습니다.</div>
              </div>
            </div>
          )}
        </div>

        <div className="report-modal__foot">
          <button className="btn" onClick={onClose}>취소</button>
          {isTeacher ? (
            <button className="btn btn--brand"
              onClick={() => { alert(`${classData.label} ${teacherRound}차 교사용 보고서를 다운로드합니다 (데모)`); onClose(); }}>
              <IconDownload /> {teacherRound}차 교사용 보고서 다운로드
            </button>
          ) : (
            <button className="btn btn--brand" disabled={selected.size === 0}
              onClick={() => { alert(`${selected.size}명의 보고서를 다운로드합니다 (데모)`); onClose(); }}>
              <IconDownload /> 다운로드 ( {selected.size}명 )
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ 검사별 유형 분포 (1차/2차 stacked vertical bars) ============ */
function DistributionBars({ classData, onStudentClick, onGoTest }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL.comprehensive;
  const [popover, setPopover] = useStateCC(null); // { sessionNo, lpaId } — 클릭 고정
  const [hover, setHover] = useStateCC(null); // { sessionNo, lpaId } — 호버
  const dist1 = classData.compProgress[1] > 0 ? data.classLPADist(classData, 1) : null;
  const dist2 = classData.compProgress[2] > 0 ? data.classLPADist(classData, 2) : null;

  const renderBar = (dist, sessionNo) => {
    if (!dist) {
      return (
        <div className="dist-col dist-col--empty">
          <div className="dist-col__title">{sessionNo}차 검사</div>
          <div className="dist-col__empty">
            <div className="dist-col__empty-dash">—</div>
            <div className="muted" style={{ fontSize: 13 }}>{sessionNo}차 검사가 아직 진행되지 않았습니다</div>
            <button className="btn btn--sm btn--brand mt-12" onClick={onGoTest}>{sessionNo}차 검사 진행하러 가기</button>
            <div className="muted mt-12" style={{ fontSize: 11 }}>2026.09.01 예정</div>
          </div>
        </div>
      );
    }
    const total = dist.depleted + dist.balanced + dist.immersed;
    const order = [
      { id: 'immersed', label: '몰입자원풍부' },
      { id: 'balanced', label: '안전균형' },
      { id: 'depleted', label: '자원소진' },
    ];
    // donut geometry
    const size = 188, stroke = 30, r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const segs = order.map(o => {
      const t = FM.lpaTypes.find(tt => tt.id === o.id);
      const n = dist[o.id];
      const frac = total ? n / total : 0;
      const seg = { o, t, n, frac, dash: frac * circ, offset };
      offset += frac * circ;
      return seg;
    });

    return (
      <div className="dist-col" onMouseLeave={() => setHover(null)}>
        <div className="dist-col__title">{sessionNo}차 검사</div>
        <div className="dist-donut-wrap">
          <svg width={size} height={size} className="dist-donut">
            <g transform={`rotate(-90 ${cx} ${cy})`}>
              {segs.map(s => {
                if (!s.n) return null;
                const shown = popover || hover;
                const isOpen = shown && shown.sessionNo === sessionNo && shown.lpaId === s.o.id;
                return (
                  <circle key={s.o.id}
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke={s.t.color}
                    strokeWidth={isOpen ? stroke + 6 : stroke}
                    strokeDasharray={`${s.dash} ${circ - s.dash}`}
                    strokedashoffset={-s.offset}
                    strokeDashoffset={-s.offset}
                    style={{ cursor: 'pointer', transition: 'stroke-width 0.15s' }}
                    onMouseEnter={() => setHover({ sessionNo, lpaId: s.o.id })}
                    onClick={() => setPopover((popover && popover.sessionNo === sessionNo && popover.lpaId === s.o.id) ? null : { sessionNo, lpaId: s.o.id })}>
                    <title>{`${s.o.label}형 ${s.n}명 (${Math.round(s.frac*100)}%)`}</title>
                  </circle>
                );
              })}
            </g>
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="800" fill="#27272A">{total}</text>
            <text x={cx} y={cy + 15} textAnchor="middle" fontSize="11" fill="#71717A">명</text>
          </svg>
          <div className="dist-donut__legend">
            {segs.map(s => {
              if (!s.n) return null;
              const shown = popover || hover;
              const isOpen = shown && shown.sessionNo === sessionNo && shown.lpaId === s.o.id;
              return (
                <button key={s.o.id}
                  className={'dist-legend-row' + (isOpen ? ' is-active' : '')}
                  onMouseEnter={() => setHover({ sessionNo, lpaId: s.o.id })}
                  onClick={() => setPopover((popover && popover.sessionNo === sessionNo && popover.lpaId === s.o.id) ? null : { sessionNo, lpaId: s.o.id })}>
                  <span className="dist-legend-row__dot" style={{ background: s.t.color }}></span>
                  <span className="dist-legend-row__name">{s.o.label}형</span>
                  <span className="dist-legend-row__val tnum">{s.n}명 · {Math.round(s.frac*100)}%</span>
                </button>
              );
            })}
          </div>
        </div>
        {(() => {
          const shown = popover || hover;
          if (!shown || shown.sessionNo !== sessionNo) return null;
          return (
            <LpaPopover
              classData={classData}
              sessionNo={sessionNo}
              lpaId={shown.lpaId}
              onClose={() => { setPopover(null); setHover(null); }}
              onStudentClick={onStudentClick}
            />
          );
        })()}
      </div>
    );
  };

  return (
    <div className="dist-cols">
      {renderBar(dist1, 1)}
      {renderBar(dist2, 2)}
      <div className="dist-cols__hint">조각·범례 클릭 → 학생 목록 보기</div>
    </div>
  );
}

function LpaPopover({ classData, sessionNo, lpaId, onClose, onStudentClick }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL.comprehensive;
  const type = FM.lpaTypes.find(t => t.id === lpaId);
  const matched = classData.students.filter(s => {
    const ses = s.compSessions[sessionNo];
    return ses && ses._lpa === lpaId;
  });
  return (
    <div className="lpa-popover" style={{ borderColor: type.color }}>
      <div className="lpa-popover__head">
        <span className="chip" style={{ background: type.colorSoft, color: type.color }}>● {type.name}</span>
        <button className="iconbtn" onClick={onClose}>✕</button>
      </div>
      <div className="lpa-popover__count">{matched.length}명</div>
      <div className="lpa-popover__hint">학생을 클릭하면 상세 분석으로 이동합니다</div>
      <div className="lpa-popover__list">
        {matched.map(s => {
          const ses = s.compSessions[sessionNo];
          return (
            <div key={s.num} className="lpa-popover__item" onClick={() => onStudentClick(s)}>
              <span className="lpa-popover__num">{s.num}</span>
              <span className="lpa-popover__name">{s.name}</span>
              {ses && ses._reliability === '주의' && <span className="chip chip--warn" style={{ fontSize: 10 }}>신뢰도</span>}
              <span className="chip chip--neutral" style={{ fontSize: 10 }}>관심</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ Feature TOP 3 ============ */
function FeatureTopBoxes({ agg, testId = 'comprehensive' }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL[testId];
  // strengths: positive factors ranked by T desc; weaknesses: polarity-aware concern desc
  const posItems = [];
  const negItems = [];
  FM.areas.forEach(a => a.categories.forEach(c => c.factors.forEach(f => {
    const t = agg[f.id];
    if (a.polarity === 'positive') {
      posItems.push({ ...f, area: a, t, score: t });            // higher T = stronger
    } else {
      negItems.push({ ...f, area: a, t, score: t });            // higher T = bigger concern
    }
  })));
  // Strengths = highest positive factors; Weaknesses = highest negative factors
  // (guarantee 3 each by always slicing the sorted list — mockup)
  const strengths = [...posItems].sort((a, b) => b.t - a.t);
  const weaknesses = [...negItems].sort((a, b) => b.t - a.t);
  const sTop = strengths.slice(0, 3);
  const wTop = weaknesses.slice(0, 3);

  const blurb = (name) => ({
    '학업열의': '학생들이 공부에 대한 흥미와 즐거움을 보입니다',
    '학습기술': '효과적인 학습 전략을 잘 활용합니다',
    '자아존중감': '자신에 대한 긍정적 인식이 강합니다',
    '학업스트레스': '성취 기준이 높아 스트레스가 누적되는 학생이 있습니다',
    '학업소진': '꾸준한 학습으로 피로 누적이 우려됩니다',
    '스마트폰 의존': '학습 외 시간에 디지털 기기 사용이 늘고 있습니다',
  }[name] || '');

  return (
    <div className="feat-top">
      <div>
        <div className="feat-top__head feat-top__head--green">
          강점 TOP 3
        </div>
        <div className="feat-top__list">
          {sTop.map((s, i) => (
            <div key={s.id} className="feat-card feat-card--good">
              <div className="feat-card__tag" style={{ color: s.area.color }}>#{s.area.name.replace(/\s/g, '')}</div>
              <div className="feat-card__title">{s.name}</div>
              <div className="feat-card__desc">{blurb(s.name) || `학년 평균을 상회하는 강점 영역입니다`}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="feat-top__head feat-top__head--red">
          약점 TOP 3
        </div>
        <div className="feat-top__list">
          {wTop.map((w, i) => (
            <div key={w.id} className="feat-card feat-card--bad">
              <div className="feat-card__tag" style={{ color: w.area.color }}>#{w.area.name.replace(/\s/g, '')}</div>
              <div className="feat-card__title">{w.name}</div>
              <div className="feat-card__desc">{blurb(w.name) || `학년 평균보다 높아 주의가 필요한 영역입니다`}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ 추천 학급 운영 활동 ============ */
const STRATEGY_LIBRARY = [
  {
    id: 'mindful', emoji: '😌', title: '마음챙김 명상',
    desc: '하루 5분 호흡 명상으로 학업 스트레스를 완화하고 정서를 안정시킵니다.',
    triggerAreas: ['obstacle'], triggerCats: ['aStress', 'rStress'],
    duration: '5분 / 회', cycle: '매일 아침',
    materials: [
      { type: 'video', name: '명상 가이드 영상', meta: '5:20', action: '재생' },
      { type: 'sheet', name: '호흡 명상 활동지', meta: 'PDF · 2p', action: '다운로드' },
      { type: 'slide', name: '수업용 슬라이드', meta: '8장', action: '열기' },
    ],
  },
  {
    id: 'recharge', emoji: '⚡', title: '학업 활력 회복 루틴',
    desc: '짧은 휴식과 작은 성취 경험을 설계해 학업 소진을 예방합니다.',
    triggerAreas: ['negMind'], triggerCats: ['burnout'],
    duration: '10분 / 회', cycle: '주 2회',
    materials: [
      { type: 'sheet', name: '활력 회복 워크북', meta: 'PDF · 4p', action: '다운로드' },
      { type: 'guide', name: '교사용 진행 가이드', meta: '읽기 3분', action: '열기' },
    ],
  },
  {
    id: 'digital', emoji: '📵', title: '디지털 절제 챌린지',
    desc: '학생이 스스로 스마트폰 사용 시간을 점검하고 줄이는 2주 챌린지입니다.',
    triggerAreas: ['obstacle'], triggerCats: ['distract'],
    duration: '2주 프로그램', cycle: '주간 운영',
    materials: [
      { type: 'sheet', name: '사용시간 기록표', meta: 'PDF · 1p', action: '다운로드' },
      { type: 'slide', name: '챌린지 안내 슬라이드', meta: '6장', action: '열기' },
      { type: 'video', name: '동기부여 영상', meta: '3:40', action: '재생' },
    ],
  },
  {
    id: 'esteem', emoji: '🌱', title: '강점 발견 활동',
    desc: '서로의 강점을 찾아 칭찬하며 자아존중감과 관계성을 키웁니다.',
    triggerAreas: ['self', 'posMind'], triggerCats: ['selfPos', 'growth'],
    duration: '20분 / 회', cycle: '주 1회',
    materials: [
      { type: 'sheet', name: '강점 카드 세트', meta: 'PDF · 12장', action: '다운로드' },
      { type: 'guide', name: '진행 가이드', meta: '읽기 4분', action: '열기' },
    ],
  },
  {
    id: 'study', emoji: '📚', title: '학습 습관 코칭',
    desc: '계획·시간관리·노트하기 등 학습 기술을 단계별로 익힙니다.',
    triggerAreas: ['stepstone'], triggerCats: ['meta', 'lskill'],
    duration: '15분 / 회', cycle: '주 2회',
    materials: [
      { type: 'sheet', name: '주간 학습 플래너', meta: 'PDF · 2p', action: '다운로드' },
      { type: 'slide', name: '학습 전략 슬라이드', meta: '10장', action: '열기' },
    ],
  },
];

const MATERIAL_META = {
  video: { icon: '🎬', label: '영상', color: '#E74C3C' },
  sheet: { icon: '📄', label: '활동지', color: '#3498DB' },
  slide: { icon: '📊', label: '슬라이드', color: '#F39C12' },
  guide: { icon: '📖', label: '가이드', color: '#2ECC71' },
};

function Strategies({ agg, testId = 'comprehensive' }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL[testId];
  const [added, setAdded] = useStateCC({});

  // Rank strategies by how well they match the class's concern areas (polarity-aware)
  const areaConcern = {};
  FM.areas.forEach(a => {
    const t = agg[a.id];
    areaConcern[a.id] = a.polarity === 'negative' ? (t - 50) : (50 - t);
  });
  // reason label: pick the highest-concern trigger area for each rec.
  // selfreg(또는 영역 id 불일치) 시 매칭 영역이 없으면 polarity 기준 최우선 영역으로 fallback.
  const fallbackArea = FM.areas
    .map(a => ({ a, score: areaConcern[a.id] || 0 }))
    .sort((x, y) => y.score - x.score)[0];
  const scored = STRATEGY_LIBRARY.map(s => {
    let best = null;
    s.triggerAreas.forEach(aid => {
      const a = FM.areas.find(x => x.id === aid);
      if (!a) return;
      const score = areaConcern[aid] || 0;
      if (!best || score > best.score) best = { area: a, score, t: agg[aid] };
    });
    if (!best) best = { area: fallbackArea.a, score: fallbackArea.score, t: agg[fallbackArea.a.id] };
    return { ...s, reason: best };
  }).sort((a, b) => b.reason.score - a.reason.score).slice(0, 3);

  const toggleAdd = (id) => setAdded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="strat-grid">
      {scored.map(s => {
        const a = s.reason.area;
        const concern = s.reason.score > 3;
        const mat = s.materials[0]; // 활동당 자료 1개
        const mm = MATERIAL_META[mat.type];
        return (
          <div key={s.id} className="strat-tile">
            <div className="strat-tile__top">
              <div className="strat-tile__icon" style={{ background: a.colorSoft }}>{s.emoji}</div>
              <span className="strat-tile__meta">{s.duration}</span>
            </div>
            <div className="strat-tile__title">{s.title}</div>
            {concern && (
              <span className="strat-tile__reason" style={{ background: a.colorSoft, color: a.color }}>
                {a.name} 보완
              </span>
            )}
            <div className="strat-tile__desc">{s.desc}</div>
            <button className="strat-tile__mat" title={`${mat.name} 다운로드`}>
              <span className="strat-tile__mat-icon" style={{ background: mm.color + '1A', color: mm.color }}>{mm.icon}</span>
              <span className="strat-tile__mat-text">
                <span className="strat-tile__mat-name">{mat.name}</span>
                <span className="strat-tile__mat-meta">{mm.label} · {mat.meta}</span>
              </span>
              <IconDownload />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ============ 학생 목록 (카드/리스트 toggle) ============ */
function StudentListV2({ classData, listMode, onStudentClick, lpaOn, effectiveSession, testId = 'comprehensive' }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL[testId];
  const data = window.HSJ_DATA;
  const [filter, setFilter] = useStateCC('all');

  const areaSummary = (ses) => {
    if (!ses) return null;
    // 3뎁스(소분류) 단위 강점/관심
    const factors = [];
    FM.areas.forEach(a => a.categories.forEach(c => c.factors.forEach(f => {
      factors.push({ id: f.id, name: f.name, color: a.color, polarity: a.polarity, t: ses[f.id] });
    })));
    const strength = factors
      .filter(f => f.polarity === 'positive')
      .sort((x, y) => y.t - x.t)[0];
    const concern = factors
      .map(f => ({ ...f, score: f.polarity === 'negative' ? f.t - 50 : 50 - f.t }))
      .sort((x, y) => y.score - x.score)[0];
    return { strength, concern };
  };

  const students = classData.students.map(s => {
    const s1 = data.sessionOf(s, testId, 1);
    const s2 = data.sessionOf(s, testId, 2);
    const cur = data.sessionOf(s, testId, effectiveSession) || s1 || s2;
    const latest = s2 || s1;
    return {
      ...s, s1, s2, cur,
      lpa1: s1 && s1._lpa,
      lpa2: s2 && s2._lpa,
      reliability1: s1 && s1._reliability === '주의',
      changed: s1 && s2 && s1._lpa !== s2._lpa,
      summary: areaSummary(latest),
      sumSession: s2 ? 2 : 1,
    };
  });

  let filtered = students;
  if (filter === 'reliability') filtered = students.filter(s => s.reliability1);
  if (filter === 'attention') filtered = students.filter(s => lpaOn ? (s.lpa1 === 'depleted' || s.lpa2 === 'depleted') : (s.summary && s.summary.concern.score >= 8));
  if (filter === 'changed') filtered = students.filter(s => s.changed);

  const counts = {
    all: students.length,
    reliability: students.filter(s => s.reliability1).length,
    attention: students.filter(s => lpaOn ? (s.lpa1 === 'depleted' || s.lpa2 === 'depleted') : (s.summary && s.summary.concern.score >= 8)).length,
    changed: students.filter(s => s.changed).length,
  };

  return (
    <>
      <div className="filterbar" style={{ marginBottom: 14 }}>
        <span className="filterbar__label">필터:</span>
        <button className={'filterchip' + (filter === 'all' ? ' is-active' : '')} onClick={() => setFilter('all')}>전체 {counts.all}</button>
        <span className="filterchip-wrap">
          <button className={'filterchip' + (filter === 'reliability' ? ' is-active' : '')} onClick={() => setFilter('reliability')}>⚠ 신뢰도 주의 {counts.reliability}</button>
        </span>
        <span className="filterchip-wrap">
          <button className={'filterchip' + (filter === 'attention' ? ' is-active' : '')} onClick={() => setFilter('attention')}>관심 필요 {counts.attention}</button>
        </span>
        {lpaOn && <button className={'filterchip' + (filter === 'changed' ? ' is-active' : '')} onClick={() => setFilter('changed')}>↻ 유형 변화 {counts.changed}</button>}
        <span style={{ marginLeft: 'auto' }} className="muted">{filtered.length}명 표시</span>
      </div>
      {listMode === 'card' ? <StudentCards students={filtered} onStudentClick={onStudentClick} lpaOn={lpaOn} testId={testId} />
        : <StudentTable students={filtered} onStudentClick={onStudentClick} lpaOn={lpaOn} testId={testId} />}
    </>
  );
}

function StudentCards({ students, onStudentClick, lpaOn, testId = 'comprehensive' }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL[testId];
  if (!lpaOn) {
    // LPA 없는 경우 (자기조절검사 · 고등) — 영역 요약 카드
    return (
      <div className="stu-cards">
        {students.map(s => {
          const sum = s.summary;
          return (
            <div key={s.num} className="stu-card stu-card--summary" onClick={() => onStudentClick(s)}>
              <div className="stu-card__head">
                <span className="stu-card__num">{s.num}</span>
                <span className="stu-card__name">{s.name}</span>
                <div className="stu-card__alerts">
                  {s.reliability1 && <span className="badge-legend__chip badge-legend__chip--risk" style={{ fontSize: 10, padding: '2px 7px' }}>🛡 신뢰도</span>}
                  {s.summary && s.summary.concern.score >= 8 && <span className="badge-legend__chip badge-legend__chip--warn" style={{ fontSize: 10, padding: '2px 7px' }}>⚠ 관심</span>}
                </div>
              </div>
              {sum && (
                <div className="stu-card__areas">
                  <div className="stu-card__area-row">
                    <span className="stu-card__area-tag" style={{ color: 'var(--gray-500)' }}>강점</span>
                    <span className="stu-card__area-name" style={{ color: sum.strength.color }}>{sum.strength.name}</span>
                    <span className="stu-card__area-sess">{s.sumSession}차</span>
                  </div>
                  <div className="stu-card__area-row">
                    <span className="stu-card__area-tag" style={{ color: 'var(--gray-500)' }}>관심</span>
                    <span className="stu-card__area-name" style={{ color: sum.concern.color }}>{sum.concern.name}</span>
                    <span className="stu-card__area-sess">{s.sumSession}차</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="stu-cards">
      {students.map(s => {
        const lpa1 = s.lpa1 ? FM.lpaTypes.find(t => t.id === s.lpa1) : null;
        const lpa2 = s.lpa2 ? FM.lpaTypes.find(t => t.id === s.lpa2) : null;
        const changeKind = s.lpa1 && s.lpa2
          ? (s.lpa1 === s.lpa2 ? 'same' : (rankLpa(s.lpa2) > rankLpa(s.lpa1) ? 'up' : 'down'))
          : null;
        return (
          <div key={s.num} className="stu-card" onClick={() => onStudentClick(s)}>
            <div className="stu-card__head">
              <span className="stu-card__num">{s.num}</span>
              <span className="stu-card__name">{s.name}</span>
              <div className="stu-card__alerts">
                {s.reliability1 && <span className="badge-legend__chip badge-legend__chip--risk" style={{ fontSize: 10, padding: '2px 7px' }}>🛡 신뢰도</span>}
                {(s.lpa1 === 'depleted' || s.lpa2 === 'depleted') && <span className="badge-legend__chip badge-legend__chip--warn" style={{ fontSize: 10, padding: '2px 7px' }}>⚠ 관심</span>}
              </div>
            </div>
            <div className="stu-card__sessions">
              <div className="stu-card__session">
                <span className="stu-card__sess-label">1차</span>
                {lpa1
                  ? <span className="stu-card__lpa" style={{ background: lpa1.colorSoft, color: lpa1.color }}>{lpa1.name}</span>
                  : <span className="stu-card__lpa stu-card__lpa--empty">미실시</span>}
              </div>
              <div className="stu-card__session">
                <span className="stu-card__sess-label">2차</span>
                {lpa2
                  ? <span className="stu-card__lpa" style={{ background: lpa2.colorSoft, color: lpa2.color }}>{lpa2.name}</span>
                  : <span className="stu-card__lpa stu-card__lpa--empty">미실시</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StudentTable({ students, onStudentClick, lpaOn, testId = 'comprehensive' }) {
  const FM = window.HSJ_DATA.FACTOR_MODEL[testId];
  return (
    <table className="stu-table">
      <thead>
        <tr>
          <th className="col-num">번호</th>
          <th>이름</th>
          <th>1차 LPA</th>
          <th>변화</th>
          <th>2차 LPA</th>
          <th>상태</th>
          <th style={{ textAlign: 'right' }}>액션</th>
        </tr>
      </thead>
      <tbody>
        {students.map(s => {
          const lpa1 = s.lpa1 ? FM.lpaTypes.find(t => t.id === s.lpa1) : null;
          const lpa2 = s.lpa2 ? FM.lpaTypes.find(t => t.id === s.lpa2) : null;
          const changeKind = s.lpa1 && s.lpa2
            ? (s.lpa1 === s.lpa2 ? 'same' : (rankLpa(s.lpa2) > rankLpa(s.lpa1) ? 'up' : 'down'))
            : null;
          return (
            <tr key={s.num} onClick={() => onStudentClick(s)}>
              <td className="col-num">{s.num}</td>
              <td className="col-name">{s.name}</td>
              <td>{lpa1 && <span className="chip" style={{ background: lpa1.colorSoft, color: lpa1.color, fontSize: 11 }}>● {lpa1.name}</span>}</td>
              <td>
                {changeKind === 'up' && <span style={{ color: 'var(--status-good)', fontWeight: 700 }}>↑ 긍정</span>}
                {changeKind === 'down' && <span style={{ color: 'var(--status-risk)', fontWeight: 700 }}>↓ 관심</span>}
                {changeKind === 'same' && <span className="muted">변화 없음</span>}
                {!changeKind && <span className="muted">—</span>}
              </td>
              <td>
                {lpa2 ? <span className="chip" style={{ background: lpa2.colorSoft, color: lpa2.color, fontSize: 11 }}>● {lpa2.name}</span>
                  : <span className="muted" style={{ fontSize: 12 }}>2차 미실시</span>}
              </td>
              <td>
                {s.reliability1 && <span className="badge-legend__chip badge-legend__chip--risk" style={{ fontSize: 10.5, padding: '2px 7px', marginRight: 4 }}>🛡 신뢰도</span>}
                {(s.lpa1 === 'depleted' || s.lpa2 === 'depleted') && <span className="badge-legend__chip badge-legend__chip--warn" style={{ fontSize: 10.5, padding: '2px 7px' }}>⚠ 관심</span>}
                {!s.reliability1 && s.lpa1 !== 'depleted' && s.lpa2 !== 'depleted' && <span className="muted">—</span>}
              </td>
              <td style={{ textAlign: 'right' }}>
                <button className="btn btn--xs" onClick={(e) => { e.stopPropagation(); onStudentClick(s); }}>상세 →</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function rankLpa(id) {
  return { depleted: 0, balanced: 1, immersed: 2 }[id] ?? 1;
}

/* ============ 요인별 학생 T점수 모달 ============ */
function FactorStudentsModal({ classData, testId, sessionNo, factorId, factorName, onClose, onStudentClick }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL[testId];
  // find polarity of the factor's parent area
  let polarity = 'positive', areaColor = 'var(--brand)';
  FM.areas.forEach(a => a.categories.forEach(c => c.factors.forEach(f => {
    if (f.id === factorId) { polarity = a.polarity; areaColor = a.color; }
  })));

  const rows = classData.students
    .map(s => {
      const ses = data.sessionOf(s, testId, sessionNo);
      return ses ? { s, t: ses[factorId], reliability: ses._reliability === '주의' } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.t - a.t);

  const avg = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.t, 0) / rows.length) : 0;
  const gradeOf = (t) => t < 30 ? '매우 낮음' : t < 40 ? '낮음' : t < 60 ? '보통' : t < 70 ? '높음' : '매우 높음';
  // "낮음" side = concern depends on polarity
  const isConcern = (t) => polarity === 'negative' ? t >= 60 : t <= 40;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="factor-modal" onClick={e => e.stopPropagation()}>
        <div className="factor-modal__head">
          <div>
            <div className="factor-modal__crumb" style={{ color: areaColor }}>요인별 학생 점수</div>
            <div className="factor-modal__title">{factorName}
              {polarity === 'negative' && <span className="polarity-tag polarity-tag--neg" style={{ marginLeft: 8 }}>낮을수록 좋음</span>}
            </div>
            <div className="factor-modal__meta">{classData.label} · {sessionNo}차 검사 · 반 평균 T {avg} · {rows.length}명</div>
          </div>
          <button className="iconbtn" onClick={onClose}>✕</button>
        </div>
        <div className="factor-modal__body">
          <div className="factor-list">
            {rows.map((r, i) => {
              const concern = isConcern(r.t);
              return (
                <button key={r.s.num} className="factor-row" onClick={() => onStudentClick(r.s)}>
                  <span className="factor-row__rank">{i + 1}</span>
                  <span className="factor-row__num">{r.s.num}번</span>
                  <span className="factor-row__name">{r.s.name}</span>
                  {r.reliability && <span className="chip chip--warn" style={{ fontSize: 10 }}>신뢰도</span>}
                  <span className="factor-row__bar">
                    <span className="factor-row__bar-fill" style={{ width: Math.max(2, Math.min(100, r.t)) + '%', background: concern ? 'var(--status-risk)' : areaColor }}></span>
                    <span className="factor-row__bar-mark"></span>
                  </span>
                  <span className={'factor-row__grade' + (concern ? ' is-concern' : '')}>{gradeOf(r.t)}</span>
                  <span className="factor-row__t tnum" style={{ color: concern ? 'var(--status-risk)' : 'var(--gray-800)' }}>T {r.t}</span>
                </button>
              );
            })}
            {rows.length === 0 && <div className="muted" style={{ padding: 24, textAlign: 'center' }}>검사 데이터가 없습니다</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ 배지 안내 모달 ============ */
function BadgeInfoModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="badge-info" onClick={e => e.stopPropagation()}>
        <div className="badge-info__head">
          <div className="badge-info__title">배지 안내</div>
          <button className="iconbtn" onClick={onClose}>✕</button>
        </div>
        <div className="badge-info__body">
          <section className="badge-info__sec">
            <span className="badge-legend__chip badge-legend__chip--warn">⚠ 관심</span>
            <p className="badge-info__lead">학생의 38개 심리 요인 중 평균과 큰 차이를 보이는 지표가 일정 수 이상일 때 표시됩니다.</p>
            <div className="badge-info__box">
              <div className="badge-info__box-title">표시 기준</div>
              <ul>
                <li>평균에서 매우 크게 벗어난 지표가 2개 이상</li>
                <li>또는, 경계 수준 지표가 5개 이상</li>
              </ul>
            </div>
            <p className="badge-info__foot">배지가 뜬 학생의 결과지를 확인하거나 개별 면담을 고려해보세요.</p>
          </section>

          <div className="badge-info__divider"></div>

          <section className="badge-info__sec">
            <span className="badge-legend__chip badge-legend__chip--risk">🛡 신뢰도</span>
            <p className="badge-info__lead">검사 결과를 해석하기 전에, 학생이 성실하게 응답했는지 확인이 필요합니다. 아래 3개 지표 중 하나라도 '주의'로 나타나면 결과의 신뢰성이 떨어집니다.</p>
            <div className="badge-info__box">
              <div className="badge-info__box-title">표시 기준 — 아래 3개 지표 중 하나라도 '주의'일 때</div>
              <div className="badge-info__item">
                <strong>1. 반응 일관성</strong>
                <span>동일하거나 유사한 문항에 일관되게 응답했는지 평가. 낮을 때 학생이 문항을 충분히 숙고하지 않았을 가능성.</span>
              </div>
              <div className="badge-info__item">
                <strong>2. 사회적 바람직성</strong>
                <span>타인에게 긍정적 이미지를 보이려는 응답 경향. 높을 때 실제 상태보다 긍정적으로 응답했을 가능성.</span>
              </div>
              <div className="badge-info__item">
                <strong>3. 연속 동일 반응</strong>
                <span>특정 유형의 응답이 지나치게 반복되었는지 평가. 많을 때 성실하게 답변하지 않았을 가능성.</span>
              </div>
            </div>
            <p className="badge-info__foot">결과 해석 시 참고로만 활용하시고, 필요시 재검사나 면담으로 보완할 수 있습니다.</p>
            <div className="badge-info__highlight">📌 신뢰도 주의 학생은 반 평균·유형 분포 등 <strong>대시보드 집계에서 제외</strong>됩니다. 단, 반 전원이 신뢰도 주의인 경우에는 부득이 집계에 포함됩니다.</div>
          </section>

          <div className="badge-info__note">
            두 배지 모두 학생의 상태를 단정하기 위한 것이 아닙니다. 교사의 관찰과 판단을 돕는 참고 신호로 활용해주세요.
          </div>
        </div>
        <div className="badge-info__footer">
          <label className="badge-info__dontshow">
            <input type="checkbox" /> <span>다시 보지 않기</span>
          </label>
          <button className="btn btn--brand" onClick={onClose}>확인</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CompClassPage });
