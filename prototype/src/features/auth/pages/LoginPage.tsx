import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FlaskConical, User } from 'lucide-react';
import { Card } from '@/shared/components';
import { TestLoginForm } from '../components';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../context/AuthContext';
import type { TestCredentials } from '../components';

type LoginMode = 'select' | 'normal' | 'test';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { isAuthenticated, isLoading, loginWithCredentials, loginWithEmail, loginError, clearLoginError } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>('select');

  // 모드 변경 시 에러 초기화
  useEffect(() => {
    clearLoginError();
  }, [mode, clearLoginError]);

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  const handleTestLogin = async (credentials: TestCredentials) => {
    setLoginLoading(true);
    try {
      await loginWithCredentials(credentials);
      navigate(redirectTo, { replace: true });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmailLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate(redirectTo, { replace: true });
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

      {/* 모드 선택 화면 */}
      {mode === 'select' && (
        <Card className="w-full max-w-md p-8">
          {/* 뒤로가기 */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>

          <div className="text-center mb-8 pt-4">
            <h2 className="text-2xl font-bold text-gray-900">로그인</h2>
            <p className="text-gray-500 mt-1 text-sm">로그인 방식을 선택해주세요</p>
          </div>

          <div className="space-y-3">
            {/* 일반 로그인 */}
            <button
              onClick={() => setMode('normal')}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-500 hover:bg-primary-50 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">로그인</p>
                <p className="text-xs text-gray-500">이메일과 비밀번호로 로그인</p>
              </div>
            </button>

            {/* 테스트 계정 로그인 */}
            <button
              onClick={() => setMode('test')}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <FlaskConical className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">테스트 계정 로그인</p>
                <p className="text-xs text-gray-500">API 테스트용 임시 로그인</p>
              </div>
            </button>
          </div>
        </Card>
      )}

      {/* 일반 로그인 폼 */}
      {mode === 'normal' && (
        <Card className="w-full max-w-md p-8 relative">
          <button
            onClick={() => setMode('select')}
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
      )}

      {/* 테스트 로그인 폼 */}
      {mode === 'test' && (
        <TestLoginForm onLogin={handleTestLogin} isLoading={loginLoading} />
      )}

      {/* 하단 안내 - 회원가입 링크 */}
      {mode === 'select' && (
        <p className="mt-8 text-sm text-gray-500 text-center">
          계정이 없으신가요?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
          >
            회원가입
          </button>
        </p>
      )}
    </div>
  );
};
