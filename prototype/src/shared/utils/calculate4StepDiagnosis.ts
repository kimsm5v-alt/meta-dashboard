/**
 * 4단계 해석 가이드 계산
 *
 * 38개 T점수를 4단계로 구조화하여 해석:
 * Step 1: 공부 마음 (긍정적/부정적 공부마음)
 * Step 2: 공부 자원 (개인/환경/방해 자원)
 * Step 3: 공부 기술 (학습 재설계/마음 재설계)
 * Step 4: 학습 유형 (사분면 + 8유형)
 */

import { SUB_CATEGORY_FACTORS } from '@/shared/data/factors';

// ============================================================
// 메인 함수
// ============================================================

/**
 * 4단계 해석 가이드 계산
 * @param tScores - Assessment.tScores (number[38])
 */
export function calculate4StepDiagnosis(tScores: number[]) {
  const mid = calculateMidCategories(tScores);

  const step1 = calculateStep1(mid);
  const step2 = calculateStep2(mid);
  const step3 = calculateStep3(tScores, mid);
  const step4 = calculateStep4(step1, step2, step3);

  return { step1, step2, step3, step4 };
}

// ============================================================
// 중분류 계산
// ============================================================

/**
 * SUB_CATEGORY_FACTORS 활용하여 중분류 T점수 평균 계산
 */
function calculateMidCategories(tScores: number[]) {
  const calcAverage = (indices: number[]) => {
    const sum = indices.reduce((acc, idx) => acc + tScores[idx], 0);
    return sum / indices.length;
  };

  return {
    긍정적자아: calcAverage(SUB_CATEGORY_FACTORS['긍정적자아']),
    대인관계능력: calcAverage(SUB_CATEGORY_FACTORS['대인관계능력']),
    메타인지: calcAverage(SUB_CATEGORY_FACTORS['메타인지']),
    학습기술: calcAverage(SUB_CATEGORY_FACTORS['학습기술']),
    지지적관계: calcAverage(SUB_CATEGORY_FACTORS['지지적관계']),
    학업열의: calcAverage(SUB_CATEGORY_FACTORS['학업열의']),
    성장력: calcAverage(SUB_CATEGORY_FACTORS['성장력']),
    학업스트레스: calcAverage(SUB_CATEGORY_FACTORS['학업스트레스']),
    학습방해물: calcAverage(SUB_CATEGORY_FACTORS['학습방해물']),
    학업관계스트레스: calcAverage(SUB_CATEGORY_FACTORS['학업관계스트레스']),
    학업소진: calcAverage(SUB_CATEGORY_FACTORS['학업소진']),
  };
}

// ============================================================
// Step 1: 공부 마음
// ============================================================

function calculateStep1(mid: ReturnType<typeof calculateMidCategories>) {
  const 긍정적공부마음 = (mid.학업열의 + mid.성장력) / 2;
  const 부정적공부마음 = 100 - mid.학업소진;
  const 총점 = (긍정적공부마음 + 부정적공부마음) / 2;

  return {
    긍정: {
      학업열의: mid.학업열의,
      성장력: mid.성장력,
      종합: 긍정적공부마음,
    },
    부정: {
      학업소진: mid.학업소진,
      종합: 부정적공부마음,
    },
    총점,
    레벨: getLevel(총점),
  };
}

// ============================================================
// Step 2: 공부 자원
// ============================================================

function calculateStep2(mid: ReturnType<typeof calculateMidCategories>) {
  const 개인자원 = (mid.긍정적자아 + mid.대인관계능력) / 2;
  const 환경자원 = mid.지지적관계;
  const 자원방해 =
    (100 - mid.학업스트레스 + (100 - mid.학습방해물) + (100 - mid.학업관계스트레스)) / 3;
  const 총점 = (개인자원 + 환경자원 + 자원방해) / 3;

  return {
    개인: {
      긍정적자아: mid.긍정적자아,
      대인관계능력: mid.대인관계능력,
      종합: 개인자원,
    },
    환경: {
      지지적관계: mid.지지적관계,
      종합: 환경자원,
    },
    방해: {
      학업스트레스: mid.학업스트레스,
      학습방해물: mid.학습방해물,
      학업관계스트레스: mid.학업관계스트레스,
      종합: 자원방해,
    },
    총점,
    레벨: getLevel(총점),
  };
}

// ============================================================
// Step 3: 공부 기술
// ============================================================

