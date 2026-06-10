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
}

export const SELFREG_FACTOR_DEFINITIONS: SelfregFactor[] = [
  // 동기전략 (6개 요인)
  { index: 0, name: '성장마인드셋', category: '동기전략', subCategory: '학습원동력' },
  { index: 1, name: '학업효능감', category: '동기전략', subCategory: '학습원동력' },
  { index: 2, name: '학습동기', category: '동기전략', subCategory: '학습원동력' },
  { index: 3, name: '성적부담조절', category: '동기전략', subCategory: '정서조절' },
  { index: 4, name: '공부부담조절', category: '동기전략', subCategory: '정서조절' },
  { index: 5, name: '실패부담조절', category: '동기전략', subCategory: '정서조절' },

  // 인지전략 (6개 요인)
  { index: 6, name: '계획능력', category: '인지전략', subCategory: '메타인지' },
  { index: 7, name: '점검능력', category: '인지전략', subCategory: '메타인지' },
  { index: 8, name: '조절능력', category: '인지전략', subCategory: '메타인지' },
  { index: 9, name: '이해기술', category: '인지전략', subCategory: '인지적학습기술' },
  { index: 10, name: '기억기술', category: '인지전략', subCategory: '인지적학습기술' },
  { index: 11, name: '집중기술', category: '인지전략', subCategory: '인지적학습기술' },

  // 행동전략 (8개 요인)
  { index: 12, name: '자기칭찬', category: '행동전략', subCategory: '행동조절' },
  { index: 13, name: '도움구하기', category: '행동전략', subCategory: '행동조절' },
  { index: 14, name: '학습지속성', category: '행동전략', subCategory: '행동조절' },
  { index: 15, name: '공부환경', category: '행동전략', subCategory: '행동적학습기술' },
  { index: 16, name: '시간관리', category: '행동전략', subCategory: '행동적학습기술' },
  { index: 17, name: '수업태도', category: '행동전략', subCategory: '행동적학습기술' },
  { index: 18, name: '노트하기', category: '행동전략', subCategory: '행동적학습기술' },
  { index: 19, name: '시험준비', category: '행동전략', subCategory: '행동적학습기술' },
];

export const SELFREG_MAIN_CATEGORIES: SelfregCategory[] = [
  '동기전략', '인지전략', '행동전략',
];

export const SELFREG_DOMAIN_COLORS: Record<SelfregCategory, string> = {
  '동기전략': '#9F91F8',
  '인지전략': '#4BC1FF',
  '행동전략': '#FF8A94',
};

export const SELFREG_DOMAIN_SOFT_COLORS: Record<SelfregCategory, string> = {
  '동기전략': '#EDE9FE',
  '인지전략': '#E2F4FF',
  '행동전략': '#FFE7EC',
};

export const SELFREG_DOMAIN_DESCRIPTIONS: Record<SelfregCategory, string> = {
  '동기전략': '학습하는 이유와 목적을 발견하여, 학습 지속성을 갖게 하는 마음가짐 전략',
  '인지전략': '학습 내용을 효과적으로 파악하고, 체계적으로 습득하도록 돕는 전략',
  '행동전략': '학습 활동을 최적화될 수 있게 하는 학습기술 및 실행력 향상 전략',
};

export const SELFREG_SUB_CATEGORY_FACTORS: Record<string, number[]> = {
  '학습원동력': [0, 1, 2],
  '정서조절': [3, 4, 5],
  '메타인지': [6, 7, 8],
  '인지적학습기술': [9, 10, 11],
  '행동조절': [12, 13, 14],
  '행동적학습기술': [15, 16, 17, 18, 19],
};

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

export const getSelfregFactorByIndex = (index: number): SelfregFactor | undefined =>
  SELFREG_FACTOR_DEFINITIONS[index];

export const getSelfregFactorsByCategory = (category: SelfregCategory): SelfregFactor[] =>
  SELFREG_FACTOR_DEFINITIONS.filter(f => f.category === category);

export default SELFREG_FACTOR_DEFINITIONS;
