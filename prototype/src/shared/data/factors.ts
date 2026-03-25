import type { Factor, FactorCategory } from '../types';

// 38개 요인 상세 정의
export const FACTOR_DEFINITIONS: Factor[] = [
  { index: 0, name: '자아존중감', category: '자아강점', subCategory: '긍정적자아', isPositive: true },
  { index: 1, name: '자기효능감', category: '자아강점', subCategory: '긍정적자아', isPositive: true },
  { index: 2, name: '성장마인드셋', category: '자아강점', subCategory: '긍정적자아', isPositive: true },
  { index: 3, name: '자기정서인식', category: '자아강점', subCategory: '대인관계능력', isPositive: true },
  { index: 4, name: '자기정서조절', category: '자아강점', subCategory: '대인관계능력', isPositive: true },
  { index: 5, name: '타인정서인식', category: '자아강점', subCategory: '대인관계능력', isPositive: true },
  { index: 6, name: '타인공감능력', category: '자아강점', subCategory: '대인관계능력', isPositive: true },
  { index: 7, name: '계획능력', category: '학습디딤돌', subCategory: '메타인지', isPositive: true },
  { index: 8, name: '점검능력', category: '학습디딤돌', subCategory: '메타인지', isPositive: true },
  { index: 9, name: '조절능력', category: '학습디딤돌', subCategory: '메타인지', isPositive: true },
  { index: 10, name: '공부환경', category: '학습디딤돌', subCategory: '학습기술', isPositive: true },
  { index: 11, name: '시간관리', category: '학습디딤돌', subCategory: '학습기술', isPositive: true },
  { index: 12, name: '수업태도', category: '학습디딤돌', subCategory: '학습기술', isPositive: true },
  { index: 13, name: '노트하기', category: '학습디딤돌', subCategory: '학습기술', isPositive: true },
  { index: 14, name: '시험준비', category: '학습디딤돌', subCategory: '학습기술', isPositive: true },
  { index: 15, name: '부모의사소통', category: '학습디딤돌', subCategory: '지지적관계', isPositive: true },
  { index: 16, name: '부모학업지지', category: '학습디딤돌', subCategory: '지지적관계', isPositive: true },
  { index: 17, name: '친구정서지지', category: '학습디딤돌', subCategory: '지지적관계', isPositive: true },
  { index: 18, name: '교사정서지지', category: '학습디딤돌', subCategory: '지지적관계', isPositive: true },
  { index: 19, name: '활기', category: '긍정적공부마음', subCategory: '학업열의', isPositive: true },
  { index: 20, name: '몰두', category: '긍정적공부마음', subCategory: '학업열의', isPositive: true },
  { index: 21, name: '의미감', category: '긍정적공부마음', subCategory: '학업열의', isPositive: true },
  { index: 22, name: '자율성', category: '긍정적공부마음', subCategory: '성장력', isPositive: true },
  { index: 23, name: '유능성', category: '긍정적공부마음', subCategory: '성장력', isPositive: true },
  { index: 24, name: '관계성', category: '긍정적공부마음', subCategory: '성장력', isPositive: true },
  { index: 25, name: '성적부담', category: '학습걸림돌', subCategory: '학업스트레스', isPositive: false },
  { index: 26, name: '공부부담', category: '학습걸림돌', subCategory: '학업스트레스', isPositive: false },
  { index: 27, name: '수업부담', category: '학습걸림돌', subCategory: '학업스트레스', isPositive: false },
  { index: 28, name: '스마트폰의존', category: '학습걸림돌', subCategory: '학습방해물', isPositive: false },
  { index: 29, name: '게임과몰입', category: '학습걸림돌', subCategory: '학습방해물', isPositive: false },
  { index: 30, name: '부모성적압력', category: '학습걸림돌', subCategory: '학업관계스트레스', isPositive: false },
  { index: 31, name: '부모공부부담', category: '학습걸림돌', subCategory: '학업관계스트레스', isPositive: false },
  { index: 32, name: '친구공부비교', category: '학습걸림돌', subCategory: '학업관계스트레스', isPositive: false },
  { index: 33, name: '교사성적압력', category: '학습걸림돌', subCategory: '학업관계스트레스', isPositive: false },
  { index: 34, name: '교사수업부담', category: '학습걸림돌', subCategory: '학업관계스트레스', isPositive: false },
  { index: 35, name: '고갈', category: '부정적공부마음', subCategory: '학업소진', isPositive: false },
  { index: 36, name: '무능감', category: '부정적공부마음', subCategory: '학업소진', isPositive: false },
  { index: 37, name: '반감냉소', category: '부정적공부마음', subCategory: '학업소진', isPositive: false },
];

