/**
 * LPA 유형 분류 서비스 — TypeScript 레퍼런스 구현
 * =================================================
 * META 학습종합검사 38개 요인 T점수 → 3유형 분류
 *
 * 사용법:
 *   import { classifyStudent } from './lpa_classifier';
 *   const params = JSON.parse(fs.readFileSync('lpa_model_params.json', 'utf-8'));
 *   const result = classifyStudent(
 *     { "자아존중감": 52.0, "자기효능감": 50.9, ... },
 *     "elementary",
 *     params
 *   );
 */

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

interface ClassifyResult {
  predictedType: string;
  probabilities: Record<string, number>;
  schoolType: string;
}

interface SchoolParams {
  means: Record<string, number[]>;
  variances: number[];
  priors: Record<string, number>;
}

interface ModelParams {
  elementary: SchoolParams;
  middle: SchoolParams;
  feature_order: string[];
  algorithm: Record<string, string>;
}

// ─── 핵심 분류 함수 ──────────────────────────────────────────────────────────

/**
 * T점수 38개(key-value)를 받아 LPA 유형 분류
 *
 * @param scoresMap - {"자아존중감": 52.0, "자기효능감": 50.9, ...} 형태의 T점수 38개
 * @param schoolType - "elementary" (초등) 또는 "middle" (중등)
 * @param params - lpa_model_params.json을 파싱한 객체
 * @returns { predictedType, probabilities, schoolType }
 */
export function classifyStudent(
  scoresMap: Record<string, number>,
  schoolType: "elementary" | "middle",
  params: ModelParams
): ClassifyResult {
  const p: SchoolParams = params[schoolType];
  const featureOrder: string[] = params.feature_order;

  // ① key-value → 배열 변환
  const scores: number[] = featureOrder.map((name) => {
    if (!(name in scoresMap)) {
      throw new Error(`누락된 요인: ${name}`);
    }
    return scoresMap[name];
  });

  const classNames = Object.keys(p.means);
  const variances: number[] = p.variances;

  // ② ~ ③ 로그 사후확률 계산
  const logPosteriors: number[] = [];

  for (const cls of classNames) {
    const means: number[] = p.means[cls];
    const prior: number = p.priors[cls];

    let logLik = 0;
    for (let i = 0; i < 38; i++) {
      const diff = scores[i] - means[i];
      logLik +=
        -0.5 *
        (diff * diff / variances[i] + Math.log(2 * Math.PI * variances[i]));
    }
    logPosteriors.push(logLik + Math.log(prior));
  }

  // ④ Log-Sum-Exp 정규화
  const maxVal = Math.max(...logPosteriors);
  const expVals = logPosteriors.map((lp) => Math.exp(lp - maxVal));
  const sumExp = expVals.reduce((a, b) => a + b, 0);
  const probs = expVals.map((ev) => ev / sumExp);

  // ⑤ 분류
  const bestIdx = probs.indexOf(Math.max(...probs));

  const probabilities: Record<string, number> = {};
  classNames.forEach((name, i) => {
    probabilities[name] = Math.round(probs[i] * 1e6) / 1e6;
  });

  return {
    predictedType: classNames[bestIdx],
    probabilities,
    schoolType,
  };
}

// ─── 사용 예시 ────────────────────────────────────────────────────────────────

/*
// Node.js 환경 사용 예시:

import * as fs from 'fs';

const params: ModelParams = JSON.parse(
  fs.readFileSync('lpa_model_params.json', 'utf-8')
);

const studentScores: Record<string, number> = {
  "자아존중감": 52, "자기효능감": 51, "성장마인드셋": 51,
  "자기정서인식": 50, "자기정서조절": 48, "타인정서인식": 49, "타인공감능력": 47,
  "계획능력": 47, "점검능력": 45, "조절능력": 48,
  "공부환경": 47, "시간관리": 46, "수업태도": 48, "노트하기": 47, "시험준비": 50,
  "부모 의사소통": 49, "부모 학업지지": 50, "친구 정서지지": 49, "교사 정서지지": 49,
  "활기": 46, "몰두": 47, "의미감": 47,
  "자율성": 47, "유능성": 50, "관계성": 51,
  "성적부담": 49, "공부부담": 51, "수업부담": 51,
  "스마트폰 의존": 50, "게임 과몰입": 49,
  "부모 성적압력": 50, "부모 공부부담": 50, "친구 공부비교": 49, "교사 성적압력": 48, "교사 수업부담": 49,
  "고갈": 51, "무능감": 48, "반감-냉소": 52,
};

const result = classifyStudent(studentScores, "elementary", params);
console.log(result);
// → { predictedType: "안전 균형형", probabilities: { ... }, schoolType: "elementary" }
*/
