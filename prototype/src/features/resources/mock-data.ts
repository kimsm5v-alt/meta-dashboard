/**
 * 수업 자료실 mock 데이터 — 목업 everyclass-v2 1.html 이식.
 * 백엔드 연동 전까지 사용. (개인정보 없는 샘플 데이터)
 */
import { hashKey } from './utils/hash';
import type {
  LibItem,
  MyLesson,
  Report,
  ContentPickItem,
  Article,
  StudentActivity,
  ResponseData,
  StatusCd,
} from './types';

/** 목업 기준일 */
export const TODAY = '2026-07-15';

/**
 * 반 목록 · 반별 정원 로스터.
 * REPORTS[].total 과 인원이 일치해야 목록 카드(참여 n/m)와 상세 배정 인원이 어긋나지 않는다.
 * 실시간 모니터링(MonitorContent)도 같은 로스터를 스크롤 표로 그린다.
 */
export const CLASSES = ['2-3반', '2-4반', '2-5반'];

export const STUDENTS: Record<string, string[]> = {
  '2-3반': ['김서준', '이하은', '박도윤', '최지우', '정민재', '강수아', '윤예린', '임하준', '조은결', '백서아'],
  '2-4반': ['오지호', '한서윤', '신도현', '배은우', '조유나', '권시윤', '황라온', '문지안', '류시온', '편도윤'],
  '2-5반': ['남태윤', '서하율', '구민서', '방시우', '엄채원', '진우진', '표소율', '계지호', '변주하', '라윤재'],
};

