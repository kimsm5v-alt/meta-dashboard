/**
 * 개인정보(PII) 마스킹 유틸리티
 *
 * AI API 호출 전 학생의 개인정보를 마스킹하여 개인정보 보호
 *
 * 마스킹 대상 (CLAUDE.md 기준):
 * - 학생 이름
 * - 학번/학생ID
 * - 생년월일
 * - 학교명
 */

// ============================================================
// 타입 정의
// ============================================================

export interface StudentAlias {
  originalName: string;
  alias: string;
}

export interface MaskingResult {
  maskedText: string;
  aliasMap: Map<string, string>;
}

// ============================================================
// 한국어 이름 패턴
// ============================================================

// 한국 성씨 목록 (주요 성씨)
const KOREAN_SURNAMES = [
  '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
  '한', '오', '서', '신', '권', '황', '안', '송', '류', '전',
  '홍', '고', '문', '양', '손', '배', '백', '허', '유', '남',
  '심', '노', '하', '곽', '성', '차', '주', '우', '구', '민',
  '나', '진', '지', '엄', '채', '원', '천', '방', '공', '현',
];

// 이름 패턴: 성 + 이름 (2~3글자)
const KOREAN_NAME_PATTERN = new RegExp(
  `(${KOREAN_SURNAMES.join('|')})[가-힣]{1,2}(?![가-힣])`,
  'g'
);

// ============================================================
// 마스킹 패턴
// ============================================================

const PATTERNS = {
  // 학번 패턴: 숫자로 시작하는 학번 형식 (예: 20240101, 2024-01-01)
  studentId: /\b\d{4}[-]?\d{2}[-]?\d{2,4}\b/g,

  // 생년월일 패턴 (예: 2010.03.15, 2010-03-15, 2010/03/15)
  birthDate: /\b(19|20)\d{2}[.\-/](0[1-9]|1[0-2])[.\-/](0[1-9]|[12]\d|3[01])\b/g,

  // 학교명 패턴 (예: OO초등학교, OO중학교, OO고등학교)
  schoolName: /[가-힣]{2,10}(초등학교|중학교|고등학교|초|중|고)/g,

  // 전화번호 패턴
  phoneNumber: /\b(010|011|016|017|018|019)[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g,

  // 이메일 패턴
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
};

// ============================================================
// 마스킹 함수
// ============================================================

/**
 * 텍스트에서 개인정보를 마스킹
 *
 * @param text - 원본 텍스트
 * @returns 마스킹된 텍스트
 */
export const maskPII = (text: string): string => {
  let result = text;

  // 1. 학번 마스킹
  result = result.replace(PATTERNS.studentId, '[학번]');

  // 2. 생년월일 마스킹
  result = result.replace(PATTERNS.birthDate, '[생년월일]');

  // 3. 학교명 마스킹
  result = result.replace(PATTERNS.schoolName, '[학교명]');

  // 4. 전화번호 마스킹
  result = result.replace(PATTERNS.phoneNumber, '[전화번호]');

  // 5. 이메일 마스킹
  result = result.replace(PATTERNS.email, '[이메일]');

  // 6. 한국어 이름 마스킹 (가장 마지막에 처리)
  result = result.replace(KOREAN_NAME_PATTERN, '[학생]');

  return result;
};

/**
 * 학생 이름을 별칭으로 변환 (AI Room용)
 *
 * @param names - 학생 이름 배열
 * @returns 별칭 맵 (원본 이름 → 별칭)
 */
export const createStudentAliases = (names: string[]): Map<string, string> => {
  const aliasMap = new Map<string, string>();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  names.forEach((name, index) => {
    if (index < 26) {
      aliasMap.set(name, `student_${alphabet[index]}`);
    } else {
      // 26명 초과 시 student_AA, student_AB 형식
      const first = Math.floor(index / 26) - 1;
      const second = index % 26;
      aliasMap.set(name, `student_${alphabet[first]}${alphabet[second]}`);
    }
  });

  return aliasMap;
};

/**
 * 텍스트에서 학생 이름을 별칭으로 치환
 *
 * @param text - 원본 텍스트
 * @param aliasMap - 별칭 맵
 * @returns 치환된 텍스트
 */
export const applyStudentAliases = (
  text: string,
  aliasMap: Map<string, string>
): string => {
  let result = text;

  // 긴 이름부터 먼저 치환 (부분 매칭 방지)
  const sortedNames = Array.from(aliasMap.keys()).sort(
    (a, b) => b.length - a.length
  );

  for (const name of sortedNames) {
    const alias = aliasMap.get(name);
    if (alias) {
      result = result.replace(new RegExp(name, 'g'), alias);
    }
  }

  return result;
};

/**
 * 별칭을 원본 이름으로 복원
 *
 * @param text - 별칭이 포함된 텍스트
 * @param aliasMap - 별칭 맵
 * @returns 복원된 텍스트
 */
export const restoreStudentNames = (
  text: string,
  aliasMap: Map<string, string>
): string => {
  let result = text;

  for (const [name, alias] of aliasMap.entries()) {
    result = result.replace(new RegExp(alias, 'g'), name);
  }

  return result;
};

/**
 * 전체 마스킹 (PII + 학생 별칭)
 *
 * @param text - 원본 텍스트
 * @param studentNames - 학생 이름 배열 (선택)
 * @returns 마스킹 결과
 */
export const maskAll = (
  text: string,
  studentNames?: string[]
): MaskingResult => {
  let maskedText = maskPII(text);
  let aliasMap = new Map<string, string>();

  if (studentNames && studentNames.length > 0) {
    aliasMap = createStudentAliases(studentNames);
    maskedText = applyStudentAliases(maskedText, aliasMap);
  }

  return { maskedText, aliasMap };
};

// ============================================================
// 검증 함수
// ============================================================

/**
 * 텍스트에 PII가 포함되어 있는지 검사
 *
 * @param text - 검사할 텍스트
 * @returns PII 포함 여부
 */
export const containsPII = (text: string): boolean => {
  // 각 패턴에 대해 검사
  for (const pattern of Object.values(PATTERNS)) {
    if (pattern.test(text)) {
      pattern.lastIndex = 0; // 정규식 상태 초기화
      return true;
    }
  }

  // 한국어 이름 패턴 검사
  if (KOREAN_NAME_PATTERN.test(text)) {
    KOREAN_NAME_PATTERN.lastIndex = 0;
    return true;
  }

  return false;
};

/**
 * 마스킹 전후 비교 (디버깅용)
 */
export const debugMasking = (text: string): void => {
  console.group('[PII Masking Debug]');
  console.log('원본:', text);
  console.log('마스킹:', maskPII(text));
  console.log('PII 포함 여부:', containsPII(text));
  console.groupEnd();
};

export default {
  maskPII,
  createStudentAliases,
  applyStudentAliases,
  restoreStudentNames,
  maskAll,
  containsPII,
  debugMasking,
};
