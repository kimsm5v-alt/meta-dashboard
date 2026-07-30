/**
 * 수업 자료실 mock 데이터 — 목업 everyclass-v2 1.html 이식.
 * 백엔드 연동 전까지 사용. (개인정보 없는 샘플 데이터)
 */
import { hashKey } from './utils/hash';
import type {
  LibItem,
  RoadmapStage,
  MyLesson,
  Report,
  ContentPickItem,
  Article,
  StudentActivity,
  ResponseData,
} from './types';

/** 목업 기준일 */
export const TODAY = '2026-07-15';

/** 반 목록 · 반별 대표 학생 표본(8명) */
export const CLASSES = ['2-3반', '2-4반', '2-5반'];

export const STUDENTS: Record<string, string[]> = {
  '2-3반': ['김서준', '이하은', '박도윤', '최지우', '정민재', '강수아', '윤예린', '임하준'],
  '2-4반': ['오지호', '한서윤', '신도현', '배은우', '조유나', '권시윤', '황라온', '문지안'],
  '2-5반': ['남태윤', '서하율', '구민서', '방시우', '엄채원', '진우진', '표소율', '계지호'],
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
// 공유 자료실 콘텐츠 (+ 결정론적 메타 back-fill)
// ============================================
export const LIB: LibItem[] = [
  { id: 'l1', title: '감정 체크인 카드', src: '검증', sel: '자기인식', views: 1240, saves: 328, g: 'g1', em: '🎴' },
  { id: 'l2', title: '관계 역할극 시나리오', src: '검증', sel: '관계기술', views: 980, saves: 210, g: 'g2', em: '🎭' },
  { id: 'l3', title: '자기관리 워크시트', src: '비검증', sel: '자기관리', views: 540, saves: 96, g: 'g3', em: '📋' },
  { id: 'l4', title: '갈등 해결 시나리오', src: '검증', sel: '책임있는의사결정', views: 1520, saves: 441, g: 'g4', em: '🤝' },
  { id: 'l5', title: '정서 안정 호흡 활동', src: '외부', sel: '자기관리', views: 320, saves: 58, g: 'g5', em: '🌿' },
  { id: 'l6', title: '우리 반 강점 찾기', src: '내부', sel: '사회적인식', views: 210, saves: 44, g: 'g6', em: '⭐' },
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

// ============================================
// 반 맞춤: 상담기반 강점 도안 TOP3 · 검사요인 추천
// ============================================
export const STRENGTH_TOP3: LibItem[] = [
  { id: 's1', title: '나의 강점 카드', sel: '자기인식', src: '검증', g: 'g1', em: '⭐', reason: '자존감 지표 하락 학생 다수 → 강점기반 활동' },
  { id: 's2', title: '강점 발견 워크북', sel: '자기인식', src: '검증', g: 'g6', em: '📔', reason: '상담 결과 강점 확장이 필요한 학생 집중' },
  { id: 's3', title: '또래 관계 강점 찾기', sel: '관계기술', src: '검증', g: 'g2', em: '🤝', reason: '교우관계 강점을 활용한 성장 코칭' },
];

export const FACTOR_REC: LibItem[] = [
  { id: 'f1', title: '감정 이름 붙이기', sel: '자기인식', src: '검증', g: 'g1', em: '🎴', reason: '감정조절 요인 하위 → 감정 어휘 확장' },
  { id: 'f2', title: '또래 갈등 역할극', sel: '관계기술', src: '검증', g: 'g2', em: '🎭', reason: '공감 요인 보완 → 관계기술 활동' },
  { id: 'f3', title: '강점 인식 활동', sel: '자기인식', src: '비검증', g: 'g6', em: '⭐', reason: '강점인식 요인 연계 콘텐츠' },
  { id: 'f4', title: '경청 훈련 카드', sel: '관계기술', src: '외부', g: 'g4', em: '👂', reason: '의사소통 요인 보완' },
  { id: 'f5', title: '감정 온도계 활동', sel: '자기관리', src: '검증', g: 'g5', em: '🌡️', reason: '감정조절 요인 강화' },
  { id: 'f6', title: '협력 미션 카드', sel: '관계기술', src: '검증', g: 'g3', em: '🤝', reason: '공감·협력 요인 연계' },
];

export const CLASS_WEAK: Record<string, string[]> = {
  '2-3반': ['감정조절', '공감', '강점인식'],
  '2-4반': ['의사소통', '목표설정', '자기이해'],
  '2-5반': ['문제해결', '갈등해결', '책임감'],
};

// ============================================
// 성장 로드맵 (피어나다 3단계)
// ============================================
export const ROADMAP: RoadmapStage[] = [
  {
    stage: '1단계', tier: '펀더멘털 Ⅰ', title: '공부 마인드 트레이닝', months: '6개월', tone: 'green',
    items: [
      { id: 'rm-1', title: '자존감', sel: '1MONTH', src: '검증', g: 'g1', em: '💚', reason: '자기이해 · 변화의지 선언' },
      { id: 'rm-2', title: '학습효능감', sel: '2MONTH', src: '검증', g: 'g2', em: '📈', reason: '성공경험 만들기' },
      { id: 'rm-3', title: '진로목표', sel: '3MONTH', src: '검증', g: 'g4', em: '🎯', reason: '꿈과 목표 · 달성 전략' },
      { id: 'rm-4', title: '강점탐색', sel: '4MONTH', src: '검증', g: 'g6', em: '⭐', reason: '강점화 전략 · 학습 강점 활용' },
      { id: 'rm-5', title: '시간관리', sel: '5MONTH', src: '검증', g: 'g5', em: '⏱️', reason: '시간 활용 전략 · 학습 플래너' },
      { id: 'rm-6', title: '성장마인드셋', sel: '6MONTH', src: '검증', g: 'g3', em: '🌱', reason: '공부 성찰 일기 · 실패조절' },
    ],
  },
  {
    stage: '2단계', tier: '펀더멘털 Ⅱ', title: '공부 전략 트레이닝', months: '6개월', tone: 'blue',
    items: [
      { id: 'rm-7', title: '공부원리', sel: '7MONTH', src: '검증', g: 'g4', em: '📘', reason: '혼공 법칙 5 · 스트레스 관리' },
      { id: 'rm-8', title: '집중력', sel: '9MONTH', src: '검증', g: 'g2', em: '🎧', reason: '집중의 기술 · 노트정리법' },
      { id: 'rm-9', title: '실행점검', sel: '12MONTH', src: '검증', g: 'g6', em: '✅', reason: '메타인지 · 시험전략' },
    ],
  },
  {
    stage: '3단계', tier: '어드밴스드', title: '성공 공식', months: '12개월', tone: 'pink',
    items: [
      { id: 'rm-10', title: '한계극복', sel: '1·2M', src: '검증', g: 'g5', em: '🔥', reason: '실천력을 높이는 행동 습관' },
      { id: 'rm-11', title: '학습동기', sel: '5·6M', src: '검증', g: 'g1', em: '🚀', reason: '자기주도학습의 원리' },
      { id: 'rm-12', title: '꿈과진로', sel: '11·12M', src: '검증', g: 'g3', em: '🌟', reason: '자아정체감 · 비전 발견' },
    ],
  },
];
export const ROADMAP_CARDS: LibItem[] = ROADMAP.flatMap((s) => s.items);

// ============================================
// 나의 자료 (세트지) · 배포 수업 (리포트)
// ============================================
// 나의 자료 = 배포 전 초안만 (배포된 활동은 REPORTS 로 이동)
export const MY: MyLesson[] = [
  { id: 'm1', title: '감정 체크인 활동', updated: '07/14', g: 'g1', em: '🎴' },
  { id: 'm2', title: '자기인식 워크시트', updated: '07/12', g: 'g3', em: '📋' },
  { id: 'm3', title: '관계 역할극', updated: '07/13', g: 'g2', em: '🎭' },
  { id: 'm4', title: '갈등 해결 시나리오', updated: '07/08', g: 'g4', em: '🤝' },
  { id: 'm5', title: '우리 반 강점 찾기', updated: '07/05', g: 'g6', em: '⭐' },
  { id: 'm6', title: '정서 안정 호흡', updated: '07/15', g: 'g5', em: '🌿' },
];

export const REPORTS: Report[] = [
  { id: 'r1', title: '감정 체크인 활동', cls: '2-3반', rstatus: '진행중', total: 25, g: 'g1', em: '🎴', start: '07/13', end: '07/18' },
  { id: 'r2', title: '자기인식 워크시트', cls: '2-4반', rstatus: '진행중', total: 24, g: 'g3', em: '📋', start: '07/12', end: '07/22' },
  { id: 'r3', title: '관계 역할극', cls: '2-3반', rstatus: '진행예정', total: 25, g: 'g2', em: '🎭', start: '07/18', end: '07/25' },
  { id: 'r4', title: '갈등 해결 시나리오', cls: '2-3반', rstatus: '완료', total: 25, g: 'g4', em: '🤝', start: '07/02', end: '07/08' },
  { id: 'r5', title: '우리 반 강점 찾기', cls: '2-5반', rstatus: '완료', total: 24, g: 'g6', em: '⭐', start: '06/30', end: '07/05' },
  { id: 'r6', title: '정서 안정 호흡 활동', cls: '2-4반', rstatus: '완료', total: 24, g: 'g5', em: '🌿', start: '06/28', end: '07/03' },
  { id: 'r7', title: '자기관리 목표 세우기', cls: '2-5반', rstatus: '진행예정', total: 24, g: 'g3', em: '🎯', start: '07/20', end: '07/27' },
];

// ============================================
// 리포트 상세 — 공용 데이터셋 (REPORT_SPEC_v2 / 사양서 mockData)
// 참여 리포트(진행중/완료)가 공유. 진행예정은 미연결(빈 상태).
// ============================================

/** 세트지에 포함된 SEL 역량요인 */
export const REPORT_SEL_FACTORS = ['자기인식', '관계기술'];

/** 아티클(페이지) 정의 — 개념/문항/활동 성격별 유형 예시 포함 */
export const REPORT_ARTICLES: Article[] = [
  { id: 'art-1', order: 1, nature: '개념', itemType: '-', title: '갈등이란 무엇일까?', selFactor: '자기인식', gradingType: 2 },
  { id: 'art-2', order: 2, nature: '문항', itemType: 'choice', title: '갈등 상황 파악하기', correctAnswer: '3', selFactor: '자기인식', gradingType: 1 },
  { id: 'art-3', order: 3, nature: '활동', itemType: 'essay', title: '나의 갈등 경험 쓰기', selFactor: '자기인식', gradingType: 2 },
  { id: 'art-4', order: 4, nature: '활동', itemType: 'drawing', title: '갈등 해결 방법 그리기', selFactor: '관계기술', gradingType: 2 },
  { id: 'art-5', order: 5, nature: '문항', itemType: 'ox', title: '갈등 해결 O/X 퀴즈', correctAnswer: 'O', selFactor: '관계기술', gradingType: 1 },
  { id: 'art-6', order: 6, nature: '활동', itemType: 'audio', title: '친구에게 사과 녹음하기', selFactor: '관계기술', gradingType: 2 },
];

const REPORT_PERIOD = { start: '2026-07-15', end: '2026-07-22' };

/** 학생 × 세트지 활동 (statusCd 2=대기,3=제출,4=진행중,5=완료) */
export const REPORT_STUDENTS: StudentActivity[] = [
  { studentId: 's1', studentName: '김서준', statusCd: 5, period: REPORT_PERIOD, score: 80, duration: 320, submittedAt: '2026-07-18 14:23' },
  { studentId: 's2', studentName: '이하은', statusCd: 5, period: REPORT_PERIOD, score: 100, duration: 280, submittedAt: '2026-07-17 09:15' },
  { studentId: 's3', studentName: '박도윤', statusCd: 2, period: REPORT_PERIOD },
  { studentId: 's4', studentName: '최지우', statusCd: 5, period: REPORT_PERIOD, score: 60, duration: 450, submittedAt: '2026-07-19 16:42' },
  { studentId: 's5', studentName: '정민재', statusCd: 5, period: REPORT_PERIOD, score: 80, duration: 310, submittedAt: '2026-07-18 11:05' },
];

/** 응답 데이터 (학생 × 아티클) — errata 1=정답,2=오답,3=부분,4=채점불가 */
export const REPORT_RESPONSES: ResponseData[] = [
  // 김서준 (s1)
  { articleId: 'art-1', studentId: 's1', submitAnswer: '', errata: 4, itemType: '-', gradingType: 2, captureImage: '개념 슬라이드 캡처' },
  { articleId: 'art-2', studentId: 's1', submitAnswer: '3', errata: 1, itemType: 'choice', gradingType: 1, captureImage: '선택형 캡처' },
  { articleId: 'art-3', studentId: 's1', submitAnswer: '친구와 다퉜을 때 먼저 사과했다', errata: 4, itemType: 'essay', gradingType: 2, captureImage: '서술형 캡처' },
  { articleId: 'art-4', studentId: 's1', submitAnswer: 'drawing-url-001', errata: 4, itemType: 'drawing', gradingType: 2, captureImage: '그리기 캡처' },
  { articleId: 'art-5', studentId: 's1', submitAnswer: 'O', errata: 1, itemType: 'ox', gradingType: 1, captureImage: 'OX 캡처' },
  { articleId: 'art-6', studentId: 's1', submitAnswer: 'audio-url-001', errata: 4, itemType: 'audio', gradingType: 2, captureImage: '녹음 캡처' },
  // 이하은 (s2)
  { articleId: 'art-2', studentId: 's2', submitAnswer: '3', errata: 1, itemType: 'choice', gradingType: 1, captureImage: '선택형 캡처' },
  { articleId: 'art-3', studentId: 's2', submitAnswer: '동생과 장난감을 나눠 쓰기로 했다', errata: 4, itemType: 'essay', gradingType: 2, captureImage: '서술형 캡처' },
  { articleId: 'art-4', studentId: 's2', submitAnswer: 'drawing-url-002', errata: 4, itemType: 'drawing', gradingType: 2, captureImage: '그리기 캡처' },
  { articleId: 'art-5', studentId: 's2', submitAnswer: 'X', errata: 2, itemType: 'ox', gradingType: 1, captureImage: 'OX 캡처' },
  // 최지우 (s4)
  { articleId: 'art-2', studentId: 's4', submitAnswer: '1', errata: 2, itemType: 'choice', gradingType: 1, captureImage: '선택형 캡처' },
  { articleId: 'art-3', studentId: 's4', submitAnswer: '아직 화해하지 못했다', errata: 4, itemType: 'essay', gradingType: 2, captureImage: '서술형 캡처' },
  { articleId: 'art-5', studentId: 's4', submitAnswer: 'O', errata: 1, itemType: 'ox', gradingType: 1, captureImage: 'OX 캡처' },
  // 정민재 (s5)
  { articleId: 'art-2', studentId: 's5', submitAnswer: '3', errata: 1, itemType: 'choice', gradingType: 1, captureImage: '선택형 캡처' },
  { articleId: 'art-4', studentId: 's5', submitAnswer: 'drawing-url-005', errata: 4, itemType: 'drawing', gradingType: 2, captureImage: '그리기 캡처' },
  { articleId: 'art-5', studentId: 's5', submitAnswer: 'O', errata: 1, itemType: 'ox', gradingType: 1, captureImage: 'OX 캡처' },
];

// 참여 리포트(진행예정 제외)에 공용 상세 데이터셋 연결.
REPORTS.forEach((r) => {
  if (r.rstatus === '진행예정') return;
  r.activityMode = '과제';
  r.selFactors = REPORT_SEL_FACTORS;
  r.articles = REPORT_ARTICLES;
  r.students = REPORT_STUDENTS;
  r.responses = REPORT_RESPONSES;
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
