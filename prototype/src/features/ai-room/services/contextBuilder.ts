/**
 * AI Room 컨텍스트 빌더
 *
 * 모드별(전체/반별/개별)로 AI 프롬프트에 주입할 RAG 컨텍스트를 생성합니다.
 * 검사 결과, 4단계 진단, 상담 기록, 관찰 메모, 생활기록부를 포함합니다.
 */

import type { Class, Student, Assessment } from '@/shared/types';
import {
  SCHEDULE_TYPE_LABELS,
  COUNSELING_AREA_LABELS,
  COUNSELING_METHOD_LABELS,
  MEMO_CATEGORY_LABELS,
  SCHOOL_RECORD_CATEGORY_LABELS,
} from '@/shared/types';
import type { ContextMode, StudentAliasMap } from '../types';
import { FACTOR_DEFINITIONS } from '@/shared/data/factors';
import { calculate4StepDiagnosis } from '@/shared/utils/calculate4StepDiagnosis';
import { unifiedCounselingService } from '@/shared/services/unifiedCounselingService';
import { memoService } from '@/shared/services/memoService';
import { schoolRecordService } from '@/shared/services/schoolRecordService';
import { computeClassProfile } from '@/features/class-dashboard/hooks/useClassProfile';

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

export const createAliasMap = (studentNames: string[]): StudentAliasMap => {
  const aliasMap: StudentAliasMap = {};
  studentNames.forEach((name, index) => {
    const letter = index < 26
      ? String.fromCharCode(65 + index)
      : String.fromCharCode(65 + Math.floor(index / 26) - 1) + String.fromCharCode(65 + (index % 26));
    aliasMap[`student_${letter}`] = name;
  });
  return aliasMap;
};

export const reverseAliasMap = (aliasMap: StudentAliasMap): Record<string, string> => {
  const reversed: Record<string, string> = {};
  Object.entries(aliasMap).forEach(([alias, name]) => {
    reversed[name] = alias;
  });
  return reversed;
};

export const applyAliases = (text: string, aliasMap: StudentAliasMap): string => {
  let result = text;
  const reversed = reverseAliasMap(aliasMap);
  Object.entries(reversed).forEach(([name, alias]) => {
    result = result.replace(new RegExp(name, 'g'), alias);
  });
  return result;
};

export const restoreNames = (text: string, aliasMap: StudentAliasMap): string => {
  let result = text;
  Object.entries(aliasMap).forEach(([alias, name]) => {
    result = result.replace(new RegExp(alias, 'g'), name);
    const escapedAlias = alias.replace(/_/g, '\\_');
    result = result.replace(new RegExp(escapedAlias.replace(/\\/g, '\\\\'), 'g'), name);
  });
  return result;
};

// ============================================================
// 유틸리티 함수
// ============================================================

const getLatestAssessment = (student: Student): Assessment | null => {
  if (!student.assessments || student.assessments.length === 0) return null;
  const round2 = student.assessments.find((a) => a.round === 2);
  return round2 || student.assessments.find((a) => a.round === 1) || null;
};

const getAssessmentByRound = (student: Student, round: 1 | 2): Assessment | null => {
  return student.assessments.find((a) => a.round === round) || null;
};

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

const filterAttentionStudents = (students: Student[]): Student[] => {
  return students.filter((student) => {
    const assessment = getLatestAssessment(student);
    return assessment?.attentionResult?.needsAttention;
  });
};

const formatTypeDistribution = (distribution: Record<string, number>): string => {
  return Object.entries(distribution)
    .map(([type, count]) => `- ${type}: ${count}명`)
    .join('\n');
};

// ============================================================
// 38개 T점수 포맷팅 (5대 영역별 그룹)
// ============================================================

const formatAllTScores = (tScores: number[]): string => {
  const groups: Record<string, string[]> = {};

  for (const factor of FACTOR_DEFINITIONS) {
    if (!groups[factor.category]) {
      groups[factor.category] = [];
    }
    const t = tScores[factor.index] ?? 50;
    groups[factor.category].push(`${factor.name} T=${t}`);
  }

  return Object.entries(groups)
    .map(([category, factors]) => `- ${category}: ${factors.join(', ')}`)
    .join('\n');
};

// ============================================================
// 1차↔2차 변화 포맷팅
// ============================================================

