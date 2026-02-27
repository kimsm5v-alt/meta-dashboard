/**
 * 검사 관리 설정
 *
 * 테스트용 ID는 JWT 토큰 내 정보와 일치해야 함
 */

// 테스트용 ID (고정)
// TODO: 실제 운영 시 JWT 토큰에서 동적으로 추출하도록 변경
export const TEST_TC_ID = 'engreal51-t';
export const TEST_CLA_ID = '22d4a5d5d98841cd9e48918c5820900a';

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
