import type { SuggestedQuestion } from '../types';

/**
 * 화면별 추천 질문
 * - 키는 현재 라우트에서 파생한 screenKey (useScreenContext) 와 일치
 * - base: 전체/해당 반 기준(또는 선택 무관)
 * - student: LNB에서 학생이 선택된 경우 (있으면 base 대신 사용)
 */
export interface ScreenQuestionSet {
  base: SuggestedQuestion[];
  student?: SuggestedQuestion[];
}

export const SCREEN_QUESTIONS: Record<string, ScreenQuestionSet> = {
  // 홈 (요약 / 검사요약 / 수업요약) — LNB 무관
  home: {
    base: [
      { emoji: '🧭', text: 'META 학습종합검사는 어떤 영역을 측정하나요?' },
      { emoji: '🚀', text: '검사 결과를 처음 보는데, 어디서부터 시작하면 좋을까요?' },
      { emoji: '⚖️', text: '긍정적 요인과 부정적 요인은 어떻게 다르게 해석하나요?' },
      { emoji: '🔗', text: '검사 결과를 상담이나 수업에 어떻게 연결할 수 있나요?' },
    ],
  },

  // 검사 > 검사관리 — 전체/해당 반
  'exam-management': {
    base: [
      { emoji: '⏱️', text: '검사는 학생에게 얼마나 걸리나요?' },
      { emoji: '📅', text: '1차, 2차 검사는 보통 언제 실시하나요?' },
      { emoji: '📢', text: '검사 전에 학생들에게 안내할 사항이 있나요?' },
      { emoji: '🔍', text: '검사 결과는 언제부터 확인할 수 있나요?' },
    ],
  },

  // 검사 > 결과보기 — 전체/해당 반 vs 학생 선택
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

  // 검사 > 변화추적 — 전체/해당 반/학생 (동일)
  'exam-tracking': {
    base: [
      { emoji: '📈', text: '1차 대비 2차에서 점수 변화는 어떻게 해석하나요?' },
      { emoji: '➖', text: '점수가 변하지 않은 척도는 문제인가요?' },
      { emoji: '🖨️', text: '변화 결과를 출력하거나 공유할 수 있나요?' },
      { emoji: '👨‍👩‍👧', text: '변화 결과를 학부모에게 어떻게 설명하면 좋을까요?' },
    ],
  },

  // 검사 > 학생상담 — 전체/해당 반 vs 학생 선택
  'exam-counseling': {
    base: [
      { emoji: '🎯', text: '상담 우선순위는 어떤 기준으로 정해지나요?' },
      { emoji: '👨‍👩‍👧', text: '학기 초 학부모 상담에서 검사 결과를 어떻게 소개하면 좋을까요?' },
      { emoji: '💬', text: '상담 시 어떤 표현을 쓰면 좋고, 어떤 표현은 피해야 하나요?' },
      { emoji: '🗂️', text: '상담 기록은 이후 어떻게 활용되나요?' },
    ],
    student: [
      { emoji: '🔍', text: '이 학생의 결과에서 어디를 먼저 봐야 하나요?' },
      { emoji: '📄', text: '요약 리포트 한 장으로 학생을 빠르게 파악하는 순서는?' },
      { emoji: '🗒️', text: '지난 상담 기록을 바탕으로 이번 상담 방향을 제안해줄 수 있나요?' },
      { emoji: '✍️', text: '상담 내용을 기록할 때 어떤 점을 남기면 추후에 도움이 될까요?' },
    ],
  },

  // 코칭 > 학급 코칭 — 전체/해당 반
  'coaching-class': {
    base: [
      { emoji: '🧭', text: '반 전체 결과를 바탕으로 어떤 코칭 방향을 잡을 수 있나요?' },
      { emoji: '⚖️', text: '학업 요구와 학습 자원의 균형은 어떻게 판단하나요?' },
      { emoji: '💡', text: 'SEL 콘텐츠 추천은 어떤 기준으로 이루어지나요?' },
      { emoji: '✅', text: '코칭 활동 후 효과를 어떻게 확인할 수 있나요?' },
    ],
  },

  // 코칭 > 개별 코칭 — 학생 선택 (개별 단위)
  'coaching-individual': {
    base: [
      { emoji: '🧩', text: '학습 유형에 따라 코칭 방향이 어떻게 달라지나요?' },
      { emoji: '📖', text: '학부모 가이드는 어떤 내용을 담고 있나요?' },
      { emoji: '💪', text: '강점을 활용한 코칭이란 구체적으로 어떤 건가요?' },
      { emoji: '🔗', text: '코칭 전략과 상담 기록은 어떻게 연결되나요?' },
    ],
  },

  // 수업 > 수업 자료실 — LNB 무관
  lesson: {
    base: [
      { emoji: '📚', text: '검사 결과에 따라 어떤 수업 자료를 선택하면 좋을까요?' },
      { emoji: '🎯', text: '맞춤형 큐레이팅은 어떤 기준으로 추천되나요?' },
      { emoji: '🗺️', text: '학년별 성장 로드맵은 어떻게 활용하나요?' },
      { emoji: '✏️', text: '자료를 직접 만들거나 수정할 수 있나요?' },
    ],
  },
};

/** screenKey + 학생 선택 여부 → 추천 질문 */
export function resolveScreenQuestions(screenKey: string, hasStudent: boolean): SuggestedQuestion[] {
  const set = SCREEN_QUESTIONS[screenKey] ?? SCREEN_QUESTIONS.home;
  return hasStudent && set.student ? set.student : set.base;
}

/** screenKey → 화면 이름 라벨 */
export const SCREEN_LABELS: Record<string, string> = {
  home: '홈',
  'exam-management': '검사관리',
  'exam-result': '결과보기',
  'exam-counseling': '학생 상담',
  'exam-tracking': '변화추적',
  'coaching-class': '학급 코칭',
  'coaching-individual': '개별 코칭',
  lesson: '수업 자료실',
};
