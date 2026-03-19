import { useState } from 'react';
import { ArrowRight, Loader2, User, Info } from 'lucide-react';

interface GuestExamEntryStepProps {
  examName: string;
  onSubmit: (nickname: string) => Promise<void>;
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
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim() || nickname.trim().length < 2) {
      setError('닉네임을 2자 이상 입력해주세요.');
      return;
    }

    try {
      await onSubmit(nickname.trim());
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

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

        {/* 닉네임 입력 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              닉네임 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setError(''); }}
                placeholder="닉네임을 입력하세요"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                disabled={isLoading}
                autoFocus
                minLength={2}
              />
            </div>
          </div>

          {/* 안내 문구 */}
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                이메일로 검사 응시 안내를 받으셨다면, 그룹 가입 시 사용한 닉네임을 입력해주세요.
              </p>
            </div>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || !nickname.trim()}
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
