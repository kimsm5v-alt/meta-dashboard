import { useSyncExternalStore, useCallback } from 'react';
import { getAuth } from '@shared/lib/authClient';
import type { AuthUser } from '@shared/lib/authClient';

/**
 * SuperPlatform Auth SDK 기반 React 훅.
 * useSyncExternalStore로 SDK의 인증 상태를 React 상태와 동기화한다.
 */
export function useSpAuth() {
  const auth = getAuth();

  const user = useSyncExternalStore<AuthUser | null>(
    (cb) => auth.onAuthChange(cb),
    () => auth.getUser(),
  );

  return {
    user,
    isAuthenticated: user !== null,
    login: useCallback(
      (redirectPath?: string) => auth.login({ redirectPath }),
      [auth],
    ),
    logout: useCallback(() => auth.logout(), [auth]),
    getAccessToken: useCallback(() => auth.getAccessToken(), [auth]),
    refreshAccessToken: useCallback(() => auth.refreshAccessToken(), [auth]),
  };
}
