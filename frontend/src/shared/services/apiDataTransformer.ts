/**
 * API 응답 → 프론트엔드 타입 변환기
 *
 * metaApi.ts의 API 응답을 기존 프론트엔드 타입(Student, Assessment, Class)으로 변환
 */

import type {
  Student,
  Assessment,
  Class,
  ClassStats,
  SchoolLevel,
  FactorDeviation,
} from '@shared/types';
import { FACTORS } from '@shared/data/lpaProfiles';
import { classifyStudent, getTypeDeviations } from '@shared/utils/lpaClassifier';
import { checkAttention } from '@shared/utils/attentionChecker';
import type { StudentListItem, TScoreItem, StudentAnalysisData, ExamDetail } from './metaApi';

// ============================================================
// SECTION_ID → FACTORS 인덱스 매핑
// ============================================================

/** API SECTION_NM → FACTORS 인덱스 매핑 빌드 */
const normalizeName = (name: string): string => name.replace(/[\s\-]/g, '');

const buildSectionMapping = (): Map<string, number> => {
  const mapping = new Map<string, number>();
  const normalizedFactors = FACTORS.map((f, i) => ({
    normalized: normalizeName(f),
    original: f,
    index: i,
  }));

  // API에서 오는 SECTION_NM을 FACTORS 인덱스로 매핑
  for (const factor of normalizedFactors) {
    mapping.set(factor.normalized, factor.index);
    mapping.set(factor.original, factor.index);
  }

  return mapping;
};

const sectionMapping = buildSectionMapping();

// ============================================================
// T점수 변환
// ============================================================

/**
 * API TScoreItem 배열 → number[38] 변환
 */
export function transformTScores(items: TScoreItem[], round: 1 | 2 = 1): number[] {
  const result = new Array<number>(38).fill(50); // 기본값 50

  const roundItems = items.filter((item) => item.DEPTH === 5 && item.ord_no === round);

  for (const item of roundItems) {
    const normalizedName = normalizeName(item.SECTION_NM);
    const index = sectionMapping.get(normalizedName) ?? sectionMapping.get(item.SECTION_NM);

    if (index !== undefined && index < 38) {
      result[index] = Math.round(item.tScore * 10) / 10;
    }
  }

  return result;
}

/**
 * 신뢰도 경고 배열 생성
 */
export function buildReliabilityWarnings(item: {
  reaction?: '양호' | '주의';
  desirable?: '양호' | '주의';
  repeatResponse?: 'Y' | 'N';
}): string[] {
  const warnings: string[] = [];

  if (item.reaction === '주의') {
    warnings.push('반응일관성');
  }
  if (item.desirable === '주의') {
    warnings.push('사회적바람직성');
  }
  if (item.repeatResponse === 'Y') {
    warnings.push('연속동일반응');
  }

  return warnings;
}

// ============================================================
// Assessment 변환
// ============================================================

/**
 * API 학생 분석 데이터 → Assessment[] 변환
 */
export function transformToAssessments(
  analysisData: StudentAnalysisData,
  studentId: string,
  schoolLevel: SchoolLevel,
): Assessment[] {
  const assessments: Assessment[] = [];
  const items = analysisData['1'] || [];

  // 1차, 2차 각각 처리
  const rounds = [...new Set(items.map((item) => item.ord_no))].sort() as (1 | 2)[];

  for (const round of rounds) {
    const roundItems = items.filter((item) => item.ord_no === round);
    if (roundItems.length === 0) continue;

    const tScores = transformTScores(items, round);

    // LPA 분류
    const classification = classifyStudent(tScores, schoolLevel);
    const predictedType = classification.predictedType;
    const typeConfidence = classification.confidence;
    const typeProbabilities = classification.allProbabilities;

    // 특이점 계산
    let deviations: FactorDeviation[] = [];
    try {
      deviations = getTypeDeviations(tScores, predictedType, schoolLevel, 3);
    } catch {
      deviations = [];
    }

    // 신뢰도 경고 (첫 번째 아이템 기준)
    const firstItem = roundItems[0];
    const reliabilityWarnings = buildReliabilityWarnings({
      reaction: firstItem?.reaction,
      desirable: firstItem?.desirable,
      repeatResponse: firstItem?.repeatResponse,
    });

    // 관심 필요 판별
    const attentionResult = checkAttention(tScores);

    // Assessment 생성
    assessments.push({
      id: `${studentId}-r${round}`,
      studentId,
      round,
      assessedAt: new Date(analysisData.eakStDt || Date.now()),
      tScores,
      predictedType,
      typeConfidence,
      typeProbabilities,
      deviations,
      reliabilityWarnings,
      attentionResult,
    });
  }

  return assessments;
}

// ============================================================
// Student 변환
// ============================================================

