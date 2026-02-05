/**
 * AI Room 컨텍스트 빌더
 *
 * 모드별(전체/반별/개별)로 AI 프롬프트에 주입할 RAG 컨텍스트를 생성합니다.
 * T_SCRIPT 서비스와 연동하여 학생별 강점/약점 분석 결과를 포함합니다.
 */

import type { Class, Student, Assessment } from '@/shared/types';
import type { ContextMode, StudentAliasMap } from '../types';
import {
  analyzeStudentScripts,
  formatMultipleStudentsForRAG,
  type StudentScriptAnalysis,
} from '@/shared/services/tScriptService';

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
 */
export const restoreNames = (text: string, aliasMap: StudentAliasMap): string => {
  let result = text;
  Object.entries(aliasMap).forEach(([alias, name]) => {
    result = result.replace(new RegExp(alias, 'g'), name);
  });
  return result;
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
 * 개별 모드 컨텍스트 생성 (T_SCRIPT 기반 RAG)
 */
const buildStudentContext = (
  students: Student[],
  aliasMap: StudentAliasMap
): string => {
  if (students.length === 0) {
    return '선택된 학생이 없습니다.';
  }

  const analyses: StudentScriptAnalysis[] = [];
  const reversedMap = reverseAliasMap(aliasMap);

  students.forEach((student) => {
    const assessment = getLatestAssessment(student);
    if (!assessment) return;

    const alias = reversedMap[student.name] || `student_${String.fromCharCode(65 + analyses.length)}`;

    // T_SCRIPT 기반 분석
    const analysis = analyzeStudentScripts(assessment.tScores, alias);
    analyses.push(analysis);
  });

  // 분석 결과를 RAG 컨텍스트로 포맷팅
  const baseContext = formatMultipleStudentsForRAG(analyses, false);

  // 각 학생에 대한 메타 정보 추가
  const metaInfo = students
    .map((student, index) => {
      const assessment = getLatestAssessment(student);
      if (!assessment) return null;

      const alias = reversedMap[student.name] || `student_${String.fromCharCode(65 + index)}`;
      const warnings = assessment.reliabilityWarnings.length > 0
        ? `신뢰도 주의: ${assessment.reliabilityWarnings.join(', ')}`
        : '';
      const attention = assessment.attentionResult?.needsAttention
        ? '관심 필요'
        : '';
      const badges = [warnings, attention].filter(Boolean).join(' | ');

      return `- ${alias}: ${assessment.predictedType} (확신도 ${(assessment.typeConfidence * 100).toFixed(0)}%)${badges ? ` [${badges}]` : ''}`;
    })
    .filter(Boolean);

  return `## 선택된 학생 (${students.length}명)
${metaInfo.join('\n')}

${baseContext}`;
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
