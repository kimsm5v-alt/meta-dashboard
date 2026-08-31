/**
 * 학습전략검사 결과 리포트 타입 정의
 */

/** 점수 기본 타입 */
export type Score = {
  t: number;
  percentile: number;
};

/** 대분류 결과 (카드용) */
export type DomainResult = Score & {
  /** 카드 하단 해설문. 백엔드 제공. 프론트에서 생성/가공 금지 */
  description: string;
};

/** 리포트 전체 데이터 */
export interface ReportData {
  /** 대분류 3개 (카드용) */
  domains: {
    motivation: DomainResult;   // 동기전략
    cognitive: DomainResult;    // 인지전략
    behavioral: DomainResult;   // 행동전략
  };
  /** 소분류 6개 (레이더 차트용) */
  subscales: {
    learningDrive: Score;       // 학습원동력
    emotionRegulation: Score;   // 정서조절
    metacognition: Score;       // 메타인지
    cognitiveSkill: Score;      // 인지적 학습기술
    behaviorRegulation: Score;  // 행동조절
    behavioralSkill: Score;     // 행동적 학습기술
  };
}

/** 등급 타입 */
export type LevelType = '매우 높음' | '높음' | '보통' | '낮음' | '매우 낮음';

/** 대분류 키 */
export type DomainKey = 'motivation' | 'cognitive' | 'behavioral';

/** 소분류 키 */
export type SubscaleKey = keyof ReportData['subscales'];
