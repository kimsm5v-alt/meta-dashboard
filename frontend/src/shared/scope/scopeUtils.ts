/**
 * 메뉴 이동과 스코프 값 처리에 사용하는 순수 유틸리티입니다.
 */

import type { MenuScopeConfig, Scope, ScopeMemory } from './scopeConfig';

export function adjustScopeForMenu(
  currentScope: Scope,
  menuConfig: MenuScopeConfig,
  scopeMemory: ScopeMemory,
): { adjustedScope: Scope; updatedMemory: ScopeMemory } {
  const { level, classId, studentId } = currentScope;
  let adjustedScope: Scope = { ...currentScope };
  const updatedMemory: ScopeMemory = { ...scopeMemory };

  if (level === 'all' && menuConfig.all) {
    updatedMemory.current = adjustedScope;
    return { adjustedScope, updatedMemory };
  }
  if (level === 'class' && menuConfig.class) {
    updatedMemory.current = adjustedScope;
    updatedMemory.lastClassId = classId;
    return { adjustedScope, updatedMemory };
  }
  if (level === 'student' && menuConfig.student) {
    updatedMemory.current = adjustedScope;
    updatedMemory.lastClassId = classId;
    updatedMemory.lastStudentId = studentId;
    return { adjustedScope, updatedMemory };
  }

  if (level === 'student' && !menuConfig.student) {
    if (studentId) {
      updatedMemory.lastStudentId = studentId;
    }
    if (classId) {
      updatedMemory.lastClassId = classId;
    }

    adjustedScope = menuConfig.class && classId ? { level: 'class', classId } : { level: 'all' };
    updatedMemory.current = adjustedScope;
    return { adjustedScope, updatedMemory };
  }

  if (level === 'class' && !menuConfig.class) {
    if (classId) {
      updatedMemory.lastClassId = classId;
    }

    if (
      menuConfig.student &&
      classId &&
      scopeMemory.lastClassId === classId &&
      scopeMemory.lastStudentId
    ) {
      adjustedScope = {
        level: 'student',
        classId,
        studentId: scopeMemory.lastStudentId,
      };
    } else {
      adjustedScope = { level: 'all' };
    }

    updatedMemory.current = adjustedScope;
    return { adjustedScope, updatedMemory };
  }

  updatedMemory.current = { level: 'all' };
  return { adjustedScope: { level: 'all' }, updatedMemory };
}

export function isValidScope(
  scope: Scope,
  validClassIds: string[],
  validStudentIds?: string[],
): boolean {
  if (scope.level === 'all') {
    return true;
  }

  if (scope.level === 'class') {
    return !!scope.classId && validClassIds.includes(scope.classId);
  }

  if (scope.level === 'student') {
    const classValid = !!scope.classId && validClassIds.includes(scope.classId);
    const studentValid =
      !validStudentIds || (!!scope.studentId && validStudentIds.includes(scope.studentId));
    return classValid && studentValid;
  }

  return false;
}

export function isScopeEqual(a: Scope, b: Scope): boolean {
  if (a.level !== b.level) return false;
  if (a.classId !== b.classId) return false;
  if (a.studentId !== b.studentId) return false;
  return true;
}

export function isScopeMemoryEqual(a: ScopeMemory, b: ScopeMemory): boolean {
  return (
    isScopeEqual(a.current, b.current) &&
    a.lastClassId === b.lastClassId &&
    a.lastStudentId === b.lastStudentId
  );
}

export function getClassIdFromScope(scope: Scope): string | undefined {
  if (scope.level === 'class' || scope.level === 'student') {
    return scope.classId;
  }
  return undefined;
}

export function getStudentIdFromScope(scope: Scope): string | undefined {
  if (scope.level === 'student') {
    return scope.studentId;
  }
  return undefined;
}

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
