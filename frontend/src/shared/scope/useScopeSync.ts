/**
 * URL 쿼리와 애플리케이션 스코프를 양방향으로 동기화합니다.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import type { Scope } from './scopeConfig';
import { isScopeEqual } from './scopeUtils';

interface UseScopeSyncOptions {
  scope: Scope;
  setScope: (scope: Scope) => void;
  enabled?: boolean;
}

interface UseScopeSyncReturn {
  parseScopeFromURL: () => Scope;
  updateURL: (scope: Scope) => void;
}

export function useScopeSync({
  scope,
  setScope,
  enabled = true,
}: UseScopeSyncOptions): UseScopeSyncReturn {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isSyncingRef = useRef(false);
  const lastScopeRef = useRef<Scope>(scope);

  const parseScopeFromURL = useCallback((): Scope => {
    const classId = searchParams.get('class');
    const studentId = searchParams.get('student');

    if (studentId && classId) {
      return { level: 'student', classId, studentId };
    }
    if (classId) {
      return { level: 'class', classId };
    }
    return { level: 'all' };
  }, [searchParams]);

  const updateURL = useCallback(
    (newScope: Scope) => {
      if (!enabled) return;

      const params = new URLSearchParams(searchParams);
      params.delete('class');
      params.delete('student');

      if (newScope.classId) {
        params.set('class', newScope.classId);
      }
      if (newScope.studentId) {
        params.set('student', newScope.studentId);
      }

      const newSearch = params.toString();
      const currentSearch = searchParams.toString();

      if (newSearch !== currentSearch) {
        isSyncingRef.current = true;
        void navigate(
          {
            pathname: location.pathname,
            search: newSearch ? `?${newSearch}` : '',
          },
          { replace: true },
        );
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 0);
      }
    },
    [enabled, searchParams, navigate, location.pathname],
  );

  useEffect(() => {
    if (!enabled) return;
    if (isSyncingRef.current) return;

    const urlScope = parseScopeFromURL();
    if (!isScopeEqual(urlScope, lastScopeRef.current)) {
      lastScopeRef.current = urlScope;
      setScope(urlScope);
    }
  }, [enabled, parseScopeFromURL, setScope, searchParams]);

  useEffect(() => {
    if (!enabled) return;
    if (isSyncingRef.current) return;

    if (!isScopeEqual(scope, lastScopeRef.current)) {
      lastScopeRef.current = scope;
      updateURL(scope);
    }
  }, [enabled, scope, updateURL]);

  return {
    parseScopeFromURL,
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