// ============================================
// 자료실 taxonomy (필터 축)
// ============================================
export const PROVIDERS: [string, string][] = [
  ['peernada', '피어나다'],
  ['onlyone', '온리원'],
  ['visang', '비상'],
  ['research', '연구단'],
  ['office', '교육청'],
];
export const SEL_AREAS = ['자기인식', '자기관리', '사회적인식', '관계기술', '책임있는의사결정'];
export const LEVELS = ['초', '중', '고'];
export const GRADES = ['초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];
export const DURATIONS = ['5분', '40분', '45분', '50분', '80분'];
export const FACTORS_SHORT = ['감정인식', '감정조절', '공감', '의사소통', '갈등해결', '목표설정', '강점인식', '문제해결'];

// ============================================
// 콘텐츠 슬라이드 덱 — contentId → 페이지 이미지
// 원본: docs/[비상교육] 테마 특강_N.*_활동지.pdf (public/lesson/SOURCE.md 참고)
// 저작툴(EditorOverlay)과 실시간 수업(ClassLiveOverlay)이 같은 덱을 본다.
// ============================================
/** 테마별 페이지 (원본 PDF 1종 = 테마 1개) */
const THEME_DECK: Record<string, string[]> = {
  'theme-1': ['/lesson/theme-1/p1.jpg'],
  'theme-2': ['/lesson/theme-2/p1.jpg', '/lesson/theme-2/p2.jpg', '/lesson/theme-2/p3.jpg'],
  'theme-3': ['/lesson/theme-3/p1.jpg'],
  'theme-4': ['/lesson/theme-4/p1.jpg', '/lesson/theme-4/p2.jpg', '/lesson/theme-4/p3.jpg'],
  'theme-5': ['/lesson/theme-5/p1.jpg', '/lesson/theme-5/p2.jpg'],
  'theme-6': ['/lesson/theme-6/p1.jpg', '/lesson/theme-6/p2.jpg', '/lesson/theme-6/p3.jpg', '/lesson/theme-6/p4.jpg'],
};

/** contentId → 페이지. 자료실 원본(l*)과 나의 자료 사본(m*)이 같은 덱을 본다. */
export const LESSON_DECKS: Record<string, string[]> = {
  l1: THEME_DECK['theme-1'], m1: THEME_DECK['theme-1'],
  l2: THEME_DECK['theme-2'], m2: THEME_DECK['theme-2'],
  l3: THEME_DECK['theme-3'], m3: THEME_DECK['theme-3'],
  l4: THEME_DECK['theme-4'], m4: THEME_DECK['theme-4'],
  l5: THEME_DECK['theme-5'], m5: THEME_DECK['theme-5'],
  l6: THEME_DECK['theme-6'], m6: THEME_DECK['theme-6'],
};

/** 실제 자료가 없는 더미 카드에 붙일 썸네일 풀 (덱 페이지 재활용 · 중복 없이 테마 기준) */
const PAGE_POOL: string[] = Object.values(THEME_DECK).flat();

/** seed 로 결정론적 썸네일 배정 — 재로딩해도 같은 그림 */
export function pooledThumb(seed: string): string {
  return PAGE_POOL[hashKey(seed) % PAGE_POOL.length];
}

// ============================================
// 공유 자료실 콘텐츠 (+ 결정론적 메타 back-fill)
// ============================================
export const LIB: LibItem[] = [
  { id: 'l1', title: '언제나 처음은 낯설다', src: '검증', sel: '자기관리', views: 1240, saves: 328, g: 'g1', em: '🌱', thumb: '/lesson/theme-1/thumb.jpg' },
  { id: 'l2', title: '시간이 돈이라면', src: '검증', sel: '자기관리', views: 980, saves: 210, g: 'g5', em: '⏱️', thumb: '/lesson/theme-2/thumb.jpg' },
  { id: 'l3', title: '이해해야 즐긴다', src: '검증', sel: '사회적인식', views: 540, saves: 96, g: 'g2', em: '💌', thumb: '/lesson/theme-3/thumb.jpg' },
  { id: 'l4', title: '많이 알수록 깊어진다', src: '검증', sel: '책임있는의사결정', views: 1520, saves: 441, g: 'g4', em: '📰', thumb: '/lesson/theme-4/thumb.jpg' },
  { id: 'l5', title: '배워서 남 줘라', src: '검증', sel: '자기인식', views: 320, saves: 58, g: 'g6', em: '🧠', thumb: '/lesson/theme-5/thumb.jpg' },
  { id: 'l6', title: '행복한 공부', src: '검증', sel: '자기인식', views: 210, saves: 44, g: 'g3', em: '💜', thumb: '/lesson/theme-6/thumb.jpg' },
];
// 목업과 동일한 결정론적 back-fill
LIB.forEach((d) => {
  const h = hashKey(d.title);
  d.provider = PROVIDERS[h % PROVIDERS.length][0];
  d.level = [LEVELS[h % 3]];
  d.grade = [GRADES[h % GRADES.length]];
  d.duration = DURATIONS[h % DURATIONS.length];
  d.factors = [FACTORS_SHORT[h % 8], FACTORS_SHORT[(h + 3) % 8]];
});

const libById = (id: string): LibItem => LIB.find((d) => d.id === id)!;

// ============================================
// 반 맞춤: 상담기반 강점 도안 TOP3 · 검사요인 추천
// ============================================
/** 전체 자료실 6종 중 2-3반 강점 코칭에 맞는 3종을 골라 노출 (같은 콘텐츠 = 같은 id) */
export const STRENGTH_TOP3: LibItem[] = [libById('l6'), libById('l5'), libById('l3')];

export const FACTOR_REC: LibItem[] = [
  { id: 'f1', title: '감정 이름 붙이기', sel: '자기인식', src: '검증', g: 'g1', em: '🎴' },
  { id: 'f2', title: '또래 갈등 역할극', sel: '관계기술', src: '검증', g: 'g2', em: '🎭' },
  { id: 'f3', title: '강점 인식 활동', sel: '자기인식', src: '비검증', g: 'g6', em: '⭐' },
  { id: 'f4', title: '경청 훈련 카드', sel: '관계기술', src: '외부', g: 'g4', em: '👂' },
  { id: 'f5', title: '감정 온도계 활동', sel: '자기관리', src: '검증', g: 'g5', em: '🌡️' },
  { id: 'f6', title: '협력 미션 카드', sel: '관계기술', src: '검증', g: 'g3', em: '🤝' },
];
FACTOR_REC.forEach((d) => { d.thumb = pooledThumb(d.id); });

export const CLASS_WEAK: Record<string, string[]> = {
  '2-3반': ['감정조절', '공감', '강점인식'],
  '2-4반': ['의사소통', '목표설정', '자기이해'],
  '2-5반': ['문제해결', '갈등해결', '책임감'],
};

// ============================================
// 나의 자료 (세트지) · 배포 수업 (리포트)
// ============================================
// 나의 자료 = 배포 전 초안만 (배포된 활동은 REPORTS 로 이동)
// 자료실 6종을 담아와 편집 중인 사본 → 제목·썸네일·덱은 원본과 동일, 수정일만 각자 다르다.
export const MY: MyLesson[] = [
  { id: 'm1', title: '언제나 처음은 낯설다', updated: '07/14', g: 'g1', em: '🌱', thumb: '/lesson/theme-1/thumb.jpg' },
  { id: 'm2', title: '시간이 돈이라면', updated: '07/12', g: 'g5', em: '⏱️', thumb: '/lesson/theme-2/thumb.jpg' },
  { id: 'm3', title: '이해해야 즐긴다', updated: '07/13', g: 'g2', em: '💌', thumb: '/lesson/theme-3/thumb.jpg' },
  { id: 'm4', title: '많이 알수록 깊어진다', updated: '07/08', g: 'g4', em: '📰', thumb: '/lesson/theme-4/thumb.jpg' },
  { id: 'm5', title: '배워서 남 줘라', updated: '07/05', g: 'g6', em: '🧠', thumb: '/lesson/theme-5/thumb.jpg' },
  { id: 'm6', title: '행복한 공부', updated: '07/15', g: 'g3', em: '💜', thumb: '/lesson/theme-6/thumb.jpg' },
];

export const REPORTS: Report[] = [
  { id: 'r1', title: '감정 체크인 활동', cls: '2-3반', rstatus: '진행중', total: 10, g: 'g1', em: '🎴', start: '2026-07-13', end: '2026-07-18' },
  { id: 'r2', title: '자기인식 워크시트', cls: '2-4반', rstatus: '진행중', total: 10, g: 'g3', em: '📋', start: '2026-07-12', end: '2026-07-22' },
  { id: 'r3', title: '관계 역할극', cls: '2-3반', rstatus: '진행예정', total: 10, g: 'g2', em: '🎭', start: '2026-07-18', end: '2026-07-25' },
  { id: 'r4', title: '갈등 해결 시나리오', cls: '2-3반', rstatus: '완료', total: 10, g: 'g4', em: '🤝', start: '2026-07-02', end: '2026-07-08' },
  { id: 'r5', title: '우리 반 강점 찾기', cls: '2-5반', rstatus: '완료', total: 10, g: 'g6', em: '⭐', start: '2026-06-30', end: '2026-07-05' },
  { id: 'r6', title: '정서 안정 호흡 활동', cls: '2-4반', rstatus: '완료', total: 10, g: 'g5', em: '🌿', start: '2026-06-28', end: '2026-07-03' },
  { id: 'r7', title: '자기관리 목표 세우기', cls: '2-5반', rstatus: '진행예정', total: 10, g: 'g3', em: '🎯', start: '2026-07-20', end: '2026-07-27' },
];
REPORTS.forEach((d) => { d.thumb = pooledThumb(d.id); });

// ============================================
// 리포트 상세 (REPORT_SPEC_v2 / 엑셀 학습데이터_260728)
// 리포트마다 **다른** 데이터셋을 결정론적으로 생성한다.
//   - 덱(아티클 세트) 3종을 리포트 성격에 맞게 배정
//   - 학생은 반 정원 로스터 전원 (배정 인원 = total 과 일치)
//   - 제출 상태·응답·정오는 hashKey 시드 → 재로딩해도 같은 화면
// 진행예정(r3·r7)은 미연결로 남겨 빈 상태를 확인할 수 있게 둔다.
// ============================================

/** 갈등 해결 덱 — 개념 · 선택형 문항 · 서술형 · 그리기 · OX · 녹음 */
const DECK_A: Article[] = [
  { id: 'a-1', order: 1, nature: '개념', itemType: '-', title: '갈등이란 무엇일까?', selFactor: '자기인식', gradingType: 2 },
  { id: 'a-2', order: 2, nature: '문항', itemType: 'choice', title: '갈등 상황 파악하기', correctAnswer: '3', selFactor: '자기인식', gradingType: 1 },
  { id: 'a-3', order: 3, nature: '활동', itemType: 'essay', title: '나의 갈등 경험 쓰기', selFactor: '자기인식', gradingType: 2 },
  { id: 'a-4', order: 4, nature: '활동', itemType: 'drawing', title: '갈등 해결 방법 그리기', selFactor: '관계기술', gradingType: 2 },
  { id: 'a-5', order: 5, nature: '문항', itemType: 'ox', title: '갈등 해결 O/X 퀴즈', correctAnswer: 'O', selFactor: '관계기술', gradingType: 1 },
  { id: 'a-6', order: 6, nature: '활동', itemType: 'audio', title: '친구에게 사과 녹음하기', selFactor: '관계기술', gradingType: 2 },
  { id: 'a-7', order: 7, nature: '문항', itemType: 'short', title: '갈등 해결 3단계 중 첫 단계는?', correctAnswer: '멈추기', selFactor: '관계기술', gradingType: 1 },
];

/** 감정 인식 덱 — T/F · 의견보드 · 단답형 문항까지 포함 */
const DECK_B: Article[] = [
  { id: 'b-1', order: 1, nature: '개념', itemType: '-', title: '감정에는 이름이 있어요', selFactor: '자기인식', gradingType: 2 },
  { id: 'b-2', order: 2, nature: '문항', itemType: 'choice', title: '오늘 내 감정 고르기', correctAnswer: '2', selFactor: '자기인식', gradingType: 1 },
  { id: 'b-3', order: 3, nature: '활동', itemType: 'board', title: '우리 반 감정 보드', selFactor: '사회적인식', gradingType: 2 },
  { id: 'b-4', order: 4, nature: '문항', itemType: 'tf', title: '감정에는 좋고 나쁨이 있다', correctAnswer: 'F', selFactor: '자기인식', gradingType: 1 },
  { id: 'b-5', order: 5, nature: '활동', itemType: 'short', title: '지금 내 마음 단어로 쓰기', selFactor: '자기인식', gradingType: 2 },
  { id: 'b-6', order: 6, nature: '문항', itemType: 'short', title: '감정 온도계 읽기', correctAnswer: '7', selFactor: '자기관리', gradingType: 1 },
  { id: 'b-7', order: 7, nature: '활동', itemType: 'drawing', title: '내 감정 얼굴 그리기', selFactor: '자기인식', gradingType: 2 },
];

/** 강점·목표 덱 — 선택형 '활동'(교사 수동) 과 선택형 '문항'(자동) 대비 */
const DECK_C: Article[] = [
  { id: 'c-1', order: 1, nature: '개념', itemType: '-', title: '강점이란 무엇일까?', selFactor: '자기인식', gradingType: 2 },
  { id: 'c-2', order: 2, nature: '활동', itemType: 'choice', title: '나의 강점 카드 고르기', selFactor: '자기인식', gradingType: 2 },
  { id: 'c-3', order: 3, nature: '문항', itemType: 'choice', title: '강점을 살린 사례 찾기', correctAnswer: '4', selFactor: '사회적인식', gradingType: 1 },
  { id: 'c-4', order: 4, nature: '문항', itemType: 'ox', title: '강점은 노력으로 키울 수 있다', correctAnswer: 'O', selFactor: '자기인식', gradingType: 1 },
  { id: 'c-5', order: 5, nature: '활동', itemType: 'essay', title: '이번 주 나의 목표 쓰기', selFactor: '자기관리', gradingType: 2 },
  { id: 'c-6', order: 6, nature: '문항', itemType: 'short', title: '목표를 세울 때 정해야 하는 것은?', correctAnswer: '기한', selFactor: '자기관리', gradingType: 1 },
  { id: 'c-7', order: 7, nature: '활동', itemType: 'video', title: '목표 다짐 녹화하기', selFactor: '자기관리', gradingType: 2 },
];

/** 리포트 → 덱 배정 (제목과 내용이 맞도록 의도적으로 지정) */
const REPORT_DECK: Record<string, Article[]> = {
  r1: DECK_B, // 감정 체크인 활동
  r2: DECK_C, // 자기인식 워크시트
  r4: DECK_A, // 갈등 해결 시나리오
  r5: DECK_C, // 우리 반 강점 찾기
  r6: DECK_B, // 정서 안정 호흡 활동
};

/** 서술형·단답형·의견보드 답안 풀 (아티클별). 없으면 GENERIC_ANSWERS 사용 */
const ANSWER_POOL: Record<string, string[]> = {
  'a-3': [
    '친구와 사소한 일로 다퉜는데 먼저 사과했더니 마음이 훨씬 가벼워졌다. 다음에도 내가 먼저 말을 걸어야겠다고 생각했다.',
    '동생과 장난감 때문에 싸웠다. 서로 시간을 정해서 번갈아 쓰기로 약속하고 나니 더는 다투지 않게 되었다.',
    '모둠 활동에서 의견이 달라 답답했다. 친구 이야기를 끝까지 듣고 나니 왜 그렇게 생각했는지 이해가 되었다.',
    '아직 화해하지 못한 친구가 있다. 어떻게 말을 꺼내야 할지 몰라서 계속 미루고 있는데 이번 주에는 용기를 내보고 싶다.',
    '체육 시간에 규칙 때문에 말다툼을 했다. 선생님 말씀대로 다시 규칙을 정하니 모두가 편하게 참여할 수 있었다.',
  ],
  'b-5': ['설렘', '조금 지침', '뿌듯함', '살짝 불안함', '편안함', '답답함', '기대됨'],
  'b-3': [
    '오늘은 아침부터 기분이 좋았어요. 급식에 좋아하는 반찬이 나와서요.',
    '시험이 다가와서 조금 긴장돼요. 그래도 준비한 만큼은 할 수 있을 것 같아요.',
    '친구가 먼저 인사해줘서 고마웠어요.',
    '어제 늦게 자서 오늘은 계속 졸려요.',
    '체육 시간이 제일 기다려져요.',
  ],
  'c-5': [
    '이번 주에는 매일 30분씩 책을 읽겠다. 자기 전에 읽으면 잊지 않을 것 같다.',
    '수업 시간에 하루에 한 번은 손을 들고 발표해보기로 했다.',
    '친구가 힘들어 보일 때 먼저 말을 걸어주는 것을 목표로 삼았다.',
    '숙제를 미루지 않고 그날 안에 끝내겠다. 알림장을 매일 확인하겠다.',
    '아침에 일어나서 스트레칭을 하고 하루를 시작하겠다.',
  ],
};

const GENERIC_ANSWERS = ['잘 모르겠어요', '조금 어려웠어요', '재미있었어요', '다음에 더 해보고 싶어요'];

/** 단답형 문항 오답 풀 — 정답이 숫자면 숫자로, 아니면 그럴듯한 오답 단어로 */
const WRONG_NUM = ['3', '5', '6', '8', '9', '10'];
const WRONG_WORD = ['화내기', '피하기', '참기', '장소', '사람', '모르겠어요'];
const wrongShort = (correct: string, seed: number): string => {
  const pool = /^\d+$/.test(correct) ? WRONG_NUM : WRONG_WORD;
  const others = pool.filter((x) => x !== correct);
  return others[seed % others.length];
};

const pick = <T,>(pool: T[], seed: number): T => pool[seed % pool.length];

/** 리포트 상태별 제출 상태 분포 (2=대기 3=제출 4=진행중 5=완료) */
function pickStatus(rstatus: Report['rstatus'], seed: number): StatusCd {
  const d = seed % 10;
  if (rstatus === '완료') return d < 8 ? 5 : d < 9 ? 3 : 2;
  // 진행중: 완료·제출·진행중·미제출이 골고루 섞이도록
  return d < 4 ? 5 : d < 6 ? 3 : d < 8 ? 4 : 2;
}

/** 'YYYY-MM-DD' + n일 */
function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 기간 내 제출 시각 'YYYY-MM-DD HH:mm' */
function submittedAtOf(r: Report, seed: number): string {
  const span = Math.max(
    1,
    Math.round((new Date(`${r.end}T00:00:00`).getTime() - new Date(`${r.start}T00:00:00`).getTime()) / 86400000),
  );
  const day = addDays(r.start, seed % span);
  const hh = String(9 + (seed % 8)).padStart(2, '0');
  const mm = String(seed % 60).padStart(2, '0');
  return `${day} ${hh}:${mm}`;
}

/** 학생 × 세트지 활동 */
function buildStudents(r: Report, roster: string[]): StudentActivity[] {
  const period = { start: r.start, end: r.end };
  return roster.map((name, i) => {
    const seed = hashKey(`${r.id}|${name}`);
    const statusCd = pickStatus(r.rstatus, seed);
    if (statusCd === 2) return { studentId: `${r.id}-s${i + 1}`, studentName: name, no: i + 1, statusCd, period };
    return {
      studentId: `${r.id}-s${i + 1}`,
      studentName: name,
      no: i + 1,
      statusCd,
      period,
      duration: 210 + (seed % 340), // 3분 30초 ~ 9분 10초
      submittedAt: submittedAtOf(r, seed),
    };
  });
}

/** 정답 아닌 보기 번호(1~4) */
function wrongChoice(correct: string | undefined, seed: number): string {
  const others = ['1', '2', '3', '4'].filter((x) => x !== correct);
  return pick(others, seed);
}

/** 학생 × 아티클 응답 */
function buildResponses(r: Report, students: StudentActivity[], articles: Article[]): ResponseData[] {
  const out: ResponseData[] = [];
  students.forEach((s) => {
    if (s.statusCd === 2) return;
    // 진행중(4)인 학생은 앞쪽 페이지까지만 응답이 쌓여 있다
    const limit =
      s.statusCd === 4 ? 1 + (hashKey(`${s.studentId}|p`) % Math.max(1, articles.length - 1)) : articles.length;

    articles.slice(0, limit).forEach((a) => {
      const seed = hashKey(`${r.id}|${s.studentId}|${a.id}`);
      // 완료가 아닌 학생은 중간중간 건너뛴 페이지가 있다
      if (s.statusCd !== 5 && seed % 10 < 2) return;

      const auto = a.gradingType === 1 && a.correctAnswer != null;
      const correct = auto && seed % 100 < 65; // 자동채점 정답률 ~65%
      let submitAnswer = '';
      let mediaSec: number | undefined;

      switch (a.itemType) {
        case 'choice':
          submitAnswer = auto
            ? correct
              ? a.correctAnswer!
              : wrongChoice(a.correctAnswer, seed)
            : String(1 + (seed % 4));
          break;
        case 'ox':
          submitAnswer = auto ? (correct ? a.correctAnswer! : a.correctAnswer === 'O' ? 'X' : 'O') : seed % 2 ? 'O' : 'X';
          break;
        case 'tf':
          submitAnswer = auto ? (correct ? a.correctAnswer! : a.correctAnswer === 'T' ? 'F' : 'T') : seed % 2 ? 'T' : 'F';
          break;
        case 'short':
        case 'quiz':
          submitAnswer = auto
            ? correct
              ? a.correctAnswer!
              : wrongShort(a.correctAnswer!, seed)
            : pick(ANSWER_POOL[a.id] ?? GENERIC_ANSWERS, seed);
          break;
        case 'essay':
        case 'board':
          submitAnswer = pick(ANSWER_POOL[a.id] ?? GENERIC_ANSWERS, seed);
          break;
        case 'audio':
        case 'video':
          mediaSec = 25 + (seed % 95); // 25초 ~ 2분
          break;
        default:
          submitAnswer = ''; // 개념(조회) · 그리기(캡처만)
      }

      out.push({
        articleId: a.id,
        studentId: s.studentId,
        submitAnswer,
        errata: auto ? (correct ? 1 : 2) : 4, // 활동은 교사 수동 채점 대기(4)
        itemType: a.itemType,
        gradingType: a.gradingType,
        captureImage: pooledThumb(`${a.id}|${s.studentId}`),
        mediaSec,
      });
    });
  });
  return out;
}

/**
 * 100점 환산 — 자동채점된 문항의 정답 비율 (엑셀 「세트지 데이터 > 점수」).
 * 아직 채점 대상 문항에 도달하지 못한 학생(진행중)은 점수 자체가 없다 → null.
 */
function scoreOf(responses: ResponseData[], studentId: string): number | null {
  const auto = responses.filter((x) => x.studentId === studentId && x.gradingType === 1);
  if (!auto.length) return null;
  return Math.round((auto.filter((x) => x.errata === 1).length / auto.length) * 100);
}

// 참여 리포트(진행예정 제외)에 리포트별 상세 데이터셋 연결.
REPORTS.forEach((r) => {
  const articles = REPORT_DECK[r.id];
  if (!articles) return; // 진행예정 → 미연결(빈 상태)

  const roster = STUDENTS[r.cls] ?? [];
  const students = buildStudents(r, roster);
  const responses = buildResponses(r, students, articles);
  students.forEach((s) => {
    if (s.statusCd === 2) return;
    const score = scoreOf(responses, s.studentId);
    if (score != null) s.score = score;
  });

  r.total = students.length; // 목록 카드 배정 인원과 상세를 일치시킨다
  r.activityMode = '과제';
  r.selFactors = [...new Set(articles.map((a) => a.selFactor).filter(Boolean))] as string[];
  r.articles = articles;
  r.students = students;
  r.responses = responses;
});

// ============================================
// 저작툴 콘텐츠 담기
// ============================================
export const CP_CONTENT: ContentPickItem[] = [
  { id: 'c1', t: '활동형 콘텐츠', d: '움직이고 만지는 인터랙션 · 96,589개', ic: '🖐️', bg: '#12b5a8' },
  { id: 'c2', t: '수업자료 콘텐츠', d: '바로 쓰는 완성 수업자료 · 9,672개', ic: '📄', bg: '#6ab04c' },
  { id: 'c3', t: '스마트 문제은행', d: '검증 문항 자동 채점 · 171,668개', ic: '🧮', bg: '#e67e22' },
  { id: 'c4', t: '스마트 교과서', d: '2022개정 디지털 교과서 · 142개', ic: '📘', bg: '#3b82f6' },
];
export const CP_TEMPLATE: ContentPickItem[] = [
  { id: 't1', t: '문항 템플릿 8종', d: '선택·단답·연쇄·OX·TF·순서·조합·연결', ic: '❓', bg: '#6c5ce7' },
  { id: 't2', t: '활동 템플릿', d: '투표·워드클라우드·드로잉·모둠·타이머', ic: '🎯', bg: '#00b894' },
  { id: 't3', t: '학심정 SEL 템플릿', d: '감정 체크인·역할극·강점 카드', ic: '💛', bg: '#f59e0b' },
  { id: 't4', t: '빈 슬라이드', d: '빈 캔버스로 시작하기', ic: '⬜', bg: '#94a3b8' },
];

/** 색상 그룹 → 썸네일 배경 그라데이션 (목업 .g1~.g6) */
export const GROUP_BG: Record<string, string> = {
  g1: 'linear-gradient(135deg,#e7f8f2,#f0fbf7)',
  g2: 'linear-gradient(135deg,#fdeef0,#fef4f5)',
  g3: 'linear-gradient(135deg,#f0eefc,#f6f5fd)',
  g4: 'linear-gradient(135deg,#e8f0fe,#eef5ff)',
  g5: 'linear-gradient(135deg,#e6f7fa,#eefbfc)',
  g6: 'linear-gradient(135deg,#fdf3e2,#fdf8ee)',
};
