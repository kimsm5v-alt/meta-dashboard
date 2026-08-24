import { apiRequest } from '@shared/services/apiClient';

export interface CoachingStrengthCard {
  factor: string;
  observation: string;
  line: string;
  question: string;
}

export interface CoachingPathwayCard {
  zFactor: string;
  xFactor: string;
  yFactor: string;
  pathType: string;
  interpretation: string;
  coaching1: { method: string; line: string };
  coaching2: { action: string; line: string };
}

export interface StudentCoaching {
  answerIdx: number;
  lpaClass: string;
  schoolLevel: string;
  strengthCards: CoachingStrengthCard[];
  coachingCard: CoachingPathwayCard | null;
}

export async function fetchStudentCoaching(answerIdx: number): Promise<StudentCoaching> {
  const response = await apiRequest<StudentCoaching>(`/api/dgnss/st/coaching/${answerIdx}`);
  return response.resultData;
}
