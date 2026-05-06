import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { User as UserType } from '@shared/types';
import { useAuth } from '@features/auth/model/AuthContext';
import { useSpAuth } from '@shared/hooks/useSpAuth';

// ============================================================
// 헬퍼
// ============================================================

const getRedirectPathByRole = (user: UserType, explicitRedirect: string | null): string => {
  if (explicitRedirect) return explicitRedirect;
  if (user.roleCode === 'STUDENT') return '/student/exams';
  return '/dashboard';
};

// ============================================================
// 컴포넌트
// ============================================================

/**
 * LoginPage — 세션 만료 등으로 /login에 온 경우 자동 SSO 리다이렉트.
 * 로그아웃 후에는 이 페이지를 거치지 않고 / (랜딩)으로 직접 감.
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { isAuthenticated, isLoading, user } = useAuth();
  const { login } = useSpAuth();

  // 이미 로그인 상태면 역할 기반 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      navigate(getRedirectPathByRole(user, redirectTo), { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate, redirectTo]);

  // 세션 만료 등으로 /login에 온 경우 자동 SSO (로그아웃은 /로 감)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login(redirectTo || undefined);
    }
  }, [isLoading, isAuthenticated, login, redirectTo]);

  // 자동 SSO 리다이렉트 대기
  return null;
};

export default LoginPage;
