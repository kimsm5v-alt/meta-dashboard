import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginCard } from '../components';
import { useAuth } from '../context/AuthContext';
import type { OAuthProvider } from '@/shared/types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = async (provider: OAuthProvider) => {
    setLoginLoading(true);
    try {
      await login(provider);
      navigate('/dashboard', { replace: true });
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

      {/* 로그인 카드 */}
      <LoginCard onLogin={handleLogin} isLoading={loginLoading} />

      {/* 하단 안내 */}
      <p className="mt-8 text-xs text-gray-500 text-center max-w-sm">
        로그인 시{' '}
        <a href="#" className="text-primary-600 hover:underline">
          서비스 이용약관
        </a>{' '}
        및{' '}
        <a href="#" className="text-primary-600 hover:underline">
          개인정보 처리방침
        </a>
        에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  );
};
