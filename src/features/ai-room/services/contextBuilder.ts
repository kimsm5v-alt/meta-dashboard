/**
 * AI Room 컨텍스트 빌더
 *
 * 모드별(전체/반별/개별)로 AI 프롬프트에 주입할 RAG 컨텍스트를 생성합니다.
 * 소분류(38개 요인) 기준으로 학생별 강점/약점 분석 결과를 포함합니다.
 */

import type { Class, Student, Assessment } from '@/shared/types';
import type { ContextMode, StudentAliasMap } from '../types';
import { FACTOR_DEFINITIONS } from '@/shared/data/factors';

// ============================================================
// 타입 정의
// ============================================================

export interface BuildContextOptions {
  mode: ContextMode;
  classes: Class[];
  selectedClass: Class | null;
  selectedStudents: Student[];
  aliasMap?: StudentAliasMap;
}

export interface ContextBuildResult {
  context: string;
  aliasMap: StudentAliasMap;
}

/** 소분류 강점/약점 분석 결과 */
interface FactorScoreItem {
  name: string;           // 소분류 요인명 (예: "자아존중감")
  subCategory: string;    // 중분류 (예: "긍정적자아")
  category: string;       // 대분류 (예: "자아강점")
  tScore: number;         // T점수
  normalizedScore: number; // 정규화 점수 (비교용)
  level: string;          // 레벨 (매우높음/높음/보통/낮음/매우낮음)
  isPositive: boolean;    // 정적 요인 여부
  isStrength: boolean;    // 강점 여부 (정적≥60 또는 부적≤40)
}

// ============================================================
// 별칭 생성 함수
// ============================================================

/**
 * 학생 이름으로 별칭 맵 생성
 * @param studentNames 학생 이름 배열
 * @returns 별칭 맵 { "student_A": "김민준", ... }
 */
export const createAliasMap = (studentNames: string[]): StudentAliasMap => {
  const aliasMap: StudentAliasMap = {};
  studentNames.forEach((name, index) => {
    const letter = index < 26
      ? String.fromCharCode(65 + index) // A-Z
      : String.fromCharCode(65 + Math.floor(index / 26) - 1) + String.fromCharCode(65 + (index % 26)); // AA, AB, ...
    aliasMap[`student_${letter}`] = name;
  });
  return aliasMap;
};

/**
 * 별칭 맵 역변환 (별칭 → 이름)
 */
export const reverseAliasMap = (aliasMap: StudentAliasMap): Record<string, string> => {
  const reversed: Record<string, string> = {};
  Object.entries(aliasMap).forEach(([alias, name]) => {
    reversed[name] = alias;
  });
  return reversed;
};

/**
 * 텍스트에서 이름을 별칭으로 변환
 */
export const applyAliases = (text: string, aliasMap: StudentAliasMap): string => {
  let result = text;
  const reversed = reverseAliasMap(aliasMap);
  Object.entries(reversed).forEach(([name, alias]) => {
    result = result.replace(new RegExp(name, 'g'), alias);
  });
  return result;
};

/**
 * 텍스트에서 별칭을 이름으로 복원
 * AI가 마크다운 이스케이프로 student\_A 형태로 출력할 수 있어 두 패턴 모두 처리
 */
export const restoreNames = (text: string, aliasMap: StudentAliasMap): string => {
  let result = text;
  Object.entries(aliasMap).forEach(([alias, name]) => {
    // 일반 형태: student_A
    result = result.replace(new RegExp(alias, 'g'), name);
    // 이스케이프된 형태: student\_A (마크다운에서 _ 이스케이프)
    const escapedAlias = alias.replace(/_/g, '\\_');
    result = result.replace(new RegExp(escapedAlias.replace(/\\/g, '\\\\'), 'g'), name);
  });
  return result;
};

// ============================================================
// 소분류(38개 요인) 기반 분석 함수
// ============================================================

/**
 * T점수를 레벨 문자열로 변환
 */
const tScoreToLevel = (tScore: number): string => {
  if (tScore >= 70) return '매우높음';
  if (tScore >= 60) return '높음';
  if (tScore >= 40) return '보통';
  if (tScore >= 30) return '낮음';
  return '매우낮음';
};

/**
 * 38개 T점수 배열을 FactorScoreItem 배열로 변환
 */
const buildFactorScores = (tScores: number[]): FactorScoreItem[] => {
  return FACTOR_DEFINITIONS.map((factor, index) => {
    const tScore = tScores[index] ?? 50;
    const level = tScoreToLevel(tScore);
    const isPositive = factor.isPositive;

    // 정규화 점수: 부적 요인은 역산 (100 - T점수)하여 비교 가능하게 함
    const normalizedScore = isPositive ? tScore : (100 - tScore);

    // 강점 판정: 정적 요인 ≥60 또는 부적 요인 ≤40
    const isStrength = isPositive ? tScore >= 60 : tScore <= 40;

    return {
      name: factor.name,
      subCategory: factor.subCategory,
      category: factor.category,
      tScore,
      normalizedScore,
      level,
      isPositive,
      isStrength,
    };
  });
};

