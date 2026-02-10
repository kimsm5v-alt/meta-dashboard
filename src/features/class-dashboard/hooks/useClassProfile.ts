import { useMemo } from 'react';
import type { Class } from '@/shared/types';
import { FACTOR_DEFINITIONS } from '@/shared/data/factors';
import { SUB_CATEGORY_SCRIPTS } from '@/shared/data/subCategoryScripts';

// 중분류 → 대분류 매핑
const SUB_TO_MAIN: Record<string, string> = {};
for (const f of FACTOR_DEFINITIONS) {
  if (!SUB_TO_MAIN[f.subCategory]) {
    SUB_TO_MAIN[f.subCategory] = f.category;
  }
}
import scriptsDepth2 from '@/shared/data/scripts_depth2.json';
import scriptsDepth3 from '@/shared/data/scripts_depth3.json';

// 중분류 → 소분류 매핑 (factor index 기준)
const SUB_CAT_FACTORS: Record<string, string[]> = {
  '긍정적자아': ['자아존중감', '자기효능감', '성장마인드셋'],
  '대인관계능력': ['자기정서인식', '자기정서조절', '타인정서인식', '타인공감능력'],
  '메타인지': ['계획능력', '점검능력', '조절능력'],
  '학습기술': ['공부환경', '시간관리', '수업태도', '노트하기', '시험준비'],
  '지지적관계': ['부모의사소통', '부모학업지지', '친구정서지지', '교사정서지지'],
  '학업열의': ['활기', '몰두', '의미감'],
  '성장력': ['자율성', '유능성', '관계성'],
  '학업스트레스': ['성적부담', '공부부담', '수업부담'],
  '학습방해물': ['스마트폰의존', '게임과몰입'],
  '학업관계스트레스': ['부모성적압력', '부모공부부담', '친구공부비교', '교사성적압력', '교사수업부담'],
  '학업소진': ['고갈', '무능감', '반감냉소'],
};

export interface ClassProfileItem {
  category: string;
  parentCategory: string;
  avgT: number;
  isPositive: boolean;
  categoryScript: string;
  topFactor: string;
  topFactorT: number;
  topFactorScript: string;
}

export interface ClassProfile {
  strengths: ClassProfileItem[];
  weaknesses: ClassProfileItem[];
}

/**
 * summary 매칭: depth2/depth3 JSON에서 T점수 구간에 맞는 summary를 찾음
 */
function findSummary(
  scripts: Array<{
    depth2_name?: string;
    depth3?: string;
    tScore_lower: number | null;
    tScore_upper: number;
    summary?: string;
  }>,
  name: string,
  tScore: number,
): string {
  const t = Math.round(tScore);
  const target = name.replace(/\s/g, '');
  const match = scripts.find((s) => {
    const n = (s.depth2_name || s.depth3 || '').replace(/\s/g, '');
    const low = s.tScore_lower ?? 0;
    return n === target && low <= t && t <= s.tScore_upper;
  });
  return match?.summary ?? '';
}

/**
 * 학급 특성 분석 훅
 * - 중분류 11개 단위로 학급 평균 T점수를 산출
 * - merit score로 강점 TOP 3 / 약점 TOP 3 결정
 * - 신뢰도 주의(🔴) 학생은 평균 계산에서 제외
 */
export function useClassProfile(
  classData: Class,
  round: 1 | 2 = 1,
): ClassProfile | null {
  return useMemo(() => {
    // 해당 라운드의 검사 결과가 있고, 신뢰도 경고가 없는 학생만 대상
    const validStudents = classData.students.filter((s) => {
      const assessment = s.assessments.find((a) => a.round === round);
      if (!assessment) return false;
      return assessment.reliabilityWarnings.length === 0;
    });

    if (validStudents.length === 0) return null;

    // 소분류별 학급 평균 T점수 계산
    const factorAvgs: Record<string, number> = {};
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
      factorAvgs[factor.name] = count > 0 ? sum / count : 50;
    }

    // 중분류별 학급 평균 T점수 + merit score
    const categoryData: Array<{
      category: string;
      avgT: number;
      isPositive: boolean;
      meritScore: number;
      factors: Array<{ name: string; avgT: number }>;
    }> = [];

    for (const [cat, factorNames] of Object.entries(SUB_CAT_FACTORS)) {
      const catScript = SUB_CATEGORY_SCRIPTS[cat];
      const isPositive = catScript?.isPositive ?? true;

      // 중분류 평균 = 소분류들의 학급 평균 T점수의 평균
      const factorTs = factorNames.map((fn) => factorAvgs[fn] ?? 50);
      const avgT = factorTs.reduce((a, b) => a + b, 0) / factorTs.length;

      // merit score: 정적이면 그대로, 부적이면 100 - avgT
      const meritScore = isPositive ? avgT : 100 - avgT;

      const factors = factorNames.map((fn) => ({
        name: fn,
        avgT: factorAvgs[fn] ?? 50,
      }));

      categoryData.push({ category: cat, avgT, isPositive, meritScore, factors });
    }

    // merit score 내림차순 정렬
    const sorted = [...categoryData].sort((a, b) => b.meritScore - a.meritScore);

    const strengths = sorted.slice(0, 3);
    const weaknesses = sorted.slice(-3).reverse(); // 하위 3개 (merit 오름차순)

    /**
     * 대표 소분류 선택 로직:
     * - 강점 + 정적 → T 가장 높은 소분류
     * - 강점 + 부적 → T 가장 낮은 소분류
     * - 약점 + 정적 → T 가장 낮은 소분류
     * - 약점 + 부적 → T 가장 높은 소분류
     */
    function pickTopFactor(
      item: (typeof categoryData)[0],
      type: 'strength' | 'weakness',
    ): { name: string; avgT: number } {
      const wantHighest =
        (type === 'strength' && item.isPositive) ||
        (type === 'weakness' && !item.isPositive);
      const sorted = [...item.factors].sort((a, b) =>
        wantHighest ? b.avgT - a.avgT : a.avgT - b.avgT,
      );
      return sorted[0];
    }

    function toProfileItem(
      item: (typeof categoryData)[0],
      type: 'strength' | 'weakness',
    ): ClassProfileItem {
      const top = pickTopFactor(item, type);
      return {
        category: item.category,
        parentCategory: SUB_TO_MAIN[item.category] ?? '',
        avgT: Math.round(item.avgT * 10) / 10,
        isPositive: item.isPositive,
        categoryScript: findSummary(
          scriptsDepth2.scripts as Array<{
            depth2_name?: string;
            depth3?: string;
            tScore_lower: number | null;
            tScore_upper: number;
            summary?: string;
          }>,
          SUB_CATEGORY_SCRIPTS[item.category]?.name ?? item.category,
          item.avgT,
        ),
        topFactor: top.name,
        topFactorT: Math.round(top.avgT * 10) / 10,
        topFactorScript: findSummary(
          scriptsDepth3.scripts as Array<{
            depth2_name?: string;
            depth3?: string;
            tScore_lower: number | null;
            tScore_upper: number;
            summary?: string;
          }>,
          top.name,
          top.avgT,
        ),
      };
    }

    return {
      strengths: strengths.map((s) => toProfileItem(s, 'strength')),
      weaknesses: weaknesses.map((w) => toProfileItem(w, 'weakness')),
    };
  }, [classData, round]);
}
