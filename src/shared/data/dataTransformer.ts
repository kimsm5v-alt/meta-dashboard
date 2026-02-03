/**
 * full_sample_data.json → TypeScript 인터페이스 변환기
 *
 * JSON 샘플 데이터를 프론트엔드 타입(Student, Assessment, Class 등)으로 변환.
 * 요인명 매핑, ID 포맷 변환, ClassStats 계산 등 수행.
 */

import type {
  Student,
  Assessment,
  Class,
  ClassStats,
  StudentType,
  FactorDeviation,
  SchoolLevel,
} from '@/shared/types';
import { FACTORS } from '@/shared/data/lpaProfiles';
import { classifyStudent, getTypeDeviations } from '@/shared/utils/lpaClassifier';
import { checkAttention } from '@/shared/utils/attentionChecker';

// ============================================================
// JSON 원본 타입 정의 (새 형식)
// ============================================================

interface RawTestData {
  status: string;
  date?: string;
  rawScores?: Record<string, number> | null;
  tScores?: Record<string, number> | null;
  type?: string | null;
  reliability?: string[] | null;
}

interface RawStudent {
  id: string;
  name: string;
  test1: RawTestData;
  test2: RawTestData;
}

interface RawClass {
  teacher: string;
  students: RawStudent[];
}

interface RawData {
  examInfo: {
    name: string;
    year: number;
    school: string;
    grade: number;
  };
  classes: Record<string, RawClass>;
}

// ============================================================
// 요인명 매핑: JSON tScore key → FACTORS 인덱스
// ============================================================

/** 공백/하이픈 제거 정규화 */
const normalizeName = (name: string): string => name.replace(/[\s\-]/g, '');

/** JSON tScore 키 목록으로부터 FACTORS 인덱스 매핑 빌드 */
const buildFactorMapping = (jsonKeys: string[]): Record<string, number> => {
  const mapping: Record<string, number> = {};
  const normalizedFactors = FACTORS.map((f, i) => ({
    normalized: normalizeName(f),
    index: i,
  }));

  for (const jsonKey of jsonKeys) {
    const normalizedKey = normalizeName(jsonKey);
    const match = normalizedFactors.find(f => f.normalized === normalizedKey);
    if (match) {
      mapping[jsonKey] = match.index;
    }
  }

  return mapping;
};

// ============================================================
// 변환 유틸리티
// ============================================================

/** "6학년 2반" → "class-6-2" */
const toClassId = (className: string): string => {
  const gradeMatch = className.match(/(\d+)학년/);
  const classMatch = className.match(/(\d+)반/);
  const grade = gradeMatch ? parseInt(gradeMatch[1]) : 0;
  const classNum = classMatch ? parseInt(classMatch[1]) : 0;
  return `class-${grade}-${classNum}`;
};

/** 학년으로 학교급 판별: 1~6 → 초등, 7~9(또는 1~3 중등) → 중등 */
const resolveSchoolLevel = (grade: number): SchoolLevel =>
  grade >= 7 ? '중등' : '초등';

/** 학생 ID에서 번호 추출: "S0201" → 1, "S0312" → 12 */
const extractStudentNumber = (id: string): number => {
  const numPart = id.slice(-2);
  return parseInt(numPart, 10) || 1;
};

/** 출석번호 → "class-6-2-student-01" */
const toStudentId = (classId: string, studentNumber: number): string => {
  return `${classId}-student-${studentNumber.toString().padStart(2, '0')}`;
};

/** tScores 객체 → number[38] (FACTORS 인덱스 순서) */
const transformTScores = (
  rawTScores: Record<string, number>,
  factorMapping: Record<string, number>,
): number[] => {
  const result = new Array<number>(38).fill(50);

  for (const [jsonKey, value] of Object.entries(rawTScores)) {
    const idx = factorMapping[jsonKey];
    if (idx !== undefined) {
      result[idx] = Math.round(value * 100) / 100;
    }
  }

  return result;
};

/** test에 유효한 데이터가 있는지 (tScores 존재 여부로 판단) */
const hasValidTestData = (testData: RawTestData): boolean => {
  return testData.tScores !== null &&
    testData.tScores !== undefined &&
    Object.keys(testData.tScores).length > 0;
};

/** 특이점(deviations) 안전하게 계산 */
const safeGetDeviations = (
  tScores: number[],
  typeName: StudentType,
  schoolLevel: SchoolLevel,
): FactorDeviation[] => {
  try {
    return getTypeDeviations(tScores, typeName, schoolLevel, 3);
  } catch {
    return [];
  }
};

// ============================================================
// 단일 Assessment 변환
// ============================================================

