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

// 일반 한국어 단어 중 이름 패턴에 오탐되는 단어 제외 목록
const COMMON_WORD_EXCLUSIONS = new Set([
  // 유(성씨) 시작
  '유형', '유지', '유사', '유의', '유도', '유발', '유연', '유용', '유리', '유대',
  // 성(성씨) 시작
  '성장', '성취', '성과', '성찰', '성격', '성향', '성적', '성공', '성숙', '성실',
  // 강(성씨) 시작
  '강점', '강화', '강조', '강한', '강의', '강도',
  // 정(성씨) 시작
  '정서', '정리', '정보', '정도', '정상', '정의', '정확', '정적', '정말', '정해',
  // 조(성씨) 시작
  '조절', '조언', '조건', '조성', '조치', '조합',
  // 진(성씨) 시작
  '진단', '진행', '진로', '진정', '진지', '진전',
  // 지(성씨) 시작
  '지도', '지원', '지속', '지표', '지적', '지향', '지지', '지식', '지금', '지나',
  // 안(성씨) 시작
  '안정', '안내', '안전', '안심',
  // 심(성씨) 시작
  '심리', '심화', '심각', '심층',
  // 전(성씨) 시작
  '전반', '전략', '전체', '전문', '전환', '전달',
  // 고(성씨) 시작
  '고유', '고려', '고민', '고등',
  // 현(성씨) 시작
  '현재', '현황', '현상',
  // 구(성씨) 시작
  '구체', '구성', '구조', '구분',
  // 주(성씨) 시작
  '주의', '주요', '주도', '주변', '주관',
  // 문(성씨) 시작
  '문제', '문장', '문항',
  // 방(성씨) 시작
  '방법', '방향', '방지', '방해',
  // 차(성씨) 시작
  '차이', '차수',
  // 원(성씨) 시작
  '원인', '원만',
  // 공(성씨) 시작
  '공부', '공감', '공동',
  // 하(성씨) 시작
  '하위', '하지', '하나', '하면',
  // 민(성씨) 시작
  '민감',
  // 나(성씨) 시작
  '나타', '나은',
  // 임(성씨) 시작
  '임상',
  // 배(성씨) 시작
  '배려', '배움',
  // 남(성씨) 시작
  '남은',
  // 우(성씨) 시작
  '우수', '우선',
  // 장(성씨) 시작
  '장기', '장점', '장애',
  // 한(성씨) 시작
  '한줄',
  // 노(성씨) 시작
  '노력',
  // 송(성씨) 시작
  '송출',
  // 권(성씨) 시작
  '권장',
]);

// 이름 패턴: 앞에 한글이 없는 위치에서 성 + 이름 (2~3글자), 뒤에 한글 없음
// lookbehind로 복합어 내부 매칭 방지
const KOREAN_NAME_PATTERN = new RegExp(
  `(?<![가-힣])(${KOREAN_SURNAMES.join('|')}[가-힣]{1,2})(?![가-힣])`,
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

  // 6. 한국어 이름 마스킹 (가장 마지막에 처리, 일반 단어 제외)
  result = result.replace(KOREAN_NAME_PATTERN, (match) =>
    COMMON_WORD_EXCLUSIONS.has(match) ? match : '[학생]'
  );

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

export default {
  maskPII,
  createStudentAliases,
  applyStudentAliases,
  restoreStudentNames,
  maskAll,
  containsPII,
};
