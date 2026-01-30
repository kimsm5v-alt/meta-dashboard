import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, MemberType, AuthState, OAuthProvider } from '../../../shared/types';

// ============================================================
// Context 타입 정의
// ============================================================

interface AuthContextType extends AuthState {
  login: (provider: OAuthProvider) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================
// Mock 사용자 데이터 (개발용)
// ============================================================

const MOCK_USERS: Record<MemberType, User> = {
  vivasam: {
    id: 'user-vivasam-1',
    name: '김교사',
    email: 'teacher@vivasam.com',
    memberType: 'vivasam',
    provider: 'vivasam',
    schoolName: '서울초등학교',
  },
  general: {
    id: 'user-general-1',
    name: '이교사',
    email: 'teacher@gmail.com',
    memberType: 'general',
    provider: 'google',
  },
};

const STORAGE_KEY = 'meta_auth_user';

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

  // 초기 세션 확인
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        setState({ user, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // 로그인 (Mock)
  const login = useCallback(async (provider: OAuthProvider) => {
    setState(prev => ({ ...prev, isLoading: true }));

    // OAuth 딜레이 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 800));

    // vivasam provider = vivasam 회원, 그 외 = 일반 회원
    const memberType: MemberType = provider === 'vivasam' ? 'vivasam' : 'general';
    const user: User = {
      ...MOCK_USERS[memberType],
      provider,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  // 로그아웃
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
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
