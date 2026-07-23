/**
 * 스코프 유틸리티 함수
 * 메뉴 변경 시 스코프 자동 조정 로직
 */

import type { Scope, ScopeMemory, MenuScopeConfig } from './scopeConfig';

/**
 * 메뉴 변경 시 스코프 자동 조정
 *
 * 규칙:
 * 1. 현재 레벨이 메뉴에서 지원됨 → 유지
 * 2. student 레벨인데 미지원 → class로 조정 (studentId는 메모리에 보존)
 * 3. class 레벨인데 미지원 (개별코칭) → student로 조정 (메모리에서 복원 시도)
 * 4. all 레벨은 항상 지원
 */
export function adjustScopeForMenu(
  currentScope: Scope,
  menuConfig: MenuScopeConfig,
  scopeMemory: ScopeMemory
): { adjustedScope: Scope; updatedMemory: ScopeMemory } {
  const { level, classId, studentId } = currentScope;
  let adjustedScope: Scope = { ...currentScope };
  const updatedMemory: ScopeMemory = { ...scopeMemory };

  // Case 1: 현재 레벨이 메뉴에서 지원됨 → 유지
  if (level === 'all' && menuConfig.all) {
    return { adjustedScope, updatedMemory };
  }
  if (level === 'class' && menuConfig.class) {
    return { adjustedScope, updatedMemory };
  }
  if (level === 'student' && menuConfig.student) {
    return { adjustedScope, updatedMemory };
  }

  // Case 2: student 레벨인데 미지원 → class로 조정
  if (level === 'student' && !menuConfig.student) {
    // studentId를 메모리에 보존
    if (studentId) {
      updatedMemory.lastStudentId = studentId;
    }
    if (classId) {
      updatedMemory.lastClassId = classId;
    }

    if (menuConfig.class && classId) {
      adjustedScope = { level: 'class', classId };
    } else {
      adjustedScope = { level: 'all' };
    }
    updatedMemory.current = adjustedScope;
    return { adjustedScope, updatedMemory };
  }

  // Case 3: class 레벨인데 미지원 (개별코칭 같은 경우)
  if (level === 'class' && !menuConfig.class) {
    // classId를 메모리에 보존
    if (classId) {
      updatedMemory.lastClassId = classId;
    }

    // 메모리에 저장된 studentId 복원 시도
    if (menuConfig.student && classId && scopeMemory.lastStudentId) {
      adjustedScope = {
        level: 'student',
        classId,
        studentId: scopeMemory.lastStudentId,
      };
    } else if (menuConfig.student && classId) {
      // studentId 없으면 all로 (학생 선택 필요)
      adjustedScope = { level: 'all' };
    } else {
      adjustedScope = { level: 'all' };
    }
    updatedMemory.current = adjustedScope;
    return { adjustedScope, updatedMemory };
  }

  // 기본값: all로 폴백
  updatedMemory.current = { level: 'all' };
  return { adjustedScope: { level: 'all' }, updatedMemory };
}

/**
 * 스코프가 유효한지 검증
 * classId/studentId가 실제 존재하는지 확인 필요 시 사용
 */
export function isValidScope(
  scope: Scope,
  validClassIds: string[],
  validStudentIds?: string[]
): boolean {
  if (scope.level === 'all') {
    return true;
  }

  if (scope.level === 'class') {
    return !!scope.classId && validClassIds.includes(scope.classId);
  }

  if (scope.level === 'student') {
    const classValid = !!scope.classId && validClassIds.includes(scope.classId);
    const studentValid = !validStudentIds || (!!scope.studentId && validStudentIds.includes(scope.studentId));
    return classValid && studentValid;
  }

  return false;
}

/**
 * 두 스코프가 동일한지 비교
 */
export function isScopeEqual(a: Scope, b: Scope): boolean {
  if (a.level !== b.level) return false;
  if (a.classId !== b.classId) return false;
  if (a.studentId !== b.studentId) return false;
  return true;
}

/**
 * 스코프에서 선택된 classId 추출 (class 또는 student 레벨)
 */
export function getClassIdFromScope(scope: Scope): string | undefined {
  if (scope.level === 'class' || scope.level === 'student') {
    return scope.classId;
  }
  return undefined;
}

/**
 * 스코프에서 선택된 studentId 추출 (student 레벨만)
 */
export function getStudentIdFromScope(scope: Scope): string | undefined {
  if (scope.level === 'student') {
    return scope.studentId;
  }
  return undefined;
}

/**
 * 스코프 레벨별 라벨
 */
export function getScopeLevelLabel(level: Scope['level']): string {
  switch (level) {
    case 'all':
      return '전체';
    case 'class':
      return '반';
    case 'student':
      return '학생';
    default:
      return '전체';
  }
}
