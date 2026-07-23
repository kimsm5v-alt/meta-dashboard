import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { Card } from '@/shared/components';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: 실제 비밀번호 재설정 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      {/* 로고 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          <span className="text-primary-500">비상교육</span> 학습심리정서검사
        </h1>
        <p className="mt-2 text-gray-600">AI 기반 맞춤형 학습 코칭 시스템</p>
      </div>

      <Card className="w-full max-w-md p-8 relative">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate('/login')}
          className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>

        {/* 전송 완료 상태 */}
        {isSent ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">이메일을 확인하세요</h2>
            <p className="text-gray-500 text-sm mb-6">
              <span className="font-medium text-gray-700">{email}</span>으로
              <br />
              비밀번호 재설정 링크를 보냈습니다.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              이메일이 도착하지 않았다면 스팸 폴더를 확인해주세요.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-primary-500 hover:bg-primary-600 text-white transition-all"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            {/* 헤더 */}
            <div className="text-center mb-8 pt-4">
              <h2 className="text-2xl font-bold text-gray-900">비밀번호 찾기</h2>
              <p className="text-gray-500 mt-1 text-sm">
                가입한 이메일을 입력하시면
                <br />
                비밀번호 재설정 링크를 보내드립니다.
              </p>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* 전송 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className={`
                  w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-medium
                  bg-primary-500 hover:bg-primary-600 text-white
                  transition-all duration-200 shadow-lg shadow-primary-500/25
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>재설정 링크 보내기</span>
                  </>
                )}
              </button>

              {/* 로그인 링크 */}
              <p className="text-center text-sm text-gray-500 pt-1">
                비밀번호가 기억나셨나요?{' '}
                <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
                  로그인
                </Link>
              </p>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};
