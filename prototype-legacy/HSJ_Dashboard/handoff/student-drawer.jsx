/* HSJ Dashboard — Student Drawer + AI Drawer + Tabs
 */

const { useState: useStateSD, useEffect: useEffectSD, useMemo: useMemoSD, useRef: useRefSD } = React;

/* ============ Coaching TIPs (from PDF) ============ */
const SELFREG_TIPS = {
  mindset:   { tip: '작은 노력과 실천으로 바꿀 수 있는 것 시도하기', desc: '재능과 능력은 노력으로 변할 수 있습니다.' },
  efficacy:  { tip: '내가 잘해왔던 학습활동 적어보고 자신감 갖기', desc: '잘해왔던 경험을 떠올리면 자신감이 커집니다.' },
  motive:    { tip: '공부하면 나에게 좋은 점 3가지 적어보기', desc: '나만의 공부 이유를 찾아보세요.' },
  gradeRegul:{ tip: '성적 부담이 크더라도 한번 더 공부해 보기', desc: '부담을 작은 행동으로 옮겨보세요.' },
  studyRegul:{ tip: '공부할 분량을 작게 나누어 하나씩 공부하기', desc: '작은 성취로 부담을 줄여보세요.' },
  failRegul: { tip: '자주 틀리는 유형이나 문제 한번 더 풀어보기', desc: '실패를 학습 기회로 바꿔보세요.' },
  plan:      { tip: '하루 동안 공부할 계획표 짜기', desc: '계획하는 능력은 자존감과 직결됩니다.' },
  monitor:   { tip: '공부하면서 배운 내용과 해결한 문제 되돌아보기', desc: '점검은 학습 효율을 높여요.' },
  control:   { tip: '나의 공부습관 중 바꾸고 싶은 것 하나 골라서 바꿔보기', desc: '나쁜 습관 하나만 바꿔도 큰 변화입니다.' },
  understand:{ tip: '학습한 내용을 얼마나 잘 이해했는지 떠올려보기', desc: '암기보다 이해가 우선입니다.' },
  memory:    { tip: '수업 후 배운 내용 복습하고, 반복하여 읽기', desc: '반복은 기억의 핵심 전략입니다.' },
  focus:     { tip: '한 과목만 장시간 공부하지 않고, 과목 바꿔가며 공부하기', desc: '과목 전환이 집중력을 높여요.' },
  praise:    { tip: '공부하면서 잘했던 점 스스로 구체적으로 칭찬하기', desc: '자기 칭찬은 동기를 만들어요.' },
  helpAsk:   { tip: '모르는 문제는 적극적으로 선생님께 물어보기', desc: '도움 구하기는 성장의 시작입니다.' },
  persist:   { tip: '공부가 힘들어도 계획한 분량은 꼭 마쳐 보기', desc: '완주 경험이 학습지속성을 키웁니다.' },
  env:       { tip: '공부에 방해되는 물건 정리해보기', desc: '환경 정돈이 집중력을 만들어요.' },
  time:      { tip: '공부 시간을 하루에 10분씩 늘려 보기', desc: '점진적 증가가 습관을 만들어요.' },
  attend:    { tip: '수업에 집중할 수 있는 방법 1개 이상 실천하기', desc: '수업 태도가 성적의 핵심입니다.' },
  note:      { tip: '수업 내용 필기하고, 보완할 사항 적어보기', desc: '필기는 기억과 복습의 도구입니다.' },
  exam:      { tip: '공부할 때 시험에 나올 수 있는 부분 체크하기', desc: '시험 준비 전략을 평소에 적용합니다.' },
};
const COMP_TIPS = {
  selfEsteem:  { tip: '나의 좋은 점 3가지 적어 거울 옆에 붙이기', desc: '자아존중감은 작은 인정에서 시작됩니다.' },
  selfEfficacy:{ tip: '잘 해낸 일 적어두고 다음 과제에 떠올리기', desc: '성공 경험이 자기효능감을 만들어요.' },
  growthMind: { tip: '실수를 "성장 기회"로 다시 말하기 연습', desc: '성장 마인드셋이 능력보다 중요합니다.' },
  emoRegul:   { tip: '4-7-8 호흡법으로 감정 다스리기', desc: '감정 조절은 학습 안정의 토대입니다.' },
  empathy:    { tip: '친구가 화났을 때 이유 추측해보기', desc: '공감 능력은 관계의 핵심입니다.' },
  plan2:      { tip: '오늘 공부 목표 3가지 적기', desc: '계획은 메타인지의 첫걸음입니다.' },
  monitor2:   { tip: '공부 끝나고 5분 회고 적기', desc: '점검은 학습 효율을 배가시킵니다.' },
  control2:   { tip: '잘 안 됐던 공부법 바꿔보기', desc: '조절 능력이 진짜 메타인지입니다.' },
  env2:       { tip: '책상 위 휴대폰 치우기', desc: '환경이 집중력을 결정합니다.' },
  time2:      { tip: '하루 공부 시간 10분씩 늘리기', desc: '꾸준함이 성적을 만들어요.' },
  attend2:    { tip: '수업 5분 전 준비물 챙기기', desc: '수업 준비가 태도의 시작입니다.' },
  note2:      { tip: '핵심 내용 색깔 펜으로 표시하기', desc: '필기 습관이 시험을 좌우합니다.' },
  exam2:      { tip: '시험 일주일 전 계획표 짜기', desc: '시험 준비는 일찍이 시작돼야 합니다.' },
  parentTalk: { tip: '부모님께 학교생활 한 가지 말씀드리기', desc: '대화가 신뢰의 시작입니다.' },
  parentAcad: { tip: '부모님께 공부 목표 공유하기', desc: '학업 지지는 가정에서 시작됩니다.' },
  friendEmo:  { tip: '친구에게 고민 한 가지 털어놓기', desc: '친구 지지가 정서의 안전망입니다.' },
  teacherEmo: { tip: '선생님께 궁금한 점 1개 질문하기', desc: '교사와의 관계가 학습 동기를 만들어요.' },
  vigor:      { tip: '공부 시작 전 좋아하는 노래 1곡 듣기', desc: '활기는 짧은 의식에서 와요.' },
  absorb:     { tip: '집중 25분 + 휴식 5분 포모도로', desc: '몰입은 시간 관리에서 시작됩니다.' },
  meaning:    { tip: '내가 공부하는 이유 한 줄로 적기', desc: '의미감이 학업열의의 핵심입니다.' },
  autonomy:   { tip: '오늘 공부 순서 스스로 정하기', desc: '자율성이 성장력을 키웁니다.' },
  competence: { tip: '잘 해낸 일에 "할 수 있다" 외치기', desc: '유능감은 작은 성공에서 와요.' },
  relatedness:{ tip: '모둠 친구에게 도움 받기 1번', desc: '관계성이 학습의 큰 동력입니다.' },
  gradeBurden:{ tip: '성적 부담 들 때 호흡 3번 하기', desc: '부담은 잠시 떨어져 보면 가벼워집니다.' },
  studyBurden:{ tip: '공부 양을 작은 단위로 나누기', desc: '큰 분량을 작게 쪼개면 부담이 줄어요.' },
  classBurden:{ tip: '수업 중 어려운 부분 표시해두기', desc: '나중에 다시 보면 이해할 수 있습니다.' },
  parentPressure: { tip: '부모님께 현재 컨디션 솔직히 말씀드리기', desc: '소통이 압력을 줄입니다.' },
  parentLoad: { tip: '부모님과 공부 시간 협상하기', desc: '합의된 약속이 부담을 줄입니다.' },
  friendCompare: { tip: '나만의 강점에 집중하기', desc: '비교 대신 나의 성장에 집중하세요.' },
  teacherPressure: { tip: '선생님 기대를 도전으로 받아들이기', desc: '압력을 동기로 바꿀 수 있습니다.' },
  teacherLoad:{ tip: '모르는 내용 수업 후 따로 질문하기', desc: '수업 부담은 질문으로 풀어요.' },
  phoneAddict:{ tip: '공부 시간 휴대폰 다른 방에 두기', desc: '환경이 의존을 줄입니다.' },
  gameAddict: { tip: '게임 시간 타이머 30분으로 설정', desc: '제한이 자기조절을 키웁니다.' },
  exhaust:    { tip: '주 1회 운동·취미로 쉬기', desc: '쉼이 학업소진을 막아요.' },
  incompetence:{ tip: '잘한 일 노트에 기록하기', desc: '성공 기록이 무능감을 줄입니다.' },
  cynicism:   { tip: '공부 좋은 점 1가지 떠올리기', desc: '작은 의미가 냉소를 녹여요.' },
};

