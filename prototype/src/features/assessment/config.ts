/**
 * 검사 관리 설정
 */

/**
 * 검사 코드 생성: claId와 dgnssId 기반 4자리 영숫자 코드
 * - UI에서 META-XXXX 형태로 표시됨
 * - claId 해시 + dgnssId 조합으로 고유 코드 생성
 */
export const generateExamCode = (claId: string, dgnssId: number): string => {
  // claId에서 숫자 부분 추출
  const numericPart = claId.replace(/\D/g, '');
  // 숫자 + dgnssId 조합 후 4자리로 변환
  const combined = parseInt(numericPart || '0', 10) * 100 + dgnssId;
  // 4자리 영숫자 코드로 변환 (1000 이상 유지)
  const code = (1000 + (combined % 9000)).toString();
  return code;
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