/**
 * 강점 추출 (소분류 38개 요인 기준, 상위 3개)
 *
 * 강점 기준:
 * - 정적 요인: T점수 ≥ 60 (높을수록 강점)
 * - 부적 요인: T점수 ≤ 40 (낮을수록 강점)
 */
const getTopStrengths = (tScores: number[]): FactorScoreItem[] => {
  const factorScores = buildFactorScores(tScores);

  // normalizedScore 높은 순 정렬 → 상위 3개
  return factorScores
    .filter(f => f.isStrength)
    .sort((a, b) => b.normalizedScore - a.normalizedScore)
    .slice(0, 3);
};

/**
 * 약점(관심 필요) 추출 (소분류 38개 요인 기준, 하위 3개)
 *
 * 약점 기준:
 * - 정적 요인: T점수 ≤ 40 (낮을수록 약점)
 * - 부적 요인: T점수 ≥ 60 (높을수록 약점)
 */
const getWeaknesses = (tScores: number[]): FactorScoreItem[] => {
  const factorScores = buildFactorScores(tScores);

  // 약점: 정적 요인 낮음 OR 부적 요인 높음
  const weaknesses = factorScores.filter(f => {
    if (f.isPositive) return f.tScore <= 40; // 정적 요인: 낮을수록 약점
    return f.tScore >= 60; // 부적 요인: 높을수록 약점
  });

  // 심각도 순 정렬 (normalizedScore 낮은 순)
  return weaknesses
    .sort((a, b) => a.normalizedScore - b.normalizedScore)
    .slice(0, 3);
};

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 학생의 최신 Assessment 조회
 */
const getLatestAssessment = (student: Student): Assessment | null => {
  if (!student.assessments || student.assessments.length === 0) return null;
  // round 2가 있으면 2, 없으면 1 반환
  const round2 = student.assessments.find((a) => a.round === 2);
  return round2 || student.assessments.find((a) => a.round === 1) || null;
};

/**
 * 학급 유형 분포 계산
 */
const calculateTypeDistribution = (students: Student[]): Record<string, number> => {
  const distribution: Record<string, number> = {};
  students.forEach((student) => {
    const assessment = getLatestAssessment(student);
    if (assessment) {
      const type = assessment.predictedType;
      distribution[type] = (distribution[type] || 0) + 1;
    }
  });
  return distribution;
};

/**
 * 관심 필요 학생 필터링
 */
const filterAttentionStudents = (students: Student[]): Student[] => {
  return students.filter((student) => {
    const assessment = getLatestAssessment(student);
    return assessment?.attentionResult?.needsAttention;
  });
};

/**
 * 유형 분포 포맷팅
 */
const formatTypeDistribution = (distribution: Record<string, number>): string => {
  return Object.entries(distribution)
    .map(([type, count]) => `- ${type}: ${count}명`)
    .join('\n');
};

// ============================================================
// 모드별 컨텍스트 빌더
// ============================================================

/**
 * 전체 모드 컨텍스트 생성
 */
const buildAllContext = (classes: Class[]): string => {
  const totalStudents = classes.reduce((sum, c) => sum + c.students.length, 0);

  // 전체 유형 분포
  const allStudents = classes.flatMap((c) => c.students);
  const typeDistribution = calculateTypeDistribution(allStudents);

  // 관심 필요 학생 수
  const attentionStudents = filterAttentionStudents(allStudents);

  // 학급별 요약
  const classSummaries = classes.map((cls) => {
    const distribution = calculateTypeDistribution(cls.students);
    const distributionText = Object.entries(distribution)
      .map(([type, count]) => `${type} ${count}명`)
      .join(', ');
    return `- ${cls.grade}학년 ${cls.classNumber}반: ${cls.students.length}명 (${distributionText})`;
  });

  return `## 전체 현황
- 담당 학급: ${classes.length}개
- 총 학생 수: ${totalStudents}명
- 관심 필요 학생: ${attentionStudents.length}명

## 전체 유형 분포
${formatTypeDistribution(typeDistribution)}

## 학급별 요약
${classSummaries.join('\n')}`;
};

/**
 * 반별 모드 컨텍스트 생성
 */
