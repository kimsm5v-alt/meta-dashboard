/**
 * 애플리케이션 스코프와 메뉴별 지원 범위를 정의합니다.
 */

export type ScopeLevel = 'all' | 'class' | 'student';

export interface Scope {
  level: ScopeLevel;
  classId?: string;
  studentId?: string;
}

export interface ScopeMemory {
  current: Scope;
  /** 학생 범위를 지원하지 않는 메뉴로 이동해도 마지막 학생 선택을 기억합니다. */
  lastStudentId?: string;
  /** 전체 범위로 이동해도 마지막 학급 선택을 기억합니다. */
  lastClassId?: string;
}

export interface MenuScopeConfig {
  all: boolean;
  class: boolean;
  student: boolean;
}

export type MenuKey =
  | 'exam/management'
  | 'exam/result'
  | 'exam/tracking'
  | 'coaching/class'
  | 'coaching/individual'
  | 'lesson'
  | 'home'
  | 'group-management'
  | 'ai-assistant';

export const MENU_SCOPE_MATRIX: Record<MenuKey, MenuScopeConfig> = {
  // 검사
  'exam/management': { all: true, class: true, student: false },
  'exam/result': { all: true, class: true, student: true },
  'exam/tracking': { all: true, class: true, student: true },
  // 코칭
  'coaching/class': { all: true, class: true, student: false },
  'coaching/individual': { all: true, class: false, student: true },
  // 수업 (separate FE team owns this; sub-tab keys to be split later. Single key for now, no student level)
  lesson: { all: true, class: true, student: false },
  // 기타
  home: { all: true, class: true, student: false },
  'group-management': { all: true, class: true, student: false },
  'ai-assistant': { all: true, class: true, student: true },
};

/** 매트릭스에 등록되지 않은 메뉴가 사용할 기본 지원 범위입니다. */
export const DEFAULT_SCOPE_CONFIG: MenuScopeConfig = {
  all: true,
  class: true,
  student: false,
};

/**
 * 경로를 가장 가까운 등록 메뉴 키로 변환합니다.
 * 상세 경로는 먼저 2-depth, 이어서 1-depth 메뉴에 부분 매칭합니다.
 */
export function getMenuKeyFromPath(pathname: string): MenuKey {
  const normalized = pathname.startsWith('/') ? pathname.slice(1) : pathname;

  if (normalized in MENU_SCOPE_MATRIX) {
    return normalized as MenuKey;
  }

  const parts = normalized.split('/');
  if (parts.length >= 2) {
    const nestedKey = `${parts[0]}/${parts[1]}`;
    if (nestedKey in MENU_SCOPE_MATRIX) {
      return nestedKey as MenuKey;
    }
  }

  const rootKey = parts[0];
  if (rootKey && rootKey in MENU_SCOPE_MATRIX) {
    return rootKey as MenuKey;
  }

  return 'home';
}

export function getMenuScopeConfig(menuKey: MenuKey): MenuScopeConfig {
  return MENU_SCOPE_MATRIX[menuKey] ?? DEFAULT_SCOPE_CONFIG;
}

export const INITIAL_SCOPE: Scope = {
  level: 'all',
};

export const INITIAL_SCOPE_MEMORY: ScopeMemory = {
  current: INITIAL_SCOPE,
};
