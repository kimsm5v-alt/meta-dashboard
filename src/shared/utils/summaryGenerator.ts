/**
 * 학생 총평 생성 유틸리티
 *
 * 38개 요인 T점수를 기반으로 AI 3줄 총평을 생성합니다.
 *
 * 처리 흐름:
 * 1. 38개 요인 T점수 → 11개 중분류 평균 계산
 * 2. 11개 중분류 각각 → 해당 레벨의 스크립트 매칭 (규칙 기반)
 * 3. 11개 스크립트 + 시스템 프롬프트 → AI 3줄 요약 요청
 *
 * 프롬프트 관리: aiPrompts.ts에서 SYSTEM_PROMPT_ANALYSIS 사용
 */

import { FACTOR_CATEGORIES } from '../data/lpaProfiles';
import { SUB_CATEGORY_SCRIPTS, getScript, getLevel } from '../data/subCategoryScripts';
import { SYSTEM_PROMPT_ANALYSIS } from '../data/aiPrompts';
import { callAI } from '../services/ai';

// ============================================================
// 타입 정의
// ============================================================

export interface SubCategoryResult {
  name: string;           // 중분류명
  displayName: string;    // 표시용 이름
  avgTScore: number;      // 평균 T점수
  level: string;          // 레벨 (매우낮음~매우높음)
  script: string;         // 해당 레벨 스크립트
  isPositive: boolean;    // 긍정/부정 요인
  isAlert: boolean;       // 주의 필요 여부
}

export interface SummaryResult {
  subCategories: SubCategoryResult[];
  aiSummary: string;
  strengths: SubCategoryResult[];
  weaknesses: SubCategoryResult[];
  alerts: SubCategoryResult[];
}

// ============================================================
// 중분류명 매핑
// ============================================================

const SUB_CATEGORY_MAP: Record<string, string> = {
  '긍정적자아': '긍정적자아',
  '대인관계능력': '대인관계능력',
  '메타인지': '메타인지',
  '학습기술': '학습기술',
  '지지적관계': '지지적관계',
  '학업열의': '학업열의',
  '성장력': '성장력',
  '학업스트레스': '학업스트레스',
  '학습방해물': '학습방해물',
  '학업관계스트레스': '학업관계스트레스',
  '학업소진': '학업소진',
};

// ============================================================
// Step 1: 38개 요인 → 11개 중분류 평균 계산
// ============================================================

export const calculateSubCategoryScores = (tScores: number[]): Record<string, number> => {
  const result: Record<string, number> = {};

  for (const [subCategory, indices] of Object.entries(FACTOR_CATEGORIES)) {
    const scores = Array.from(indices).map(i => tScores[i]);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    result[subCategory] = Math.round(avg);
  }

  return result;
};

// ============================================================
// Step 2: 11개 중분류 각각 → 스크립트 매칭
// ============================================================

export const getSubCategoryResults = (tScores: number[]): SubCategoryResult[] => {
  const avgScores = calculateSubCategoryScores(tScores);
  const results: SubCategoryResult[] = [];

  for (const [subCategory, avgTScore] of Object.entries(avgScores)) {
    const scriptKey = SUB_CATEGORY_MAP[subCategory];
    const scriptData = SUB_CATEGORY_SCRIPTS[scriptKey];

    if (!scriptData) continue;

    const level = getLevel(avgTScore);
    const script = getScript(scriptKey, avgTScore);

    // 주의 필요 여부: 긍정 요인이 낮거나, 부정 요인이 높으면 주의
    const isAlert = scriptData.isPositive
      ? (level === '매우낮음' || level === '낮음')
      : (level === '높음' || level === '매우높음');

    results.push({
      name: subCategory,
      displayName: scriptData.name,
      avgTScore,
      level,
      script,
      isPositive: scriptData.isPositive,
      isAlert,
    });
  }

  return results;
};

// ============================================================
// Step 3: AI 3줄 총평 생성
// ============================================================

/**
 * 11개 중분류 스크립트를 AI로 3줄 요약
 *
 * 프롬프트: aiPrompts.ts의 SYSTEM_PROMPT_ANALYSIS 사용
 * 출력: 3문장이 자연스럽게 연결된 하나의 문단 (줄바꿈 없음)
 */
export const generateAISummary = async (
  subCategoryResults: SubCategoryResult[],
  _studentType: string
): Promise<string> => {
  // 사용자 프롬프트 구성 (명세 형식)
  const lines = subCategoryResults.map(r => {
    const direction = r.isPositive ? '정적' : '부적';
    return `- ${r.displayName}(${direction}): T=${r.avgTScore.toFixed(0)} → ${r.script}`;
  });

  const userPrompt = `아래는 학생의 학습심리검사 중분류 11개 결과입니다.

${lines.join('\n')}

위 결과를 바탕으로 3줄 총평을 작성해 주세요.`;

  // AI 호출 (시스템 프롬프트는 aiPrompts.ts에서 관리)
  const response = await callAI({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_ANALYSIS },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3, // 일관성 있는 출력
  });

  // 응답 파싱 (줄바꿈이 있으면 공백으로 합치기)
  return parseAISummary(response.content);
};

/**
 * AI 응답 파싱 (온점 기준 줄바꿈)
 */
const parseAISummary = (raw: string): string => {
  // 먼저 줄바꿈 제거하여 하나로 합침
  const merged = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join(' ');

  // 온점 기준으로 줄바꿈 추가 (마지막 온점 제외)
  return merged
    .replace(/\.\s*/g, '.\n')
    .trim();
};

// ============================================================
// 통합 함수
// ============================================================

/**
 * 전체 총평 생성 (중분류 결과 + AI 요약)
 */
export const generateSummary = async (
  tScores: number[],
  studentType: string
): Promise<SummaryResult> => {
  const subCategories = getSubCategoryResults(tScores);

  const strengths = subCategories.filter(r => {
    if (r.isPositive) return r.level === '높음' || r.level === '매우높음';
    return r.level === '매우낮음' || r.level === '낮음';
  });

  const weaknesses = subCategories.filter(r => {
    if (r.isPositive) return r.level === '매우낮음' || r.level === '낮음';
    return r.level === '높음' || r.level === '매우높음';
  });

  const alerts = subCategories.filter(r => r.isAlert);
  const aiSummary = await generateAISummary(subCategories, studentType);

  return { subCategories, aiSummary, strengths, weaknesses, alerts };
};

/**
 * 스크립트만 반환 (AI 호출 없이)
 */
export const getSubCategoryScriptsOnly = (tScores: number[]): SubCategoryResult[] => {
  return getSubCategoryResults(tScores);
};

export default {
  calculateSubCategoryScores,
  getSubCategoryResults,
  generateAISummary,
  generateSummary,
  getSubCategoryScriptsOnly,
};
