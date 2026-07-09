/* Mock data for 자기조절학습검사 (META Self-Regulated Learning Test) dashboard
 * Korean elementary school context, 4 homeroom classes, ~10 students each.
 * Two test sessions (1차, 2차) per year per test type.
 * Exposed on window.HSJ_DATA — read by all React modules.
 */

(function () {
  // ---------- factor model ----------
  const FACTOR_MODEL = {
    selfreg: {
      id: 'selfreg',
      name: '자기조절학습검사',
      shortName: '자기조절',
      color: '#009F88',
      colorSoft: '#E5F6F3',
      colorMid: '#80CFC4',
      hasLPAType: false,
      strategies: [
        {
          id: 'motivation',
          name: '동기전략',
          color: '#9F91F8',
          colorSoft: '#EEEBFE',
          desc: '학습하는 이유와 목적을 발견하여, 학습 지속성을 갖게 하는 마음가짐 전략',
          categories: [
            { id: 'driver',  name: '학습원동력',  factors: [
              { id: 'mindset',    name: '성장마인드셋' },
              { id: 'efficacy',   name: '학업효능감' },
              { id: 'motive',     name: '학습동기' },
            ]},
            { id: 'emotion', name: '정서조절', factors: [
              { id: 'gradeRegul', name: '성적부담조절' },
              { id: 'studyRegul', name: '공부부담조절' },
              { id: 'failRegul',  name: '실패부담조절' },
            ]},
          ],
        },
        {
          id: 'cognition',
          name: '인지전략',
          color: '#4BC1FF',
          colorSoft: '#E2F4FF',
          desc: '학습 내용을 효과적으로 파악하고, 체계적으로 습득하도록 돕는 전략',
          categories: [
            { id: 'meta',  name: '메타인지', factors: [
              { id: 'plan',    name: '계획능력' },
              { id: 'monitor', name: '점검능력' },
              { id: 'control', name: '조절능력' },
            ]},
            { id: 'skill', name: '인지적 학습기술', factors: [
              { id: 'understand', name: '이해기술' },
              { id: 'memory',     name: '기억기술' },
              { id: 'focus',      name: '집중기술' },
            ]},
          ],
        },
        {
          id: 'behavior',
          name: '행동전략',
          color: '#FF8A94',
          colorSoft: '#FFE8EA',
          desc: '학습 활동을 최적화될 수 있게 하는 학습기술 및 실행력 향상 전략',
          categories: [
            { id: 'bRegul', name: '행동조절', factors: [
              { id: 'praise',   name: '자기칭찬' },
              { id: 'helpAsk',  name: '도움구하기' },
              { id: 'persist',  name: '학습지속성' },
            ]},
            { id: 'bSkill', name: '행동적 학습기술', factors: [
              { id: 'env',     name: '공부환경' },
              { id: 'time',    name: '시간관리' },
              { id: 'attend',  name: '수업태도' },
              { id: 'note',    name: '노트하기' },
              { id: 'exam',    name: '시험준비' },
            ]},
          ],
        },
      ],
      // areas alias (comp 컴포넌트 재사용용 — 모두 정적, LPA 없음)
      get areas() { return this.strategies.map(s => ({ ...s, polarity: 'positive' })); },
      lpaTypes: [],
    },
    comprehensive: {
      id: 'comprehensive',
      name: '학습종합검사',
      shortName: '학습종합',
      color: '#9D53E1',
      colorSoft: '#F3EAFB',
      colorMid: '#C9A4ED',
      hasLPAType: true, // Tweaks에서 토글 (고등은 false)
      // 5 areas — 정·부적 혼재
      areas: [
        {
          id: 'self', name: '자아강점', color: '#00D282', colorSoft: '#DFF8EC', polarity: 'positive',
          desc: '자신의 가치와 능력에 대한 긍정적 인식과 대인관계능력',
          categories: [
            { id: 'selfPos', name: '긍정적 자아', factors: [
              { id: 'selfEsteem', name: '자아존중감' },
              { id: 'selfEfficacy', name: '자기효능감' },
              { id: 'growthMind', name: '성장마인드셋' },
            ]},
            { id: 'relation', name: '대인관계능력', factors: [
              { id: 'emoAware', name: '자기정서인식' },
              { id: 'emoRegul', name: '자기정서조절' },
              { id: 'otherAware', name: '타인정서인식' },
              { id: 'empathy', name: '타인공감능력' },
            ]},
          ],
        },
        {
          id: 'stepstone', name: '학습 디딤돌', color: '#4BC1FF', colorSoft: '#E2F4FF', polarity: 'positive',
          desc: '학습에 도움이 되는 메타인지·학습기술·지지적 관계',
          categories: [
            { id: 'meta', name: '메타인지', factors: [
              { id: 'plan2', name: '계획능력' },
              { id: 'monitor2', name: '점검능력' },
              { id: 'control2', name: '조절능력' },
            ]},
            { id: 'lskill', name: '학습기술', factors: [
              { id: 'env2', name: '공부환경' },
              { id: 'time2', name: '시간관리' },
              { id: 'attend2', name: '수업태도' },
              { id: 'note2', name: '노트하기' },
              { id: 'exam2', name: '시험준비' },
            ]},
            { id: 'support', name: '지지적 관계', factors: [
              { id: 'parentTalk', name: '부모 의사소통' },
              { id: 'parentAcad', name: '부모 학업지지' },
              { id: 'friendEmo', name: '친구 정서지지' },
              { id: 'teacherEmo', name: '교사 정서지지' },
            ]},
          ],
        },
        {
          id: 'posMind', name: '긍정적 공부마음', color: '#67A7FF', colorSoft: '#E4EFFF', polarity: 'positive',
          desc: '공부하고 싶은 마음과 학습 의지·심리적 욕구',
          categories: [
            { id: 'engagement', name: '학업열의', factors: [
              { id: 'vigor', name: '활기' },
              { id: 'absorb', name: '몰두' },
              { id: 'meaning', name: '의미감' },
            ]},
            { id: 'growth', name: '성장력', factors: [
              { id: 'autonomy', name: '자율성' },
              { id: 'competence', name: '유능성' },
              { id: 'relatedness', name: '관계성' },
            ]},
          ],
        },
        {
          id: 'obstacle', name: '학습 걸림돌', color: '#FF849F', colorSoft: '#FFE7EC', polarity: 'negative',
          desc: '공부를 방해하는 스트레스·압력·중독',
          categories: [
            { id: 'aStress', name: '학업스트레스', factors: [
              { id: 'gradeBurden', name: '성적부담' },
              { id: 'studyBurden', name: '공부부담' },
              { id: 'classBurden', name: '수업부담' },
            ]},
            { id: 'rStress', name: '학업관계 스트레스', factors: [
              { id: 'parentPressure', name: '부모 성적압력' },
              { id: 'parentLoad', name: '부모 공부부담' },
              { id: 'friendCompare', name: '친구 공부비교' },
              { id: 'teacherPressure', name: '교사 성적압력' },
              { id: 'teacherLoad', name: '교사 수업부담' },
            ]},
            { id: 'distract', name: '학습 방해물', factors: [
              { id: 'phoneAddict', name: '스마트폰 의존' },
              { id: 'gameAddict', name: '게임 과몰입' },
            ]},
          ],
        },
        {
          id: 'negMind', name: '부정적 공부마음', color: '#FF87D4', colorSoft: '#FFE6F4', polarity: 'negative',
          desc: '심리적으로 지쳐서 공부를 지속하기 어려운 상태',
          categories: [
            { id: 'burnout', name: '학업소진', factors: [
              { id: 'exhaust', name: '고갈' },
              { id: 'incompetence', name: '무능감' },
              { id: 'cynicism', name: '반감-냉소' },
            ]},
          ],
        },
      ],
      // LPA types for elementary
      lpaTypes: [
        { id: 'depleted', name: '자원소진형', color: '#E74C3C', colorSoft: '#FDECEA' },
        { id: 'balanced', name: '안전 균형형', color: '#3498DB', colorSoft: '#EAF3FB' },
        { id: 'immersed', name: '몰입자원 풍부형', color: '#2ECC71', colorSoft: '#E6F8EE' },
      ],
    },
  };

  // ---------- deterministic PRNG (seeded) ----------
  function makeRng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };
  }
  function tnorm(rng, mean = 50, sd = 10) {
    // crude approximation of normal distribution
    let u = 0;
    for (let i = 0; i < 4; i++) u += rng();
    const z = (u - 2) * Math.sqrt(3 / 2);
    return Math.round(Math.max(15, Math.min(85, mean + z * sd)));
  }

  // ---------- student name pool ----------
  const SURNAMES = ['강','고','남','류','문','박','배','서','손','신','오','윤','이','임','장','정','조','최','한','홍','김','권','노','민','백','석','심','안','양','우','유','임','전','채','천','표','하','황'];
  const GIVENS = ['시우','우진','은채','채아','현우','준혁','서윤','서현','지호','민서','지유','하준','예린','도윤','수아','지원','연우','은성','다인','시현','지안','민준','수빈','윤서','태민','채은','하은','지훈','승우','예진'];

  function makeStudent(rng, num, classBias) {
    const name = SURNAMES[Math.floor(rng() * SURNAMES.length)] + GIVENS[Math.floor(rng() * GIVENS.length)];
    return {
      num,
      name,
      gender: rng() > 0.5 ? 'F' : 'M',
      // bias for the class so different classes look different
      bias: classBias,
    };
  }

  // ---------- score generator ----------
  // Returns T-scores keyed by factor id (the 20 sub-factors) + roll-ups.
  function makeSession(rng, biasVec, growth = 0) {
    // biasVec: [motivation, cognition, behavior] offsets in T units
    const out = {};
    const FM = FACTOR_MODEL.selfreg;
    const stratScore = {};
    FM.strategies.forEach((strat, sIdx) => {
      const stratBias = biasVec[sIdx] + (growth ? (rng() * growth * 2 - growth * 0.3) : 0);
      const catScores = [];
      strat.categories.forEach((cat) => {
        const catBias = stratBias + (rng() * 6 - 3);
        const factorScores = [];
        cat.factors.forEach((f) => {
          const t = tnorm(rng, 50 + catBias, 8);
          out[f.id] = t;
          factorScores.push(t);
        });
        const catAvg = Math.round(factorScores.reduce((a, b) => a + b, 0) / factorScores.length);
        out[cat.id] = catAvg;
        catScores.push(catAvg);
      });
      const stratAvg = Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length);
      out[strat.id] = stratAvg;
      stratScore[strat.id] = stratAvg;
    });
    // reliability: small chance of '주의'
    out._reliability = rng() < 0.08 ? '주의' : '양호';
    return out;
  }

  // Comprehensive: 5 areas; positive areas correlated together, negative areas inversely
  function makeCompSession(rng, compBiasVec, growth = 0) {
    // compBiasVec: [self, stepstone, posMind, obstacle, negMind] offsets in T units
    const out = {};
    const FM = FACTOR_MODEL.comprehensive;
    FM.areas.forEach((area, aIdx) => {
      const areaBias = compBiasVec[aIdx] + (growth ? (rng() * growth * 2 - growth * 0.3) : 0);
      const catScores = [];
      area.categories.forEach((cat) => {
        const catBias = areaBias + (rng() * 5 - 2.5);
        const factorScores = [];
        cat.factors.forEach((f) => {
          const t = tnorm(rng, 50 + catBias, 8);
          out[f.id] = t;
          factorScores.push(t);
        });
        const catAvg = Math.round(factorScores.reduce((a, b) => a + b, 0) / factorScores.length);
        out[cat.id] = catAvg;
        catScores.push(catAvg);
      });
      const areaAvg = Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length);
      out[area.id] = areaAvg;
    });
    out._reliability = rng() < 0.07 ? '주의' : '양호';
    out._lpa = classifyLPA(out);
    return out;
  }

  // LPA classifier (elementary 3-type)
  function classifyLPA(compSession) {
    const pos = (compSession.self + compSession.stepstone + compSession.posMind) / 3;
    const neg = (compSession.obstacle + compSession.negMind) / 2;
    // 자원소진형: pos 낮음 또는 neg 높음
    if (pos < 47 || neg > 53) return 'depleted';
    // 몰입자원 풍부형: pos 높음 AND neg 낮음
    if (pos >= 53 && neg <= 47) return 'immersed';
    return 'balanced';
  }

  // ---------- build classes ----------
  function buildClass(meta) {
    const rng = makeRng(meta.seed);
    const students = [];
    for (let i = 1; i <= meta.size; i++) {
      const s = makeStudent(rng, i, meta.classBias);
      // Selfreg sessions
      const s1 = makeSession(rng, meta.selfregBias, 0);
      const s2 = makeSession(rng, meta.selfregBias.map((b, idx) => b + meta.selfregGrowth[idx]), 6);
      // Comprehensive sessions
      const c1 = makeCompSession(rng, meta.compBias, 0);
      const c2 = makeCompSession(rng, meta.compBias.map((b, idx) => b + meta.compGrowth[idx]), 6);
      students.push({
        ...s,
        sessions: { 1: s1, 2: s2 },
        compSessions: { 1: c1, 2: c2 },
      });
    }
    return {
      id: meta.id,
      label: meta.label,
      grade: meta.grade,
      classNo: meta.classNo,
      size: meta.size,
      students,
      progress: { 1: meta.progress[0], 2: meta.progress[1] },
      compProgress: { 1: meta.compProgress[0], 2: meta.compProgress[1] },
    };
  }

  const CLASSES = [
    buildClass({
      id: '5-1', label: '5학년 1반', grade: 5, classNo: 1, size: 0, seed: 11,
      progress: [0, 0], compProgress: [0, 0],
      classBias: 'a',
      selfregBias: [0, 0, 0], selfregGrowth: [0, 0, 0],
      compBias: [0, 0, 0, 0, 0], compGrowth: [0, 0, 0, 0, 0],
    }),
    buildClass({
      id: '6-1', label: '6학년 1반', grade: 6, classNo: 1, size: 10, seed: 22,
      progress: [10, 10], compProgress: [10, 10],
      classBias: 'b',
      selfregBias: [-2, +1, -3], selfregGrowth: [+3, +2, +5],
      // 6-1: 정·부적이 모두 평균 근처지만 양극화 (자원소진/풍부가 반반)
      compBias: [-2, -3, -1, +2, +2], compGrowth: [+3, +4, +2, -3, -4],
    }),
    buildClass({
      id: '6-2', label: '6학년 2반', grade: 6, classNo: 2, size: 10, seed: 33,
      progress: [10, 8], compProgress: [10, 6],
      classBias: 'c',
      selfregBias: [+1, -1, +2], selfregGrowth: [-1, +4, +1],
      // 6-2: 균형형 다수, 모든 유형 골고루
      compBias: [-1, -1, 0, +1, 0], compGrowth: [+2, +1, +2, -2, -2],
    }),
    buildClass({
      id: '6-3', label: '6학년 3반', grade: 6, classNo: 3, size: 11, seed: 44,
      progress: [11, 0], compProgress: [11, 0],
      classBias: 'd',
      selfregBias: [-3, -4, -2], selfregGrowth: [0, 0, 0],
      // 6-3: 자원소진형 다수 (가장 어려운 반)
      compBias: [-4, -5, -3, +5, +4], compGrowth: [0, 0, 0, 0, 0],
    }),
    buildClass({
      id: '5-2', label: '5학년 2반', grade: 5, classNo: 2, size: 10, seed: 55,
      progress: [10, 0], compProgress: [10, 0],
      classBias: 'e',
      selfregBias: [+1, +2, +1], selfregGrowth: [0, 0, 0],
      compBias: [+1, +1, +2, -1, -1], compGrowth: [0, 0, 0, 0, 0],
    }),
    buildClass({
      id: '5-3', label: '5학년 3반', grade: 5, classNo: 3, size: 11, seed: 66,
      progress: [11, 0], compProgress: [11, 0],
      classBias: 'f',
      selfregBias: [0, +1, 0], selfregGrowth: [0, 0, 0],
      compBias: [0, +1, 0, 0, +1], compGrowth: [0, 0, 0, 0, 0],
    }),
    buildClass({
      id: '4-1', label: '4학년 1반', grade: 4, classNo: 1, size: 12, seed: 77,
      progress: [12, 0], compProgress: [12, 0],
      classBias: 'g',
      selfregBias: [-1, 0, -1], selfregGrowth: [0, 0, 0],
      compBias: [-1, -1, 0, +2, +1], compGrowth: [0, 0, 0, 0, 0],
    }),
    buildClass({
      id: '4-2', label: '4학년 2반', grade: 4, classNo: 2, size: 11, seed: 88,
      progress: [11, 0], compProgress: [11, 0],
      classBias: 'h',
      selfregBias: [+2, +1, +2], selfregGrowth: [0, 0, 0],
      compBias: [+2, +2, +3, -2, -2], compGrowth: [0, 0, 0, 0, 0],
    }),
    buildClass({
      id: '4-3', label: '4학년 3반', grade: 4, classNo: 3, size: 10, seed: 99,
      progress: [10, 0], compProgress: [10, 0],
      classBias: 'i',
      selfregBias: [-2, -1, -1], selfregGrowth: [0, 0, 0],
      compBias: [-2, -2, -1, +3, +2], compGrowth: [0, 0, 0, 0, 0],
    }),
    buildClass({
      id: '4-4', label: '4학년 4반', grade: 4, classNo: 4, size: 12, seed: 110,
      progress: [12, 0], compProgress: [12, 0],
      classBias: 'j',
      selfregBias: [0, 0, +1], selfregGrowth: [0, 0, 0],
      compBias: [0, 0, +1, 0, -1], compGrowth: [0, 0, 0, 0, 0],
    }),
    buildClass({
      id: '3-1', label: '3학년 1반', grade: 3, classNo: 1, size: 11, seed: 121,
      progress: [11, 0], compProgress: [11, 0],
      classBias: 'k',
      selfregBias: [+1, 0, +1], selfregGrowth: [0, 0, 0],
      compBias: [+1, 0, +1, -1, 0], compGrowth: [0, 0, 0, 0, 0],
    }),
  ];

  // 데모용: 3학년 1반(3-1)은 응시자 전원을 검사 신뢰도 '주의'로 설정
  (function () {
    const demo = CLASSES.find(c => c.id === '3-1');
    if (demo) demo.students.forEach(s => {
      [1, 2].forEach(n => {
        if (s.compSessions && s.compSessions[n]) s.compSessions[n]._reliability = '주의';
        if (s.sessions && s.sessions[n]) s.sessions[n]._reliability = '주의';
      });
    });
  })();

  // ---------- aggregations ----------
  function avgFor(students, key, sessionNo, sessKey = 'sessions') {
    const vals = students.map(s => s[sessKey] && s[sessKey][sessionNo] && s[sessKey][sessionNo][key]).filter(v => v != null);
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  function classAggregate(cls, sessionNo, testId = 'selfreg') {
    const out = {};
    const sessKey = testId === 'comprehensive' ? 'compSessions' : 'sessions';
    if (testId === 'comprehensive') {
      const FM = FACTOR_MODEL.comprehensive;
      FM.areas.forEach(area => {
        out[area.id] = avgFor(cls.students, area.id, sessionNo, sessKey);
        area.categories.forEach(cat => {
          out[cat.id] = avgFor(cls.students, cat.id, sessionNo, sessKey);
          cat.factors.forEach(f => {
            out[f.id] = avgFor(cls.students, f.id, sessionNo, sessKey);
          });
        });
      });
    } else {
      const FM = FACTOR_MODEL.selfreg;
      FM.strategies.forEach(strat => {
        out[strat.id] = avgFor(cls.students, strat.id, sessionNo, sessKey);
        strat.categories.forEach(cat => {
          out[cat.id] = avgFor(cls.students, cat.id, sessionNo, sessKey);
          cat.factors.forEach(f => {
            out[f.id] = avgFor(cls.students, f.id, sessionNo, sessKey);
          });
        });
      });
    }
    return out;
  }

  // LPA distribution across a class
  function classLPADist(cls, sessionNo) {
    const dist = { depleted: 0, balanced: 0, immersed: 0 };
    cls.students.forEach(s => {
      const ses = s.compSessions && s.compSessions[sessionNo];
      if (ses && ses._lpa) dist[ses._lpa]++;
    });
    return dist;
  }

  // LPA transitions between 1차 → 2차 (Sankey-friendly counts)
  function classLPAFlow(cls) {
    const flow = {};
    cls.students.forEach(s => {
      const a = s.compSessions && s.compSessions[1] && s.compSessions[1]._lpa;
      const b = s.compSessions && s.compSessions[2] && s.compSessions[2]._lpa;
      if (!a || !b) return;
      const key = a + '→' + b;
      flow[key] = (flow[key] || 0) + 1;
    });
    return flow;
  }

  // Classify factor strength for COMPREHENSIVE — polarity-aware
  // Returns 'strength' | 'growth' | 'improvement'
  function classifyCompFactor(t, polarity) {
    if (t == null) return 'na';
    if (polarity === 'negative') {
      // For 학습 걸림돌/부정공부마음: LOW T is good
      if (t <= 40) return 'strength';
      if (t >= 60) return 'improvement';
      return 'growth';
    }
    if (t >= 60) return 'strength';
    if (t <= 40) return 'improvement';
    return 'growth';
  }

  // Strength / Improvement / Growth-expect classifier
  // Strength: T >= 60   (≥ 상위)
  // Growth-expect: 41 <= T <= 59  (보통, 잘 안내하면 향상 가능)
  // Improvement: T <= 40  (낮음·매우낮음, 우선 보완 필요)
  function classifyFactor(t) {
    if (t == null) return 'na';
    if (t >= 60) return 'strength';
    if (t <= 40) return 'improvement';
    return 'growth';
  }

  // ---------- expose ----------
  const CLASS_COLORS = [
    '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
    '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4',
  ];

  window.HSJ_DATA = {
    FACTOR_MODEL,
    CLASSES,
    CLASS_COLORS,
    classColor(i) { return CLASS_COLORS[i % CLASS_COLORS.length]; },
    classAggregate,
    classLPADist,
    classLPAFlow,
    classifyFactor,
    classifyCompFactor,
    classifyLPA,
    avgFor,
    // helpers
    getClass(id) { return CLASSES.find(c => c.id === id); },
    progressOf(cls, testId, n) { return testId === 'comprehensive' ? cls.compProgress[n] : cls.progress[n]; },
    sessionOf(student, testId, n) { return testId === 'comprehensive' ? (student.compSessions && student.compSessions[n]) : (student.sessions && student.sessions[n]); },
    allStudents() { return CLASSES.flatMap(c => c.students.map(s => ({ ...s, classId: c.id, classLabel: c.label }))); },
  };
})();
