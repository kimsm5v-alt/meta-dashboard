import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, AuthState } from '@shared/types';
import { getAuth } from '@shared/lib/authClient';
import type { AuthUser } from '@shared/lib/authClient';
import { useCaptureStore } from '@shared/store/useCaptureStore';

// ============================================================
// Context 타입 정의
// ============================================================

/** 게스트 로그인 정보 */
interface GuestLoginInfo {
  stdtId: string;
  claId: string;
  groupNm: string;
  email: string;
  accessToken: string;
  guestId?: string;
}

interface AuthContextType extends AuthState {
  /** 게스트 로그인 (토큰 기반) */
  loginAsGuest: (info: GuestLoginInfo) => void;
  /** 사용자 정보 부분 업데이트 */
  updateUser: (updates: Partial<User>) => void;
  /** 로그아웃 — SDK가 Auth 서버 세션까지 삭제 */
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================
// 스토리지 키
// ============================================================

const AUTH_STORAGE_KEY = 'meta_auth_user';

// ============================================================
// Provider 컴포넌트
// ============================================================

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth SDK 기반으로 전환된 AuthProvider.
 *
 * SSO 전환으로 제거된 기능:
 * - loginWithCredentials (테스트 로그인)
 * - loginWithEmail (이메일/비밀번호 로그인) → auth.login()으로 대체
 * - signUp (회원가입) → Auth 서버에서 처리
 * - sendCode / verifyCode (가입용 이메일 인증) → Auth 서버에서 처리
 *
 * SDK의 auth.login()은 Auth 서버로 리다이렉트하므로 AuthContext가 아닌
 * useSpAuth() 훅 또는 getAuth().login()을 직접 사용한다.
 */
// 로그아웃 진행 중 플래그 — SDK clearTokens() → onAuthChange(null) → React re-render 방지
let loggingOut = false;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // SDK 인증 상태와 동기화
  useEffect(() => {
    const auth = getAuth();

    // SDK에서 현재 사용자 가져오기
    const sdkUser = auth.getUser();
    if (sdkUser) {
      const user = mapSdkUserToUser(sdkUser);
      // localStorage에 학심정 서비스 데이터가 있으면 병합
      const storedUser = loadStoredUser();
      // SDK가 Truth — 현재 로그인한 사용자의 name/email이 localStorage 잔존 데이터를 덮어씀
      // A → 로그아웃 → B 로그인 시 A 이름 잔존 방지
      const merged = storedUser ? { ...storedUser, ...user } : user;
      setState({ user: merged, isAuthenticated: true, isLoading: false });
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }

    // SDK 인증 상태 변경 리스너
    const unsubscribe = auth.onAuthChange((sdkUser: AuthUser | null) => {
      // 로그아웃 진행 중이면 React 상태 업데이트 하지 않음
      // (ProtectedLayout → /login → LoginPage auto-login race condition 방지)
      if (loggingOut) return;

      if (sdkUser) {
        const user = mapSdkUserToUser(sdkUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        setState({ user, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return unsubscribe;
  }, []);

  // 게스트 로그인 — SDK setGuestToken 사용
  const loginAsGuest = useCallback((info: GuestLoginInfo) => {
    const auth = getAuth();
    auth.setGuestToken(info.accessToken);

    const user: User = {
      id: info.stdtId,
      spUserId: info.guestId || info.stdtId,
      name: info.email.split('@')[0],
      email: info.email,
      memberType: 'guest',
      provider: 'sso',
      roleCode: 'GUEST',
      stdtId: info.stdtId,
      classId: info.claId,
      userType: 'GUEST',
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  // 사용자 정보 업데이트 (학심정 서비스 데이터)
  const updateUser = useCallback((updates: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...updates };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      return { ...prev, user: updatedUser };
    });
  }, []);

  // 로그아웃 — SDK가 Auth 서버 SSO 세션까지 삭제
  const logout = useCallback(() => {
    // 플래그 설정: SDK clearTokens() → onAuthChange(null) 시 React re-render 방지
    // 이 플래그가 없으면 ProtectedLayout → /login → LoginPage auto-login이
    // SDK의 /oauth2/logout 리다이렉트보다 먼저 실행되어 로그아웃이 안 됨
    loggingOut = true;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // 사용자 전환(A 로그아웃 → B 로그인) 시 stale 프로필 캐시 노출 방지
    queryClient.removeQueries({ queryKey: ['profile-status'] });
    // 이전 사용자가 첨부 대기 중이던 캡처 이미지가 다음 사용자 세션으로 넘어가지 않도록 초기화
    useCaptureStore.getState().reset();
    const auth = getAuth();
    auth.logout(); // 브라우저 리다이렉트 발생 (페이지 이동 후 플래그 자동 리셋)
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginAsGuest,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// 헬퍼
// ============================================================

function mapSdkUserToUser(sdkUser: AuthUser): User {
  return {
    id: sdkUser.publicUserId,
    spUserId: sdkUser.publicUserId,
    name: sdkUser.name,
    email: sdkUser.email,
    memberType: sdkUser.userType === 'GUEST' ? 'guest' : 'general',
    provider: 'sso',
    userType: sdkUser.userType,
    roleCode: sdkUser.userType, // TEACHER/STUDENT — useProfileCheck에서 정확한 값으로 덮어씀
  };
}

function loadStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

// ============================================================
// Hook
// ============================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
