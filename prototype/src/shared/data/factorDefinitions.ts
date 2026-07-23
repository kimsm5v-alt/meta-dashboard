/**
 * 38개 학습요인 정의
 * 출처: 학습요인 유형 분류표 (prototype/docs/meta-test/13_학습요인_정의.md)
 */

export interface FactorDefinition {
  name: string;
  definition: string;
  category: string; // 대분류
  subCategory: string; // 중분류
  isPositive: boolean;
  factorType?: '개인요인' | '환경요인' | '—';
}

export const FACTOR_DEFINITIONS_MAP: Record<string, FactorDefinition> = {
  자아존중감: {
    name: '자아존중감',
    definition: '자신의 능력과 가치에 대한 전반적인 평가와 태도',
    category: '자아강점',
    subCategory: '긍정적자아',
    isPositive: true,
    factorType: '개인요인',
  },
  자기효능감: {
    name: '자기효능감',
    definition: '자신이 어떤 일을 성공적으로 수행할 수 있는 능력이 있다고 믿는 기대와 신념',
    category: '자아강점',
    subCategory: '긍정적자아',
    isPositive: true,
    factorType: '개인요인',
  },
  성장마인드셋: {
    name: '성장마인드셋',
    definition: '지능이나 능력이 노력을 통해 변화하고 성장할 수 있다고 생각하는 정도',
    category: '자아강점',
    subCategory: '긍정적자아',
    isPositive: true,
    factorType: '개인요인',
  },
  자기정서인식: {
    name: '자기정서인식',
    definition: '나의 정서적 상태를 알아차릴 수 있는 정도',
    category: '자아강점',
    subCategory: '대인관계능력',
    isPositive: true,
    factorType: '개인요인',
  },
  자기정서조절: {
    name: '자기정서조절',
    definition: '자신의 감정을 상황에 맞게 조절하고 대처할 수 있는 정도',
    category: '자아강점',
    subCategory: '대인관계능력',
    isPositive: true,
    factorType: '개인요인',
  },
  타인정서인식: {
    name: '타인정서인식',
    definition: '상대방의 기분이나 처한 상황에서 느끼는 감정을 이해할 수 있는 정도',
    category: '자아강점',
    subCategory: '대인관계능력',
    isPositive: true,
    factorType: '개인요인',
  },
  타인공감능력: {
    name: '타인공감능력',
    definition: '상대방의 감정, 의견, 주장 등에 대하여 자신도 동일하게 느끼는 정도',
    category: '자아강점',
    subCategory: '대인관계능력',
    isPositive: true,
    factorType: '개인요인',
  },
  계획능력: {
    name: '계획능력',
    definition: '공부 목표를 세우고, 목표에 따라 순차적으로 학습을 계획하는 능력',
    category: '학습디딤돌',
    subCategory: '메타인지',
    isPositive: true,
    factorType: '개인요인',
  },
  점검능력: {
    name: '점검능력',
    definition: '공부 목표 달성 정도와 공부 방법이 적절했는지를 전반적으로 파악할 수 있는 능력',
    category: '학습디딤돌',
    subCategory: '메타인지',
    isPositive: true,
    factorType: '개인요인',
  },
  조절능력: {
    name: '조절능력',
    definition: '공부 과정 중에 나타난 문제를 반복하지 않도록 더 나은 공부방법을 찾아 조정하는 능력',
    category: '학습디딤돌',
    subCategory: '메타인지',
    isPositive: true,
    factorType: '개인요인',
  },
  공부환경: {
    name: '공부환경',
    definition: '학습에 최적화된 공부환경이 될 수 있도록 정리, 정돈하는 습관',
    category: '학습디딤돌',
    subCategory: '학습기술',
    isPositive: true,
    factorType: '개인요인',
  },
  시간관리: {
    name: '시간관리',
    definition: '규칙적으로 공부할 수 있는 시간을 계획하고, 관리하는 습관',
    category: '학습디딤돌',
    subCategory: '학습기술',
    isPositive: true,
    factorType: '개인요인',
  },
  수업태도: {
    name: '수업태도',
    definition: '수업에 집중하여 선생님 말씀을 경청하고, 수업에 필요한 물품을 사전에 준비하는 습관',
    category: '학습디딤돌',
    subCategory: '학습기술',
    isPositive: true,
    factorType: '개인요인',
  },
  노트하기: {
    name: '노트하기',
    definition: '학습한 핵심 내용을 정리하여 기록하고, 기억하기 위해 활용하는 공부습관',
    category: '학습디딤돌',
    subCategory: '학습기술',
    isPositive: true,
    factorType: '개인요인',
  },
  시험준비: {
    name: '시험준비',
    definition: '수업에 집중하여 선생님 말씀을 경청하고, 수업에 필요한 물품을 사전에 준비하는 습관',
    category: '학습디딤돌',
    subCategory: '학습기술',
    isPositive: true,
    factorType: '개인요인',
  },
  부모의사소통: {
    name: '부모의사소통',
    definition: '부모님과 자신의 생활과 생각에 대해 편안하게 대화하는 정도',
    category: '학습디딤돌',
    subCategory: '지지적관계',
    isPositive: true,
    factorType: '환경요인',
  },
  부모학업지지: {
    name: '부모학업지지',
    definition: '부모님이 공부와 관련하여 자신의 의견과 노력을 지지한다고 생각하는 정도',
    category: '학습디딤돌',
    subCategory: '지지적관계',
    isPositive: true,
    factorType: '환경요인',
  },
  친구정서지지: {
    name: '친구정서지지',
    definition: '친구들이 자신의 의견과 고민을 잘 이해하고, 들어준다고 생각하는 정도',
    category: '학습디딤돌',
    subCategory: '지지적관계',
    isPositive: true,
    factorType: '환경요인',
  },
  교사정서지지: {
    name: '교사정서지지',
    definition: '교사가 자신의 의견과 고민을 잘 이해하며, 격려한다고 생각하는 정도',
    category: '학습디딤돌',
    subCategory: '지지적관계',
    isPositive: true,
    factorType: '환경요인',
  },
  활기: {
    name: '활기',
    definition: '공부를 할 때 힘이 나거나 재미와 즐거움을 느끼는 정도',
    category: '긍정적공부마음',
    subCategory: '학업열의',
    isPositive: true,
  },
  몰두: {
    name: '몰두',
    definition: '시간과 장소에 관계없이 공부에 집중할 수 있는 정도',
    category: '긍정적공부마음',
    subCategory: '학업열의',
    isPositive: true,
  },
  의미감: {
    name: '의미감',
    definition: '공부하는 의미와 목적을 알고, 보람을 느끼는 정도',
    category: '긍정적공부마음',
    subCategory: '학업열의',
    isPositive: true,
  },
  자율성: {
    name: '자율성',
    definition: '자기 스스로의 원칙에 따라 어떤 일을 주체적으로 결정하는 특성',
    category: '긍정적공부마음',
    subCategory: '성장력',
    isPositive: true,
  },
  유능성: {
    name: '유능성',
    definition: '어떤 일을 남들보다 잘하는 능력이 있다는 느낌',
    category: '긍정적공부마음',
    subCategory: '성장력',
    isPositive: true,
  },
  관계성: {
    name: '관계성',
    definition: '사람들 사이에서 관심을 주고 받으며, 그 속에서 소속감을 느끼는 정도',
    category: '긍정적공부마음',
    subCategory: '성장력',
    isPositive: true,
  },
  성적부담: {
    name: '성적부담',
    definition: '기대와 목표에 비해 성적이 낮게 나올 수 있다는 부담을 느끼는 정도',
    category: '학습걸림돌',
    subCategory: '학업스트레스',
    isPositive: false,
    factorType: '개인요인',
  },
  공부부담: {
    name: '공부부담',
    definition: '공부의 필요성과 공부 방법을 알지 못하거나, 공부 양이 많아 부담을 느끼는 정도',
    category: '학습걸림돌',
    subCategory: '학업스트레스',
    isPositive: false,
    factorType: '개인요인',
  },
  수업부담: {
    name: '수업부담',
    definition: '수업 내용이 어렵거나 지루하여 답답함이나 부담을 느끼는 정도',
    category: '학습걸림돌',
    subCategory: '학업스트레스',
    isPositive: false,
    factorType: '개인요인',
  },
  스마트폰의존: {
    name: '스마트폰의존',
    definition: '스마트폰 의존도가 높아서 일상생활과 공부에 방해 받는 정도',
    category: '학습걸림돌',
    subCategory: '학습방해물',
    isPositive: false,
    factorType: '개인요인',
  },
  게임과몰입: {
    name: '게임과몰입',
    definition: '인터넷 게임 의존도가 높아서 일상생활과 공부에 방해 받는 정도',
    category: '학습걸림돌',
    subCategory: '학습방해물',
    isPositive: false,
    factorType: '개인요인',
  },
  부모성적압력: {
    name: '부모성적압력',
    definition: '성적과 관련된 부모님의 높은 기대나 꾸중에 대해 부담감을 느끼는 정도',
    category: '학습걸림돌',
    subCategory: '학업관계스트레스',
    isPositive: false,
    factorType: '환경요인',
  },
  부모공부부담: {
    name: '부모공부부담',
    definition: '공부와 관련된 부모님의 비교와 압박으로 인해 부담감을 느끼는 정도',
    category: '학습걸림돌',
    subCategory: '학업관계스트레스',
    isPositive: false,
    factorType: '환경요인',
  },
  친구공부비교: {
    name: '친구공부비교',
    definition: '친구에 비해 성적이 떨어지는 것을 불안해 하거나 열등감을 느끼는 정도',
    category: '학습걸림돌',
    subCategory: '학업관계스트레스',
    isPositive: false,
    factorType: '환경요인',
  },
  교사성적압력: {
    name: '교사성적압력',
    definition: '교사의 성적비교, 꾸중에 대한 불안감, 기대에 부응하지 못한 성적으로 인한 좌절감의 정도',
    category: '학습걸림돌',
    subCategory: '학업관계스트레스',
    isPositive: false,
    factorType: '환경요인',
  },
  교사수업부담: {
    name: '교사수업부담',
    definition: '수업 중 교사의 질문에 답을 못하거나 수업 내용을 잘 이해하지 못할까봐 부담을 느끼는 정도',
    category: '학습걸림돌',
    subCategory: '학업관계스트레스',
    isPositive: false,
    factorType: '환경요인',
  },
  고갈: {
    name: '고갈',
    definition: '공부 때문에 지쳐서 아무 즐거움이나 흥미가 없는 피로 상태',
    category: '부정적공부마음',
    subCategory: '학업소진',
    isPositive: false,
  },
  무능감: {
    name: '무능감',
    definition: '노력해도 성적이 만족스럽지 않고, 노력한만큼 좋은 결과가 나오지 않아 실망감을 느끼는 상태',
    category: '부정적공부마음',
    subCategory: '학업소진',
    isPositive: false,
  },
  반감냉소: {
    name: '반감냉소',
    definition: '공부 흥미가 줄거나 하기 싫다고 느끼며, 공부의 필요성을 느끼지 못하는 정도',
    category: '부정적공부마음',
    subCategory: '학업소진',
    isPositive: false,
  },
};

/**
 * 요인명으로 정의 조회
 */
export function getFactorDefinition(factorName: string): string {
  return FACTOR_DEFINITIONS_MAP[factorName]?.definition ?? '';
}

/**
 * 요인 전체 정보 조회
 */
export function getFactorInfo(factorName: string): FactorDefinition | undefined {
  return FACTOR_DEFINITIONS_MAP[factorName];
}
