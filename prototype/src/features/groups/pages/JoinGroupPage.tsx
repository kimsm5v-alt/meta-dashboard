import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ArrowRight, Loader2, CheckCircle, AlertCircle, UserPlus, Mail, User } from 'lucide-react';
import { Button } from '@/shared/components';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { groupService } from '../services/groupService';
import { useAuth } from '@/features/auth/context/AuthContext';
import { APIError } from '@/shared/services/apiClient';

type PageStep = 'loading' | 'info' | 'guest-form' | 'joining' | 'success' | 'error';

export const JoinGroupPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, loginWithEmail } = useAuth();

  const [step, setStep] = useState<PageStep>('loading');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 게스트 가입 폼
  const [guestNickname, setGuestNickname] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  // 초기화
  useEffect(() => {
    if (!code || authLoading) return;
    setStep('info');
  }, [code, authLoading]);

  // 로그인 처리 (로그인 성공 후 자동 가입)
  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    try {
      await loginWithEmail(email, password);
      // 로그인 성공 → useEffect에서 isAuthenticated 변경 감지 → 자동 가입 처리
    } finally {
      setLoginLoading(false);
    }
  };

  // 로그인 후 자동 가입 (한 번만 실행)
  useEffect(() => {
    if (isAuthenticated && user && step === 'info') {
      handleMemberJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, step]);

  // 회원 가입 처리
  const handleMemberJoin = async () => {
    if (!user || !code) {
      console.warn('[JoinGroupPage] user 또는 code 없음:', { user, code });
      return;
    }

    setStep('joining');
    try {
      // 초대 코드로 가입 (그룹 ID는 백엔드가 초대 코드로 찾음)
      await groupService.joinGroup(
        '', // 그룹 ID는 사용되지 않음
        { inviteCode: code },
        user.id,
        user.name
      );
      setStep('success');
    } catch (err) {
      console.error('[JoinGroupPage] 그룹 가입 실패:', err);

      // 중복 가입 에러 처리 (이미 가입된 경우 성공으로 간주)
      if (err instanceof APIError && err.isDuplicateKeyError()) {
        setStep('success');
        return;
      }

      setError('그룹 가입에 실패했습니다. 다시 시도해주세요.');
      setStep('error');
    }
  };

  // 이메일 인증 코드 발송
  const handleSendCode = async () => {
    if (!guestEmail.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setIsSendingCode(true);
    setError('');

    try {
      const { sendVerificationCode } = await import('@/shared/services/apiClient');
      await sendVerificationCode(guestEmail.trim());
      setError('');
    } catch (err) {
      setError('인증코드 발송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 이메일 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('인증코드를 입력해주세요.');
      return;
    }

    setError('');

    try {
      const { verifyEmailCode } = await import('@/shared/services/apiClient');
      await verifyEmailCode(guestEmail.trim(), verificationCode.trim());
      setIsEmailVerified(true);
      setError('');
    } catch (err) {
      setError('인증코드가 올바르지 않습니다.');
    }
  };

  // 게스트 가입 처리 (닉네임 + 이메일)
  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code) return;

    if (!guestNickname.trim() || guestNickname.trim().length < 2) {
      setError('닉네임을 2자 이상 입력해주세요.');
      return;
    }
    if (!guestEmail.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!isEmailVerified) {
      setError('이메일 인증을 완료해주세요.');
      return;
    }

    setError('');
    setStep('joining');

    try {
      await groupService.joinGroupAsGuest('', {
        inviteCode: code,
        email: guestEmail.trim(),
        name: guestNickname.trim(),
      });
      setStep('success');
    } catch {
      setError('그룹 가입에 실패했습니다. 다시 시도해주세요.');
      setStep('error');
    }
  };

  // ── 로딩 ──
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">그룹 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // ── 에러 ──
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류 발생</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/groups')} className="w-full justify-center">
              그룹 목록으로
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setError('');
                setStep('loading');
                window.location.reload();
              }}
              className="w-full justify-center"
            >
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── 가입 성공 ──
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">가입 완료!</h1>
          <p className="text-gray-600 mb-6">
            그룹에 성공적으로 가입되었습니다.
          </p>
          {isAuthenticated ? (
            <Button onClick={() => navigate('/groups')} className="w-full justify-center">
              그룹 목록 보기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                  선생님이 검사를 시작하면 <span className="font-semibold">{guestEmail}</span>으로
                  검사 응시 안내 메일이 발송됩니다.
                </p>
              </div>
              <Button variant="secondary" onClick={() => navigate('/login')} className="w-full justify-center">
                로그인하고 결과 확인하기
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 가입 중 ──
  if (step === 'joining') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">가입 처리 중...</p>
        </div>
      </div>
    );
  }

  // ── 게스트 폼 (닉네임 + 이메일) ──
  if (step === 'guest-form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 헤더 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
              <UserPlus className="w-8 h-8 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">게스트로 참가</h1>
          </div>

          {/* 폼 */}
          <form onSubmit={handleGuestJoin} className="bg-white rounded-2xl shadow-lg p-8">
            <div className="space-y-4 mb-6">
              {/* 닉네임 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  닉네임 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={guestNickname}
                    onChange={(e) => { setGuestNickname(e.target.value); setError(''); }}
                    placeholder="닉네임을 입력하세요"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    required
                    minLength={2}
                    autoFocus
                  />
                </div>
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value);
                        setError('');
                        setIsEmailVerified(false);
                        setVerificationCode('');
                      }}
                      placeholder="example@email.com"
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all ${
                        isEmailVerified ? 'border-green-500 bg-green-50' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSendingCode || !guestEmail.trim()}
                    className={`px-4 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                      isEmailVerified
                        ? 'bg-green-500 text-white'
                        : isSendingCode
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-500 hover:bg-primary-600 text-white'
                    }`}
                  >
                    {isEmailVerified ? '인증완료' : isSendingCode ? '발송중...' : '인증코드'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  검사 응시 안내 메일이 이 주소로 발송됩니다.
                </p>
              </div>

              {/* 인증 코드 */}
              {!isEmailVerified && guestEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    인증 코드 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => { setVerificationCode(e.target.value); setError(''); }}
                      placeholder="6자리 인증코드"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={!verificationCode.trim()}
                      className="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium text-sm whitespace-nowrap transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      확인
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="mb-4 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}

            {/* 안내 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                게스트로 참가하시면 검사 종료 후 입력하신 이메일로 결과지(PDF)가 발송됩니다.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                게스트로 참가하기
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => { setStep('info'); setError(''); }}
                className="w-full px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
              >
                뒤로
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── 메인: 로그인 폼 (비로그인) / 가입 버튼 (로그인) ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-3">
            <Users className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">그룹 가입</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-4">

          {isAuthenticated && user ? (
            // ── 로그인 상태: 바로 가입 ──
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">{user.name}</span>님으로 가입합니다.
                </p>
              </div>

              <button
                onClick={handleMemberJoin}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                그룹 가입하기
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            // ── 비로그인 상태: 로그인 폼 바로 표시 ──
            <div>
              <p className="text-center text-sm text-gray-600 mb-4">
                그룹에 가입하려면 로그인하거나 게스트로 참가하세요
              </p>
              <LoginForm
                onLogin={handleLogin}
                isLoading={loginLoading}
                onGuestLogin={() => setStep('guest-form')}
                redirectPath={`/join/${code}`}
              />
            </div>
          )}
        </div>

        {/* 초대 코드 표시 */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            초대 코드: <span className="font-mono">{code}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
