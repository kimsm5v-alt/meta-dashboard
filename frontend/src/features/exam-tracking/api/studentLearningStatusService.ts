import { apiClient } from '@shared/api';

export type LearningStatusLevel = 'very-low' | 'low' | 'mid' | 'high' | 'very-high';
export type LearningMotivation = 'interest' | 'future' | 'college' | 'expectations' | 'unknown';
export type SelfStudyTime = 'none' | 'under1h' | '1-2h' | '2-3h' | 'over3h';
export type LearningCounselor = 'friend' | 'teacher' | 'family' | 'counselor' | 'etc';

interface StudentLearningStatusRoundResponse {
  round?: number;
  ordNo?: number;
  answerIdx: number;
  academicAchievement: LearningStatusLevel | null;
  gradeSatisfaction: LearningStatusLevel | null;
  learningMotivation: LearningMotivation | null;
  selfStudyTime: SelfStudyTime | null;
  learningCounselor: LearningCounselor | null;
}

interface StudentLearningStatusResponse {
  studentId: string;
  rounds: StudentLearningStatusRoundResponse[];
}

export interface StudentLearningStatusRound {
  ordNo: number;
  answerIdx: number;
  academicAchievement: LearningStatusLevel | null;
  gradeSatisfaction: LearningStatusLevel | null;
  learningMotivation: LearningMotivation | null;
  selfStudyTime: SelfStudyTime | null;
  learningCounselor: LearningCounselor | null;
}

export interface StudentLearningStatus {
  studentId: string;
  rounds: StudentLearningStatusRound[];
}

export async function fetchStudentLearningStatus(
  classId: string,
  studentId: string,
  paperIdx = 1,
): Promise<StudentLearningStatus> {
  const params = new URLSearchParams({ claId: classId, paperIdx: String(paperIdx) });
  const response = await apiClient.get<StudentLearningStatusResponse>(
    `/api/dgnss/students/${encodeURIComponent(studentId)}/learning-status?${params.toString()}`,
  );
  const result = response.resultData;

  return {
    studentId: result.studentId,
    rounds: (result.rounds ?? [])
      .map(({ round, ordNo, ...item }) => ({ ...item, ordNo: ordNo ?? round ?? 0 }))
      .filter(({ ordNo }) => ordNo > 0)
      .sort((a, b) => a.ordNo - b.ordNo),
  };
}
