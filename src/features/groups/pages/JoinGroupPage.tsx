import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

type JoinStep = 'input' | 'loading' | 'success';

export const JoinGroupPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [name, setName] = useState('');
  const [step, setStep] = useState<JoinStep>('input');
  const [error, setError] = useState('');

  // Mock 그룹 정보
  const groupInfo = {
    name: '6학년 2반',
    teacherName: '김선생님',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('이름을 2자 이상 입력해주세요.');
      return;
    }

    setStep('loading');

    // Mock API 호출
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">가입 완료!</h1>
          <p className="text-gray-600 mb-6">
            <span className="font-semibold">{groupInfo.name}</span>에 성공적으로 가입되었습니다.
          </p>
          <p className="text-sm text-gray-500">
            선생님이 검사를 시작하면 알림을 받게 됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-4">
            <Users className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">그룹 가입</h1>
          <p className="text-gray-600">
            <span className="font-semibold text-primary-600">{groupInfo.name}</span>
            {' '}({groupInfo.teacherName})
          </p>
        </div>

        {/* 가입 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              disabled={step === 'loading'}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">초대 코드</p>
            <p className="font-mono font-semibold text-gray-900">{code}</p>
          </div>

          <button
            type="submit"
            disabled={step === 'loading' || name.trim().length < 2}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {step === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                가입 중...
              </>
            ) : (
              <>
                그룹 가입하기
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* 안내 문구 */}
        <p className="text-center text-sm text-gray-500 mt-6">
          가입하면 선생님이 생성한 검사에 참여할 수 있습니다.
        </p>
      </div>
    </div>
  );
};
