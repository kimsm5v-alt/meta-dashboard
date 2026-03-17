import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TestLoginForm } from '../components';
import { useAuth } from '../context/AuthContext';
import type { TestCredentials } from '../components';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, loginWithCredentials } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = async (credentials: TestCredentials) => {
    setLoginLoading(true);
    try {
      await loginWithCredentials(credentials);
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

      {/* 로그인 폼 */}
      <TestLoginForm onLogin={handleLogin} isLoading={loginLoading} />

      {/* 하단 안내 */}
      <p className="mt-8 text-xs text-gray-500 text-center max-w-sm">
        이 페이지는 API 테스트를 위한 임시 로그인 페이지입니다.
        <br />
        실제 서비스에서는 SSO 인증으로 대체됩니다.
      </p>
    </div>
  );
};
