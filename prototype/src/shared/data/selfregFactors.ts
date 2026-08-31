/**
 * 자기조절학습검사 요인 구조
 * - 대분류 3 / 중분류 6 / 요인 20
 * - 모든 대분류 polarity = positive (부적 요인 없음)
 */

export type SelfregCategory = '동기전략' | '인지전략' | '행동전략';

export interface SelfregFactor {
  index: number;
  name: string;
  category: SelfregCategory;
  subCategory: string;
  /** 조작적 정의 */
  description: string;
}

// 20개 요인 상세 정의 (조작적 정의 포함)
export const SELFREG_FACTOR_DEFINITIONS: SelfregFactor[] = [
  // 동기전략 (6개 요인)
  {
    index: 0,
    name: '성장마인드셋',
    category: '동기전략',
    subCategory: '학습 원동력',
    description: '지능이나 능력이 노력을 통해 변화하고 성장할 수 있다고 생각하는 정도',
  },
  {
    index: 1,
    name: '학업효능감',
    category: '동기전략',
    subCategory: '학습 원동력',
    description: '스스로 수업내용이나 과제를 잘 이해하고 잘 해낼 자신이 있다고 믿는 정도',
  },
  {
    index: 2,
    name: '학습동기',
    category: '동기전략',
    subCategory: '학습 원동력',
    description: '학습에 대한 흥미가 높고, 미래를 위해 학습활동이 중요하다고 생각하는 정도',
  },
  {
    index: 3,
    name: '성적부담조절',
    category: '동기전략',
    subCategory: '정서조절',
    description: '성적이 만족스럽지 않아도 다시 공부하기 위해 마음을 조절하는 정도',
  },
  {
    index: 4,
    name: '공부부담조절',
    category: '동기전략',
    subCategory: '정서조절',
    description: '공부를 잘하지 못할 것 같거나 이해하기 어렵다고 느끼는 마음을 조절하는 정도',
  },
  {
    index: 5,
    name: '실패부담조절',
    category: '동기전략',
    subCategory: '정서조절',
    description: '공부가 어렵다고 느끼거나 틀린 문제가 많아 속상한 마음을 조절할 수 있는 정도',
  },

  // 인지전략 (6개 요인)
  {
    index: 6,
    name: '계획능력',
    category: '인지전략',
    subCategory: '메타 인지',
    description: '공부 목표를 세우고, 목표에 따라 순차적으로 학습을 계획하는 능력',
  },
  {
    index: 7,
    name: '점검능력',
    category: '인지전략',
    subCategory: '메타 인지',
    description: '공부 목표 달성 정도와 공부 방법이 적절했는지를 전반적으로 파악할 수 있는 능력',
  },
  {
    index: 8,
    name: '조절능력',
    category: '인지전략',
    subCategory: '메타 인지',
    description: '공부 과정 중에 나타난 문제를 반복하지 않도록 더 나은 공부 방법을 찾아 조정하는 능력',
  },
  {
    index: 9,
    name: '이해기술',
    category: '인지전략',
    subCategory: '인지적 학습기술',
    description: '학습내용을 효과적으로 이해하기 위해 노력하는 정도',
  },
  {
    index: 10,
    name: '기억기술',
    category: '인지전략',
    subCategory: '인지적 학습기술',
    description: '기억을 잘 하기 위해 반복학습, 노트 필기, 말줄 긋기 등 기억 전략을 활용하는 정도',
  },
  {
    index: 11,
    name: '집중기술',
    category: '인지전략',
    subCategory: '인지적 학습기술',
    description: '공부에 방해되는 생각이나 행동을 자제하고, 최대한 공부에 집중하려고 노력하는 정도',
  },

  // 행동전략 (8개 요인)
  {
    index: 12,
    name: '자기칭찬',
    category: '행동전략',
    subCategory: '행동 조절',
    description: '좋은 성취를 거뒀거나 열심히 노력한 이후 스스로에게 보상을 주는 행위',
  },
  {
    index: 13,
    name: '도움구하기',
    category: '행동전략',
    subCategory: '행동 조절',
    description: '학습 시 모르는 것을 알기 위해 자료를 찾거나 교사 등 주변 사람에게 도움을 요청하는 정도',
  },
  {
    index: 14,
    name: '학습지속성',
    category: '행동전략',
    subCategory: '행동 조절',
    description: '공부가 지루해도 숙제나 계획한 공부를 끝까지 마치고자 노력하는 정도',
  },
  {
    index: 15,
    name: '공부환경',
    category: '행동전략',
    subCategory: '행동적 학습기술',
    description: '학습에 최적화된 공부환경이 될 수 있도록 정리, 정돈하는 습관',
  },
  {
    index: 16,
    name: '시간관리',
    category: '행동전략',
    subCategory: '행동적 학습기술',
    description: '규칙적으로 공부할 수 있는 시간을 계획하고, 관리하는 습관',
  },
  {
    index: 17,
    name: '수업태도',
    category: '행동전략',
    subCategory: '행동적 학습기술',
    description: '수업에 집중하여 선생님 말씀을 경청하고, 수업에 필요한 물품을 사전에 준비하는 습관',
  },
  {
    index: 18,
    name: '노트하기',
    category: '행동전략',
    subCategory: '행동적 학습기술',
    description: '학습한 핵심 내용을 정리하여 기록하고, 기억하기 위해 활용하는 공부습관',
  },
  {
    index: 19,
    name: '시험준비',
    category: '행동전략',
    subCategory: '행동적 학습기술',
    description: '평소에 시험 준비 전략을 학습에 잘 적용하고, 시험 상황에서도 실수를 줄이기 위해 노력하는 정도',
  },
];

