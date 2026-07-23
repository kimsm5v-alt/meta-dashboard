/**
 * URL 동기화 훅
 * useSearchParams를 사용하여 URL ↔ 스코프 양방향 동기화
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import type { Scope } from './scopeConfig';
import { isScopeEqual } from './scopeUtils';

interface UseScopeSyncOptions {
  /** 현재 스코프 상태 */
  scope: Scope;
  /** 스코프 변경 함수 */
  setScope: (scope: Scope) => void;
  /** URL 동기화 활성화 여부 (기본: true) */
  enabled?: boolean;
}

interface UseScopeSyncReturn {
  /** URL에서 스코프 파싱 */
  parseScopeFromURL: () => Scope;
  /** 스코프를 URL에 반영 */
  updateURL: (scope: Scope) => void;
}

/**
 * URL ↔ 스코프 동기화 훅
 *
 * URL 형식: /exam/result?class=group-2&student=s1
 */
export function useScopeSync({
  scope,
  setScope,
  enabled = true,
}: UseScopeSyncOptions): UseScopeSyncReturn {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // 내부 동기화 중인지 추적 (무한 루프 방지)
  const isSyncingRef = useRef(false);
  const lastScopeRef = useRef<Scope>(scope);

  /**
   * URL에서 스코프 파싱
   */
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

  /**
   * 스코프를 URL에 반영
   */
  const updateURL = useCallback(
    (newScope: Scope) => {
      if (!enabled) return;

      const params = new URLSearchParams(searchParams);

      // 기존 스코프 파라미터 제거
      params.delete('class');
      params.delete('student');

      // 새 스코프 파라미터 추가
      if (newScope.classId) {
        params.set('class', newScope.classId);
      }
      if (newScope.studentId) {
        params.set('student', newScope.studentId);
      }

      const newSearch = params.toString();
      const currentSearch = searchParams.toString();

      // 검색 파라미터가 변경된 경우에만 navigate
      if (newSearch !== currentSearch) {
        isSyncingRef.current = true;
        navigate(
          {
            pathname: location.pathname,
            search: newSearch ? `?${newSearch}` : '',
          },
          { replace: true }
        );
        // 다음 틱에서 동기화 플래그 해제
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 0);
      }
    },
    [enabled, searchParams, navigate, location.pathname]
  );

  // URL 변경 감지 → 스코프 업데이트 (초기 로드 및 브라우저 뒤로가기)
  useEffect(() => {
    if (!enabled) return;
    if (isSyncingRef.current) return;

    const urlScope = parseScopeFromURL();

    // URL의 스코프와 현재 스코프가 다른 경우에만 업데이트
    if (!isScopeEqual(urlScope, lastScopeRef.current)) {
      lastScopeRef.current = urlScope;
      setScope(urlScope);
    }
  }, [enabled, parseScopeFromURL, setScope, searchParams]);

  // 스코프 변경 → URL 업데이트
  useEffect(() => {
    if (!enabled) return;
    if (isSyncingRef.current) return;

    // 스코프가 변경된 경우에만 URL 업데이트
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

/**
 * URL 쿼리 파라미터 빌더
 */
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

/**
 * URL에서 스코프 파라미터 추출 (정적 함수)
 */
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
