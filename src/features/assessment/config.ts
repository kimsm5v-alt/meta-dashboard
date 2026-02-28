/**
 * 검사 관리 설정
 *
 * 테스트용 ID는 JWT 토큰 내 정보와 일치해야 함
 */

// 테스트용 ID (고정)
// TODO: 실제 운영 시 JWT 토큰에서 동적으로 추출하도록 변경
export const TEST_TC_ID = 'engreal51-t';
export const TEST_CLA_ID = '1c4379432acc4a37ad0b608fd3a16a5c';

// 테스트용 학교급 (검사 생성 시 사용한 학년군)
// 'el' = 초등, 'mi' = 중등, 'hi' = 고등
// TODO: 실제 운영 시 API 응답에서 추출하거나 JWT에서 동적으로 결정
export const TEST_GRADE_LEVEL: 'el' | 'mi' | 'hi' = 'mi';

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
