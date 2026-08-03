/**
 * Feature Flags
 * - 기능별 활성화/비활성화 설정
 * - 배포 시 특정 기능 숨김 처리에 사용
 */

export const FEATURES = {
  /** v2 정보구조(GNB + scope LNB). 점진 전환 완료 전까지 기본 비활성화 */
  IA_V2: false,

  /** 대시보드 (L1, L2, L3) */
  DASHBOARD: true,

  /** AI Room */
  AI_ROOM: true,

  /** 상담일정 */
  SCHEDULE: true,

  /** 상담 대시보드 - 3월 배포 제외 */
  COUNSELING_DASHBOARD: false,

  /** 검사 관리 */
  ASSESSMENT: true,

  /** 그룹 관리 */
  GROUPS: true,

  /** 커뮤니티 - HSJ-36: 1차 고도화 버전, MVP 제외 */
  COMMUNITY: false,

  /** 자료실 - HSJ-36: 1차 고도화 버전, MVP 제외 */
  RESOURCES: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

/** 특정 기능이 활성화되어 있는지 확인 */
export const isFeatureEnabled = (feature: FeatureKey): boolean => {
  return FEATURES[feature];
};
