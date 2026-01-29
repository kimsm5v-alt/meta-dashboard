/**
 * 학생 총평 생성 유틸리티
 * 
 * 로직:
 * 1. 38개 요인 T점수 → 11개 중분류 평균 계산
 * 2. 11개 중분류 각각 → 해당 레벨의 스크립트 매칭 (규칙 기반)
 * 3. 11개 스크립트 → AI에게 3줄 요약 요청
 */

import { FACTOR_CATEGORIES } from '../data/lpaProfiles';
import { SUB_CATEGORY_SCRIPTS, getScript, getLevel } from '../data/subCategoryScripts';
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
  subCategories: SubCategoryResult[];  // 11개 중분류 결과
  aiSummary: string;                   // AI 3줄 총평
  strengths: SubCategoryResult[];      // 강점 영역
  weaknesses: SubCategoryResult[];     // 약점 영역
  alerts: SubCategoryResult[];         // 주의 필요 영역
}

// ============================================================
// 중분류명 매핑 (FACTOR_CATEGORIES 키 → SUB_CATEGORY_SCRIPTS 키)
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
    result[subCategory] = Math.round(avg * 10) / 10;
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
    
    // 주의 필요 여부 판단
    // - 긍정 요인: 매우낮음, 낮음이면 주의
    // - 부정 요인: 높음, 매우높음이면 주의
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

export const generateAISummary = async (
  subCategoryResults: SubCategoryResult[],
  studentType: string
): Promise<string> => {
  // 프롬프트 구성
  const scriptsText = subCategoryResults
    .map(r => `[${r.displayName}] (T=${r.avgTScore}, ${r.level})\n${r.script}`)
    .join('\n\n');
  
  const systemPrompt = `당신은 학습심리정서검사 결과를 해석하는 교육 전문가입니다.
학생의 검사 결과를 교사가 이해하기 쉽게 요약해주세요.

규칙:
1. 반드시 3문장으로 작성
2. 강점과 약점을 균형 있게 언급
3. 가장 주목해야 할 영역 강조
4. 교사가 바로 이해할 수 있는 쉬운 표현 사용
5. 학생 이름은 언급하지 않음`;

  const userPrompt = `이 학생의 LPA 유형은 "${studentType}"입니다.

11개 영역별 검사 결과:
${scriptsText}

위 내용을 바탕으로 이 학생의 학습심리정서 상태를 3줄로 요약해주세요.`;

  const response = await callAI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    maxTokens: 500,
    temperature: 0.7,
  });
  
  return response.content;
};

// ============================================================
// 통합 함수: 전체 총평 생성
// ============================================================

export const generateSummary = async (
  tScores: number[],
  studentType: string
): Promise<SummaryResult> => {
  // 1. 11개 중분류 결과 계산
  const subCategories = getSubCategoryResults(tScores);
  
  // 2. 강점/약점/주의 영역 분류
  const strengths = subCategories.filter(r => {
    if (r.isPositive) return r.level === '높음' || r.level === '매우높음';
    return r.level === '매우낮음' || r.level === '낮음';
  });
  
  const weaknesses = subCategories.filter(r => {
    if (r.isPositive) return r.level === '매우낮음' || r.level === '낮음';
    return r.level === '높음' || r.level === '매우높음';
  });
  
  const alerts = subCategories.filter(r => r.isAlert);
  
  // 3. AI 3줄 총평 생성
  const aiSummary = await generateAISummary(subCategories, studentType);
  
  return {
    subCategories,
    aiSummary,
    strengths,
    weaknesses,
    alerts,
  };
};

// ============================================================
// 간단 버전: 스크립트만 (AI 호출 없이)
// ============================================================

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