const transformTestToAssessment = (
  testData: RawTestData,
  round: 1 | 2,
  studentId: string,
  factorMapping: Record<string, number>,
  schoolLevel: SchoolLevel,
): Assessment | null => {
  if (!hasValidTestData(testData) || !testData.tScores) return null;

  const tScores = transformTScores(testData.tScores, factorMapping);

  // LPA 분류기로 probabilities 직접 계산
  const classification = classifyStudent(tScores, schoolLevel);
  const predictedType = classification.predictedType;
  const typeConfidence = classification.confidence;
  const typeProbabilities = classification.allProbabilities;

  const deviations = safeGetDeviations(tScores, predictedType, schoolLevel);
  const reliabilityWarnings = testData.reliability ?? [];
  const attentionResult = checkAttention(tScores);

  return {
    id: `${studentId}-r${round}`,
    studentId,
    round,
    assessedAt: testData.date ? new Date(testData.date) : new Date(),
    tScores,
    predictedType,
    typeConfidence,
    typeProbabilities,
    deviations,
    reliabilityWarnings,
    attentionResult,
  };
};

// ============================================================
// 단일 학생 변환
// ============================================================

const transformStudent = (
  raw: RawStudent,
  classId: string,
  grade: number,
  schoolLevel: SchoolLevel,
  factorMapping: Record<string, number>,
): Student => {
  const studentNumber = extractStudentNumber(raw.id);
  const studentId = toStudentId(classId, studentNumber);
  const assessments: Assessment[] = [];

  const r1 = transformTestToAssessment(raw.test1, 1, studentId, factorMapping, schoolLevel);
  if (r1) assessments.push(r1);

  const r2 = transformTestToAssessment(raw.test2, 2, studentId, factorMapping, schoolLevel);
  if (r2) assessments.push(r2);

  return {
    id: studentId,
    classId,
    number: studentNumber,
    name: raw.name,
    schoolLevel,
    grade,
    assessments,
  };
};

// ============================================================
// ClassStats 계산
// ============================================================

const computeClassStats = (students: Student[]): ClassStats => {
  const assessed = students.filter(s => s.assessments.length > 0);
  const withRound2 = students.filter(s => s.assessments.some(a => a.round === 2));

  // 최신 회차 기준 유형 분포
  const typeCounts: Record<string, number> = {};
  for (const s of assessed) {
    const latest = s.assessments.find(a => a.round === 2) || s.assessments[0];
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

  // 관심 필요 학생: 최신 회차에서 attentionResult.needsAttention
  const needAttentionCount = assessed.filter(s => {
    const latest = s.assessments.find(a => a.round === 2) || s.assessments[0];
    return latest?.attentionResult.needsAttention ?? false;
  }).length;

  const round1Completed = assessed.length === students.length;
  const round2Completed = withRound2.length > 0 && withRound2.length === students.length;

  return {
    totalStudents: students.length,
    assessedStudents: assessed.length,
    typeDistribution,
    needAttentionCount,
    round1Completed,
    round2Completed,
  };
};

// ============================================================
// 메인 변환 함수
// ============================================================

export interface TransformResult {
  classes: Class[];
  teacher: { id: string; name: string };
}

export const transformFullData = (rawData: RawData): TransformResult => {
  const classes: Class[] = [];
  let factorMapping: Record<string, number> | null = null;

  const grade = rawData.examInfo.grade;
  const schoolLevel = resolveSchoolLevel(grade);

  // 첫 번째 반의 교사명을 대표 교사로 사용
  const firstClass = Object.values(rawData.classes)[0];
  const teacherName = firstClass?.teacher ?? '교사';
  const teacherId = 'teacher-001';

  for (const [className, rawClass] of Object.entries(rawData.classes)) {
    const classId = toClassId(className);

    // 첫 학생의 tScore 키로 매핑 빌드 (1회만)
    if (!factorMapping) {
      const firstWithScores = rawClass.students.find(s => s.test1.tScores);
      if (firstWithScores?.test1.tScores) {
        factorMapping = buildFactorMapping(Object.keys(firstWithScores.test1.tScores));
      }
    }

    if (!factorMapping) continue;

    const classMatch = className.match(/(\d+)반/);
    const classNumber = classMatch ? parseInt(classMatch[1]) : 0;

    const students = rawClass.students.map(raw =>
      transformStudent(raw, classId, grade, schoolLevel, factorMapping!),
    );

    const stats = computeClassStats(students);

    classes.push({
      id: classId,
      schoolLevel,
      grade,
      classNumber,
      teacherId,
      students,
      stats,
    });
  }

  classes.sort((a, b) => a.classNumber - b.classNumber);

  return {
    classes,
    teacher: { id: teacherId, name: teacherName },
  };
};
