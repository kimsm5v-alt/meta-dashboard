import { useMemo } from 'react';
import type {
  Class,
  Student,
  Assessment,
  AttentionReason,
  TLevel,
  FactorAvgData,
  SubCategoryData,
  DomainData,
} from '@/shared/types';
import { FACTOR_DEFINITIONS, MAIN_CATEGORIES, SUB_CATEGORY_FACTORS } from '@/shared/data/factors';
import { CATEGORY_COLORS, DOMAIN_ICONS, POSITIVE_DOMAINS } from '@/shared/data/lpaProfiles';
import { SUB_CATEGORY_SCRIPTS, getLevel } from '@/shared/data/subCategoryScripts';

// 타입 re-export (하위 호환성)
export type { TLevel, FactorAvgData, SubCategoryData, DomainData };

// ============================================================
// 타입 정의
// ============================================================

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
  /** 신뢰도 양호 학생이 0명이고 신뢰도 경고 학생만 있는 경우 true */
  reliabilityWarningOnly: boolean;
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
    const studentsWithAssessment = classData.students.filter((s) =>
      s.assessments.some((a) => a.round === round)
    );

    const validStudents = studentsWithAssessment.filter((s) => {
      const assessment = s.assessments.find((a) => a.round === round);
      return assessment!.reliabilityWarnings.length === 0;
    });

    // 신뢰도 경고 학생만 있을 경우 전체 학생 사용 (fallback)
    const effectiveStudents = validStudents.length > 0 ? validStudents : studentsWithAssessment;

    // DEBUG: 학생 데이터 확인
    if (process.env.NODE_ENV === 'development') {
      console.log('[useClassDetailData] 전체 학생:', classData.students.length);
      console.log('[useClassDetailData] 검사 완료 학생:', studentsWithAssessment.length);
      console.log('[useClassDetailData] 신뢰도 양호 학생:', validStudents.length);
      console.log('[useClassDetailData] 실제 사용 학생:', effectiveStudents.length);
      if (effectiveStudents.length > 0) {
        const sample = effectiveStudents[0].assessments.find(a => a.round === round);
        console.log('[useClassDetailData] 샘플 tScores:', sample?.tScores);
      }
    }

    // 2. 38개 요인별 학급 평균 T점수
    const factorAvgMap: Record<number, number> = {};
    for (const factor of FACTOR_DEFINITIONS) {
      let sum = 0;
      let count = 0;
      for (const student of effectiveStudents) {
        const assessment = student.assessments.find((a) => a.round === round);
        if (assessment && assessment.tScores[factor.index] != null) {
          sum += assessment.tScores[factor.index];
          count++;
        }
      }
      factorAvgMap[factor.index] = count > 0 ? Math.round(sum / count) : 50;
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
      subCategoryAvgs[subCat] = Math.round(avg);
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

    // 신뢰도 양호 학생이 0명이고 검사 완료 학생이 있는 경우
    const reliabilityWarningOnly = validStudents.length === 0 && studentsWithAssessment.length > 0;

    return {
      factorAvgs,
      subCategoryAvgs,
      domainData,
      criticalStudents,
      watchListStudents,
      validStudentCount: effectiveStudents.length,
      totalStudentCount: classData.students.length,
      reliabilityWarningOnly,
    };
  }, [classData, round]);
}
