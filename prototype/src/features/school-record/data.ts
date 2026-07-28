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
