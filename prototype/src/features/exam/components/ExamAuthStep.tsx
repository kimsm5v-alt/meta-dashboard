import { useState } from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/context/AuthContext';

interface ExamAuthStepProps {
  examName: string;
  examCode: string;
  onGuestStart: () => void;
}

export const ExamAuthStep: React.FC<ExamAuthStepProps> = ({
  examName,
  examCode,
  onGuestStart,
}) => {
  const { loginWithEmail } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    try {
      await loginWithEmail(email, password);
      // 로그인 성공 → ExamPage의 useEffect가 isAuthenticated 변경 감지 → 'number' step으로 이동
    } finally {
      setLoginLoading(false);
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
          <p className="text-gray-600">검사를 응시하려면 로그인해주세요</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <LoginForm
            onLogin={handleLogin}
            isLoading={loginLoading}
            onGuestLogin={onGuestStart}
            redirectPath={`/exam/${examCode}`}
          />
        </div>
      </div>
    </div>
  );
};
