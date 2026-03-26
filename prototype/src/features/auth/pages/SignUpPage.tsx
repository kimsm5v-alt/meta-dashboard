import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, AlertCircle, Eye, EyeOff, Mail, Lock, User, CheckCircle, GraduationCap, UserCheck } from 'lucide-react';
import { Card } from '@/shared/components';
import { useAuth } from '../context/AuthContext';
import { sendVerificationCodeApi, verifyCodeApi, APIError } from '@/shared/services/apiClient';

type SignUpStep = 'role-select' | 'form';

/** 역할에 따른 리다이렉트 경로 결정 */
function getRedirectPathByRole(roleCode: 'TEACHER' | 'STUDENT' | null, defaultPath: string): string {
  if (!roleCode) return defaultPath;

  switch (roleCode) {
    case 'STUDENT':
      return '/student/exams';
    case 'TEACHER':
      return '/dashboard';
    default:
      return defaultPath;
  }
}

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { signUp, user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<SignUpStep>('role-select');
  const [selectedRole, setSelectedRole] = useState<'TEACHER' | 'STUDENT' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 이메일 인증 관련 상태
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeSentMessage, setCodeSentMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [form, setForm] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '' as 'M' | 'F' | '',
  });

  // 재발송 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // 회원가입 후 역할 기반 리다이렉트
  useEffect(() => {
    if (isAuthenticated && user?.roleCode) {
      const targetPath = redirectTo || getRedirectPathByRole(user.roleCode, '/dashboard');
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, redirectTo]);

  // 이메일 변경 시 인증 상태 초기화
  const handleEmailChange = useCallback((value: string) => {
    setForm(prev => ({ ...prev, email: value }));
    setIsEmailVerified(false);
    setVerificationCode('');
    setCodeSentMessage('');
    setResendCooldown(0);
  }, []);

  // 인증코드 발송
  const handleSendCode = async () => {
    if (!form.email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setIsSendingCode(true);
    setError('');
    setCodeSentMessage('');

    try {
      await sendVerificationCodeApi(form.email.trim());
      setCodeSentMessage('인증코드가 발송되었습니다. 이메일을 확인해주세요.');
      setResendCooldown(60); // 1분 재발송 제한
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('인증코드 발송에 실패했습니다.');
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  // 인증코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('인증코드를 입력해주세요.');
      return;
    }

    setIsVerifyingCode(true);
    setError('');

    try {
      await verifyCodeApi(form.email.trim(), verificationCode.trim());
      setIsEmailVerified(true);
      setCodeSentMessage('');
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('인증코드 확인에 실패했습니다.');
      }
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // 비밀번호 정책 검증 (Backend 스펙: 10~64자, 영문대/소/숫자/특수문자 중 2가지 이상)
  const validatePassword = (password: string): string | null => {
    if (password.length < 10) {
      return '비밀번호는 10자 이상이어야 합니다.';
    }
    if (password.length > 64) {
      return '비밀번호는 64자 이하여야 합니다.';
    }

    // 영문대/소/숫자/특수문자 중 2가지 이상 체크
    let typeCount = 0;
    if (/[A-Z]/.test(password)) typeCount++;
    if (/[a-z]/.test(password)) typeCount++;
    if (/[0-9]/.test(password)) typeCount++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) typeCount++;

    if (typeCount < 2) {
      return '영문 대/소문자, 숫자, 특수문자 중 2가지 이상을 포함해야 합니다.';
    }

    // 동일문자 4회 연속 금지
    if (/(.)\1{3,}/.test(password)) {
      return '동일한 문자를 4번 이상 연속 사용할 수 없습니다.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    if (!form.email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!isEmailVerified) {
      setError('이메일 인증이 필요합니다.');
      return;
    }
    if (!form.gender) {
      setError('성별을 선택해주세요.');
      return;
    }
    if (!form.password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // 이메일 포함 금지
    const emailPrefix = form.email.split('@')[0].toLowerCase();
    if (form.password.toLowerCase().includes(emailPrefix)) {
      setError('비밀번호에 이메일을 포함할 수 없습니다.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      await signUp({
        nickname: form.nickname.trim(),
        email: form.email.trim(),
        password: form.password,
        gender: form.gender as 'M' | 'F',
        roleCode: selectedRole!,
      });
      // 리다이렉트는 useEffect에서 역할 기반으로 처리됨
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
          onClick={() => {
            if (step === 'form') {
              setStep('role-select');
              setError('');
            } else {
              navigate('/login');
            }
          }}
          className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>

        {/* 역할 선택 단계 */}
        {step === 'role-select' && (
          <>
            <div className="text-center mb-8 pt-4">
              <h2 className="text-2xl font-bold text-gray-900">회원가입</h2>
              <p className="text-gray-500 mt-1 text-sm">계정 유형을 선택해주세요</p>
            </div>

            <div className="space-y-3">
              {/* 교사 선택 */}
              <button
                onClick={() => {
                  setSelectedRole('TEACHER');
                  setStep('form');
                }}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-500 hover:bg-primary-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <UserCheck className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">교사</p>
                  <p className="text-xs text-gray-500">학생 관리 및 검사 진행</p>
                </div>
              </button>

              {/* 학생 선택 */}
              <button
                onClick={() => {
                  setSelectedRole('STUDENT');
                  setStep('form');
                }}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-500 hover:bg-primary-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">학생</p>
                  <p className="text-xs text-gray-500">검사 참여 및 결과 확인</p>
                </div>
              </button>
            </div>

            {/* 로그인 링크 */}
            <p className="text-center text-sm text-gray-500 pt-6">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
                로그인
              </Link>
            </p>
          </>
        )}

        {/* 정보 입력 폼 단계 */}
        {step === 'form' && selectedRole && (
          <>
            <div className="text-center mb-8 pt-4">
              <h2 className="text-2xl font-bold text-gray-900">회원가입</h2>
              <p className="text-gray-500 mt-1 text-sm">
                {selectedRole === 'TEACHER' ? '교사' : '학생'} 계정 정보를 입력하세요
              </p>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 닉네임 */}
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                  닉네임 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="nickname"
                    type="text"
                    value={form.nickname}
                    onChange={(e) => updateField('nickname', e.target.value)}
                    placeholder="닉네임을 입력하세요"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    disabled={isLoading}
                    autoComplete="nickname"
                  />
                </div>
              </div>

              {/* 이메일 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                  {isEmailVerified && (
                    <span className="ml-2 text-green-600 text-xs font-normal inline-flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      인증완료
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="example@email.com"
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all ${
                        isEmailVerified ? 'border-green-500 bg-green-50' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isLoading || isSendingCode || resendCooldown > 0}
                    className={`px-4 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                      isEmailVerified
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : isSendingCode || resendCooldown > 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-500 hover:bg-primary-600 text-white'
                    }`}
                  >
                    {isEmailVerified ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isSendingCode ? (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    ) : resendCooldown > 0 ? (
                      `${resendCooldown}초`
                    ) : (
                      '인증'
                    )}
                  </button>
                </div>

                {/* 인증코드 발송 성공 메시지 */}
                {codeSentMessage && !isEmailVerified && (
                  <p className="mt-2 text-xs text-green-600">{codeSentMessage}</p>
                )}

                {/* 인증코드 입력 필드 - 코드 발송 후 표시 */}
                {codeSentMessage && !isEmailVerified && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      placeholder="6자리 인증코드 입력"
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-center tracking-widest font-mono"
                      maxLength={6}
                      disabled={isVerifyingCode}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verificationCode.length !== 6 || isVerifyingCode}
                      className={`px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                        verificationCode.length !== 6 || isVerifyingCode
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-primary-500 hover:bg-primary-600 text-white'
                      }`}
                    >
                      {isVerifyingCode ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        '확인'
                      )}
                    </button>
                  </div>
                )}

                {/* 인증코드 안내 */}
                {codeSentMessage && !isEmailVerified && (
                  <p className="mt-2 text-xs text-gray-500">
                    인증코드는 5분간 유효합니다.
                  </p>
                )}
              </div>

              {/* 성별 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  성별 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => updateField('gender', 'M')}
                    className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                      form.gender === 'M'
                        ? 'border-primary-500 bg-primary-50 text-primary-600'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                    disabled={isLoading}
                  >
                    남성
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('gender', 'F')}
                    className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                      form.gender === 'F'
                        ? 'border-primary-500 bg-primary-50 text-primary-600'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                    disabled={isLoading}
                  >
                    여성
                  </button>
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
                    placeholder="10자 이상, 영문/숫자/특수문자 중 2가지 이상"
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
                <p className="mt-1 text-xs text-gray-500">
                  10~64자, 영문 대/소문자·숫자·특수문자 중 2가지 이상
                </p>
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
          </>
        )}
      </Card>
    </div>
  );
};
