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

export default FACTOR_DEFINITIONS;
