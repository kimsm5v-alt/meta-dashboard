import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, AlertCircle, Eye, EyeOff, Mail, Lock, User, School } from 'lucide-react';
import { Card } from '@/shared/components';
import { useAuth } from '../context/AuthContext';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!form.email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!form.password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        schoolName: form.schoolName.trim() || undefined,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
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

        {/* 헤더 */}
        <div className="text-center mb-8 pt-4">
          <h2 className="text-2xl font-bold text-gray-900">회원가입</h2>
          <p className="text-gray-500 mt-1 text-sm">새 계정을 만들어주세요</p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="홍길동"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
          </div>

          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="example@email.com"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="8자 이상 입력하세요"
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                disabled={isLoading}
                autoComplete="new-password"
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

          {/* 비밀번호 확인 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 학교명 (선택) */}
          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
              학교명 <span className="text-gray-400 text-xs">(선택)</span>
            </label>
            <div className="relative">
              <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="schoolName"
                type="text"
                value={form.schoolName}
                onChange={(e) => updateField('schoolName', e.target.value)}
                placeholder="소속 학교명"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                disabled={isLoading}
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

          {/* 가입 버튼 */}
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
                <UserPlus className="w-5 h-5" />
                <span>회원가입</span>
              </>
            )}
          </button>

          {/* 로그인 링크 */}
          <p className="text-center text-sm text-gray-500 pt-1">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
              로그인
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
};
