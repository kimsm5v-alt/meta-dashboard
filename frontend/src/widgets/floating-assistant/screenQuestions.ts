export interface SuggestedQuestion {
  emoji: string;
  text: string;
}

interface ScreenQuestionSet {
  base: SuggestedQuestion[];
  student?: SuggestedQuestion[];
}

/**
 * 화면별 추천 질문 문구. 프로토타입 features/ai-room/data/screenQuestions.ts에서 질문
 * 텍스트만 이식했다 — 프로토타입의 답변은 목업 전용이라 가져오지 않는다(실제 답변은
 * 백엔드 AI가 생성).
 */
const SCREEN_QUESTIONS: Record<string, ScreenQuestionSet> = {
  home: {
    base: [
      { emoji: '🧭', text: 'META 학습종합검사는 어떤 영역을 측정하나요?' },
      { emoji: '🚀', text: '검사 결과를 처음 보는데, 어디서부터 시작하면 좋을까요?' },
      { emoji: '⚖️', text: '긍정적 요인과 부정적 요인은 어떻게 다르게 해석하나요?' },
      { emoji: '🔗', text: '검사 결과를 상담이나 수업에 어떻게 연결할 수 있나요?' },
    ],
  },
  'exam-management': {
    base: [
      { emoji: '⏱️', text: '검사는 학생에게 얼마나 걸리나요?' },
      { emoji: '📅', text: '1차, 2차 검사는 보통 언제 실시하나요?' },
      { emoji: '📢', text: '검사 전에 학생들에게 안내할 사항이 있나요?' },
      { emoji: '🔍', text: '검사 결과는 언제부터 확인할 수 있나요?' },
    ],
  },
  'exam-result': {
    base: [
      { emoji: '📊', text: 'T점수 구간(매우 낮음~매우 높음)은 각각 어떤 의미인가요?' },
      { emoji: '💪', text: '우리 반의 강점과 보완점은 어떻게 구분하나요?' },
      { emoji: '🤔', text: '긍정적 요인이 높으면 무조건 좋은 건가요?' },
      { emoji: '📝', text: '우리 반 결과를 요약해줄 수 있나요?' },
    ],
    student: [
      { emoji: '🧭', text: '학생 결과를 해석할 때 어떤 순서로 봐야 하나요?' },
      { emoji: '📐', text: 'T점수와 백분위는 어떻게 다른가요?' },
      { emoji: '📊', text: '하위 척도 간 점수 차이가 클 때는 어떤 의미인가요?' },
      { emoji: '📝', text: '이 학생의 결과를 요약해줄 수 있나요?' },
    ],
  },
  'exam-tracking': {
    base: [
      { emoji: '📈', text: '1차 대비 2차에서 점수 변화는 어떻게 해석하나요?' },
      { emoji: '➖', text: '점수가 변하지 않은 척도는 문제인가요?' },
      { emoji: '🖨️', text: '변화 결과를 출력하거나 공유할 수 있나요?' },
      { emoji: '👨‍👩‍👧', text: '변화 결과를 학부모에게 어떻게 설명하면 좋을까요?' },
    ],
  },
  'exam-record': {
    base: [
      { emoji: '📝', text: '생활기록부 문구는 검사 결과를 바탕으로 어떻게 작성되나요?' },
      { emoji: '✍️', text: '학생별로 문구를 다듬을 때 어떤 점을 참고하면 좋을까요?' },
      { emoji: '⚠️', text: '생활기록부에 쓰면 안 되는 표현이 있나요?' },
      { emoji: '📋', text: '생성된 문구를 반 전체 일괄로 확인·수정할 수 있나요?' },
    ],
  },
  'coaching-class': {
    base: [
      { emoji: '🧭', text: '반 전체 결과를 바탕으로 어떤 코칭 방향을 잡을 수 있나요?' },
      { emoji: '⚖️', text: '학업 요구와 학습 자원의 균형은 어떻게 판단하나요?' },
      { emoji: '💡', text: 'SEL 콘텐츠 추천은 어떤 기준으로 이루어지나요?' },
      { emoji: '✅', text: '코칭 활동 후 효과를 어떻게 확인할 수 있나요?' },
    ],
  },
  'coaching-individual': {
    base: [
      { emoji: '🧩', text: '학습 유형에 따라 코칭 방향이 어떻게 달라지나요?' },
      { emoji: '📖', text: '학부모 가이드는 어떤 내용을 담고 있나요?' },
      { emoji: '💪', text: '강점을 활용한 코칭이란 구체적으로 어떤 건가요?' },
      { emoji: '🔗', text: '코칭 전략과 상담 기록은 어떻게 연결되나요?' },
    ],
  },
  lesson: {
    base: [
      { emoji: '📚', text: '검사 결과에 따라 어떤 수업 자료를 선택하면 좋을까요?' },
      { emoji: '🎯', text: '맞춤형 큐레이팅은 어떤 기준으로 추천되나요?' },
      { emoji: '🗺️', text: '학년별 성장 로드맵은 어떻게 활용하나요?' },
      { emoji: '✏️', text: '자료를 직접 만들거나 수정할 수 있나요?' },
    ],
  },
};

const SCREEN_LABELS: Record<string, string> = {
  home: '홈',
  'exam-management': '검사관리',
  'exam-result': '결과보기',
  'exam-tracking': '변화추적',
  'exam-record': '생활기록부 작성',
  'coaching-class': '학급 코칭',
  'coaching-individual': '개별 코칭',
  lesson: '수업 자료실',
};

/**
 * 라우트 경로 → screenKey. widgets/layout/v2/gnbConfig.ts는 같은 레이어(widgets)라
 * import하지 않고 경로 접두어를 독립적으로 하드코딩한다.
 */
export const pathToScreenKey = (pathname: string): string => {
  if (pathname.startsWith('/exam/management')) return 'exam-management';
  if (pathname.startsWith('/exam/result')) return 'exam-result';
  if (pathname.startsWith('/exam/tracking')) return 'exam-tracking';
  if (pathname.startsWith('/exam/record')) return 'exam-record';
  if (pathname.startsWith('/coaching/class')) return 'coaching-class';
  if (pathname.startsWith('/coaching/individual')) return 'coaching-individual';
  if (pathname.startsWith('/lesson')) return 'lesson';
  return 'home';
};

export const screenLabelFor = (pathname: string): string =>
  SCREEN_LABELS[pathToScreenKey(pathname)] ?? '홈';

/** screenKey + 학생 선택 여부 → 추천 질문 */
export const resolveScreenQuestions = (
  pathname: string,
  hasStudent: boolean,
): SuggestedQuestion[] => {
  const set = SCREEN_QUESTIONS[pathToScreenKey(pathname)] ?? SCREEN_QUESTIONS.home;
  return hasStudent && set.student ? set.student : set.base;
};
