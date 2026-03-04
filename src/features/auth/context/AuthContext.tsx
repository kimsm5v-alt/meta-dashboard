import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, AuthState } from '@/shared/types';
import { MOCK_TEACHER } from '@/shared/data/mockData';
import type { TestCredentials } from '../components';

// ============================================================
// Context 타입 정의
// ============================================================

interface AuthContextType extends AuthState {
  /** 테스트 로그인 (credentials 저장) */
  loginWithCredentials: (credentials: TestCredentials) => Promise<void>;
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
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // 테스트 로그인
  const loginWithCredentials = useCallback(async (creds: TestCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));

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

  // 로그아웃
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
    setCredentials(null);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, loginWithCredentials, logout, credentials }}>
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
