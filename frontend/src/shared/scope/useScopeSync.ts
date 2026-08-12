/**
 * URL 쿼리와 애플리케이션 스코프를 양방향으로 동기화합니다.
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { Scope } from './scopeConfig';

interface UseScopeSyncReturn {
  urlScope: Scope;
  updateURL: (scope: Scope) => void;
}

export function useScopeSync(): UseScopeSyncReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const serializedSearchParams = searchParams.toString();
  const urlScope = useMemo(
    () => parseScopeFromSearchParams(new URLSearchParams(serializedSearchParams)),
    [serializedSearchParams],
  );

  const updateURL = useCallback(
    (newScope: Scope) => {
      const params = new URLSearchParams(serializedSearchParams);
      params.delete('class');
      params.delete('student');

      if (newScope.classId) {
        params.set('class', newScope.classId);
      }
      if (newScope.studentId) {
        params.set('student', newScope.studentId);
      }

      if (params.toString() !== serializedSearchParams) {
        void setSearchParams(params, { replace: true });
      }
    },
    [serializedSearchParams, setSearchParams],
  );

  return {
    urlScope,
    updateURL,
  };
}

export function buildScopeQueryString(scope: Scope): string {
  const params = new URLSearchParams();

  if (scope.classId) {
    params.set('class', scope.classId);
  }
  if (scope.studentId) {
    params.set('student', scope.studentId);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export function parseScopeFromSearchParams(searchParams: URLSearchParams): Scope {
  const classId = searchParams.get('class');
  const studentId = searchParams.get('student');

  if (studentId && classId) {
    return { level: 'student', classId, studentId };
  }
  if (classId) {
    return { level: 'class', classId };
  }
  return { level: 'all' };
}
