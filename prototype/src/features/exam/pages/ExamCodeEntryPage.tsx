import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { validateExamCode } from '../services/examService';

export const ExamCodeEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullCode = `META-${code.toUpperCase()}`;

    if (code.length < 4) {
      setError('검사 코드 4자리를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await validateExamCode(fullCode);

      if (result.valid) {
        navigate(`/exam/${fullCode}`);
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
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length < 4}
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
        </form>

        {/* 안내 문구 */}
        <p className="text-center text-sm text-gray-500 mt-6">
          검사 코드를 모르시나요? 선생님께 문의하세요.
        </p>
      </div>
    </div>
  );
};
