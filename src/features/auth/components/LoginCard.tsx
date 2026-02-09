import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/shared/components';
import { OAuthButton } from './OAuthButton';
import type { OAuthProvider } from '@/shared/types';


interface LoginCardProps {
  onLogin: (provider: OAuthProvider) => void;
  isLoading: boolean;
}

export const LoginCard: React.FC<LoginCardProps> = ({ onLogin, isLoading }) => {
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-md p-8 relative">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-gray-500" />
      </button>

      {/* 로고 */}
      <div className="text-center mb-8 pt-4">
        <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
        <p className="text-gray-500 mt-1 text-sm">비상교육 학습심리정서검사 대시보드</p>
      </div>

      {/* 비바샘 로그인 - Primary */}
      <div className="mb-6">
        <OAuthButton
          provider="vivasam"
          onClick={() => onLogin('vivasam')}
          disabled={isLoading}
          primary
        />
        <p className="text-xs text-gray-500 text-center mt-2">
          기존 검사 결과가 자동으로 연동됩니다
        </p>
      </div>

      {/* 구분선 */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">또는</span>
        </div>
      </div>

      {/* 소셜 로그인 */}
      <div className="space-y-3">
        <OAuthButton
          provider="google"
          onClick={() => onLogin('google')}
          disabled={isLoading}
        />
        <OAuthButton
          provider="kakao"
          onClick={() => onLogin('kakao')}
          disabled={isLoading}
        />
        <OAuthButton
          provider="naver"
          onClick={() => onLogin('naver')}
          disabled={isLoading}
        />
      </div>

      {/* 자동 가입 안내 */}
      <p className="text-center text-xs text-gray-400 mt-8">
        처음 로그인하시면 자동으로 회원가입됩니다
      </p>
    </Card>
  );
};
