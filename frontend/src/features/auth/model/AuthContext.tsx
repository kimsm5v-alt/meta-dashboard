import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState } from '@shared/types';
import { getAuth } from '@shared/lib/authClient';
import type { AuthUser } from '@shared/lib/authClient';

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
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
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
      const merged = storedUser ? { ...user, ...storedUser, ...user } : user;
      setState({ user: merged, isAuthenticated: true, isLoading: false });
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }

    // SDK 인증 상태 변경 리스너
    const unsubscribe = auth.onAuthChange((sdkUser: AuthUser | null) => {
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
    localStorage.removeItem(AUTH_STORAGE_KEY);
    const auth = getAuth();
    auth.logout(); // 브라우저 리다이렉트 발생
  }, []);

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
