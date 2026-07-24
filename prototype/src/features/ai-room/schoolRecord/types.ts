/**
 * 생활기록부(행동특성 및 종합의견) 작성 지원 - 타입
 * @see docs/FEATURES_proto 260724.md §12.1
 */

export type SchoolLevel = '초등' | '중등' | '고등';
export type FactorCategory = 'strength' | 'improvement';

export type DraftStatus = 'EMPTY' | 'INPUTTING' | 'GENERATING' | 'DRAFT' | 'EDITED' | 'FAILED';
export type GenerationSource = 'TEST_ONLY' | 'COMMON_CONTEXT' | 'INDIVIDUAL_OBSERVATION';

/** 교사 관찰 입력 */
export interface ObservationInput {
  factorCodes: string[];
  situationCodes: string[];
  behaviorCodes: string[];
  continuityCode?: string;
  freeText?: string;
  /** 문구 생성에 반영할 상담 기록 id */
  counselingRefs?: string[];
}

/** 상담·관찰 기록 (참고 데이터) */
export interface CounselingRecord {
  id: string;
  date: string;
  category: string;
  summary: string;
}

/** 학급 (복수 학급 구성) */
export interface RecordClass {
  id: string;
  /** 그룹명 (기본 표기) */
  group: string;
  /** 학년·반 (그룹명 옆 배지 표기) */
  name: string;
  schoolLevel: SchoolLevel;
  students: RecordStudent[];
}

/** 학생 (작성 현황 + 작성 상태 포함) */
export interface RecordStudent {
  id: string;
  no: number;
  name: string;
  className: string;
  schoolLevel: SchoolLevel;
  lpaType: string;
  strengths: string[]; // 강점 TOP3 요인명
  improvements: string[]; // 보완 TOP3 요인명
  status: DraftStatus;
  input: ObservationInput;
  generatedText?: string;
  savedText?: string;
  previousSavedText?: string;
  savedAt?: string;
  source?: GenerationSource;
}

/** 요인 메타 (설명·관찰질문·추천행동) */
export interface FactorInfo {
  description: string;
  question: string;
  recommendedBehaviors: string[];
}
