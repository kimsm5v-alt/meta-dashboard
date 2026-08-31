import { apiClient } from '@shared/api';

export type LearningStatusLevel = 'very-low' | 'low' | 'mid' | 'high' | 'very-high';
export type LearningMotivation = 'interest' | 'future' | 'college' | 'expectations' | 'unknown';
export type SelfStudyTime = 'none' | 'under1h' | '1-2h' | '2-3h' | 'over3h';
export type LearningCounselor = 'friend' | 'teacher' | 'family' | 'counselor' | 'etc';

/** 학습현황 설문 응답값 → 표시 라벨. 결과보기/변화추적 화면이 공용으로 쓴다. */
export const LEVEL_LABELS: Record<LearningStatusLevel, string> = {
  'very-low': '매우 낮음',
  low: '낮음',
  mid: '보통',
  high: '높음',
  'very-high': '매우 높음',
};

export const MOTIVATION_LABELS: Record<LearningMotivation, string> = {
  interest: '흥미를 느껴서',
  future: '미래를 위해서',
  college: '대학 진학',
  expectations: '주변 기대 때문에',
  unknown: '모르겠음',
};

export const STUDY_TIME_LABELS: Record<SelfStudyTime, string> = {
  none: '전혀 안 함',
  under1h: '1시간 미만',
  '1-2h': '1~2시간',
  '2-3h': '2~3시간',
  over3h: '3시간 이상',
};

export const COUNSELOR_LABELS: Record<LearningCounselor, string> = {
  friend: '친구',
  teacher: '선생님',
  family: '가족',
  counselor: '상담 전문가',
  etc: '기타',
};

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
