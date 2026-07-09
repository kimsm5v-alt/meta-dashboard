/**
 * Feature Flags
 * - 기능별 활성화/비활성화 설정
 * - 배포 시 특정 기능 숨김 처리에 사용
 *
 * @updated 2026-07-09 - 신규 IA (4안) 기준 개편
 */

export const FEATURES = {
  // ============================================================
  // 신규 IA (V2) - GNB 메뉴 기준
  // ============================================================

  /** [GNB] 홈 */
  HOME: true,

  /** [GNB] 검사 > 검사관리 */
  EXAM_MANAGEMENT: true,

  /** [GNB] 검사 > 결과보기 */
  EXAM_RESULT: true,

  /** [GNB] 검사 > 변화추적 */
  EXAM_TRACKING: true,

  /** [GNB] 상담·코칭 > 학생 상담 */
  COUNSELING: true,

  /** [GNB] 상담·코칭 > 코칭 */
  COACHING: true,

  /** [GNB] 수업 > 수업 자료실 */
  LESSON_RESOURCES: true,

  /** [GNB] 수업 > 나의 수업 */
  MY_LESSON: true,

  /** [GNB] AI어시스턴트 */
  AI_ASSISTANT: true,

  /** [LNB] 그룹관리 */
  GROUP_MANAGEMENT: true,

  // ============================================================
  // 레거시 (호환성 유지) - 향후 제거 예정
  // ============================================================

  /** @deprecated 대시보드 → EXAM_RESULT로 대체 */
  DASHBOARD: true,

  /** @deprecated AI Room → AI_ASSISTANT로 대체 */
  AI_ROOM: true,

  /** @deprecated 상담일정 → COUNSELING으로 대체 */
  SCHEDULE: true,

  /** @deprecated 상담 대시보드 → COACHING으로 대체 */
  COUNSELING_DASHBOARD: false,

  /** @deprecated 검사 관리 → EXAM_MANAGEMENT로 대체 */
  ASSESSMENT: true,

  /** @deprecated 그룹 관리 → GROUP_MANAGEMENT로 대체 */
  GROUPS: true,

  /** @deprecated 커뮤니티 (V2에서 제거) */
  COMMUNITY: false,

  /** @deprecated 자료실 → LESSON_RESOURCES로 대체 */
  RESOURCES: true,
} as const;

export type FeatureKey = keyof typeof FEATURES;

/** 특정 기능이 활성화되어 있는지 확인 */
export const isFeatureEnabled = (feature: FeatureKey): boolean => {
  return FEATURES[feature];
};