// 대분류 목록
export const SELFREG_MAIN_CATEGORIES: SelfregCategory[] = [
  '동기전략', '인지전략', '행동전략',
];

// 대분류별 색상
export const SELFREG_DOMAIN_COLORS: Record<SelfregCategory, string> = {
  '동기전략': '#9F91F8',
  '인지전략': '#4AC1FF',
  '행동전략': '#FF8993',
};

export const SELFREG_DOMAIN_SOFT_COLORS: Record<SelfregCategory, string> = {
  '동기전략': '#EDE9FE',
  '인지전략': '#E2F4FF',
  '행동전략': '#FFE7EC',
};

// 대분류별 설명
export const SELFREG_DOMAIN_DESCRIPTIONS: Record<SelfregCategory, string> = {
  '동기전략': '학습하는 이유와 목적을 발견하여, 학습 지속성을 갖게 하는 마음가짐 전략',
  '인지전략': '학습 내용을 효과적으로 파악하고, 체계적으로 습득하도록 돕는 전략',
  '행동전략': '학습 활동을 최적화될 수 있게 하는 학습기술 및 실행력 향상 전략',
};

// 중분류별 요인 인덱스 매핑
export const SELFREG_SUB_CATEGORY_FACTORS: Record<string, number[]> = {
  // 동기전략
  '학습 원동력': [0, 1, 2],
  '정서조절': [3, 4, 5],
  // 인지전략
  '메타 인지': [6, 7, 8],
  '인지적 학습기술': [9, 10, 11],
  // 행동전략
  '행동 조절': [12, 13, 14],
  '행동적 학습기술': [15, 16, 17, 18, 19],
};

// 대분류별 구조 계산
export const SELFREG_DOMAIN_STRUCTURE = SELFREG_MAIN_CATEGORIES.map(domain => {
  const factors = SELFREG_FACTOR_DEFINITIONS.filter(f => f.category === domain);
  const subCatsSet = new Set(factors.map(f => f.subCategory));
  const subCategories = Array.from(subCatsSet).map(subCat => ({
    name: subCat,
    factors: factors.filter(f => f.subCategory === subCat),
  }));
  return {
    id: domain,
    name: domain,
    color: SELFREG_DOMAIN_COLORS[domain],
    softColor: SELFREG_DOMAIN_SOFT_COLORS[domain],
    description: SELFREG_DOMAIN_DESCRIPTIONS[domain],
    subCategories,
    factorCount: factors.length,
  };
});

export const getSelfregFactorByIndex = (index: number): SelfregFactor | undefined => {
  return SELFREG_FACTOR_DEFINITIONS[index];
};

export const getSelfregFactorsByCategory = (category: SelfregCategory): SelfregFactor[] => {
  return SELFREG_FACTOR_DEFINITIONS.filter(f => f.category === category);
};

export default SELFREG_FACTOR_DEFINITIONS;
