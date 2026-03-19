import { useState } from 'react';
import { CheckCircle2, Mail, Send, Loader2 } from 'lucide-react';

interface ExamCompleteStepProps {
  studentNumber: number;
  onSubmitEmail: (email: string) => Promise<void>;
  isSubmitting: boolean;
}

export const ExamCompleteStep: React.FC<ExamCompleteStepProps> = ({
  studentNumber,
  onSubmitEmail,
  isSubmitting,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      await onSubmitEmail(email);
      setIsSubmitted(true);
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">결과가 발송되었습니다!</h1>
          <p className="text-gray-600 mb-6">
            입력하신 이메일로 검사 결과 PDF가 발송됩니다.
            <br />
            메일이 도착하지 않으면 스팸함을 확인해주세요.
          </p>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500">발송 이메일</p>
            <p className="font-medium text-gray-900">{email}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 완료 메시지 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">검사 완료!</h1>
          <p className="text-gray-600">
            {studentNumber}번 학생, 검사를 완료했습니다.
            <br />
            결과를 받을 이메일 주소를 입력해주세요.
          </p>
        </div>

        {/* 이메일 입력 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일 주소
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="example@email.com"
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                disabled={isSubmitting}
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                발송 중...
              </>
            ) : (
              <>
                결과 받기
                <Send className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* 안내 문구 */}
        <p className="text-center text-sm text-gray-500 mt-6">
          ※ 입력하신 이메일로 결과 PDF가 발송됩니다.
        </p>
      </div>
    </div>
  );
};
