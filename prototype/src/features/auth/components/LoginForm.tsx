import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, AlertCircle, Eye, EyeOff, Mail, Lock, UserPlus } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  isLoading: boolean;
  /** 게스트 로그인 콜백 (있으면 게스트 로그인 버튼 표시) */
  onGuestLogin?: () => void;
  /** redirect 경로 (비밀번호찾기/회원가입 링크에 쿼리파라미터로 전달) */
  redirectPath?: string;
  /** 외부에서 전달받은 에러 메시지 (API 에러 등) */
  error?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading, onGuestLogin, redirectPath, error: externalError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // 외부 에러 또는 로컬 에러 표시
  const error = externalError || localError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('이메일을 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      setLocalError('비밀번호를 입력해주세요.');
      return;
    }

    onLogin(email.trim(), password.trim());
  };

  const forgotPasswordUrl = redirectPath
    ? `/forgot-password?redirect=${encodeURIComponent(redirectPath)}`
    : '/forgot-password';
  const signupUrl = redirectPath
    ? `/signup?redirect=${encodeURIComponent(redirectPath)}`
    : '/signup';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 이메일 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          이메일
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            disabled={isLoading}
            autoComplete="email"
          />
        </div>
      </div>

      {/* 비밀번호 */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            disabled={isLoading}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 로그인 버튼 */}
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
            <LogIn className="w-5 h-5" />
            <span>로그인</span>
          </>
        )}
      </button>

      {/* 비밀번호 찾기 / 회원가입 / 게스트 로그인 */}
      <div className={`flex items-center text-sm pt-1 ${onGuestLogin ? 'justify-center gap-3' : 'justify-between'}`}>
        <Link
          to={forgotPasswordUrl}
          className="text-gray-500 hover:text-primary-500 transition-colors"
        >
          비밀번호 찾기
        </Link>
        {onGuestLogin && <span className="text-gray-300">|</span>}
        <Link
          to={signupUrl}
          className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
        >
          회원가입
        </Link>
        {onGuestLogin && (
          <>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={onGuestLogin}
              className="text-gray-500 hover:text-primary-500 transition-colors flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              게스트 로그인
            </button>
          </>
        )}
      </div>
    </form>
  );
};
