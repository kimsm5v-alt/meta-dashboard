import { FACTOR_DEFINITIONS } from '@shared/data/factors';
import type { Class, SchoolLevelCode, Student } from '@shared/types';
import type {
  AgentObservation,
  AgentRoundChange,
  AgentStudentInput,
  RecordGenerationAction,
  SchoolRecordGenerationRequest,
} from '../api/schoolRecordAgentApi';
import type {
  CounselingRefOption,
  GenerationSource,
  ObservationPayload,
  StudentProfile,
} from '../types';

const SCHOOL_LEVEL_BY_CODE: Record<SchoolLevelCode, '초등' | '중등' | '고등'> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
};

const SCHOOL_LEVEL_CODE = {
  초등: 'elementary',
  중등: 'middle',
  고등: 'high',
} as const;

const maskKnownName = (text: string, studentName: string): string => {
  const trimmedName = studentName.trim();
  if (!trimmedName) return text;
  return text
    .split(trimmedName)
    .join(`${trimmedName[0]}${'*'.repeat(Math.max(1, trimmedName.length - 1))}`);
};

export function buildRoundChanges(student: Student): AgentRoundChange[] {
  const round1 = student.assessments.find((assessment) => assessment.round === 1);
  const round2 = student.assessments.find((assessment) => assessment.round === 2);
  if (!round1 || !round2) return [];

  return FACTOR_DEFINITIONS.map((factor) => {
    const before = round1.tScores[factor.index];
    const after = round2.tScores[factor.index];
    if (before == null || after == null) return null;
    const rawDelta = after - before;
    if (Math.abs(rawDelta) < 5) return null;
    const meritDelta = factor.isPositive ? rawDelta : -rawDelta;
    return {
      category: factor.name,
      direction: meritDelta > 0 ? ('개선' as const) : ('하락' as const),
      magnitude: Math.abs(rawDelta),
    };
  })
    .filter((change): change is NonNullable<typeof change> => change !== null)
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 5)
    .map(({ category, direction }) => ({ category, direction }));
}

export function buildAgentObservation(
  input: ObservationPayload,
  counselingOptions: CounselingRefOption[],
  studentName: string,
): AgentObservation {
  const selectedRefs = new Set(input.counselingRefs);
  return {
    observations: input.observations.map((observation) => ({
      factor: observation.factor,
      type: observation.type,
      behavior_codes: observation.behaviorCodes,
    })),
    free_text: maskKnownName(input.freeText, studentName),
    counseling_notes: counselingOptions
      .filter((option) => selectedRefs.has(option.id))
      .map((option) => maskKnownName(option.summary, studentName)),
  };
}

export function buildAgentStudentInput(params: {
  student: Student;
  profile: StudentProfile;
  observation?: AgentObservation;
  previousText?: string;
}): AgentStudentInput {
  const latestAssessment =
    params.student.assessments.find((assessment) => assessment.round === 2) ??
    params.student.assessments.find((assessment) => assessment.round === 1);

  return {
    student_id: params.student.id,
    lpa_type: latestAssessment?.predictedType ?? '미지원',
    strengths: params.profile.strengths.map((factor) => ({
      name: factor.factorName,
      t_score: factor.avgT,
      is_positive: factor.isPositive,
    })),
    improvements: params.profile.weaknesses.map((factor) => ({
      name: factor.factorName,
      t_score: factor.avgT,
      is_positive: factor.isPositive,
    })),
    round2_available: params.student.assessments.some((assessment) => assessment.round === 2),
    round_changes: buildRoundChanges(params.student),
    ...(params.observation ? { observation: params.observation } : {}),
    ...(params.previousText ? { previous_text: params.previousText } : {}),
  };
}

export function buildGenerationRequest(params: {
  classData: Class;
  source: GenerationSource;
  action: RecordGenerationAction;
  students: AgentStudentInput[];
  streamTokens: boolean;
  commonContext?: SchoolRecordGenerationRequest['common_context'];
}): SchoolRecordGenerationRequest {
  const schoolLevelCode =
    params.classData.schoolLevelCode ?? SCHOOL_LEVEL_CODE[params.classData.schoolLevel];
  return {
    session_id: `school-record-${crypto.randomUUID()}`,
    class_id: params.classData.id,
    school_level: SCHOOL_LEVEL_BY_CODE[schoolLevelCode],
    school_level_code: schoolLevelCode,
    grade: params.classData.grade,
    source: params.source,
    action: params.action,
    ...(params.commonContext ? { common_context: params.commonContext } : {}),
    stream_tokens: params.streamTokens,
    students: params.students,
  };
}
