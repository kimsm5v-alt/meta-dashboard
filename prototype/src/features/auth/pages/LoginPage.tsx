import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/shared/components';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../context/AuthContext';
import type { User as UserType } from '@/shared/types';

/** 역할에 따른 리다이렉트 경로 결정 */
function getRedirectPathByRole(user: UserType | null, defaultPath: string): string {
  if (!user?.roleCode) return defaultPath;

  switch (user.roleCode) {
    case 'STUDENT':
      return '/student/exams';
    case 'TEACHER':
    case 'ADMIN':
      return '/dashboard';
    default:
      return defaultPath;
  }
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { user, isAuthenticated, isLoading, loginWithEmail, loginError, clearLoginError } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);

  // 컴포넌트 마운트 시 에러 초기화
  useEffect(() => {
    clearLoginError();
  }, [clearLoginError]);

  // 이미 로그인된 경우 역할 기반 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      const targetPath = getRedirectPathByRole(user, redirectTo);
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate, redirectTo]);

  const handleEmailLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    try {
      await loginWithEmail(email, password);
      // 로그인 성공 시 useEffect에서 역할 기반 리다이렉트 처리
    } catch {
      // 에러는 AuthContext에서 처리됨 (loginError로 전달)
    } finally {
      setLoginLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      {/* 로고 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          <span className="text-primary-500">비상교육</span> 학습심리정서검사
        </h1>
        <p className="mt-2 text-gray-600">AI 기반 맞춤형 학습 코칭 시스템</p>
      </div>

      {/* 로그인 폼 */}
      <Card className="w-full max-w-md p-8 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>

        <div className="text-center mb-8 pt-4">
          <h2 className="text-2xl font-bold text-gray-900">로그인</h2>
          <p className="text-gray-500 mt-1 text-sm">이메일과 비밀번호를 입력하세요</p>
        </div>

        <LoginForm onLogin={handleEmailLogin} isLoading={loginLoading} error={loginError} />
      </Card>

      {/* 하단 안내 - 회원가입 링크 */}
      <p className="mt-8 text-sm text-gray-500 text-center">
        계정이 없으신가요?{' '}
        <button
          onClick={() => navigate('/signup')}
          className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
        >
          회원가입
        </button>
      </p>
    </div>
  );
};
