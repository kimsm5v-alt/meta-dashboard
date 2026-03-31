import type { SchoolLevel, StudentType } from '../types';
import { LPA_PROFILE_DATA, FACTORS } from '../data/lpaProfiles';
import { FACTOR_DEFINITIONS } from '../data/factors';

interface ClassificationResult {
  schoolLevel: SchoolLevel;
  predictedType: StudentType;
  confidence: number;
  allProbabilities: Record<string, number>;
  rank: Array<{ typeName: string; probability: number }>;
}

// Step 1: 로그 우도 계산
const calculateLogLikelihood = (studentScores: number[], profileMeans: number[]): number => {
  let logLikelihood = 0;
  const variance = 100;
  const logConstant = Math.log(2 * Math.PI * variance);
  for (let i = 0; i < 38; i++) {
    const diff = studentScores[i] - profileMeans[i];
    logLikelihood += -0.5 * ((diff * diff) / variance + logConstant);
  }
  return logLikelihood;
};

// Step 2: 사전확률 반영
const applyPrior = (
  logLikelihoods: Record<string, number>,
  priors: Record<string, number>,
): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const [type, ll] of Object.entries(logLikelihoods)) {
    result[type] = ll + Math.log(priors[type]);
  }
  return result;
};

// Step 3: 정규화
const normalize = (logPosteriors: Record<string, number>): Record<string, number> => {
  const max = Math.max(...Object.values(logPosteriors));
  const expValues: Record<string, number> = {};
  for (const [type, lp] of Object.entries(logPosteriors)) {
    expValues[type] = Math.exp(lp - max);
  }
  const sum = Object.values(expValues).reduce((a, b) => a + b, 0);
  const probs: Record<string, number> = {};
  for (const [type, exp] of Object.entries(expValues)) {
    probs[type] = (exp / sum) * 100;
  }
  return probs;
};

// 메인 분류 함수
export const classifyStudent = (
  studentScores: number[],
  schoolLevel: SchoolLevel,
): ClassificationResult => {
  // 방어: studentScores 유효성 검사
  if (!studentScores || !Array.isArray(studentScores) || studentScores.length !== 38) {
    console.warn(`[classifyStudent] 유효하지 않은 T점수 배열:`, studentScores?.length);
    // 기본값 반환
    const defaultType = schoolLevel === '초등' ? '안전균형형' : '정서조절취약형';
    return {
      schoolLevel,
      predictedType: defaultType as StudentType,
      confidence: 0,
      allProbabilities: {},
      rank: [],
    };
  }

  let schoolData = LPA_PROFILE_DATA[schoolLevel];

  // 방어: 학교급 데이터가 없거나 means가 비어있으면 초등 데이터 사용
  const hasValidMeans = schoolData?.types.some((t) => t.means.length === 38);
  if (!schoolData || !hasValidMeans) {
    console.warn(
      `[classifyStudent] '${schoolLevel}' 학교급에 유효한 means 데이터 없음, 초등 데이터 사용`,
    );
    schoolData = LPA_PROFILE_DATA['초등'];
    if (!schoolData) {
      // 최후의 fallback
      const defaultType = schoolLevel === '초등' ? '안전균형형' : '정서조절취약형';
      return {
        schoolLevel,
        predictedType: defaultType as StudentType,
        confidence: 0,
        allProbabilities: {},
        rank: [],
      };
    }
  }

  const logLikelihoods: Record<string, number> = {};
  for (const profile of schoolData.types) {
    if (profile.means.length === 38) {
      logLikelihoods[profile.name] = calculateLogLikelihood(studentScores, profile.means);
    }
  }

  // 방어: 유효한 유형이 없으면 기본값 반환
  if (Object.keys(logLikelihoods).length === 0) {
    console.warn(`[classifyStudent] 유효한 LPA 유형 데이터 없음`);
    const defaultType = schoolLevel === '초등' ? '안전균형형' : '정서조절취약형';
    return {
      schoolLevel,
      predictedType: defaultType as StudentType,
      confidence: 0,
      allProbabilities: {},
      rank: [],
    };
  }

  const logPosteriors = applyPrior(logLikelihoods, schoolData.priors);
  const probabilities = normalize(logPosteriors);

  const sorted = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);

  // 방어: sorted가 비어있으면 기본값 반환
  if (sorted.length === 0) {
    console.warn(`[classifyStudent] 확률 계산 결과 없음`);
    const defaultType = schoolLevel === '초등' ? '안전균형형' : '정서조절취약형';
    return {
      schoolLevel,
      predictedType: defaultType as StudentType,
      confidence: 0,
      allProbabilities: probabilities,
      rank: [],
    };
  }

  return {
    schoolLevel,
    predictedType: sorted[0][0] as StudentType,
    confidence: Math.round(sorted[0][1] * 10) / 10,
    allProbabilities: probabilities,
    rank: sorted.map(([name, prob]) => ({
      typeName: name,
      probability: Math.round(prob * 10) / 10,
    })),
  };
};

// 유형별 특이점 추출
export const getTypeDeviations = (
  studentScores: number[],
  typeName: string,
  schoolLevel: SchoolLevel,
  topN: number = 3,
) => {
  // 방어: studentScores 유효성 검사
  if (!studentScores || !Array.isArray(studentScores) || studentScores.length !== 38) {
    console.warn(`[getTypeDeviations] 유효하지 않은 T점수 배열`);
    return [];
  }

  let schoolData = LPA_PROFILE_DATA[schoolLevel];
  let profile = schoolData?.types.find((t) => t.name === typeName);

  // 해당 유형의 means가 없으면 초등 데이터에서 가장 비슷한 유형 찾기
  if (!profile || profile.means.length !== 38) {
    // 초등 데이터로 fallback
    schoolData = LPA_PROFILE_DATA['초등'];
    if (schoolData) {
      // 첫 번째 유효한 유형 사용
      profile = schoolData.types.find((t) => t.means.length === 38);
    }
  }

  // 여전히 없으면 빈 배열 반환
  if (!profile || profile.means.length !== 38) {
    console.warn(`[getTypeDeviations] '${typeName}' 유형 데이터 없음, 빈 배열 반환`);
    return [];
  }

  const deviations = FACTORS.map((factor, i) => {
    const diff = studentScores[i] - profile!.means[i];
    const isPositive = FACTOR_DEFINITIONS[i]?.isPositive ?? true;
    // 정적요인: ↑긍정 ↓부정, 부적요인: ↑부정 ↓긍정
    const isGood = isPositive ? diff > 0 : diff < 0;
    return {
      index: i,
      factor,
      studentScore: studentScores[i],
      typeMean: Math.round(profile!.means[i] * 10) / 10,
      diff: Math.round(diff * 10) / 10,
      absDiff: Math.abs(diff),
      direction: (isGood ? 'positive' : 'negative') as 'positive' | 'negative',
    };
  });

  return deviations.sort((a, b) => b.absDiff - a.absDiff).slice(0, topN);
};

// 유형 정보 조회
export const getTypeInfo = (typeName: string, schoolLevel: SchoolLevel) => {
  const schoolData = LPA_PROFILE_DATA[schoolLevel];
  return schoolData?.types.find((t) => t.name === typeName);
};

export default { classifyStudent, getTypeDeviations, getTypeInfo };
