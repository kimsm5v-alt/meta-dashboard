import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/context/AuthContext';

interface ExamAuthStepProps {
  examName: string;
  examCode: string;
  onGuestLogin?: () => void;
}

export const ExamAuthStep: React.FC<ExamAuthStepProps> = ({
  examName,
  examCode,
  onGuestLogin,
}) => {
  const navigate = useNavigate();
  const { loginWithEmail } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    try {
      await loginWithEmail(email, password);
      // 로그인 성공 → 학생 검사 목록으로 이동
      navigate('/student/exams');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGuestLogin = () => {
    if (onGuestLogin) {
      onGuestLogin();
    } else {
      // 게스트는 먼저 그룹 가입이 필요함
      // 그룹 가입 시 토큰을 받고, 이후 검사 목록에서 검사 응시 가능
      // 임시: 그룹 가입 안내 알림 후 홈으로 이동
      alert('게스트로 검사에 응시하려면 먼저 그룹에 가입해야 합니다.\n선생님께 초대 링크를 받아 그룹에 가입해주세요.');
      navigate('/');
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
            onGuestLogin={handleGuestLogin}
            redirectPath={`/exam/${examCode}`}
          />
        </div>
      </div>
    </div>
  );
};
