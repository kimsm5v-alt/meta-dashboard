import { useMemo } from 'react';
import type { Class, Student, Assessment, AttentionReason, FactorCategory } from '@/shared/types';
import { FACTOR_DEFINITIONS, MAIN_CATEGORIES, SUB_CATEGORY_FACTORS } from '@/shared/data/factors';
import { CATEGORY_COLORS, DOMAIN_ICONS, POSITIVE_DOMAINS } from '@/shared/data/lpaProfiles';
import { SUB_CATEGORY_SCRIPTS, getLevel } from '@/shared/data/subCategoryScripts';

// ============================================================
// 타입 정의
// ============================================================

export type TLevel = '매우낮음' | '낮음' | '보통' | '높음' | '매우높음';

export interface FactorAvgData {
  index: number;
  name: string;
  category: FactorCategory;
  subCategory: string;
  isPositive: boolean;
  avgTScore: number;
  level: TLevel;
}

export interface SubCategoryData {
  name: string;
  displayName: string;
  isPositive: boolean;
  avgTScore: number;
  level: TLevel;
  color: string;
  factors: FactorAvgData[];
}

export interface DomainData {
  category: FactorCategory;
  icon: string;
  isPositive: boolean;
  subCategories: SubCategoryData[];
}

export interface RiskStudent {
  student: Student;
  assessment: Assessment;
  reasons: AttentionReason[];
  severeFactors: { name: string; score: number; isPositive: boolean }[];
}

export interface ClassDetailData {
  factorAvgs: FactorAvgData[];
  subCategoryAvgs: Record<string, number>;
  domainData: DomainData[];
  criticalStudents: RiskStudent[];
  watchListStudents: RiskStudent[];
  validStudentCount: number;
  totalStudentCount: number;
}

// ============================================================
// Hook
// ============================================================

export function useClassDetailData(
  classData: Class,
  round: 1 | 2 = 1,
): ClassDetailData {
  return useMemo(() => {
    // 1. 유효 학생 필터 (해당 차수 검사 있고, 신뢰도 경고 없는 학생)
    const validStudents = classData.students.filter((s) => {
      const assessment = s.assessments.find((a) => a.round === round);
      if (!assessment) return false;
      return assessment.reliabilityWarnings.length === 0;
    });

    // 2. 38개 요인별 학급 평균 T점수
    const factorAvgMap: Record<number, number> = {};
    for (const factor of FACTOR_DEFINITIONS) {
      let sum = 0;
      let count = 0;
      for (const student of validStudents) {
        const assessment = student.assessments.find((a) => a.round === round);
        if (assessment && assessment.tScores[factor.index] != null) {
          sum += assessment.tScores[factor.index];
          count++;
        }
      }
      factorAvgMap[factor.index] = count > 0 ? Math.round((sum / count) * 10) / 10 : 50;
    }

    const factorAvgs: FactorAvgData[] = FACTOR_DEFINITIONS.map((f) => ({
      index: f.index,
      name: f.name,
      category: f.category,
      subCategory: f.subCategory,
      isPositive: f.isPositive,
      avgTScore: factorAvgMap[f.index],
      level: getLevel(factorAvgMap[f.index]),
    }));

    // 3. 11개 중분류 평균
    const subCategoryAvgs: Record<string, number> = {};
    for (const [subCat, indices] of Object.entries(SUB_CATEGORY_FACTORS)) {
      const scores = indices.map((i) => factorAvgMap[i]);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      subCategoryAvgs[subCat] = Math.round(avg * 10) / 10;
    }

    // 4. 5대분류 → 11중분류 → 38소분류 계층 구조
    const domainData: DomainData[] = MAIN_CATEGORIES.map((cat) => {
      const domainFactors = factorAvgs.filter((f) => f.category === cat);
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

    // 5. 관심 필요 학생 분류 (모든 학생 대상)
    const criticalStudents: RiskStudent[] = [];
    const watchListStudents: RiskStudent[] = [];

    for (const student of classData.students) {
      const assessment = student.assessments.find((a) => a.round === round);
      if (!assessment) continue;

      const { attentionResult } = assessment;
      if (!attentionResult.needsAttention) continue;

      // 극단 점수 요인 (부적 T≥70 또는 정적 T≤29)
      const severeFactors: RiskStudent['severeFactors'] = [];
      for (const factor of FACTOR_DEFINITIONS) {
        const score = assessment.tScores[factor.index];
        if (!factor.isPositive && score >= 70) {
          severeFactors.push({ name: factor.name, score, isPositive: false });
        } else if (factor.isPositive && score <= 29) {
          severeFactors.push({ name: factor.name, score, isPositive: true });
        }
      }

      const riskStudent: RiskStudent = {
        student,
        assessment,
        reasons: attentionResult.reasons,
        severeFactors,
      };

      if (attentionResult.reasons.length >= 2 || severeFactors.length > 0) {
        criticalStudents.push(riskStudent);
      } else {
        watchListStudents.push(riskStudent);
      }
    }

    // 심각도 순 정렬 (reasons 많은 순 → severeFactors 많은 순)
    criticalStudents.sort(
      (a, b) =>
        b.reasons.length - a.reasons.length ||
        b.severeFactors.length - a.severeFactors.length,
    );

    return {
      factorAvgs,
      subCategoryAvgs,
      domainData,
      criticalStudents,
      watchListStudents,
      validStudentCount: validStudents.length,
      totalStudentCount: classData.students.length,
    };
  }, [classData, round]);
}