export const getFactorByName = (name: string): Factor | undefined => {
  return FACTOR_DEFINITIONS.find(f => f.name === name);
};

export const getFactorByIndex = (index: number): Factor | undefined => {
  return FACTOR_DEFINITIONS[index];
};

export const getFactorsByCategory = (category: FactorCategory): Factor[] => {
  return FACTOR_DEFINITIONS.filter(f => f.category === category);
};

export const MAIN_CATEGORIES: FactorCategory[] = [
  '자아강점', '학습디딤돌', '학습걸림돌', '긍정적공부마음', '부정적공부마음',
];

/**
 * 11개 중분류별 요인 인덱스 매핑
 * 중분류 T점수 = 해당 요인들의 T점수 평균
 */
export const SUB_CATEGORY_FACTORS: Record<string, number[]> = {
  // 자아강점 (7개 요인)
  '긍정적자아': [0, 1, 2],          // 자아존중감, 자기효능감, 성장마인드셋
  '대인관계능력': [3, 4, 5, 6],     // 자기정서인식, 자기정서조절, 타인정서인식, 타인공감능력

  // 학습디딤돌 (12개 요인)
  '메타인지': [7, 8, 9],            // 계획능력, 점검능력, 조절능력
  '학습기술': [10, 11, 12, 13, 14], // 공부환경, 시간관리, 수업태도, 노트하기, 시험준비
  '지지적관계': [15, 16, 17, 18],   // 부모의사소통, 부모학업지지, 친구정서지지, 교사정서지지

  // 긍정적공부마음 (6개 요인)
  '학업열의': [19, 20, 21],         // 활기, 몰두, 의미감
  '성장력': [22, 23, 24],           // 자율성, 유능성, 관계성

  // 학습걸림돌 (10개 요인)
  '학업스트레스': [25, 26, 27],     // 성적부담, 공부부담, 수업부담
  '학습방해물': [28, 29],           // 스마트폰의존, 게임과몰입
  '학업관계스트레스': [30, 31, 32, 33, 34], // 부모성적압력, 부모공부부담, 친구공부비교, 교사성적압력, 교사수업부담

  // 부정적공부마음 (3개 요인)
  '학업소진': [35, 36, 37],         // 고갈, 무능감, 반감냉소
};

/**
 * 대분류별 중분류 그룹핑 (FACTOR_DEFINITIONS 기반 자동 생성)
 */
export const DOMAIN_GROUPS: Array<{ domain: FactorCategory; subCategories: string[] }> = (() => {
  const groups: Array<{ domain: FactorCategory; subCategories: string[] }> = [];
  for (const cat of MAIN_CATEGORIES) {
    const subs = [...new Set(
      FACTOR_DEFINITIONS.filter((f) => f.category === cat).map((f) => f.subCategory),
    )];
    groups.push({ domain: cat, subCategories: subs });
  }
  return groups;
})();

/**
 * 중분류별 요인 조회
 */
export const getFactorsBySubCategory = (subCategory: string): Factor[] => {
  const indices = SUB_CATEGORY_FACTORS[subCategory];
  if (!indices) return [];
  return indices.map(idx => FACTOR_DEFINITIONS[idx]).filter(Boolean);
};

export default FACTOR_DEFINITIONS;
