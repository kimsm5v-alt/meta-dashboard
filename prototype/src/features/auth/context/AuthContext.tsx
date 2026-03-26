import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, AuthState } from '@/shared/types';
import { MOCK_TEACHER } from '@/shared/data/mockData';
import type { TestCredentials } from '../components';
import {
  loginApi,
  logoutApi,
  refreshTokenApi,
  signupApi,
  saveAuthTokens,
  clearAuthTokens,
  getAuthTokens,
  APIError,
  type LoginResponseData,
  type SignupRequestData,
} from '@/shared/services/apiClient';

// ============================================================
// Context 타입 정의
// ============================================================

interface SignUpData {
  email: string;
  password: string;
  nickname: string;
  gender: 'M' | 'F';
  roleCode: 'TEACHER' | 'STUDENT';
}

interface AuthContextType extends AuthState {
  /** 테스트 로그인 (credentials 저장) */
  loginWithCredentials: (credentials: TestCredentials) => Promise<void>;
  /** 이메일/비밀번호 로그인 (백엔드 API 연동) */
  loginWithEmail: (email: string, password: string) => Promise<void>;
  /** 회원가입 */
  signUp: (data: SignUpData) => Promise<void>;
  /** 로그아웃 */
  logout: () => void;
  /** 사용자 정보 업데이트 */
  updateUser: (updates: Partial<User>) => void;
  /** 테스트용 credentials (API 호출 시 사용) */
  credentials: TestCredentials | null;
  /** 로그인 에러 메시지 */
  loginError: string | null;
  /** 로그인 에러 초기화 */
  clearLoginError: () => void;
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

/** API 응답을 User 타입으로 변환 */
function mapLoginResponseToUser(data: LoginResponseData): User {
  return {
    id: String(data.userNo),
    name: data.nickname,
    email: data.email,
    memberType: 'general',
    provider: 'vivasam',
    roleCode: data.roleCode as User['roleCode'],
    tcId: data.tcId ?? undefined,
    stdtId: data.stdtId ?? undefined,
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [credentials, setCredentials] = useState<TestCredentials | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // 초기 세션 확인
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      const storedCredentials = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
      const authTokens = getAuthTokens();

      // 1. 실제 로그인 토큰이 있는 경우
      if (storedUser && authTokens?.accessToken) {
        try {
          const user = JSON.parse(storedUser) as User;

          // 새로고침 시에는 토큰 갱신을 시도하지 않고, 기존 토큰 사용
          // 실제 API 요청 시 401 에러가 발생하면 그때 리프레시 시도
          setState({ user, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          clearAuthTokens();
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }

      // 2. 테스트 credentials가 있는 경우 (기존 호환성)
      if (storedUser && storedCredentials) {
        try {
          const user = JSON.parse(storedUser) as User;
          const creds = JSON.parse(storedCredentials) as TestCredentials;

          // localStorage의 이름을 현재 MOCK_TEACHER 이름과 동기화
          const synced: User = { ...user, name: MOCK_TEACHER.name };
          if (synced.name !== user.name) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(synced));
          }

          setState({ user: synced, isAuthenticated: true, isLoading: false });
          setCredentials(creds);
          return;
        } catch {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
        }
      }

      setState(prev => ({ ...prev, isLoading: false }));
    };

    initAuth();
  }, []);

  // 토큰 감시 - 토큰이 삭제되면 자동 로그아웃
  useEffect(() => {
    const checkTokens = () => {
      if (state.isAuthenticated && !getAuthTokens()?.accessToken) {
        // 토큰이 삭제되었으면 로그아웃 처리
        console.warn('Tokens cleared, logging out...');
        setState({ user: null, isAuthenticated: false, isLoading: false });
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    };

    // 주기적으로 토큰 체크 (1초마다)
    const interval = setInterval(checkTokens, 1000);
    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  // 로그인 에러 초기화
  const clearLoginError = useCallback(() => {
    setLoginError(null);
  }, []);

  // 테스트 로그인
  const loginWithCredentials = useCallback(async (creds: TestCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));
    setLoginError(null);

    // 로그인 딜레이 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));

    // 테스트 사용자 생성
    const user: User = {
      id: `test-${creds.teacherId}`,
      name: MOCK_TEACHER.name,
      email: `${creds.teacherId}@test.com`,
      memberType: 'vivasam',
      provider: 'vivasam',
      schoolName: '테스트 학교',
    };

    // 저장
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(creds));

    setCredentials(creds);
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  // 이메일/비밀번호 로그인 (백엔드 API 연동)
  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    setLoginError(null);

    try {
      const response = await loginApi(email, password);
      const data = response.resultData;

      // 토큰 저장
      saveAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      // User 객체 생성 및 저장
      const user = mapLoginResponseToUser(data);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

      // 테스트 credentials 삭제 (실제 로그인으로 전환)
      localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
      setCredentials(null);

      setState({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));

      if (error instanceof APIError) {
        setLoginError(error.message);
      } else {
        setLoginError('로그인 중 오류가 발생했습니다.');
      }
      throw error;
    }
  }, []);

  // 회원가입
  const signUp = useCallback(async (data: SignUpData) => {
    setState(prev => ({ ...prev, isLoading: true }));
    setLoginError(null);

    try {
      // 회원가입 API 호출
      const signupData: SignupRequestData = {
        email: data.email,
        password: data.password,
        nickname: data.nickname,
        gender: data.gender,
        roleCode: data.roleCode,
      };

      await signupApi(signupData);

      // 회원가입 성공 후 자동 로그인
      const loginResponse = await loginApi(data.email, data.password);
      const loginData = loginResponse.resultData;

      // 토큰 저장
      saveAuthTokens({
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
      });

      // User 객체 생성 및 저장
      const user = mapLoginResponseToUser(loginData);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

      setState({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));

      if (error instanceof APIError) {
        setLoginError(error.message);
      } else {
        setLoginError('회원가입 중 오류가 발생했습니다.');
      }
      throw error;
    }
  }, []);

  // 사용자 정보 업데이트
  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => {
      if (!prev.user) return prev;

      const updatedUser = { ...prev.user, ...updates };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));

      return { ...prev, user: updatedUser };
    });
  }, []);

  // 로그아웃
  const logout = useCallback(async () => {
    // 서버에 로그아웃 요청 (토큰 무효화)
    const authTokens = getAuthTokens();
    if (authTokens?.refreshToken) {
      await logoutApi(authTokens.refreshToken);
    }

    // 로컬 상태 정리
    clearAuthTokens();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
    setCredentials(null);
    setLoginError(null);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      loginWithCredentials,
      loginWithEmail,
      signUp,
      logout,
      updateUser,
      credentials,
      loginError,
      clearLoginError,
    }}>
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
