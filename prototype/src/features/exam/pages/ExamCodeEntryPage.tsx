import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, Loader2, User, Mail } from 'lucide-react';
import { validateExamCode } from '../services/examService';

type EntryMode = 'select' | 'login' | 'guest';

export const ExamCodeEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [entryMode, setEntryMode] = useState<EntryMode>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullCode = `META-${code.toUpperCase()}`;

    if (code.length < 4) {
      setError('검사 코드 4자리를 입력해주세요.');
      return;
    }

    // 게스트 모드일 때 추가 검증
    if (entryMode === 'guest') {
      if (!nickname.trim() || nickname.trim().length < 2) {
        setError('닉네임을 2자 이상 입력해주세요.');
        return;
      }
      if (!email.trim() || !validateEmail(email)) {
        setError('올바른 이메일 형식을 입력해주세요.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await validateExamCode(fullCode);

      if (result.valid) {
        // 게스트 정보를 state로 전달
        if (entryMode === 'guest') {
          navigate(`/exam/${fullCode}`, {
            state: {
              isGuest: true,
              nickname: nickname.trim(),
              email: email.trim(),
            },
          });
        } else {
          navigate(`/exam/${fullCode}`);
        }
      } else {
        setError('유효하지 않은 검사 코드입니다. 다시 확인해주세요.');
      }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    setCode(value);
    setError('');
  };

  const handleModeSelect = (mode: EntryMode) => {
    setEntryMode(mode);
    setError('');
    if (mode === 'login') {
      // 로그인 페이지로 이동 (코드 유지)
      navigate('/login', { state: { returnTo: '/exam', examCode: code } });
    }
  };

  // 코드 입력이 완료되었는지
  const isCodeValid = code.length >= 4;

  // 게스트 폼이 완료되었는지
  const isGuestFormValid =
    entryMode === 'guest' &&
    nickname.trim().length >= 2 &&
    validateEmail(email);

  // 제출 가능 여부
  const canSubmit = isCodeValid && (entryMode === 'select' ? false : entryMode === 'guest' ? isGuestFormValid : true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-4">
            <GraduationCap className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">학습심리정서검사</h1>
          <p className="text-gray-600">선생님께 받은 검사 코드를 입력하세요</p>
        </div>

        {/* 코드 입력 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          {/* 검사 코드 입력 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검사 코드
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-semibold text-gray-400">META -</span>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="____"
                className="flex-1 text-center text-2xl font-mono font-bold tracking-widest px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                maxLength={4}
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 응시 방법 선택 - 코드 입력 후 표시 */}
          {isCodeValid && entryMode === 'select' && (
            <div className="mb-6 space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-3">응시 방법을 선택하세요</p>
              <button
                type="button"
                onClick={() => handleModeSelect('login')}
                className="w-full flex items-center gap-3 px-4 py-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">로그인해서 응시</p>
                  <p className="text-sm text-gray-500">결과를 웹에서 바로 확인</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('guest')}
                className="w-full flex items-center gap-3 px-4 py-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">게스트로 응시</p>
                  <p className="text-sm text-gray-500">이메일로 PDF 결과 수신</p>
                </div>
              </button>
            </div>
          )}

          {/* 게스트 정보 입력 */}
          {entryMode === 'guest' && (
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">게스트 정보 입력</p>
                <button
                  type="button"
                  onClick={() => setEntryMode('select')}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  응시 방법 변경
                </button>
              </div>

              {/* 닉네임 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  닉네임 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => { setNickname(e.target.value); setError(''); }}
                    placeholder="닉네임 (2자 이상)"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="결과를 받을 이메일"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">
                ※ 검사 완료 후 입력한 이메일로 결과 PDF가 발송됩니다.
              </p>
            </div>
          )}

          {error && (
            <p className="mb-4 text-sm text-red-600">{error}</p>
          )}

          {/* 제출 버튼 */}
          {(entryMode === 'guest' || !isCodeValid) && (
            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  확인 중...
                </>
              ) : (
                <>
                  검사 시작하기
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </form>

        {/* 안내 문구 */}
        <p className="text-center text-sm text-gray-500 mt-6">
          검사 코드를 모르시나요? 선생님께 문의하세요.
        </p>
      </div>
    </div>
  );
};