function calculateStep3(
  tScores: number[],
  mid: ReturnType<typeof calculateMidCategories>
) {
  const 학습재설계 = (mid.메타인지 + mid.학습기술) / 2;

  // 자기정서조절은 소분류 직접 사용 (인덱스 4번)
  const 자기정서조절 = tScores[4];
  const 마음재설계 = 자기정서조절;

  const 총점 = (학습재설계 + 마음재설계) / 2;

  return {
    학습: {
      메타인지: mid.메타인지,
      학습기술: mid.학습기술,
      종합: 학습재설계,
    },
    마음: {
      자기정서조절,
      종합: 마음재설계,
    },
    총점,
    레벨: getLevel(총점),
  };
}

// ============================================================
// Step 4: 학습 유형
// ============================================================

const 유형명Map: Record<string, string> = {
  '1-1': '최상위 성취형',
  '1-2': '잠재력 발현형',
  '2-1': '자기극복형',
  '2-2': '의지 의존형',
  '3-1': '기술 의지형',
  '3-2': '전면 지원형',
  '4-1': '동기 회복형',
  '4-2': '잠재 재발견형',
};

const 코칭전략Map: Record<string, string[]> = {
  '1-1': [
    '학습 상위 목표 설정',
    '과도한 기대, 압박 조심',
    '진로 목표 & 미래역량개발',
  ],
  '1-2': [
    '\'습\' 중심의 공부 습관 형성 필요',
    '선호 과목과 성적 확인(인지능력)',
    '가정에서 학습지도 파악',
  ],
  '2-1': [
    '단계적 효능감 강화 전략',
    '활용 및 대처자원 탐색 & 강화',
    '스트레스 대처능력 강화',
  ],
  '2-2': [
    '강점 기술을 약점 기술에 적용',
    '활용 및 대처 자원 탐색 & 강화',
    '학습 지속 기간 확인 후 지지',
  ],
  '3-1': [
    '공부 낙심 사건 탐색 & 재해석',
    '공부 이유 탐색과 적용',
    '활용 및 대처 자원 탐색 & 적용',
    '단계적 공부 자원 강화 전략',
  ],
  '3-2': [
    '공부마음→ 공부기술 단계적 향상 코칭',
    '활용 및 대처 자원 탐색 & 적용',
    '자율성 회복과 강화',
  ],
  '4-1': [
    '공부 낙심 사건 탐색 & 재해석',
    '공부 이유 탐색과 적용',
    '단계적 공부마음 향상 전략',
  ],
  '4-2': [
    '공부 마음→ 공부 기술 단계적 향상 코칭',
    '공부 경험 & 공부 흥미 탐색',
    '과보호 여부, 양육 태도 탐색',
  ],
};

function calculateStep4(
  step1: ReturnType<typeof calculateStep1>,
  step2: ReturnType<typeof calculateStep2>,
  step3: ReturnType<typeof calculateStep3>
) {
  const 공부마음 = step1.총점;
  const 공부자원 = step2.총점;
  const 공부기술 = step3.총점;

  const mindHigh = 공부마음 >= 50;
  const resourceHigh = 공부자원 >= 50;
  const skillHigh = 공부기술 >= 50;

  let 사분면: 1 | 2 | 3 | 4;
  if (mindHigh && resourceHigh) 사분면 = 1;
  else if (mindHigh && !resourceHigh) 사분면 = 2;
  else if (!mindHigh && !resourceHigh) 사분면 = 3;
  else 사분면 = 4;

  const 유형코드 = `${사분면}-${skillHigh ? 1 : 2}`;

  return {
    공부마음,
    공부자원,
    공부기술,
    사분면,
    유형코드,
    유형명: 유형명Map[유형코드] || '미분류',
    코칭전략: 코칭전략Map[유형코드] || [],
  };
}

// ============================================================
// 유틸리티
// ============================================================

export function getLevel(score: number): Level {
  if (score >= 70) return '매우높음';
  if (score >= 60) return '높음';
  if (score >= 40) return '보통';
  if (score >= 30) return '낮음';
  return '매우낮음';
}

// ============================================================
// 타입 export
// ============================================================

export type Level = '매우높음' | '높음' | '보통' | '낮음' | '매우낮음';
export type FourStepDiagnosis = ReturnType<typeof calculate4StepDiagnosis>;
export type Step1Result = ReturnType<typeof calculateStep1>;
export type Step2Result = ReturnType<typeof calculateStep2>;
export type Step3Result = ReturnType<typeof calculateStep3>;
export type Step4Result = ReturnType<typeof calculateStep4>;
