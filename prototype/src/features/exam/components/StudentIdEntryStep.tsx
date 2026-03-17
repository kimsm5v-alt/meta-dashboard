import { useState } from 'react';
import { ArrowRight, Loader2, User } from 'lucide-react';

interface StudentIdEntryStepProps {
  examName: string;
  onSubmit: (stdtId: string) => Promise<void>;
  isLoading: boolean;
}

export const StudentIdEntryStep: React.FC<StudentIdEntryStepProps> = ({
  examName,
  onSubmit,
  isLoading,
}) => {
  const [stdtId, setStdtId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedId = stdtId.trim();
    if (!trimmedId) {
      setError('학생 ID를 입력해주세요.');
      return;
    }

    try {
      await onSubmit(trimmedId);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStdtId(e.target.value);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 검사 정보 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary-100 text-primary-600 text-sm font-medium mb-4">
            META 학습종합검사
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{examName}</h1>
          <p className="text-gray-600">본인의 학생 ID를 입력해주세요</p>
        </div>

        {/* ID 입력 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              학생 ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={stdtId}
                onChange={handleChange}
                placeholder="예: engreal51-s1"
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                autoFocus
                disabled={isLoading}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 text-center">
              선생님께 안내받은 학생 ID를 입력하세요
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !stdtId.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                확인 중...
              </>
            ) : (
              <>
                다음
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
