/**
 * T_SCRIPT 데이터 모듈
 *
 * scripts_depth3.json의 38개 변인별 레벨 스크립트를 활용합니다.
 * - 5단계 레벨: 매우 낮음, 낮음, 보통, 높음, 매우높음
 * - 각 레벨별 T점수 범위, 해석 스크립트, 요약문 포함
 */

import scriptsData from './scripts_depth3.json';
import { FACTOR_DEFINITIONS } from './factors';
import type { FactorCategory } from '../types';

// ============================================================
// 타입 정의
// ============================================================

/** 레벨 (5단계) */
export type TScoreLevel = '매우 낮음' | '낮음' | '보통' | '높음' | '매우높음';

/** 등급 (A~E, 레벨과 매핑) */
export type TScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';

/** JSON 원본 스크립트 항목 */
export interface RawScriptEntry {
  depth2: string;
  depth3: string;
  level: TScoreLevel;
  tScore_lower: number | null;
  tScore_upper: number;
  script: string;
  summary: string;
}

/** 가공된 T_SCRIPT 항목 */
export interface TScriptEntry {
  factorIndex: number;
  factorName: string;
  category: FactorCategory;
  subCategory: string;
  level: TScoreLevel;
  grade: TScoreGrade;
  isPositive: boolean;
  tScoreLower: number;
  tScoreUpper: number;
  script: string;        // 전체 해석 텍스트
  summary: string;       // 요약문
}

export interface GradeRange {
  min: number;
  max: number;
  label: string;
  level: TScoreLevel;
}

// ============================================================
// 등급/레벨 매핑
// ============================================================

/** 레벨 → 등급 매핑 (정적 요인 기준) */
const LEVEL_TO_GRADE_POSITIVE: Record<TScoreLevel, TScoreGrade> = {
  '매우높음': 'A',
  '높음': 'B',
  '보통': 'C',
  '낮음': 'D',
  '매우 낮음': 'E',
};

/** 레벨 → 등급 매핑 (부적 요인 기준: 낮을수록 좋음) */
const LEVEL_TO_GRADE_NEGATIVE: Record<TScoreLevel, TScoreGrade> = {
  '매우높음': 'E',  // 부적 요인이 매우 높음 = 나쁨 = E등급
  '높음': 'D',
  '보통': 'C',
  '낮음': 'B',
  '매우 낮음': 'A', // 부적 요인이 매우 낮음 = 좋음 = A등급
};

export const GRADE_RANGES: Record<TScoreGrade, GradeRange> = {
  A: { min: 70, max: 100, label: '매우 높음', level: '매우높음' },
  B: { min: 60, max: 69, label: '높음', level: '높음' },
  C: { min: 40, max: 59, label: '보통', level: '보통' },
  D: { min: 30, max: 39, label: '낮음', level: '낮음' },
  E: { min: 0, max: 29, label: '매우 낮음', level: '매우 낮음' },
};

// ============================================================
// 데이터 변환
// ============================================================

/** 요인명 정규화 (공백 제거) */
const normalizeName = (name: string): string => {
  return name.replace(/\s+/g, '').replace(/-/g, '');
};

/** 요인명으로 Factor 정의 찾기 */
const findFactor = (depth3: string) => {
  const normalized = normalizeName(depth3);
  return FACTOR_DEFINITIONS.find(
    (f) => normalizeName(f.name) === normalized
  );
};

/** 레벨에 따른 등급 결정 */
const getGradeFromLevel = (level: TScoreLevel, isPositive: boolean): TScoreGrade => {
  if (isPositive) {
    return LEVEL_TO_GRADE_POSITIVE[level];
  } else {
    return LEVEL_TO_GRADE_NEGATIVE[level];
  }
};

// ============================================================
// T_SCRIPT 데이터 생성
// ============================================================

const rawScripts = scriptsData.scripts as RawScriptEntry[];

export const T_SCRIPT_DATA: TScriptEntry[] = rawScripts
  .map((raw) => {
    const factor = findFactor(raw.depth3);
    if (!factor) return null;

    // depth2에서 카테고리 추출: "자아 강점>긍정적 자아>자아존중감"
    const depth2Parts = raw.depth2.split('>');
    const categoryRaw = depth2Parts[0]?.trim().replace(/\s+/g, '') || '';
    const subCategoryRaw = depth2Parts[1]?.trim().replace(/\s+/g, '') || '';

    // 카테고리 매핑
    const categoryMap: Record<string, FactorCategory> = {
      '자아강점': '자아강점',
      '학습디딤돌': '학습디딤돌',
      '학습걸림돌': '학습걸림돌',
      '긍정적공부마음': '긍정적공부마음',
      '부정적공부마음': '부정적공부마음',
    };

    const category = categoryMap[categoryRaw] || factor.category;

    return {
      factorIndex: factor.index,
      factorName: factor.name,
      category,
      subCategory: subCategoryRaw || factor.subCategory,
      level: raw.level,
      grade: getGradeFromLevel(raw.level, factor.isPositive),
      isPositive: factor.isPositive,
      tScoreLower: raw.tScore_lower ?? 0,
      tScoreUpper: raw.tScore_upper,
      script: raw.script,
      summary: raw.summary,
    };
  })
  .filter((entry): entry is TScriptEntry => entry !== null);

// ============================================================
// 빠른 조회를 위한 Map 생성
// ============================================================

// key: "factorIndex-level" (예: "0-매우높음", "25-낮음")
export const T_SCRIPT_MAP_BY_LEVEL: Map<string, TScriptEntry> = new Map(
  T_SCRIPT_DATA.map((entry) => [`${entry.factorIndex}-${entry.level}`, entry])
);

// key: "factorIndex-grade" (예: "0-A", "25-B")
export const T_SCRIPT_MAP_BY_GRADE: Map<string, TScriptEntry> = new Map(
  T_SCRIPT_DATA.map((entry) => [`${entry.factorIndex}-${entry.grade}`, entry])
);

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * T점수를 레벨로 변환
 */
export const tScoreToLevel = (score: number): TScoreLevel => {
  if (score >= 70) return '매우높음';
  if (score >= 60) return '높음';
  if (score >= 40) return '보통';
  if (score >= 30) return '낮음';
  return '매우 낮음';
};

/**
 * T점수를 등급으로 변환 (정적/부적 요인 고려 없이)
 */
export const tScoreToGrade = (score: number): TScoreGrade => {
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D';
  return 'E';
};

/**
 * 요인 인덱스 + T점수로 T_SCRIPT 조회
 */
export const getTScriptByScore = (
  factorIndex: number,
  tScore: number
): TScriptEntry | null => {
  const level = tScoreToLevel(tScore);
  const key = `${factorIndex}-${level}`;
  return T_SCRIPT_MAP_BY_LEVEL.get(key) || null;
};

/**
 * 요인 인덱스 + 등급으로 T_SCRIPT 조회
 */
export const getTScriptByGrade = (
  factorIndex: number,
  grade: TScoreGrade
): TScriptEntry | null => {
  const key = `${factorIndex}-${grade}`;
  return T_SCRIPT_MAP_BY_GRADE.get(key) || null;
};

export default T_SCRIPT_DATA;
