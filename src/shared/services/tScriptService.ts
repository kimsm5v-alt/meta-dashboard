/**
 * T_SCRIPT 서비스
 *
 * 학생의 T점수를 기반으로 해석 스크립트를 조회하고,
 * 강점/약점 요인을 분류하는 서비스입니다.
 *
 * 향후 API 연동 시 이 파일의 함수들을 수정하면 됩니다.
 */

import {
  getTScriptByScore,
  type TScriptEntry,
} from '@/shared/data/tScriptData';

// ============================================================
// 타입 정의
// ============================================================

/** 강점/약점 분류 결과 */
export interface FactorAnalysis {
  strengths: TScriptEntry[];  // 강점 요인 (정적 높음/부적 낮음)
  weaknesses: TScriptEntry[]; // 약점 요인 (정적 낮음/부적 높음)
  neutral: TScriptEntry[];    // 보통 수준 요인
}

/** 학생 T점수 분석 결과 */
export interface StudentScriptAnalysis {
  studentAlias: string;
  factorAnalysis: FactorAnalysis;
  topStrengths: TScriptEntry[];   // 상위 3개 강점
  topWeaknesses: TScriptEntry[];  // 상위 3개 약점
  allScripts: TScriptEntry[];     // 38개 전체 스크립트
}

// ============================================================
// 핵심 조회 함수
// ============================================================

/**
 * 38개 T점수 배열로 전체 T_SCRIPT 조회
 * @param tScores 38개 T점수 배열
 * @returns 38개 TScriptEntry 배열 (순서 유지)
 */
export const getTScriptsForStudent = (tScores: number[]): TScriptEntry[] => {
  return tScores
    .map((score, index) => getTScriptByScore(index, score))
    .filter((entry): entry is TScriptEntry => entry !== null);
};

/**
 * 강점 요인 추출
 * - 정적 요인: 높음/매우높음 (T점수 60 이상)
 * - 부적 요인: 낮음/매우 낮음 (T점수 39 이하)
 */
export const getStrengthScripts = (tScores: number[]): TScriptEntry[] => {
  return tScores
    .map((score, index) => {
      const script = getTScriptByScore(index, score);
      if (!script) return null;

      // 정적 요인: 높을수록 좋음
      if (script.isPositive) {
        if (score >= 60) return script;
      }
      // 부적 요인: 낮을수록 좋음
      else {
        if (score <= 39) return script;
      }
      return null;
    })
    .filter((entry): entry is TScriptEntry => entry !== null);
};

/**
 * 약점(관심 필요) 요인 추출
 * - 정적 요인: 낮음/매우 낮음 (T점수 39 이하)
 * - 부적 요인: 높음/매우높음 (T점수 60 이상)
 */
export const getWeaknessScripts = (tScores: number[]): TScriptEntry[] => {
  return tScores
    .map((score, index) => {
      const script = getTScriptByScore(index, score);
      if (!script) return null;

      // 정적 요인: 낮을수록 안좋음
      if (script.isPositive) {
        if (score <= 39) return script;
      }
      // 부적 요인: 높을수록 안좋음
      else {
        if (score >= 60) return script;
      }
      return null;
    })
    .filter((entry): entry is TScriptEntry => entry !== null);
};

/**
 * 보통 수준 요인 추출 (T점수 40~59)
 */
export const getNeutralScripts = (tScores: number[]): TScriptEntry[] => {
  return tScores
    .map((score, index) => {
      if (score >= 40 && score <= 59) {
        return getTScriptByScore(index, score);
      }
      return null;
    })
    .filter((entry): entry is TScriptEntry => entry !== null);
};

// ============================================================
// 분석 함수
// ============================================================

/**
 * 학생 T점수 종합 분석
 * @param tScores 38개 T점수 배열
 * @param studentAlias 학생 별칭 (예: "student_A")
 * @returns 강점/약점 분류 및 상위 요인
 */