const formatRoundChanges = (student: Student): string | null => {
  const round1 = getAssessmentByRound(student, 1);
  const round2 = getAssessmentByRound(student, 2);
  if (!round1 || !round2) return null;

  const changes: { name: string; diff: number; isPositive: boolean }[] = [];

  for (const factor of FACTOR_DEFINITIONS) {
    const t1 = round1.tScores[factor.index] ?? 50;
    const t2 = round2.tScores[factor.index] ?? 50;
    const diff = t2 - t1;
    if (Math.abs(diff) >= 5) {
      changes.push({ name: factor.name, diff, isPositive: factor.isPositive });
    }
  }

  if (changes.length === 0) return '- 유의미한 변화 없음 (±5 미만)';

  const positive = changes.filter((c) =>
    (c.isPositive && c.diff > 0) || (!c.isPositive && c.diff < 0)
  );
  const negative = changes.filter((c) =>
    (c.isPositive && c.diff < 0) || (!c.isPositive && c.diff > 0)
  );

  const lines: string[] = [];
  if (positive.length > 0) {
    lines.push(`- 긍정 변화: ${positive.map((c) => `${c.name}(${c.diff > 0 ? '+' : ''}${c.diff})`).join(', ')}`);
  }
  if (negative.length > 0) {
    lines.push(`- 부정 변화: ${negative.map((c) => `${c.name}(${c.diff > 0 ? '+' : ''}${c.diff})`).join(', ')}`);
  }
  return lines.join('\n');
};

// ============================================================
// 4단계 진단 포맷팅
// ============================================================

const format4StepDiagnosis = (tScores: number[]): string => {
  const diagnosis = calculate4StepDiagnosis(tScores);
  const { step1, step2, step3, step4 } = diagnosis;

  return `- 공부마음: ${step1.레벨} (T=${Math.round(step1.총점)}) — 긍정: 학업열의 T=${Math.round(step1.긍정.학업열의)}, 성장력 T=${Math.round(step1.긍정.성장력)} / 부정: 학업소진 T=${Math.round(step1.부정.학업소진)}
- 공부자원: ${step2.레벨} (T=${Math.round(step2.총점)}) — 개인 T=${Math.round(step2.개인.종합)}, 환경 T=${Math.round(step2.환경.종합)}, 방해 T=${Math.round(step2.방해.종합)}
- 공부기술: ${step3.레벨} (T=${Math.round(step3.총점)}) — 학습재설계 T=${Math.round(step3.학습.종합)}, 마음재설계 T=${Math.round(step3.마음.종합)}
- 학습유형: ${step4.유형코드} ${step4.유형명} (사분면 ${step4.사분면})
- 코칭전략: ${step4.코칭전략.join(' / ')}`;
};

// ============================================================
// 상담 기록 포맷팅
// ============================================================

const formatCounselingRecords = (
  records: Awaited<ReturnType<typeof unifiedCounselingService.getByStudentId>>,
  aliasMap: StudentAliasMap,
): string => {
  const active = records.filter((r) => r.status !== 'cancelled');
  if (active.length === 0) return '- 상담 기록 없음';

  return active
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, 5)
    .map((r) => {
      const date = r.scheduledAt.split(' ')[0];
      const status = r.status === 'completed' ? '완료' : '예정';
      const areas = r.areas.map((a) => COUNSELING_AREA_LABELS[a]).join('/');
      const types = r.types.map((t) => SCHEDULE_TYPE_LABELS[t]).join('/');
      const methods = r.methods.map((m) => COUNSELING_METHOD_LABELS[m]).join('/');
      let line = `- ${date} [${status}] ${types} ${areas} (${methods})`;
      if (r.summary) {
        line += `: ${applyAliases(r.summary.slice(0, 100), aliasMap)}`;
      }
      if (r.nextSteps) {
        line += ` → 후속: ${applyAliases(r.nextSteps.slice(0, 80), aliasMap)}`;
      }
      return line;
    })
    .join('\n');
};

// ============================================================
// 관찰 메모 포맷팅
// ============================================================

const formatObservationMemos = (
  memos: Awaited<ReturnType<typeof memoService.getByStudentId>>,
  aliasMap: StudentAliasMap,
): string => {
  if (memos.length === 0) return '- 관찰 메모 없음';

  return memos
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((m) => {
      const category = MEMO_CATEGORY_LABELS[m.category];
      const important = m.isImportant ? ' ★' : '';
      const content = applyAliases(m.content.slice(0, 100), aliasMap);
      return `- ${m.date} [${category}]${important} ${content}`;
    })
    .join('\n');
};

// ============================================================
// 생활기록부 포맷팅
// ============================================================

const formatSchoolRecords = (
  records: Awaited<ReturnType<typeof schoolRecordService.getSavedByStudentId>>,
  aliasMap: StudentAliasMap,
): string => {
  if (records.length === 0) return '';

  return records
    .map((r) => {
      const label = SCHOOL_RECORD_CATEGORY_LABELS[r.category];
      const content = applyAliases(r.content.slice(0, 150), aliasMap);
      return `- [${label}] ${content}`;
    })
    .join('\n');
};