/* ============ Student Drawer ============ */
function StudentDrawer({ studentInfo, close, navigate }) {
  const data = window.HSJ_DATA;
  const cls = data.getClass(studentInfo.classId);
  const student = cls.students.find(s => s.num === studentInfo.num);
  const test = studentInfo.test || 'selfreg';
  const [tab, setTab] = useStateSD('summary');
  const [sessionNo, setSessionNo] = useStateSD(studentInfo.sessionNo || 2);

  const sibs = studentInfo.siblings || [];
  const idx = sibs.findIndex(s => s.num === student.num && s.classId === cls.id);
  const hasNext = sibs.length > 0;

  const FM = data.FACTOR_MODEL[test];
  const sessions = test === 'comprehensive' ? student.compSessions : student.sessions;
  const cur = sessions[sessionNo];
  const prev = sessionNo === 2 ? sessions[1] : null;
  const testColor = FM.color;

  // pick LPA for comprehensive
  const lpa = test === 'comprehensive' && cur && cur._lpa
    ? FM.lpaTypes.find(t => t.id === cur._lpa) : null;

  const studentKey = `${cls.id}_${student.num}`;

  return (
    <>
      <div className="drawer__head" style={{ borderTop: '3px solid ' + testColor }}>
        <div className="drawer__head-row">
          <div className="drawer__head-meta">
            <span className="muted">{cls.label}</span>
            <span className="dot-sep">·</span>
            <span>{student.num}번</span>
            <span className="dot-sep">·</span>
            <span className="muted">{FM.shortName}검사 {sessionNo}차</span>
          </div>
          <div className="drawer__head-actions">
            {hasNext && (
              <>
                <button className="iconbtn" onClick={() => navigate(-1)} title="이전 학생 (←)">‹</button>
                <span className="drawer__sib-counter">{idx + 1} / {sibs.length}</span>
                <button className="iconbtn" onClick={() => navigate(1)} title="다음 학생 (→)">›</button>
              </>
            )}
            <button className="iconbtn drawer__close" onClick={close} title="닫기 (Esc)">✕</button>
          </div>
        </div>
        <div className="drawer__head-title-row">
          <h2 className="drawer__name">{student.name}</h2>
          {lpa && (
            <span className="chip" style={{ background: lpa.colorSoft, color: lpa.color }}>{lpa.name}</span>
          )}
          {cur._reliability === '주의' && (
            <span className="chip chip--warn">신뢰도 주의</span>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <SessionSwitcher value={sessionNo} onChange={setSessionNo} />
          </div>
        </div>
      </div>

      <div className="drawer__tabs">
        {[
          { id: 'summary', name: '요약', icon: '📊' },
          { id: 'note',    name: '메모', icon: '📝' },
          { id: 'consult', name: '상담', icon: '💬' },
          { id: 'coach',   name: '코칭 전략', icon: '🎯' },
          { id: 'record',  name: '생기부', icon: '📋' },
          { id: 'chat',    name: 'AI 챗', icon: '✨' },
        ].map(t => (
          <button key={t.id}
            className={'drawer__tab' + (tab === t.id ? ' is-active' : '')}
            onClick={() => setTab(t.id)}>
            <span className="drawer__tab-icon">{t.icon}</span>
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      <div className="drawer__body">
        {tab === 'summary' && <SummaryTab student={student} cls={cls} test={test} cur={cur} prev={prev} sessionNo={sessionNo} />}
        {tab === 'note'    && <NoteTab studentKey={studentKey} student={student} />}
        {tab === 'consult' && <ConsultTab studentKey={studentKey} student={student} />}
        {tab === 'coach'   && <CoachTab student={student} cur={cur} test={test} />}
        {tab === 'record'  && <RecordTab student={student} cur={cur} test={test} />}
        {tab === 'chat'    && <ChatTab student={student} cur={cur} test={test} />}
      </div>
    </>
  );
}

/* ============ Summary Tab ============ */
function SummaryTab({ student, cls, test, cur, prev, sessionNo }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL[test];

  // dimensions (3 for selfreg, 5 for comp)
  const dims = test === 'comprehensive'
    ? FM.areas.map(a => ({ id: a.id, name: a.name, color: a.color, polarity: a.polarity }))
    : FM.strategies.map(s => ({ id: s.id, name: s.name, color: s.color, polarity: 'positive' }));

  // concerns
  let concerns = [];
  let strengths = [];
  if (test === 'comprehensive') {
    FM.areas.forEach(a => a.categories.forEach(c => c.factors.forEach(f => {
      const t = cur[f.id];
      const danger = a.polarity === 'negative' ? t >= 60 : t <= 40;
      const strong = a.polarity === 'negative' ? t <= 35 : t >= 60;
      if (danger) concerns.push({ name: f.name, t, color: a.color, area: a.name, polarity: a.polarity });
      if (strong) strengths.push({ name: f.name, t, color: a.color, area: a.name, polarity: a.polarity });
    })));
  } else {
    FM.strategies.forEach(s => s.categories.forEach(c => c.factors.forEach(f => {
      const t = cur[f.id];
      if (t <= 40) concerns.push({ name: f.name, t, color: s.color, area: s.name });
      if (t >= 60) strengths.push({ name: f.name, t, color: s.color, area: s.name });
    })));
  }
  concerns.sort((a, b) => a.t - b.t).splice(3);
  strengths.sort((a, b) => b.t - a.t).splice(3);

  return (
    <div className="drawer-body__pad">
      {/* AI insight */}
      <div className="insight" style={{ marginBottom: 14 }}>
        <div className="insight__head">💡 AI 학생 분석</div>
        <div className="insight__body">
          {student.name} 학생은 {test === 'comprehensive'
            ? (cur._lpa === 'depleted' ? '학습 자원이 부족해 우선 정서적 지지가 필요합니다.'
              : cur._lpa === 'immersed' ? '학습 자원이 풍부해 도전적 과제를 추천드립니다.'
              : '학습 자원이 균형적이지만 일부 영역의 강화가 필요합니다.')
            : '동기·인지·행동 전략 중 ' + (() => {
                const ss = FM.strategies.map(s => ({...s, t: cur[s.id]})).sort((a,b) => a.t - b.t)[0];
                return `${ss.name}이 T ${ss.t}로 가장 약합니다.`;
              })()
          }
          {prev && (() => {
            const dimIds = dims.map(d => d.id);
            const avg = (s) => dimIds.reduce((sum, id) => sum + s[id], 0) / dimIds.length;
            const d = Math.round((avg(cur) - avg(prev)) * 10) / 10;
            return d !== 0 ? ` 1차 대비 종합 점수가 ${d > 0 ? '+' : ''}${d} ${d > 0 ? '상승' : '하락'}했습니다.` : '';
          })()}
        </div>
      </div>

      {/* Dimension scores grid */}
      <div className="card__title" style={{ marginBottom: 8 }}>{test === 'comprehensive' ? '5대 영역' : '3대 전략'}</div>
      <div className="stu-dims">
        {dims.map(d => {
          const t = cur[d.id];
          const pt = prev ? prev[d.id] : null;
          const delta = pt != null ? t - pt : null;
          const isNeg = d.polarity === 'negative';
          const deltaGood = delta != null && (isNeg ? delta < 0 : delta > 0);
          return (
            <div key={d.id} className="stu-dim" style={{ borderLeftColor: d.color }}>
              <div className="stu-dim__head">
                <span className="stu-dim__name" style={{ color: d.color }}>{d.name}</span>
                {isNeg && <span className="polarity-tag polarity-tag--neg">부적</span>}
              </div>
              <div className="stu-dim__bar">
                <div className="stu-dim__bar-fill" style={{ width: Math.max(2, Math.min(98, t)) + '%', background: d.color }}></div>
                <div className="stu-dim__bar-mark"></div>
              </div>
              <div className="stu-dim__foot">
                <span className="tnum" style={{ fontWeight: 800 }}>T {t}</span>
                {delta != null && (
                  <span className={'chip ' + (deltaGood ? 'chip--good' : delta === 0 ? 'chip--neutral' : 'chip--warn')} style={{ fontSize: 10 }}>
                    {delta > 0 ? '▲' : delta < 0 ? '▼' : '–'} {Math.abs(delta)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Concerns + Strengths */}
      <div className="grid-2 mt-16" style={{ gap: 12 }}>
        <div className="card" style={{ padding: 14 }}>
          <div className="card__title" style={{ fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: 'var(--status-risk)' }}>🔴 관심 영역</span>
          </div>
          {concerns.length === 0 && <div className="muted" style={{ fontSize: 12 }}>관심 영역이 없습니다</div>}
          {concerns.map(c => (
            <div key={c.name} className="concern-row">
              <span style={{ color: c.color, fontSize: 12.5, fontWeight: 700 }}>{c.name}</span>
              <span className="tnum" style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 12, color: 'var(--status-risk)' }}>T {c.t}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div className="card__title" style={{ fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: 'var(--status-good)' }}>🟢 강점</span>
          </div>
          {strengths.length === 0 && <div className="muted" style={{ fontSize: 12 }}>두드러진 강점이 없습니다</div>}
          {strengths.map(c => (
            <div key={c.name} className="concern-row">
              <span style={{ color: c.color, fontSize: 12.5, fontWeight: 700 }}>{c.name}</span>
              <span className="tnum" style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 12, color: 'var(--status-good)' }}>T {c.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ Note Tab (localStorage backed) ============ */
function NoteTab({ studentKey, student }) {
  const lsKey = 'hsj_memo_' + studentKey;
  const [notes, setNotes] = useStateSD(() => {
    try { return JSON.parse(localStorage.getItem(lsKey) || '[]'); } catch { return []; }
  });
  const [text, setText] = useStateSD('');

  const save = () => {
    if (!text.trim()) return;
    const next = [{ id: Date.now(), at: new Date().toISOString(), text: text.trim() }, ...notes];
    setNotes(next);
    localStorage.setItem(lsKey, JSON.stringify(next));
    setText('');
  };
  const remove = (id) => {
    const next = notes.filter(n => n.id !== id);
    setNotes(next);
    localStorage.setItem(lsKey, JSON.stringify(next));
  };

  return (
    <div className="drawer-body__pad">
      <div className="card" style={{ padding: 12 }}>
        <textarea
          placeholder={`${student.name} 학생에 대한 메모를 작성해보세요. (학부모님과 공유되지 않습니다)`}
          value={text}
          onChange={e => setText(e.target.value)}
          className="note-textarea"
        />
        <div className="row row--end mt-12">
          <button className="btn btn--brand btn--sm" onClick={save} disabled={!text.trim()}>+ 메모 저장</button>
        </div>
      </div>
      <div className="mt-16">
        <div className="card__title" style={{ fontSize: 13, marginBottom: 8 }}>저장된 메모 ({notes.length})</div>
        {notes.length === 0 && (
          <div className="muted" style={{ fontSize: 12, padding: 14, textAlign: 'center' }}>
            아직 저장된 메모가 없습니다
          </div>
        )}
        {notes.map(n => (
          <div key={n.id} className="note-item">
            <div className="note-item__head">
              <span className="note-item__date">{formatDate(n.at)}</span>
              <button className="btn btn--xs btn--ghost" onClick={() => remove(n.id)}>삭제</button>
            </div>
            <div className="note-item__body">{n.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Consult Tab (localStorage backed) ============ */
function ConsultTab({ studentKey, student }) {
  const lsKey = 'hsj_consult_' + studentKey;
  const [items, setItems] = useStateSD(() => {
    try { return JSON.parse(localStorage.getItem(lsKey) || '[]'); } catch { return []; }
  });
  const [date, setDate] = useStateSD(() => new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));
  const [topic, setTopic] = useStateSD('학업 상담');
  const [note, setNote] = useStateSD('');

  const save = () => {
    if (!date) return;
    const next = [{ id: Date.now(), date, topic, note, status: 'scheduled' }, ...items];
    setItems(next);
    localStorage.setItem(lsKey, JSON.stringify(next));
    setNote('');
  };
  const toggleStatus = (id) => {
    const next = items.map(it => it.id === id ? { ...it, status: it.status === 'scheduled' ? 'done' : 'scheduled' } : it);
    setItems(next);
    localStorage.setItem(lsKey, JSON.stringify(next));
  };
  const remove = (id) => {
    const next = items.filter(it => it.id !== id);
    setItems(next);
    localStorage.setItem(lsKey, JSON.stringify(next));
  };

  return (
    <div className="drawer-body__pad">
      <div className="card" style={{ padding: 14 }}>
        <div className="card__title" style={{ fontSize: 13, marginBottom: 12 }}>{student.name} 학생 상담 예약</div>
        <div className="form-row">
          <label className="form-row__label">날짜</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" />
        </div>
        <div className="form-row">
          <label className="form-row__label">유형</label>
          <select value={topic} onChange={e => setTopic(e.target.value)} className="form-input">
            <option>학업 상담</option>
            <option>학교생활 상담</option>
            <option>학부모 상담</option>
            <option>진로 상담</option>
            <option>심리·정서 상담</option>
          </select>
        </div>
        <div className="form-row">
          <label className="form-row__label">상담 요청 사항</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="구체적인 상담 내용을 적어주세요"
            className="form-input form-input--textarea"
          />
        </div>
        <div className="row row--end mt-12">
          <button className="btn btn--brand btn--sm" onClick={save}>+ 상담 예약</button>
        </div>
      </div>
      <div className="mt-16">
        <div className="card__title" style={{ fontSize: 13, marginBottom: 8 }}>예약·이력 ({items.length})</div>
        {items.length === 0 && (
          <div className="muted" style={{ fontSize: 12, padding: 14, textAlign: 'center' }}>아직 예약된 상담이 없습니다</div>
        )}
        {items.map(it => (
          <div key={it.id} className="consult-item">
            <div style={{ flex: 1 }}>
              <div className="consult-item__head">
                <span className="consult-item__date">{it.date}</span>
                <span className={'chip ' + (it.status === 'done' ? 'chip--good' : 'chip--info')}>{it.status === 'done' ? '완료' : '예정'}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>{it.topic}</span>
              </div>
              {it.note && <div className="consult-item__note">{it.note}</div>}
            </div>
            <div className="row" style={{ gap: 4 }}>
              <button className="btn btn--xs" onClick={() => toggleStatus(it.id)}>{it.status === 'done' ? '재예약' : '완료 처리'}</button>
              <button className="btn btn--xs btn--ghost" onClick={() => remove(it.id)}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Coach Tab — factor-based TIPs ============ */
function CoachTab({ student, cur, test }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL[test];
  const TIPS = test === 'selfreg' ? SELFREG_TIPS : COMP_TIPS;
  // collect weak factors (polarity-aware for comp)
  let weak = [];
  if (test === 'comprehensive') {
    FM.areas.forEach(a => a.categories.forEach(c => c.factors.forEach(f => {
      const t = cur[f.id];
      const danger = a.polarity === 'negative' ? t >= 58 : t <= 42;
      if (danger && TIPS[f.id]) weak.push({ id: f.id, name: f.name, t, color: a.color, polarity: a.polarity, area: a.name });
    })));
  } else {
    FM.strategies.forEach(s => s.categories.forEach(c => c.factors.forEach(f => {
      const t = cur[f.id];
      if (t <= 42 && TIPS[f.id]) weak.push({ id: f.id, name: f.name, t, color: s.color, area: s.name });
    })));
  }
  weak.sort((a, b) => test === 'comprehensive'
    ? (a.polarity === 'negative' ? b.t - a.t : a.t - b.t)
    : a.t - b.t).splice(6);

  return (
    <div className="drawer-body__pad">
      <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
        {student.name} 학생의 약점 영역에 적합한 학습 습관 TIP들입니다. 카드를 학습 일지나 학급 계획에 활용해보세요.
      </div>
      {weak.length === 0 && (
        <div className="card" style={{ padding: 30, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 700 }}>특별한 약점 영역이 없습니다</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>현재 균형 있는 학습을 유지하고 있습니다</div>
        </div>
      )}
      {weak.map(w => {
        const tip = TIPS[w.id];
        return (
          <div key={w.id} className="coach-card" style={{ borderLeftColor: w.color }}>
            <div className="coach-card__head">
              <span className="coach-card__factor" style={{ color: w.color }}>{w.area} · {w.name}</span>
              <span className="chip chip--warn" style={{ fontSize: 10.5 }}>T {w.t}</span>
            </div>
            <div className="coach-card__tip">💡 {tip.tip}</div>
            <div className="coach-card__desc">{tip.desc}</div>
            <div className="row row--end mt-12">
              <button className="btn btn--xs">학급 계획에 추가</button>
              <button className="btn btn--xs btn--brand">메모로 저장</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============ Record Tab — 생기부 ============ */
function RecordTab({ student, cur, test }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL[test];
  // Generate suggested 생기부 문구
  let lines = [];
  if (test === 'comprehensive') {
    const strengthArea = FM.areas
      .filter(a => a.polarity === 'positive')
      .map(a => ({ ...a, t: cur[a.id] }))
      .sort((a, b) => b.t - a.t)[0];
    if (strengthArea && strengthArea.t >= 55) {
      lines.push(`${strengthArea.name}이(가) T${strengthArea.t}로 뚜렷한 강점을 보이며, 학습 활동에 적극적으로 참여함.`);
    }
    lines.push(`학습 과정에서 ${cur._lpa === 'immersed' ? '몰입 능력이 우수' : cur._lpa === 'balanced' ? '균형 잡힌 자세' : '꾸준한 노력'}을(를) 보임.`);
    lines.push(`반 평균 대비 ${cur._lpa === 'depleted' ? '추가 관심과 정서적 지지가 필요한' : '주체적 학습 태도가 두드러진'} 학생임.`);
  } else {
    const top = FM.strategies.map(s => ({ ...s, t: cur[s.id] })).sort((a, b) => b.t - a.t)[0];
    lines.push(`${top.name}이(가) T${top.t}로 두드러져 학습 자기조절 능력이 ${top.t >= 60 ? '우수한' : '양호한'} 편임.`);
    lines.push(`수업 시간 ${top.id === 'cognition' ? '집중력과 이해력이' : top.id === 'motivation' ? '학습 동기와 열의가' : '실행력과 학습 태도가'} 두드러지게 나타남.`);
  }

  const copyAll = () => {
    navigator.clipboard.writeText(lines.join(' ')).then(() => alert('생기부 문구가 클립보드에 복사됐습니다'));
  };

  return (
    <div className="drawer-body__pad">
      <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
        {student.name} 학생의 검사 결과를 바탕으로 생활기록부 작성을 위한 추천 문구입니다. 수정 후 복사해서 활용해보세요.
      </div>
      <div className="card" style={{ padding: 14 }}>
        <div className="card__title" style={{ fontSize: 13, marginBottom: 10 }}>📋 생기부 추천 문구</div>
        <div className="record-lines">
          {lines.map((l, i) => (
            <div key={i} className="record-line">
              <span className="record-line__bullet">•</span>
              <span>{l}</span>
            </div>
          ))}
        </div>
        <div className="row row--end mt-12">
          <button className="btn btn--sm" onClick={() => navigator.clipboard.writeText(lines.join(' '))}>📋 전체 복사</button>
          <button className="btn btn--sm btn--brand" onClick={copyAll}>✏️ 편집 후 복사</button>
        </div>
      </div>
      <div className="mt-16 muted" style={{ fontSize: 11, padding: '0 4px', lineHeight: 1.6 }}>
        ⚠ 자동 생성된 문구이므로 학생의 실제 모습과 맞는지 확인 후 사용해주세요. 검사 결과만으로 학생을 판단하지 않도록 주의가 필요합니다.
      </div>
    </div>
  );
}

/* ============ Chat Tab — canned AI conversation ============ */
function ChatTab({ student, cur, test }) {
  const data = window.HSJ_DATA;
  const FM = data.FACTOR_MODEL[test];
  const suggestions = test === 'comprehensive'
    ? [
        `${student.name} 학생의 학업 스트레스 원인은?`,
        '관심 영역 개선을 위해 어떤 코칭이 효과적일까요?',
        '학부모님께 어떻게 안내해드리면 좋을까요?',
      ]
    : [
        `${student.name} 학생의 동기·인지·행동 전략 균형은?`,
        '이 학생에게 적합한 학습 습관 TIP은?',
        '1차 대비 가장 큰 변화는?',
      ];

  const [messages, setMessages] = useStateSD([
    {
      role: 'assistant',
      text: `안녕하세요. ${student.name} 학생 (${FM.shortName}검사) 분석을 도와드릴게요. 무엇이 궁금하세요?`,
    },
  ]);
  const [input, setInput] = useStateSD('');
  const [loading, setLoading] = useStateSD(false);
  const bodyRef = useRefSD(null);

  useEffectSD(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading]);

  const send = (txt) => {
    if (!txt.trim()) return;
    setMessages(m => [...m, { role: 'user', text: txt }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: 'assistant', text: generateAnswer(txt, student, cur, FM, test) }]);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="chat">
      <div className="chat__body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={'chat__msg chat__msg--' + m.role}>
            {m.role === 'assistant' && <span className="chat__avatar">✨</span>}
            <div className="chat__bubble">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="chat__msg chat__msg--assistant">
            <span className="chat__avatar">✨</span>
            <div className="chat__bubble chat__bubble--loading">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>
      <div className="chat__suggestions">
        {suggestions.map((s, i) => (
          <button key={i} className="chat__suggestion" onClick={() => send(s)}>{s}</button>
        ))}
      </div>
      <div className="chat__input-row">
        <input
          className="chat__input"
          placeholder={`${student.name} 학생에 대해 질문해보세요...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
        />
        <button className="btn btn--brand" onClick={() => send(input)} disabled={!input.trim() || loading}>전송</button>
      </div>
    </div>
  );
}

function generateAnswer(question, student, cur, FM, test) {
  const q = question.toLowerCase();
  // very simple intent matching with student data
  if (test === 'comprehensive') {
    if (q.includes('스트레스')) {
      return `${student.name} 학생의 학업스트레스는 T ${cur.aStress}, 학업관계스트레스는 T ${cur.rStress}입니다. ${cur.aStress > cur.rStress ? '본인이 느끼는 학업 부담' : '주변에서 받는 학업 압력'}이 더 크네요. ${cur.aStress >= 60 || cur.rStress >= 60 ? '상담 선생님과 조기 면담을 권장드립니다.' : '현재는 또래 수준입니다.'}`;
    }
    if (q.includes('관심') || q.includes('코칭')) {
      const FMC = FM.areas.flatMap(a => a.categories.flatMap(c => c.factors.map(f => ({ ...f, polarity: a.polarity }))));
      const weak = FMC.filter(f => f.polarity === 'negative' ? cur[f.id] >= 58 : cur[f.id] <= 42).slice(0, 2);
      if (weak.length === 0) return `${student.name} 학생은 균형있는 결과를 보이고 있습니다. 현재 강점을 유지하는 활동을 추천드립니다.`;
      return `우선 코칭이 필요한 영역은 ${weak.map(w => w.name).join(', ')}입니다. 코칭 전략 탭에서 학습 습관 TIP을 확인하실 수 있습니다.`;
    }
    if (q.includes('학부모') || q.includes('안내')) {
      return `${student.name} 학생의 검사 결과를 학부모님께 안내하실 때, ${cur._lpa === 'depleted' ? '"학교에서 함께 살펴보고 싶다"는 동반자적 톤' : '"학생의 강점을 더 키워주고 싶다"는 긍정적 톤'}으로 시작하시면 효과적입니다. 구체적인 영역 점수보다는 학교생활 관찰과 결합해서 말씀드리는 게 좋습니다.`;
    }
    return `${student.name} 학생의 종합 분석을 도와드릴게요. 5대 영역 중 자아강점 T${cur.self}, 학습 디딤돌 T${cur.stepstone}, 긍정적 공부마음 T${cur.posMind}입니다. 더 자세히 알고 싶은 영역을 알려주세요.`;
  } else {
    if (q.includes('변화') || q.includes('비교') || q.includes('1차')) {
      const session1 = student.sessions[1];
      const m = cur.motivation - session1.motivation;
      const c = cur.cognition - session1.cognition;
      const b = cur.behavior - session1.behavior;
      const max = [m, c, b].reduce((a, v) => Math.abs(v) > Math.abs(a) ? v : a, 0);
      const label = max === m ? '동기전략' : max === c ? '인지전략' : '행동전략';
      return `${student.name} 학생은 1차 대비 ${label}이 ${max > 0 ? '+' : ''}${max} 변화했습니다. 동기 ${m > 0 ? '+' : ''}${m} / 인지 ${c > 0 ? '+' : ''}${c} / 행동 ${b > 0 ? '+' : ''}${b}.`;
    }
    if (q.includes('균형') || q.includes('전략')) {
      return `${student.name} 학생의 3대 전략 균형: 동기 T${cur.motivation}, 인지 T${cur.cognition}, 행동 T${cur.behavior}입니다. ${cur.motivation < cur.cognition && cur.motivation < cur.behavior ? '동기' : cur.cognition < cur.behavior ? '인지' : '행동'} 전략이 상대적으로 약하니 이 영역의 학습 습관 TIP부터 시도해보세요.`;
    }
    if (q.includes('습관') || q.includes('TIP') || q.includes('tip')) {
      return `학생의 약점 요인 기반 추천 TIP은 "코칭 전략" 탭에서 확인하실 수 있습니다. 가장 우선순위가 높은 1-2개부터 실천하는 것을 추천드립니다.`;
    }
    return `${student.name} 학생의 자기조절학습 분석을 도와드릴게요. 동기 T${cur.motivation}, 인지 T${cur.cognition}, 행동 T${cur.behavior}입니다. 어떤 부분이 궁금하세요?`;
  }
}

/* ============ AI Drawer (from FAB) ============ */
function AIDrawer({ seed, close }) {
  return (
    <>
      <div className="drawer__head" style={{ borderTop: '3px solid var(--brand)' }}>
        <div className="drawer__head-row">
          <div className="drawer__head-meta">
            <span style={{ fontWeight: 800, fontSize: 14 }}>✨ AI 어시스턴트</span>
          </div>
          <div className="drawer__head-actions">
            <button className="iconbtn drawer__close" onClick={close}>✕</button>
          </div>
        </div>
        <div className="muted" style={{ fontSize: 12, padding: '0 20px 14px' }}>
          학급 전체에 대한 질문이나 보고서 작성을 도와드립니다
        </div>
      </div>
      <div className="drawer__body" style={{ padding: 0 }}>
        <ChatTab
          student={{ name: '학급', num: 0 }}
          cur={{ motivation: 50, cognition: 50, behavior: 50, _lpa: 'balanced', self: 50, stepstone: 50, posMind: 50, obstacle: 50, negMind: 50, aStress: 55, rStress: 50 }}
          test="comprehensive"
        />
      </div>
    </>
  );
}

/* ============ utils ============ */
function formatDate(iso) {
  const d = new Date(iso);
  const Y = d.getFullYear(), M = String(d.getMonth() + 1).padStart(2, '0'), D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0'), m = String(d.getMinutes()).padStart(2, '0');
  return `${Y}-${M}-${D} ${h}:${m}`;
}

Object.assign(window, { StudentDrawer, AIDrawer });
