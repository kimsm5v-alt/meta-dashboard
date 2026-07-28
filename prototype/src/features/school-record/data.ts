import type { CounselingRecord, FactorInfo, RecordClass, RecordStudent } from './types';

/**
 * 생활기록부 작성 지원 - mock 데이터
 * @see docs/FEATURES_proto 260724.md
 */

// ── LPA 유형 배지 색상 (§3.4) ──────────────────────────────
export const LPA_COLORS: Record<string, string> = {
  자원소진형: 'bg-red-50 text-red-600 border-red-200',
  안전균형형: 'bg-blue-50 text-blue-600 border-blue-200',
  몰입자원풍부형: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  냉소적무기력형: 'bg-red-50 text-red-600 border-red-200',
  정서조절취약형: 'bg-amber-50 text-amber-600 border-amber-200',
  자기주도몰입형: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

// ── 관찰 상황 (§5.3 Step1) ────────────────────────────────
export interface SituationOption {
  code: string;
  label: string;
}
export const SITUATIONS: SituationOption[] = [
  { code: 'CLASS_PARTICIPATION', label: '수업 참여' },
  { code: 'TASK_PREPARATION', label: '과제·학습 준비' },
  { code: 'GROUP_ACTIVITY', label: '모둠 활동' },
  { code: 'PRESENTATION_COMMUNICATION', label: '발표·의사소통' },
  { code: 'PEER_RELATIONSHIP', label: '친구 관계' },
  { code: 'CLASS_ROLE', label: '학급 역할' },
  { code: 'CHALLENGE', label: '어려운 과제·도전 상황' },
  { code: 'ETC', label: '기타' },
];

// ── 상황별 관찰 행동 (§5.3) ───────────────────────────────
export const SITUATION_BEHAVIORS: Record<string, string[]> = {
  CLASS_PARTICIPATION: [
    '설명을 집중하여 들음',
    '궁금한 내용을 질문함',
    '자신의 의견을 적극적으로 발표함',
    '다른 사람의 발표를 경청함',
    '교사의 피드백을 반영함',
    '수업 활동에 꾸준히 참여함',
  ],
  TASK_PREPARATION: [
    '해야 할 일을 순서대로 정함',
    '준비물을 스스로 챙김',
    '정해진 시간 안에 과제를 마침',
    '결과물을 다시 확인함',
    '부족한 부분을 스스로 수정함',
    '계획에 맞게 학습을 진행함',
  ],
  GROUP_ACTIVITY: [
    '맡은 역할을 성실히 수행함',
    '친구의 의견을 끝까지 들음',
    '자신의 생각을 이해하기 쉽게 설명함',
    '서로 다른 의견을 조율함',
    '도움이 필요한 친구를 지원함',
    '모둠의 목표 달성에 기여함',
  ],
  PRESENTATION_COMMUNICATION: [
    '자신의 생각을 근거와 함께 설명함',
    '상대방의 질문에 적절히 답함',
    '다른 사람의 의견을 경청함',
    '이해하기 쉬운 표현을 사용함',
    '피드백을 반영하여 내용을 보완함',
    '발표 과정에서 맡은 역할을 수행함',
  ],
  PEER_RELATIONSHIP: [
    '친구의 감정을 이해하려고 함',
    '친구의 고민이나 이야기를 들어줌',
    '어려움을 겪는 친구를 도와줌',
    '갈등이 있을 때 상대의 입장을 살핌',
    '자신의 감정을 말로 표현함',
    '대화를 통해 관계를 회복함',
  ],
  CLASS_ROLE: [
    '맡은 역할을 잊지 않고 수행함',
    '공동으로 사용하는 물품을 정리함',
    '학급 활동 준비에 참여함',
    '필요한 일을 먼저 찾아 수행함',
    '다른 학생과 역할을 나누어 협력함',
    '정해진 약속과 규칙을 지키려고 노력함',
  ],
  CHALLENGE: [
    '쉽게 포기하지 않고 다시 시도함',
    '어려운 부분에 대해 도움을 요청함',
    '기존 방법이 효과적이지 않을 때 다른 방법을 찾음',
    '실수를 확인하고 수정함',
    '피드백을 받아 결과물을 개선함',
    '어려움이 있어도 끝까지 참여함',
  ],
  ETC: [],
};

// ── 요인 정보: 설명·관찰질문·추천행동 (§5.2, §5.3) ─────────
export const FACTOR_INFO: Record<string, FactorInfo> = {
  타인공감능력: {
    description: '상대방의 감정과 입장을 이해하고 공감하는 능력',
    question: '친구의 감정이나 입장을 이해하고 배려한 모습이 있었나요?',
    recommendedBehaviors: ['친구의 의견을 끝까지 들음', '도움이 필요한 친구를 지원함', '친구의 고민이나 이야기를 들어줌', '어려움을 겪는 친구를 도와줌'],
  },
  자기정서조절: {
    description: '속상하거나 어려운 상황에서 감정을 조절하며 대응하는 능력',
    question: '속상하거나 어려운 상황에서도 감정을 조절하며 대응한 모습이 있었나요?',
    recommendedBehaviors: ['자신의 감정을 말로 표현함', '갈등이 있을 때 상대의 입장을 살핌', '대화를 통해 관계를 회복함'],
  },
  성장마인드셋: {
    description: '실수나 실패를 성장의 계기로 삼아 다시 시도하는 태도',
    question: '실수하거나 실패한 뒤 다시 시도한 모습이 있었나요?',
    recommendedBehaviors: ['쉽게 포기하지 않고 다시 시도함', '어려움이 있어도 끝까지 참여함', '피드백을 받아 결과물을 개선함'],
  },
  시간관리: {
    description: '과제 시작·준비물·마감 시간을 스스로 관리하는 능력',
    question: '과제 시작, 준비물, 마감 시간을 스스로 관리한 모습이 있었나요?',
    recommendedBehaviors: ['해야 할 일을 순서대로 정함', '준비물을 스스로 챙김', '정해진 시간 안에 과제를 마침', '계획에 맞게 학습을 진행함'],
  },
  점검능력: {
    description: '자신의 결과물을 다시 확인하고 보완하는 능력',
    question: '자신의 결과물을 다시 확인하고 고치거나 보완한 모습이 있었나요?',
    recommendedBehaviors: ['결과물을 다시 확인함', '부족한 부분을 스스로 수정함', '실수를 확인하고 수정함'],
  },
  수업태도: {
    description: '수업에 경청·질문·발표로 참여하는 태도',
    question: '설명을 경청하거나 질문·발표 등으로 수업에 참여한 모습이 있었나요?',
    recommendedBehaviors: ['설명을 집중하여 들음', '궁금한 내용을 질문함', '수업 활동에 꾸준히 참여함', '교사의 피드백을 반영함'],
  },
  계획능력: {
    description: '해야 할 일을 순서대로 정하고 계획하는 능력',
    question: '해야 할 일을 순서대로 정하거나 계획한 모습이 있었나요?',
    recommendedBehaviors: ['해야 할 일을 순서대로 정함', '계획에 맞게 학습을 진행함'],
  },
  자아존중감: {
    description: '자신의 장점을 알고 자신감 있게 행동하는 태도',
    question: '자신의 장점을 알고 자신감 있게 행동한 모습이 있었나요?',
    recommendedBehaviors: ['자신의 의견을 적극적으로 발표함', '쉽게 포기하지 않고 다시 시도함'],
  },
  자기효능감: {
    description: '어려운 상황에서도 해볼 수 있다는 태도를 보이는 능력',
    question: '어려운 상황에서도 포기하지 않고 해볼 수 있다는 태도를 보인 적이 있었나요?',
    recommendedBehaviors: ['쉽게 포기하지 않고 다시 시도함', '어려운 부분에 대해 도움을 요청함'],
  },
  관계성: {
    description: '친구들과 협력하며 공동체에 소속감을 느끼는 능력',
    question: '친구들과 협력하며 공동체에 소속감을 느끼는 모습이 있었나요?',
    recommendedBehaviors: ['서로 다른 의견을 조율함', '모둠의 목표 달성에 기여함', '다른 학생과 역할을 나누어 협력함'],
  },

  // ── 자아강점 · 대인관계능력 ──
  자기정서인식: {
    description: '자신의 감정을 알아차리고 이름 붙일 수 있는 능력',
    question: '자신의 감정을 알아차리고 표현한 모습이 있었나요?',
    recommendedBehaviors: ['지금 느끼는 감정을 말로 표현함', '기분 변화를 스스로 알아차림', '감정의 이유를 돌아봄'],
  },
  타인정서인식: {
    description: '다른 사람의 감정과 기분 변화를 알아차리는 능력',
    question: '친구의 감정이나 기분 변화를 알아차린 모습이 있었나요?',
    recommendedBehaviors: ['친구의 표정·말투 변화를 살핌', '힘들어하는 친구를 먼저 알아차림', '상대의 기분에 맞춰 반응함'],
  },

  // ── 학습디딤돌 · 메타인지 ──
  조절능력: {
    description: '학습 과정에서 방법을 점검하고 필요할 때 바꾸는 능력',
    question: '학습 방법이 잘 맞지 않을 때 스스로 방법을 바꾼 모습이 있었나요?',
    recommendedBehaviors: ['막히는 부분에서 방법을 바꿔 봄', '집중이 흐트러질 때 스스로 다잡음', '더 나은 방법을 찾아 적용함'],
  },

  // ── 학습디딤돌 · 학습기술 ──
  공부환경: {
    description: '집중할 수 있도록 학습 환경을 스스로 정돈하는 습관',
    question: '집중할 수 있도록 학습 환경을 스스로 정돈한 모습이 있었나요?',
    recommendedBehaviors: ['책상과 준비물을 정리함', '집중을 방해하는 요소를 치움', '학습에 알맞은 자리를 찾아 앉음'],
  },
  노트하기: {
    description: '수업 내용을 자신의 방식으로 정리·기록하는 습관',
    question: '수업 내용을 자신의 방식으로 정리하거나 기록한 모습이 있었나요?',
    recommendedBehaviors: ['핵심 내용을 정리해 기록함', '중요한 부분을 표시하며 정리함', '배운 내용을 나중에 다시 정리함'],
  },
  시험준비: {
    description: '평가를 앞두고 계획을 세워 준비하는 태도',
    question: '평가를 앞두고 계획을 세워 꾸준히 준비한 모습이 있었나요?',
    recommendedBehaviors: ['준비 계획을 세워 실천함', '틀린 문제를 다시 확인함', '부족한 부분을 반복해 익힘'],
  },

  // ── 학습디딤돌 · 지지적관계 (학생의 소통·활용 모습으로 관찰) ──
  부모의사소통: {
    description: '가정에서 배움이나 고민을 나누며 소통하는 모습',
    question: '가정에서 배운 내용이나 고민을 나누며 소통한 모습이 있었나요?',
    recommendedBehaviors: ['가정에서 배운 내용을 나눔', '고민을 가족과 상의함', '학교생활을 가족과 이야기함'],
  },
  부모학업지지: {
    description: '가정의 관심과 지지를 바탕으로 학습을 이어가는 모습',
    question: '가정의 관심을 바탕으로 학습을 꾸준히 이어간 모습이 있었나요?',
    recommendedBehaviors: ['가정에서 정한 학습 습관을 지킴', '도움을 받아 학습을 이어감', '배운 내용을 가정에서 복습함'],
  },
  친구정서지지: {
    description: '친구와 서로 힘이 되어주며 지내는 모습',
    question: '친구와 서로 힘이 되어주며 지낸 모습이 있었나요?',
    recommendedBehaviors: ['힘들어하는 친구를 격려함', '친구의 이야기를 들어줌', '친구와 서로 도우며 지냄'],
  },
  교사정서지지: {
    description: '선생님과 소통하며 도움을 구하고 조언을 받아들이는 모습',
    question: '선생님과 소통하며 도움을 구하거나 조언을 받아들인 모습이 있었나요?',
    recommendedBehaviors: ['어려울 때 선생님께 도움을 요청함', '조언을 받아들여 실천함', '선생님과 자주 소통함'],
  },

  // ── 긍정적공부마음 · 학업열의 ──
  활기: {
    description: '학습에 활기차고 에너지 있게 임하는 모습',
    question: '학습이나 활동에 활기차게 참여한 모습이 있었나요?',
    recommendedBehaviors: ['활동에 적극적으로 참여함', '밝은 태도로 학습에 임함', '새로운 활동에 의욕을 보임'],
  },
  몰두: {
    description: '학습에 깊이 집중하며 몰입하는 모습',
    question: '한 가지 학습이나 활동에 깊이 집중한 모습이 있었나요?',
    recommendedBehaviors: ['맡은 과제에 오래 집중함', '주변에 흔들리지 않고 몰입함', '끝까지 집중해 마무리함'],
  },
  의미감: {
    description: '공부의 이유와 의미를 스스로 찾는 태도',
    question: '공부의 이유나 의미를 스스로 생각하며 임한 모습이 있었나요?',
    recommendedBehaviors: ['배우는 이유를 스스로 찾음', '자신의 목표와 학습을 연결함', '배운 내용을 생활에 적용함'],
  },

  // ── 긍정적공부마음 · 성장력 ──
  자율성: {
    description: '스스로 선택하고 주도적으로 학습하는 태도',
    question: '스스로 정하고 주도적으로 학습을 이끈 모습이 있었나요?',
    recommendedBehaviors: ['스스로 학습 목표를 정함', '해야 할 일을 자발적으로 함', '자기 방식으로 과제를 해결함'],
  },
  유능성: {
    description: '스스로 해낼 수 있다는 자신감을 느끼는 모습',
    question: '과제를 해내며 스스로 할 수 있다는 자신감을 보인 모습이 있었나요?',
    recommendedBehaviors: ['맡은 일을 끝까지 해냄', '해낸 경험을 바탕으로 도전함', '자신의 성취를 스스로 확인함'],
  },

  // ── 학습걸림돌 · 학업스트레스 (부담 속에서도 노력·조절한 성장 관찰) ──
  성적부담: {
    description: '성적에 대한 부담 속에서도 학습을 이어가려는 노력',
    question: '성적에 대한 부담 속에서도 학습을 꾸준히 이어가려 노력한 모습이 있었나요?',
    recommendedBehaviors: ['부담을 느낄 때 도움을 요청함', '결과보다 과정에 집중하려 함', '자신만의 방법으로 마음을 다잡음'],
  },
  공부부담: {
    description: '공부량이 부담될 때 스스로 조절하며 임하는 노력',
    question: '공부가 부담될 때 스스로 조절하며 임한 모습이 있었나요?',
    recommendedBehaviors: ['할 일을 작게 나누어 시작함', '무리하지 않고 계획을 조정함', '쉬어가며 꾸준히 이어감'],
  },
  수업부담: {
    description: '수업이 어렵게 느껴질 때에도 참여하려는 노력',
    question: '수업이 어렵게 느껴질 때에도 참여하려 노력한 모습이 있었나요?',
    recommendedBehaviors: ['모르는 부분을 질문함', '어려워도 끝까지 수업에 참여함', '수업 후 부족한 부분을 보충함'],
  },

  // ── 학습걸림돌 · 학습방해물 (스스로 조절한 성장 관찰) ──
  스마트폰의존: {
    description: '스마트폰 사용 시간을 스스로 조절하려는 노력',
    question: '스마트폰 사용 시간을 스스로 조절하려 노력한 모습이 있었나요?',
    recommendedBehaviors: ['학습 중 사용을 스스로 줄임', '사용 시간을 정해 지키려 함', '집중이 필요할 때 멀리 둠'],
  },
  게임과몰입: {
    description: '게임 시간을 조절하고 학습과 균형을 잡으려는 노력',
    question: '게임 시간을 조절하며 학습과 균형을 잡으려 한 모습이 있었나요?',
    recommendedBehaviors: ['정한 시간만큼만 하려 함', '할 일을 마친 뒤 여가를 가짐', '스스로 시간을 정해 조절함'],
  },

  // ── 학습걸림돌 · 학업관계스트레스 (기대·비교 속 자기 기준 유지 관찰) ──
  부모성적압력: {
    description: '주변의 기대 속에서도 자기 기준으로 학습에 임하는 모습',
    question: '주변의 기대 속에서도 자기 기준을 지키며 학습에 임한 모습이 있었나요?',
    recommendedBehaviors: ['자신의 목표에 집중함', '부담을 느낄 때 마음을 나눔', '자기 속도로 꾸준히 함'],
  },
  부모공부부담: {
    description: '가정의 기대가 부담될 때에도 균형을 잡으려는 노력',
    question: '가정의 기대가 부담될 때에도 스스로 균형을 잡으려 한 모습이 있었나요?',
    recommendedBehaviors: ['힘든 마음을 가족과 나눔', '할 수 있는 만큼 계획을 세움', '자신의 페이스를 지킴'],
  },
  친구공부비교: {
    description: '주변과 비교되는 상황에서도 자신의 목표에 집중하는 모습',
    question: '주변과 비교되는 상황에서도 자신의 목표에 집중한 모습이 있었나요?',
    recommendedBehaviors: ['자신의 목표에 집중함', '어제의 자신과 견주며 성장함', '과정을 스스로 돌아봄'],
  },
  교사성적압력: {
    description: '평가에 대한 부담 속에서도 배움에 임하려는 노력',
    question: '평가에 대한 부담 속에서도 배움에 꾸준히 임한 모습이 있었나요?',
    recommendedBehaviors: ['부담보다 배움에 집중하려 함', '어려울 때 선생님께 도움을 구함', '자신의 성장에 초점을 둠'],
  },
  교사수업부담: {
    description: '수업이 부담될 때에도 참여를 이어가려는 노력',
    question: '수업이 부담되는 상황에서도 참여를 이어간 모습이 있었나요?',
    recommendedBehaviors: ['어려워도 수업에 참여함', '이해가 안 될 때 질문함', '부족한 부분을 스스로 보완함'],
  },

  // ── 부정적공부마음 · 학업소진 (회복·재참여·자신감 관찰) ──
  고갈: {
    description: '지치는 상황에서도 스스로 에너지를 회복하려는 노력',
    question: '지치는 상황에서도 스스로 에너지를 회복하려 한 모습이 있었나요?',
    recommendedBehaviors: ['쉬어가며 다시 시작함', '힘들 때 도움을 요청함', '작은 것부터 다시 시도함'],
  },
  무능감: {
    description: '자신감이 낮을 때 작은 성공으로 회복하려는 노력',
    question: '어렵게 느끼던 일에서 작은 성공을 통해 자신감을 회복한 모습이 있었나요?',
    recommendedBehaviors: ['작은 목표부터 해냄', '해낸 경험을 스스로 확인함', '도움을 받아 다시 도전함'],
  },
  반감냉소: {
    description: '흥미가 낮았던 활동에 다시 관심을 갖고 참여하려는 노력',
    question: '흥미가 낮았던 활동에 다시 관심을 갖고 참여한 모습이 있었나요?',
    recommendedBehaviors: ['관심 있는 부분부터 참여함', '다시 시도해 보려 함', '작은 흥미를 학습으로 이어감'],
  },
};

// ── 변화·지속 정도 (§5.3 Step3) ───────────────────────────
export interface ContinuityOption {
  code: string;
  label: string;
}
export const CONTINUITY_OPTIONS: ContinuityOption[] = [
  { code: 'CONSISTENT', label: '꾸준히 보임' },
  { code: 'MORE_FREQUENT', label: '최근 더 자주 보임' },
  { code: 'IMPROVING', label: '점차 좋아지고 있음' },
  { code: 'WITH_SUPPORT', label: '도움을 받으면 수행함' },
  { code: 'SITUATIONAL', label: '특정 상황에서 두드러짐' },
];

// ── 학교급별 구체적 장면 placeholder (§5.3 Step4) ─────────
export const FREETEXT_PLACEHOLDER: Record<string, string> = {
  초등: '예) 쉬는 시간에 우는 친구에게 먼저 다가가 다독여주는 모습이 인상적이었음',
  중등: '예) 모둠 수학 프로젝트에서 어려워하는 친구에게 풀이 방법을 설명해 주는 모습이 인상적이었음',
  고등: '예) 물리 수행평가에서 실험 결과가 예상과 다르자, 변인을 재설정하여 실험을 재설계하는 탐구 자세를 보임',
};

const empty = () => ({ factorCodes: [], situationCodes: [], behaviorCodes: [], freeText: '' });

type Seed = [name: string, lpa: string, str: string[], imp: string[], status: RecordStudent['status'], extra?: Partial<RecordStudent>];

// startIndex: LNB(스코프) 학생 목록(s1~s26)에서의 시작 인덱스 — 학생명 순서가 LNB와 동일
const buildStudents = (classId: string, className: string, level: RecordStudent['schoolLevel'], startIndex: number, seeds: Seed[]): RecordStudent[] =>
  seeds.map(([name, lpa, str, imp, status, extra], i) => ({
    id: `${classId}-${i + 1}`,
    scopeId: `s${startIndex + i + 1}`,
    no: i + 1,
    name,
    className,
    schoolLevel: level,
    lpaType: lpa,
    strengths: str,
    improvements: imp,
    status,
    input: empty(),
    ...extra,
  }));

// ── 공통 학생 로스터 (LNB 스코프의 s1~s26과 동일) ──
// 앱 전역 규칙상 모든 반이 같은 26명 로스터를 공유한다 (LNB·검사 mock과 동일).
const ROSTER: Seed[] = [
  ['김민준', '자원소진형', ['성장마인드셋', '관계성', '자아존중감'], ['시간관리', '수업태도', '점검능력'], 'EDITED',
    { input: { factorCodes: ['성장마인드셋'], situationCodes: ['CHALLENGE'], behaviorCodes: ['쉽게 포기하지 않고 다시 시도함'], continuityCode: 'IMPROVING', freeText: '' }, savedText: '어려운 과제에도 쉽게 포기하지 않고 다시 시도하는 끈기를 보이며, 스스로 방법을 바꾸어 해결하려는 태도가 점차 향상되고 있음.', previousSavedText: '어려운 과제에 다시 도전하는 모습을 보임.', savedAt: '2026.07.23 16:20', source: 'INDIVIDUAL_OBSERVATION' }],
  ['이서연', '안전균형형', ['계획능력', '자기효능감', '수업태도'], ['자기정서조절', '점검능력', '관계성'], 'DRAFT',
    { input: { factorCodes: ['수업태도'], situationCodes: ['CLASS_PARTICIPATION'], behaviorCodes: ['설명을 집중하여 들음', '궁금한 내용을 질문함'], continuityCode: 'CONSISTENT', freeText: '' }, savedText: '수업 시간에 교사의 설명을 집중하여 듣고 궁금한 내용을 스스로 질문하며 배움에 적극적으로 참여하는 태도가 꾸준히 나타남.', savedAt: '2026.07.24 14:32', source: 'INDIVIDUAL_OBSERVATION' }],
  ['박지호', '안전균형형', ['자아존중감', '관계성', '계획능력'], ['자기효능감', '시간관리', '점검능력'], 'INPUTTING',
    { input: { factorCodes: ['관계성'], situationCodes: ['GROUP_ACTIVITY'], behaviorCodes: [], freeText: '' }, savedAt: '2026.07.24 10:15' }],
  ['최수아', '안전균형형', ['타인공감능력', '관계성', '자아존중감'], ['시간관리', '계획능력', '점검능력'], 'DRAFT',
    { input: { factorCodes: ['타인공감능력'], situationCodes: ['PEER_RELATIONSHIP'], behaviorCodes: ['친구의 고민이나 이야기를 들어줌', '어려움을 겪는 친구를 도와줌'], continuityCode: 'CONSISTENT', freeText: '' }, savedText: '친구의 고민을 진심으로 들어주고 어려움을 겪는 친구를 먼저 도와주는 등 상대의 감정을 살피며 배려하는 모습이 꾸준히 나타남.', savedAt: '2026.07.24 11:05', source: 'INDIVIDUAL_OBSERVATION' }],
  ['정예준', '몰입자원풍부형', ['수업태도', '계획능력', '성장마인드셋'], ['타인공감능력', '자기정서조절', '관계성'], 'EMPTY'],
  ['강하은', '몰입자원풍부형', ['계획능력', '점검능력', '자기효능감'], ['타인공감능력', '관계성', '자기정서조절'], 'EMPTY'],
  ['조민서', '안전균형형', ['계획능력', '수업태도', '관계성'], ['자아존중감', '자기효능감', '시간관리'], 'EMPTY'],
  ['윤시우', '자원소진형', ['성장마인드셋', '자기효능감', '수업태도'], ['자기정서조절', '관계성', '점검능력'], 'EMPTY'],
  ['장도윤', '몰입자원풍부형', ['타인공감능력', '수업태도', '성장마인드셋'], ['시간관리', '점검능력', '자기정서조절'], 'EMPTY'],
  ['임지아', '몰입자원풍부형', ['수업태도', '성장마인드셋', '점검능력'], ['타인공감능력', '자기정서조절', '관계성'], 'EMPTY'],
  ['한서준', '몰입자원풍부형', ['자기효능감', '계획능력', '점검능력'], ['타인공감능력', '관계성', '자기정서조절'], 'EMPTY'],
  ['오하린', '안전균형형', ['관계성', '타인공감능력', '자아존중감'], ['시간관리', '점검능력', '계획능력'], 'DRAFT',
    { input: { factorCodes: ['관계성'], situationCodes: ['GROUP_ACTIVITY'], behaviorCodes: ['서로 다른 의견을 조율함', '모둠의 목표 달성에 기여함'], continuityCode: 'MORE_FREQUENT', freeText: '' }, savedText: '모둠 활동에서 서로 다른 의견을 조율하고 공동의 목표 달성에 기여하는 모습이 최근 더욱 자주 나타남.', savedAt: '2026.07.24 09:40', source: 'INDIVIDUAL_OBSERVATION' }],
  ['신유나', '안전균형형', ['자아존중감', '수업태도', '관계성'], ['자기효능감', '시간관리', '점검능력'], 'EMPTY'],
  ['권준우', '자원소진형', ['성장마인드셋', '자기효능감', '계획능력'], ['자기정서조절', '수업태도', '점검능력'], 'INPUTTING',
    { input: { factorCodes: ['성장마인드셋'], situationCodes: ['CHALLENGE'], behaviorCodes: [], freeText: '' }, savedAt: '2026.07.23 15:40' }],
  ['송지원', '몰입자원풍부형', ['수업태도', '성장마인드셋', '점검능력'], ['타인공감능력', '자기정서조절', '관계성'], 'EMPTY'],
  ['백서윤', '안전균형형', ['타인공감능력', '관계성', '수업태도'], ['시간관리', '계획능력', '자기정서조절'], 'EMPTY'],
  ['고은우', '몰입자원풍부형', ['계획능력', '점검능력', '수업태도'], ['타인공감능력', '관계성', '자아존중감'], 'EMPTY'],
  ['문채원', '안전균형형', ['관계성', '자아존중감', '계획능력'], ['자기효능감', '점검능력', '시간관리'], 'EMPTY'],
  ['양시온', '몰입자원풍부형', ['수업태도', '계획능력', '성장마인드셋'], ['타인공감능력', '자기정서조절', '관계성'], 'EMPTY'],
  ['배하율', '자원소진형', ['성장마인드셋', '자아존중감', '자기효능감'], ['시간관리', '수업태도', '점검능력'], 'EMPTY'],
  ['허지후', '안전균형형', ['타인공감능력', '관계성', '자아존중감'], ['자기정서조절', '시간관리', '점검능력'], 'EMPTY'],
  ['남윤서', '몰입자원풍부형', ['수업태도', '점검능력', '계획능력'], ['타인공감능력', '관계성', '자기정서조절'], 'EMPTY'],
  ['심현우', '안전균형형', ['계획능력', '관계성', '수업태도'], ['자아존중감', '자기효능감', '시간관리'], 'EMPTY'],
  ['안소율', '몰입자원풍부형', ['자기효능감', '타인공감능력', '점검능력'], ['시간관리', '자기정서조절', '계획능력'], 'EMPTY'],
  ['유건우', '안전균형형', ['자기효능감', '계획능력', '수업태도'], ['자기정서조절', '관계성', '점검능력'], 'EMPTY'],
  ['노이서', '몰입자원풍부형', ['성장마인드셋', '수업태도', '계획능력'], ['타인공감능력', '시간관리', '관계성'], 'EMPTY'],
];

// ── 학급 mock (LNB 스코프의 학급/학생과 동일 구성 — group-1~4 / 2-3~2-6반, 로스터 공유) ──
const RECORD_CLASS_META: { id: string; name: string }[] = [
  { id: 'group-1', name: '2-3반' },
  { id: 'group-2', name: '2-4반' },
  { id: 'group-3', name: '2-5반' },
  { id: 'group-4', name: '2-6반' },
];

export const MOCK_RECORD_CLASSES: RecordClass[] = RECORD_CLASS_META.map(({ id, name }) => ({
  id,
  group: name,
  name,
  schoolLevel: '초등',
  students: buildStudents(id, name, '초등', 0, ROSTER),
}));

// ── 상담·관찰 기록 mock (학생 id 기준) ─────────────────────
// 학생(스코프 id) 기준 상담·관찰 기록 — 로스터를 공유하므로 반과 무관하게 학생을 따라감
export const MOCK_COUNSELING: Record<string, CounselingRecord[]> = {
  s1: [{ id: 'c1', date: '2026.04.28', category: '학습 상담', summary: '한 번 실패한 과제를 방식을 바꿔 다시 시도해 완성함.' }],
  s2: [
    { id: 'c2', date: '2026.05.12', category: '학습 상담', summary: '모둠 과제에서 친구들의 의견을 정리해 발표를 맡음. 역할에 책임감을 보임.' },
    { id: 'c3', date: '2026.06.03', category: '관찰 메모', summary: '어려워하는 짝을 도와 문제 풀이를 함께 진행하는 모습을 관찰함.' },
  ],
  s4: [{ id: 'c4', date: '2026.06.10', category: '관찰 메모', summary: '다툰 친구에게 먼저 다가가 사과하고 관계를 회복함.' }],
  s12: [{ id: 'c5', date: '2026.05.20', category: '정서 상담', summary: '발표 전 긴장을 호소했으나, 심호흡 후 차분하게 발표를 마침.' }],
};