// ============================================================
// 학급 프로필 포맷팅
// ============================================================

const formatClassProfile = (classData: Class, round: 1 | 2 = 1): string => {
  const profile = computeClassProfile(classData, round);
  if (!profile) return '- 프로필 데이터 없음';

  const formatItems = (items: typeof profile.strengths) =>
    items
      .map((item, i) => {
        let line = `${i + 1}. ${item.category} [${item.parentCategory}] (평균 T=${item.avgT})`;
        if (item.categoryScript) line += `: ${item.categoryScript}`;
        line += `\n   - 대표 요인: ${item.topFactor} (T=${item.topFactorT})`;
        if (item.topFactorScript) line += `: ${item.topFactorScript}`;
        return line;
      })
      .join('\n');

  return `### 강점 TOP 3
${formatItems(profile.strengths)}

### 약점 TOP 3
${formatItems(profile.weaknesses)}`;
};

// ============================================================
// 위험군 학생 포맷팅
// ============================================================

const formatRiskStudents = (
  students: Student[],
  aliasMap: StudentAliasMap,
): string => {
  const critical: string[] = [];
  const watchList: string[] = [];
  const reversed = reverseAliasMap(aliasMap);

  for (const student of students) {
    const assessment = getLatestAssessment(student);
    if (!assessment?.attentionResult?.needsAttention) continue;

    const alias = reversed[student.name] || student.name;
    const reasons = assessment.attentionResult.reasons
      .map((r) => `${r.category} ${r.direction === 'low' ? '낮음' : '높음'}`)
      .join(', ');

    const hasSevere = assessment.tScores.some((t, idx) => {
      const factor = FACTOR_DEFINITIONS[idx];
      return factor && ((factor.isPositive && t <= 29) || (!factor.isPositive && t >= 70));
    });

    const line = `- ${alias}: ${assessment.predictedType} — ${reasons}`;
    if (assessment.attentionResult.reasons.length >= 2 || hasSevere) {
      critical.push(line);
    } else {
      watchList.push(line);
    }
  }

  const sections: string[] = [];
  if (critical.length > 0) {
    sections.push(`### 긴급 관심 (${critical.length}명)\n${critical.join('\n')}`);
  }
  if (watchList.length > 0) {
    sections.push(`### 관찰 필요 (${watchList.length}명)\n${watchList.join('\n')}`);
  }
  return sections.length > 0 ? sections.join('\n\n') : '- 위험군 학생 없음';
};

// ============================================================
// 모드별 컨텍스트 빌더
// ============================================================

const buildAllContext = async (classes: Class[]): Promise<string> => {
  const totalStudents = classes.reduce((sum, c) => sum + c.students.length, 0);
  const allStudents = classes.flatMap((c) => c.students);
  const typeDistribution = calculateTypeDistribution(allStudents);
  const attentionStudents = filterAttentionStudents(allStudents);

  const classProfiles = classes.map((cls) => {
    const distribution = calculateTypeDistribution(cls.students);
    const distributionText = Object.entries(distribution)
      .map(([type, count]) => `${type} ${count}명`)
      .join(', ');

    const profile = computeClassProfile(cls);
    const strengths = profile
      ? profile.strengths.map((s) => `${s.category}(T=${s.avgT})`).join(', ')
      : '-';
    const weaknesses = profile
      ? profile.weaknesses.map((w) => `${w.category}(T=${w.avgT})`).join(', ')
      : '-';

    return `### ${cls.grade}학년 ${cls.classNumber}반 (${cls.students.length}명)
- 유형 분포: ${distributionText}
- 강점: ${strengths}
- 약점: ${weaknesses}`;
  });

  const allRecords = await unifiedCounselingService.getAll();
  const activeRecords = allRecords.filter((r) => r.status !== 'cancelled');
  const completedCount = activeRecords.filter((r) => r.status === 'completed').length;
  const scheduledCount = activeRecords.filter((r) => r.status === 'scheduled').length;

  return `## 전체 현황
- 담당 학급: ${classes.length}개
- 총 학생 수: ${totalStudents}명
- 관심 필요 학생: ${attentionStudents.length}명
- 상담 현황: 완료 ${completedCount}건 / 예정 ${scheduledCount}건

## 전체 유형 분포
${formatTypeDistribution(typeDistribution)}

## 학급별 프로필
${classProfiles.join('\n\n')}`;
};

