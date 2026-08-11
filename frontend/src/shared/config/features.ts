/**
 * Feature Flags
 * - 기능별 활성화/비활성화 설정
 * - 배포 시 특정 기능 숨김 처리에 사용
 */

/** 개발/스테이징 환경에서 기획자 검수용으로 IA_V2를 브라우저에서 직접 켜고 끌 수 있게 하는 localStorage 오버라이드 키 */
export const IA_V2_OVERRIDE_KEY = 'IA_V2_OVERRIDE';

const readIaV2Override = (): boolean | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(IA_V2_OVERRIDE_KEY);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
};

const IA_V2_DEFAULT = true;

export const FEATURES = {
  /** v2 정보구조(GNB + scope LNB). 점진 전환 완료 전까지 기본 비활성화. 개발/스테이징에서는 IaV2Toggle로 localStorage 오버라이드 가능(IaV2Toggle.tsx 참고) */
  IA_V2: readIaV2Override() ?? IA_V2_DEFAULT,

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
