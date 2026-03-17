import { FACTOR_DEFINITIONS, MAIN_CATEGORIES, SUB_CATEGORY_FACTORS } from '@/shared/data/factors';
import { CATEGORY_COLORS, DOMAIN_ICONS, POSITIVE_DOMAINS } from '@/shared/data/lpaProfiles';
import { SUB_CATEGORY_SCRIPTS, getLevel } from '@/shared/data/subCategoryScripts';
import type { DomainData, FactorAvgData, SubCategoryData } from '@/features/class-dashboard/hooks/useClassDetailData';

/**
 * 단일 학생의 tScores(38개)를 DomainData[] 계층 구조로 변환
 * useClassDetailData의 domainData 생성 로직과 동일한 구조
 */
export function buildStudentDomainData(tScores: number[]): DomainData[] {
  const factorData: FactorAvgData[] = FACTOR_DEFINITIONS.map((f) => ({
    index: f.index,
    name: f.name,
    category: f.category,
    subCategory: f.subCategory,
    isPositive: f.isPositive,
    avgTScore: tScores[f.index] ?? 50,
    level: getLevel(tScores[f.index] ?? 50),
  }));

  const subCategoryAvgs: Record<string, number> = {};
  for (const [subCat, indices] of Object.entries(SUB_CATEGORY_FACTORS)) {
    const scores = indices.map((i) => tScores[i] ?? 50);
    subCategoryAvgs[subCat] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  return MAIN_CATEGORIES.map((cat) => {
    const domainFactors = factorData.filter((f) => f.category === cat);
    const subCatNames = [...new Set(domainFactors.map((f) => f.subCategory))];

    const subCategories: SubCategoryData[] = subCatNames.map((subCat) => {
      const scriptData = SUB_CATEGORY_SCRIPTS[subCat];
      return {
        name: subCat,
        displayName: scriptData?.name ?? subCat,
        isPositive: scriptData?.isPositive ?? true,
        avgTScore: subCategoryAvgs[subCat] ?? 50,
        level: getLevel(subCategoryAvgs[subCat] ?? 50),
        color: CATEGORY_COLORS[subCat] ?? '#9CA3AF',
        factors: domainFactors.filter((f) => f.subCategory === subCat),
      };
    });

    return {
      category: cat,
      icon: DOMAIN_ICONS[cat] ?? '📊',
      isPositive: POSITIVE_DOMAINS.has(cat),
      subCategories,
    };
  });
}