const buildClassContext = async (
  cls: Class,
  aliasMap: StudentAliasMap,
): Promise<string> => {
  const typeDistribution = calculateTypeDistribution(cls.students);

  const classRecords = await unifiedCounselingService.getByClassId(cls.id);
  const activeRecords = classRecords.filter((r) => r.status !== 'cancelled');
  const completedCount = activeRecords.filter((r) => r.status === 'completed').length;
  const scheduledCount = activeRecords.filter((r) => r.status === 'scheduled').length;

  return `## ${cls.grade}학년 ${cls.classNumber}반 현황
- 학생 수: ${cls.students.length}명
- 검사 완료: ${cls.stats?.assessedStudents || cls.students.filter((s) => getLatestAssessment(s)).length}명
- 상담 현황: 완료 ${completedCount}건 / 예정 ${scheduledCount}건

## 유형 분포
${formatTypeDistribution(typeDistribution)}

## 학급 프로필
${formatClassProfile(cls)}

## 위험군 학생
${formatRiskStudents(cls.students, aliasMap)}`;
};

const buildStudentContext = async (
  students: Student[],
  aliasMap: StudentAliasMap,
): Promise<string> => {
  if (students.length === 0) {
    return '선택된 학생이 없습니다.';
  }

  const reversedMap = reverseAliasMap(aliasMap);
  const studentContexts: string[] = [];

  for (let index = 0; index < students.length; index++) {
    const student = students[index];
    const assessment = getLatestAssessment(student);
    if (!assessment) continue;

    const alias = reversedMap[student.name] || `student_${String.fromCharCode(65 + index)}`;
    const tScores = assessment.tScores;

    const warnings = assessment.reliabilityWarnings.length > 0
      ? `신뢰도 주의: ${assessment.reliabilityWarnings.join(', ')}`
      : '';
    const attention = assessment.attentionResult?.needsAttention ? '관심 필요' : '';
    const badges = [warnings, attention].filter(Boolean).join(' | ');
    const badgeText = badges ? ` [${badges}]` : '';

    const allScoresText = formatAllTScores(tScores);
    const changesText = formatRoundChanges(student);
    const diagnosisText = format4StepDiagnosis(tScores);

    const counselingRecords = await unifiedCounselingService.getByStudentId(student.id);
    const counselingText = formatCounselingRecords(counselingRecords, aliasMap);

    const memos = await memoService.getByStudentId(student.id);
    const memoText = formatObservationMemos(memos, aliasMap);

    const schoolRecords = await schoolRecordService.getSavedByStudentId(student.id);
    const schoolRecordText = formatSchoolRecords(schoolRecords, aliasMap);

    let context = `### ${alias}
- **유형**: ${assessment.predictedType} (확신도 ${(assessment.typeConfidence * 100).toFixed(0)}%)${badgeText}

#### 38개 요인 T점수 (5대 영역별)
${allScoresText}`;

    if (changesText) {
      context += `\n\n#### 1차→2차 변화 (T±5 이상)\n${changesText}`;
    }

    context += `\n\n#### 4단계 진단\n${diagnosisText}`;

    context += `\n\n#### 상담 기록 (${counselingRecords.filter((r) => r.status !== 'cancelled').length}건)\n${counselingText}`;

    context += `\n\n#### 관찰 메모 (${memos.length}건)\n${memoText}`;

    if (schoolRecordText) {
      context += `\n\n#### 저장된 생활기록부 문구\n${schoolRecordText}`;
    }

    studentContexts.push(context);
  }

  return `## 선택된 학생 분석 (${students.length}명)

${studentContexts.join('\n\n---\n\n')}`;
};

// ============================================================
// 메인 빌더 함수
// ============================================================

export const buildRAGContext = async (
  options: BuildContextOptions,
): Promise<ContextBuildResult> => {
  const { mode, classes, selectedClass, selectedStudents } = options;

  let aliasMap: StudentAliasMap = options.aliasMap || {};

  if (mode === 'student' && selectedStudents.length > 0) {
    aliasMap = createAliasMap(selectedStudents.map((s) => s.name));
  } else if (mode === 'class' && selectedClass) {
    const attentionStudents = filterAttentionStudents(selectedClass.students);
    aliasMap = createAliasMap(attentionStudents.slice(0, 10).map((s) => s.name));
  }

  let context: string;

  switch (mode) {
    case 'all':
      context = await buildAllContext(classes);
      break;

    case 'class':
      if (!selectedClass) {
        context = '선택된 학급이 없습니다.';
      } else {
        context = await buildClassContext(selectedClass, aliasMap);
      }
      break;

    case 'student':
      context = await buildStudentContext(selectedStudents, aliasMap);
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