export const analyzeStudentScripts = (
  tScores: number[],
  studentAlias: string = 'student'
): StudentScriptAnalysis => {
  const allScripts = getTScriptsForStudent(tScores);
  const strengths = getStrengthScripts(tScores);
  const weaknesses = getWeaknessScripts(tScores);
  const neutral = getNeutralScripts(tScores);

  // 강점 정렬: T점수 기준 (정적은 높은 순, 부적은 낮은 순)
  const sortedStrengths = [...strengths].sort((a, b) => {
    const scoreA = tScores[a.factorIndex];
    const scoreB = tScores[b.factorIndex];
    if (a.isPositive && b.isPositive) {
      return scoreB - scoreA; // 정적: 높은 순
    } else if (!a.isPositive && !b.isPositive) {
      return scoreA - scoreB; // 부적: 낮은 순
    }
    return 0;
  });

  // 약점 정렬: 심각도 기준 (정적은 낮은 순, 부적은 높은 순)
  const sortedWeaknesses = [...weaknesses].sort((a, b) => {
    const scoreA = tScores[a.factorIndex];
    const scoreB = tScores[b.factorIndex];
    if (a.isPositive && b.isPositive) {
      return scoreA - scoreB; // 정적: 낮은 순 (더 심각)
    } else if (!a.isPositive && !b.isPositive) {
      return scoreB - scoreA; // 부적: 높은 순 (더 심각)
    }
    return 0;
  });

  return {
    studentAlias,
    factorAnalysis: {
      strengths: sortedStrengths,
      weaknesses: sortedWeaknesses,
      neutral,
    },
    topStrengths: sortedStrengths.slice(0, 3),
    topWeaknesses: sortedWeaknesses.slice(0, 3),
    allScripts,
  };
};

// ============================================================
// RAG 컨텍스트 생성용 함수
// ============================================================

/**
 * 학생 분석 결과를 텍스트 컨텍스트로 변환
 * AI 프롬프트에 주입할 형식으로 변환합니다.
 */
export const formatAnalysisForRAG = (
  analysis: StudentScriptAnalysis,
  includeFullScript: boolean = false
): string => {
  const { studentAlias, topStrengths, topWeaknesses } = analysis;

  const strengthsText = topStrengths.length > 0
    ? topStrengths
        .map((s) => {
          const base = `- **${s.factorName}** (${s.category}): ${s.summary}`;
          return includeFullScript ? `${base}\n  상세: ${s.script}` : base;
        })
        .join('\n')
    : '- 특별히 두드러진 강점 영역이 없습니다.';

  const weaknessesText = topWeaknesses.length > 0
    ? topWeaknesses
        .map((s) => {
          const base = `- **${s.factorName}** (${s.category}): ${s.summary}`;
          return includeFullScript ? `${base}\n  상세: ${s.script}` : base;
        })
        .join('\n')
    : '- 특별히 관심이 필요한 영역이 없습니다.';

  return `### ${studentAlias}

#### 강점 영역
${strengthsText}

#### 관심 필요 영역
${weaknessesText}`;
};

/**
 * 여러 학생의 분석 결과를 하나의 RAG 컨텍스트로 결합
 */
export const formatMultipleStudentsForRAG = (
  analyses: StudentScriptAnalysis[],
  includeFullScript: boolean = false
): string => {
  if (analyses.length === 0) {
    return '분석할 학생 데이터가 없습니다.';
  }

  return analyses
    .map((analysis) => formatAnalysisForRAG(analysis, includeFullScript))
    .join('\n\n---\n\n');
};

// ============================================================
// 향후 API 연동 대비
// ============================================================

// 환경 변수로 API 사용 여부 결정 (향후 구현)
// const USE_API = import.meta.env.VITE_USE_TSCRIPT_API === 'true';

/**
 * 향후 API 연동 시 사용할 함수
 * 현재는 로컬 데이터를 반환합니다.
 */
export const fetchTScriptFromAPI = async (
  factorIndex: number,
  tScore: number
): Promise<TScriptEntry | null> => {
  // TODO: API 연동 시 아래 주석 해제
  // const sectionId = buildSectionId(factorIndex, tScoreToLevel(tScore));
  // const response = await fetch(`/api/tscript/${sectionId}`);
  // return response.json();

  // 현재: 로컬 데이터 반환
  return getTScriptByScore(factorIndex, tScore);
};

export default {
  getTScriptsForStudent,
  getStrengthScripts,
  getWeaknessScripts,
  getNeutralScripts,
  analyzeStudentScripts,
  formatAnalysisForRAG,
  formatMultipleStudentsForRAG,
};
