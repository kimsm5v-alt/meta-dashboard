import type { StudentType } from '@shared/types';

/** 심화코칭 1건(제목+리드+실천단계 4개). */
export interface AdvancedStrategy {
  title: string;
  description: string;
  actionItems: string[];
}

/**
 * LPA 유형 1개의 학급전략 콘텐츠.
 * 출처: 학급전략DB_최종확정_v1.0_260721_JE.pdf(유형ID·유형명·섹션·항목·순번·내용 스키마).
 */
export interface LPATypeStrategy {
  /** [유형특징 > 본문] */
  characteristics: string;
  /** [대표전략 > 제목] */
  strategyTitle: string;
  /** [대표전략 > 리드] STEP1에만 노출 */
  strategyDescription: string;
  /** [대표전략 > 단계] 순서 고정 — 1:수업 도입부, 2:학급 운영, 3:교사의 말·피드백 */
  actionItems: string[];
  /** [관찰지표 > 2주 관찰 지표] 3건, STEP1에만 노출 */
  successIndicators: string[];
  /** [타유형영향 > 운영 유의점] 모든 STEP 카드에 노출 */
  noteForOtherTypes: string;
  /** [심화코칭1, 심화코칭2] STEP1 카드 접이식 */
  advancedStrategies: [AdvancedStrategy, AdvancedStrategy];
}

/** 반 학생 수 기준 순위 1건. */
export interface RankedType {
  type: StudentType;
  count: number;
}
