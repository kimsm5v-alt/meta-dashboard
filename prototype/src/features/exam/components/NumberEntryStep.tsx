import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface NumberEntryStepProps {
  examName: string;
  maxStudentNumber: number;  // 최대 학생 번호 (학급 학생 수)
  onSubmit: (studentNumber: number) => Promise<void>;
  isLoading: boolean;
}

export const NumberEntryStep: React.FC<NumberEntryStepProps> = ({
  examName,
  maxStudentNumber,
  onSubmit,
  isLoading,
}) => {
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const studentNumber = parseInt(number, 10);
    if (isNaN(studentNumber) || studentNumber < 1 || studentNumber > maxStudentNumber) {
      setError(`올바른 번호를 입력해주세요. (1~${maxStudentNumber})`);
      return;
    }

    try {
      await onSubmit(studentNumber);
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setNumber(value);
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
          <p className="text-gray-600">본인의 번호를 입력해주세요</p>
        </div>

        {/* 번호 입력 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              몇 번인가요?
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={number}
              onChange={handleChange}
              placeholder="00"
              className="w-full text-center text-5xl font-bold tracking-widest px-4 py-6 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              maxLength={2}
              autoFocus
              disabled={isLoading}
            />
            <p className="mt-2 text-sm text-gray-500 text-center">출석 번호를 입력하세요 (1~{maxStudentNumber}번)</p>
            {error && (
              <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !number}
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
