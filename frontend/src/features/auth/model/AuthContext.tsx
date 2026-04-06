import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState } from '@shared/types';
import { MOCK_TEACHER } from '@shared/data/mockData';
import { apiClient } from '@shared/api/client';
import type { TestCredentials } from '../ui';

// ============================================================
// Context 타입 정의
// ============================================================

interface SignUpData {
  name: string;
  email: string;
  password: string;
  gender?: 'M' | 'F';
  roleCode: 'TEACHER' | 'STUDENT';
}

/** 게스트 로그인 정보 */
interface GuestLoginInfo {
  stdtId: string;
  claId: string;
  groupNm: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType extends AuthState {
  /** 테스트 로그인 (credentials 저장) */
  loginWithCredentials: (credentials: TestCredentials) => Promise<void>;
  /** 이메일/비밀번호 로그인 */
  loginWithEmail: (email: string, password: string) => Promise<void>;
  /** 게스트 로그인 (토큰 기반) */
  loginAsGuest: (info: GuestLoginInfo) => void;
  /** 사용자 정보 부분 업데이트 */
  updateUser: (updates: Partial<User>) => void;
  /** 이메일 인증코드 발송 */
  sendCode: (email: string) => Promise<void>;
  /** 이메일 인증코드 확인 */
  verifyCode: (email: string, code: string) => Promise<void>;
  /** 회원가입 */
  signUp: (data: SignUpData) => Promise<void>;
  /** 로그아웃 */
  logout: () => void;
  /** 테스트용 credentials (API 호출 시 사용) */
  credentials: TestCredentials | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================
// 스토리지 키
// ============================================================

const AUTH_STORAGE_KEY = 'meta_auth_user';
const CREDENTIALS_STORAGE_KEY = 'meta_test_credentials';

// ============================================================
// Provider 컴포넌트
// ============================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [credentials, setCredentials] = useState<TestCredentials | null>(null);

  // 초기 세션 확인
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedCredentials = localStorage.getItem(CREDENTIALS_STORAGE_KEY);

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        const creds = storedCredentials ? (JSON.parse(storedCredentials) as TestCredentials) : null;

        // localStorage의 이름을 현재 MOCK_TEACHER 이름과 동기화 (테스트 로그인 케이스)
        if (creds) {
          const synced: User = { ...user, name: MOCK_TEACHER.name };
          if (synced.name !== user.name) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(synced));
          }
          setState({ user: synced, isAuthenticated: true, isLoading: false });
          setCredentials(creds);
        } else {
          setState({ user, isAuthenticated: true, isLoading: false });
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // client.ts에서 refresh 실패 시 발생하는 이벤트 + 다른 탭 로그아웃 동기화
  useEffect(() => {
    const handleForceLogout = () => {
      setCredentials(null);
      setState({ user: null, isAuthenticated: false, isLoading: false });
    };

    const handleStorageChange = (e: StorageEvent) => {
      // 다른 탭에서 auth_token이 제거되면 (로그아웃) 현재 탭도 로그아웃
      if (e.key === 'auth_token' && !e.newValue) {
        handleForceLogout();
      }
    };

    window.addEventListener('auth:logout', handleForceLogout);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('auth:logout', handleForceLogout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 테스트 로그인
  const loginWithCredentials = useCallback(async (creds: TestCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    await new Promise((resolve) => setTimeout(resolve, 500));

    const user: User = {
      id: `test-${creds.teacherId}`,
      name: MOCK_TEACHER.name,
      email: `${creds.teacherId}@test.com`,
      memberType: 'vivasam',
      provider: 'vivasam',
      schoolName: '테스트 학교',
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(creds));

    setCredentials(creds);
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  // 게스트 로그인 (토큰 기반)
  const loginAsGuest = useCallback((info: GuestLoginInfo) => {
    localStorage.setItem('auth_token', info.accessToken);
    localStorage.setItem('refresh_token', info.refreshToken);

    const user: User = {
      id: info.stdtId,
      name: info.email.split('@')[0],
      email: info.email,
      memberType: 'guest',
      provider: 'vivasam',
      roleCode: 'GUEST',
      stdtId: info.stdtId,
      classId: info.claId,
    };

    localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    setCredentials(null);
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  // 이메일/비밀번호 로그인 — isLoading을 건드리지 않음 (로딩은 호출자가 관리)
  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<{
      userNo: number;
      email: string;
      nickname: string;
      gender: string;
      roleCode: string;
      tcId: string | null;
      stdtId: string | null;
      accessToken: string;
      refreshToken: string;
    }>('/member/login', { email, password });

    const data = res.resultData;

    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);

    const user: User = {
      id: String(data.userNo),
      name: data.nickname,
      email: data.email,
      memberType: 'general',
      provider: 'vivasam',
      roleCode: data.roleCode,
      ...(data.tcId ? { tcId: data.tcId } : {}),
      ...(data.stdtId ? { stdtId: data.stdtId } : {}),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  // 이메일 인증코드 발송
  const sendCode = useCallback(async (email: string) => {
    await apiClient.post('/member/send-code', { email });
  }, []);

  // 이메일 인증코드 확인
  const verifyCode = useCallback(async (email: string, code: string) => {
    await apiClient.post('/member/verify-code', { email, code });
  }, []);

  // 회원가입 (가입 완료 후 자동 로그인)
  const signUp = useCallback(async (data: SignUpData) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await apiClient.post('/member/signup', {
        email: data.email,
        password: data.password,
        nickname: data.name,
        gender: data.gender,
        roleCode: data.roleCode,
      });
      await loginWithEmail(data.email, data.password);
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  }, [loginWithEmail]);

  // 사용자 정보 업데이트
  const updateUser = useCallback((updates: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...updates };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      return { ...prev, user: updatedUser };
    });
  }, []);

  // 로그아웃
  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('refresh_token');

    // 백엔드 로그아웃 (refreshToken 무효화) — 실패해도 클라이언트는 로그아웃
    if (refreshToken) {
      apiClient.post('/member/logout', { refreshToken }).catch(() => {});
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setCredentials(null);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginWithCredentials,
        loginWithEmail,
        loginAsGuest,
        updateUser,
        sendCode,
        verifyCode,
        signUp,
        logout,
        credentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

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
