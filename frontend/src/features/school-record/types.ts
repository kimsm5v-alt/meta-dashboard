export type DraftStatus = 'EMPTY' | 'INPUTTING' | 'GENERATING' | 'DRAFT' | 'EDITED' | 'FAILED';
export type GenerationSource = 'TEST_ONLY' | 'COMMON_CONTEXT' | 'INDIVIDUAL_OBSERVATION';
export type FactorPolarity = 'strength' | 'improvement';

/** 서버 status 코드(§3-1) ↔ 내부 DraftStatus. EMPTY는 서버에 행이 없는 상태(프런트 전용, 절대 전송하지 않음). */
export const DRAFT_STATUS_CODE: Record<Exclude<DraftStatus, 'EMPTY'>, string> = {
  INPUTTING: '1',
  GENERATING: '2',
  DRAFT: '3',
  EDITED: '4',
  FAILED: '5',
};

export const DRAFT_STATUS_FROM_CODE: Record<string, DraftStatus> = {
  '1': 'INPUTTING',
  '2': 'GENERATING',
  '3': 'DRAFT',
  '4': 'EDITED',
  '5': 'FAILED',
};

/** 요인 메타 — 설명·관찰질문·추천행동(38개 요인 전체) */
export interface FactorInfo {
  description: string;
  question: string;
  recommendedBehaviors: string[];
}

export interface SituationOption {
  code: string;
  label: string;
}

export interface ContinuityOption {
  code: string;
  label: string;
}

/** 관찰 블록 1개 — 선택한 요인 1개 + 그 요인에서 체크한 행동 */
export interface ObservationEntry {
  factor: string;
  type: FactorPolarity;
  behaviorCodes: string[];
}

/** 저장 API에 보내는 observationInput 형태 (FE 가이드 §3-3) */
export interface ObservationPayload {
  observations: ObservationEntry[];
  freeText: string;
  counselingRefs: string[];
}

/** GET /api/school-records/class/{classId} 응답 1건 (경량 리스트) */
export interface RecordDraftSummary {
  studentId: string;
  status: DraftStatus;
  strengths: string[] | null;
  improvements: string[] | null;
  savedAt: string | null;
}

/** GET /api/school-records/student/{studentId}/draft 응답 */
export interface RecordDraftDetail {
  id: number;
  studentId: string;
  classId: string;
  status: DraftStatus;
  source: GenerationSource | null;
  content: string | null;
  previousContent: string | null;
  generatedText: string | null;
  strengths: string[] | null;
  improvements: string[] | null;
  observationInput: ObservationPayload | null;
  createdAt: string;
  savedAt: string;
}

export interface StudentProfileItem {
  factorName: string;
  avgT: number;
  isPositive: boolean;
}

export interface StudentProfile {
  strengths: StudentProfileItem[];
  weaknesses: StudentProfileItem[];
}

/** 상담·관찰 기록 참고 옵션 (useStudentCounselingRecordsQuery + useStudentMemosQuery 병합 결과) */
export interface CounselingRefOption {
  id: string;
  date: string;
  category: string;
  summary: string;
}
