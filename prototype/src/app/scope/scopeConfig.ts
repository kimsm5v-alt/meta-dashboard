/**
 * 스코프 설정 및 타입 정의
 * LNB 아코디언 트리의 스코프 레벨 및 메뉴별 지원 매트릭스
 */

// ============================================
// 스코프 타입 정의
// ============================================

export type ScopeLevel = 'all' | 'class' | 'student';

export interface Scope {
  level: ScopeLevel;
  classId?: string;
  studentId?: string;
}

export interface ScopeMemory {
  current: Scope;
  /** 마지막으로 선택된 studentId (학생 레벨 미지원 메뉴로 이동 시 보존) */
  lastStudentId?: string;
  /** 마지막으로 선택된 classId (전체로 이동 시 보존) */
  lastClassId?: string;
}

// ============================================
// 메뉴별 스코프 지원 설정
// ============================================

export interface MenuScopeConfig {
  all: boolean;
  class: boolean;
  student: boolean;
}

export type MenuKey = string;

/**
 * 메뉴별 스코프 지원 매트릭스
 *
 * | 1depth | 2depth     | 전체 | 반 | 학생 |
 * |--------|------------|------|-----|------|
 * | 검사   | 검사관리   | O    | O   | X    |
 * | 검사   | 결과보기   | O    | O   | O    |
 * | 검사   | 학생 상담  | O    | O   | O    |
 * | 검사   | 변화추적   | O    | O   | O    |
 * | 코칭   | 학급코칭   | O    | O   | X    |
 * | 코칭   | 개별코칭   | O    | X   | O    |
 * | 수업   | 자료실     | O    | O   | X    |
 * | 수업   | 나의 수업  | O    | O   | X    |
 */
export const MENU_SCOPE_MATRIX: Record<MenuKey, MenuScopeConfig> = {
  // 검사
  'exam/management': { all: true, class: true, student: false },
  'exam/result': { all: true, class: true, student: true },
  'exam/counseling': { all: true, class: true, student: true },
  'exam/tracking': { all: true, class: true, student: true },
  'exam/record': { all: true, class: true, student: true },
  // 코칭 - 둘 다 전체 표시, 클릭 시 메뉴 자동 전환
  'coaching/class': { all: true, class: true, student: true },
  'coaching/individual': { all: true, class: true, student: true },
  // 수업
  'lesson/resources': { all: true, class: true, student: false },
  'lesson/my-lessons': { all: true, class: true, student: false },
  // 기본값 (홈, 그룹관리 등)
  'home': { all: true, class: true, student: false },
  'group-management': { all: true, class: true, student: false },
  'ai-assistant': { all: true, class: true, student: true },
};

/** 기본 스코프 설정 (매트릭스에 없는 메뉴용) */
export const DEFAULT_SCOPE_CONFIG: MenuScopeConfig = {
  all: true,
  class: true,
  student: false,
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * pathname에서 메뉴 키 추출
 * 예: '/exam/result' → 'exam/result'
 */
export function getMenuKeyFromPath(pathname: string): MenuKey {
  // '/exam/result' → 'exam/result'
  const normalized = pathname.startsWith('/') ? pathname.slice(1) : pathname;

  // 정확한 매칭 시도
  if (MENU_SCOPE_MATRIX[normalized]) {
    return normalized;
  }

  // 부분 매칭 (예: '/exam/result/detail' → 'exam/result')
  const parts = normalized.split('/');
  if (parts.length >= 2) {
    const key = `${parts[0]}/${parts[1]}`;
    if (MENU_SCOPE_MATRIX[key]) {
      return key;
    }
  }

  // 1depth만 있는 경우
  if (parts.length >= 1 && MENU_SCOPE_MATRIX[parts[0]]) {
    return parts[0];
  }

  return 'home';
}

/**
 * 메뉴 키로 스코프 설정 조회
 */
export function getMenuScopeConfig(menuKey: MenuKey): MenuScopeConfig {
  return MENU_SCOPE_MATRIX[menuKey] ?? DEFAULT_SCOPE_CONFIG;
}

/**
 * 초기 스코프 상태
 */
export const INITIAL_SCOPE: Scope = {
  level: 'all',
};

/**
 * 초기 스코프 메모리
 */
export const INITIAL_SCOPE_MEMORY: ScopeMemory = {
  current: INITIAL_SCOPE,
};
