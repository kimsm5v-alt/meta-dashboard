import { useState } from 'react';
import { ArrowRight, Loader2, User, Mail, Info } from 'lucide-react';

interface GuestExamEntryStepProps {
  examName: string;
  onSubmit: (nickname: string, email: string) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export const GuestExamEntryStep: React.FC<GuestExamEntryStepProps> = ({
  examName,
  onSubmit,
  onBack,
  isLoading,
}) => {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim() || nickname.trim().length < 2) {
      setError('닉네임을 2자 이상 입력해주세요.');
      return;
    }

    if (!email.trim() || !validateEmail(email.trim())) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      await onSubmit(nickname.trim(), email.trim());
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const isFormValid = nickname.trim().length >= 2 && validateEmail(email.trim());

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 검사 정보 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary-100 text-primary-600 text-sm font-medium mb-4">
            META 학습종합검사
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{examName}</h1>
          <p className="text-gray-600">게스트로 검사를 응시합니다</p>
        </div>

        {/* 게스트 정보 입력 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-4 mb-6">
            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  autoFocus
                  minLength={2}
                />
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
          </div>

          {/* 안내 문구 */}
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                그룹 가입 시 입력한 닉네임과 이메일을 정확히 입력해주세요.
                <br />
                검사 완료 후 입력한 이메일로 결과 PDF가 발송됩니다.
              </p>
            </div>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  확인 중...
                </>
              ) : (
                <>
                  검사 시작
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
              disabled={isLoading}
            >
              뒤로
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
