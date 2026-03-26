/**
 * 검사 관리 설정
 */

// QR 코드용 카운터
let codeCounter = 1000;

/** QR 코드용 짧은 숫자 생성 */
export const generateShortCode = (): string => {
  return String(codeCounter++);
};

/** 학교급 타입 */
export type SchoolLevel = 'elementary' | 'middle' | 'high';

/** 학교급 → API 학년군 변환 */
export const schoolLevelToGradeLevel = (schoolLevel: SchoolLevel) => {
  const map = {
    elementary: 'el',
    middle: 'mi',
    high: 'hi',
  } as const;
  return map[schoolLevel];
};