/**
 * API 학생 목록 아이템 → Student 기본 정보 변환
 * (Assessment는 별도 API 호출 필요)
 */
export function transformToStudentBase(
  item: StudentListItem,
  classId: string,
  schoolLevel: SchoolLevel,
  grade: number,
): Omit<Student, 'assessments'> {
  return {
    id: item.stdtId,
    classId,
    number: item.rowNum,
    name: `학생${item.rowNum}`, // API에서 이름 안 옴, 별도 조회 필요
    schoolLevel,
    grade,
  };
}

/**
 * API 학생 목록 + 분석 데이터 → Student 전체 변환
 */
export function transformToStudent(
  listItem: StudentListItem,
  analysisData: StudentAnalysisData | null,
  classId: string,
  schoolLevel: SchoolLevel,
  grade: number,
): Student {
  const baseStudent = transformToStudentBase(listItem, classId, schoolLevel, grade);

  const assessments = analysisData
    ? transformToAssessments(analysisData, listItem.stdtId, schoolLevel)
    : [];

  return {
    ...baseStudent,
    assessments,
    round2Submitted: assessments.some((a) => a.round === 2),
  };
}

// ============================================================
// Class 변환
// ============================================================

/**
 * API 검사 상세 + 학생 목록 → Class 변환
 */
export function transformToClass(
  examDetail: ExamDetail,
  students: Student[],
  schoolLevel: SchoolLevel,
  grade: number,
  classNumber: number,
): Class {
  const stats = computeClassStats(students, examDetail);

  return {
    id: examDetail.claId,
    schoolLevel,
    grade,
    classNumber,
    teacherId: '', // API에서 제공 안 함
    students,
    stats,
  };
}

/**
 * ClassStats 계산
 */
function computeClassStats(students: Student[], examDetail: ExamDetail): ClassStats {
  const assessed = students.filter((s) => s.assessments.length > 0);
  const withRound2 = students.filter((s) => s.assessments.some((a) => a.round === 2));

  // 유형 분포 계산
  const typeCounts: Record<string, number> = {};
  for (const s of assessed) {
    const latest = s.assessments.find((a) => a.round === 2) || s.assessments[0];
    if (latest) {
      typeCounts[latest.predictedType] = (typeCounts[latest.predictedType] || 0) + 1;
    }
  }

  const totalAssessed = assessed.length;
  const typeDistribution: Record<string, { count: number; percentage: number }> = {};
  for (const [type, count] of Object.entries(typeCounts)) {
    typeDistribution[type] = {
      count,
      percentage: totalAssessed > 0 ? Math.round((count / totalAssessed) * 1000) / 10 : 0,
    };
  }

  // 관심 필요 학생 수
  const needAttentionCount = assessed.filter((s) => {
    const latest = s.assessments.find((a) => a.round === 2) || s.assessments[0];
    return latest?.attentionResult.needsAttention ?? false;
  }).length;

  const round1Completed = assessed.length === students.length;
  const round2Completed = withRound2.length > 0 && withRound2.length === students.length;
  const round2SubmittedCount = students.filter((s) => s.round2Submitted).length;

  return {
    totalStudents: examDetail.stTotalCnt || students.length,
    assessedStudents: examDetail.stSubmCnt || assessed.length,
    typeDistribution,
    needAttentionCount,
    round1Completed,
    round2Completed,
    examStatus: {
      round1: examDetail.dgnssAt === 'N' ? '종료' : '진행중',
      round2: examDetail.ordNo >= 2 ? (examDetail.dgnssAt === 'N' ? '종료' : '진행중') : '시작전',
    },
    round2SubmittedCount,
  };
}

// ============================================================
// 학급 평균 T점수 변환
// ============================================================

/**
 * API 학급 분석 데이터 → 학급 평균 T점수 배열
 */
export function transformClassTScores(items: TScoreItem[], round: 1 | 2 = 1): number[] {
  return transformTScores(items, round);
}

/**
 * API 학급 분석 데이터 → 중분류별 T점수
 */
export function transformMidCategoryScores(
  items: TScoreItem[],
  round: 1 | 2 = 1,
): { name: string; score: number }[] {
  return items
    .filter((item) => item.DEPTH === 4 && item.ord_no === round)
    .map((item) => ({
      name: item.SECTION_NM,
      score: Math.round(item.tScore * 10) / 10,
    }));
}

// ============================================================
// 유틸리티
// ============================================================

/**
 * 학년 문자열 → 숫자 변환
 * "1학년" → 1, "6학년" → 6
 */
export function parseGrade(gradeStr: string): number {
  const match = gradeStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * 학년으로 학교급 판별
 */
export function resolveSchoolLevel(grade: number): SchoolLevel {
  return grade >= 7 ? '중등' : '초등';
}
