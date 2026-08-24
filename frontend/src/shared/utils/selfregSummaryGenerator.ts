/**
 * 자기조절학습검사 AI 총평 생성 유틸
 *
 * summaryGenerator.ts(학습종합검사 11개 중분류 전용)와 별개 — 자기조절학습검사는
 * 6개 중분류(3대 전략)에 부적 요인이 없는 완전히 다른 구조라 프롬프트를 공유할 수 없다.
 * callAI 호출/캐싱 패턴만 동일하게 유지한다.
 */
import { SELFREG_SUB_CATEGORY_FACTORS, SELFREG_DOMAIN_STRUCTURE } from '../data/selfregFactors';
import { SYSTEM_PROMPT_SELFREG_ANALYSIS } from '../data/aiPrompts';
import { callAI } from '../services/ai';

const SUMMARY_CACHE_PREFIX = 'ai_summary_selfreg_v1_';

const getLevel = (t: number): string => {
  if (t >= 70) return '매우높음';
  if (t >= 60) return '높음';
  if (t >= 40) return '보통';
  if (t >= 30) return '낮음';
  return '매우낮음';
};

/** 20개 요인 T점수 → 6개 중분류 평균 (모두 정적 요인) */
export const getSelfregSubCategoryAverages = (
  tScores: number[],
): { name: string; avgTScore: number; level: string }[] => {
  return Object.entries(SELFREG_SUB_CATEGORY_FACTORS).map(([name, indices]) => {
    const avg = indices.reduce((sum, i) => sum + (tScores[i] ?? 50), 0) / indices.length;
    const avgTScore = Math.round(avg);
    return { name, avgTScore, level: getLevel(avgTScore) };
  });
};

const getSummaryCacheKey = (subCategories: { name: string; avgTScore: number }[]): string => {
  const scores = subCategories.map((r) => `${r.name}:${r.avgTScore}`).join(',');
  return SUMMARY_CACHE_PREFIX + btoa(encodeURIComponent(scores));
};

const parseAISummary = (raw: string): string => {
  const merged = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join(' ');
  return merged.replace(/\.\s*/g, '.\n').trim();
};

/** 20개 요인 T점수를 AI로 3줄 요약(자기조절학습검사 전용) */
export const generateSelfregAISummary = async (tScores: number[]): Promise<string> => {
  const subCategories = getSelfregSubCategoryAverages(tScores);

  const cacheKey = getSummaryCacheKey(subCategories);
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;

  const domainLines = SELFREG_DOMAIN_STRUCTURE.map((domain) => {
    const subs = domain.subCategories
      .map((sub) => {
        const found = subCategories.find((r) => r.name === sub.name);
        return found ? `${sub.name}(T=${found.avgTScore}, ${found.level})` : sub.name;
      })
      .join(', ');
    return `- ${domain.name}: ${subs}`;
  });

  const userPrompt = `아래는 학생의 자기조절학습검사 6개 중분류(3대 전략) 결과입니다.

${domainLines.join('\n')}

위 결과를 바탕으로 3줄 총평을 작성해 주세요.`;

  const response = await callAI({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_SELFREG_ANALYSIS },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
  });

  const result = parseAISummary(response.content);

  if (response.success) {
    try {
      sessionStorage.setItem(cacheKey, result);
    } catch {
      // storage quota 초과 등 무시
    }
  }

  return result;
};