const buildClassContext = (cls: Class): string => {
  const typeDistribution = calculateTypeDistribution(cls.students);
  const attentionStudents = filterAttentionStudents(cls.students);

  // 관심 필요 학생 목록 (별칭 사용)
  const attentionList = attentionStudents
    .slice(0, 5) // 최대 5명
    .map((s, i) => {
      const assessment = getLatestAssessment(s);
      const alias = `student_${String.fromCharCode(65 + i)}`;
      const reasons = assessment?.attentionResult?.reasons
        ?.map((r) => r.category)
        .join(', ') || '';
      return `- ${alias}: ${assessment?.predictedType || '미분류'} (${reasons})`;
    });

  return `## ${cls.grade}학년 ${cls.classNumber}반 현황
- 학생 수: ${cls.students.length}명
- 검사 완료: ${cls.stats?.assessedStudents || cls.students.filter((s) => getLatestAssessment(s)).length}명

## 유형 분포
${formatTypeDistribution(typeDistribution)}

## 관심 필요 학생 (${attentionStudents.length}명)
${attentionList.length > 0 ? attentionList.join('\n') : '- 없음'}`;
};

/**
 * 개별 모드 컨텍스트 생성 (소분류 38개 요인 기반)
 */
const buildStudentContext = (
  students: Student[],
  aliasMap: StudentAliasMap
): string => {
  if (students.length === 0) {
    return '선택된 학생이 없습니다.';
  }

  const reversedMap = reverseAliasMap(aliasMap);
  const studentContexts: string[] = [];

  students.forEach((student, index) => {
    const assessment = getLatestAssessment(student);
    if (!assessment) return;

    const alias = reversedMap[student.name] || `student_${String.fromCharCode(65 + index)}`;
    const tScores = assessment.tScores;

    // 강점 분석 (소분류 상위 3개)
    const topStrengths = getTopStrengths(tScores);
    const strengthsText = topStrengths.length > 0
      ? topStrengths.map((s, i) => {
          const icon = s.isStrength ? '✨' : '';
          return `${i + 1}. **${s.name}** [${s.subCategory}] (T=${s.tScore}, ${s.level}) ${icon}`;
        }).join('\n')
      : '- 특별히 두드러진 강점 영역이 없습니다.';

    // 약점 분석 (소분류 하위 3개)
    const weaknesses = getWeaknesses(tScores);
    const weaknessesText = weaknesses.length > 0
      ? weaknesses.map((w, i) => {
          return `${i + 1}. **${w.name}** [${w.subCategory}] (T=${w.tScore}, ${w.level}) ⚠️`;
        }).join('\n')
      : '- 특별히 관심이 필요한 영역이 없습니다.';

    // 메타 정보
    const warnings = assessment.reliabilityWarnings.length > 0
      ? `신뢰도 주의: ${assessment.reliabilityWarnings.join(', ')}`
      : '';
    const attention = assessment.attentionResult?.needsAttention
      ? '관심 필요'
      : '';
    const badges = [warnings, attention].filter(Boolean).join(' | ');
    const badgeText = badges ? ` [${badges}]` : '';

    const studentContext = `### ${alias}
- **유형**: ${assessment.predictedType} (확신도 ${(assessment.typeConfidence * 100).toFixed(0)}%)${badgeText}

#### 강점 영역 (소분류 상위 3개)
${strengthsText}

#### 관심 필요 영역 (소분류 하위 3개)
${weaknessesText}`;

    studentContexts.push(studentContext);
  });

  return `## 선택된 학생 분석 (${students.length}명)

${studentContexts.join('\n\n---\n\n')}`;
};

// ============================================================
// 메인 빌더 함수
// ============================================================

/**
 * 모드에 따른 RAG 컨텍스트 생성
 */
export const buildRAGContext = (options: BuildContextOptions): ContextBuildResult => {
  const { mode, classes, selectedClass, selectedStudents } = options;

  // 별칭 맵 생성
  let aliasMap: StudentAliasMap = options.aliasMap || {};

  if (mode === 'student' && selectedStudents.length > 0) {
    aliasMap = createAliasMap(selectedStudents.map((s) => s.name));
  } else if (mode === 'class' && selectedClass) {
    // 반별 모드에서도 관심 필요 학생에 대한 별칭 생성
    const attentionStudents = filterAttentionStudents(selectedClass.students);
    aliasMap = createAliasMap(attentionStudents.slice(0, 5).map((s) => s.name));
  }

  let context: string;

  switch (mode) {
    case 'all':
      context = buildAllContext(classes);
      break;

    case 'class':
      if (!selectedClass) {
        context = '선택된 학급이 없습니다.';
      } else {
        context = buildClassContext(selectedClass);
      }
      break;

    case 'student':
      context = buildStudentContext(selectedStudents, aliasMap);
      break;

    default:
      context = '';
  }

  return { context, aliasMap };
};

export default {
  buildRAGContext,
  createAliasMap,
  reverseAliasMap,
  applyAliases,
  restoreNames,
};
