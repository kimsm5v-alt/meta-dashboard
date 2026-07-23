/**
 * 스코프 모듈 진입점
 */

// 타입 및 설정
export type { Scope, ScopeLevel, ScopeMemory, MenuScopeConfig, MenuKey } from './scopeConfig';
export {
  MENU_SCOPE_MATRIX,
  DEFAULT_SCOPE_CONFIG,
  INITIAL_SCOPE,
  INITIAL_SCOPE_MEMORY,
  getMenuKeyFromPath,
  getMenuScopeConfig,
} from './scopeConfig';

// 유틸리티 함수
export {
  adjustScopeForMenu,
  isValidScope,
  isScopeEqual,
  getClassIdFromScope,
  getStudentIdFromScope,
  getScopeLevelLabel,
} from './scopeUtils';

// URL 동기화 훅
export {
  useScopeSync,
  buildScopeQueryString,
  parseScopeFromSearchParams,
} from './useScopeSync';
