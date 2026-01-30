import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { Button } from '../../../shared/components';
import { HeroSection, FeaturesSection, StartMethodSection } from '../components';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // 이미 로그인되어 있으면 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* 로고 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="font-bold text-lg text-gray-900">META</span>
          </div>

          {/* 네비게이션 */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
              로그인
            </Button>
            <Button size="sm" onClick={() => navigate('/login')}>
              시작하기
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="pt-16">
        <HeroSection onGetStarted={handleGetStarted} />
        <FeaturesSection />
        <StartMethodSection
          onVivasamClick={() => navigate('/login')}
          onSocialClick={() => navigate('/login')}
        />
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* 로고 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-white">META</span>
            </div>

            {/* 링크 */}
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">이용약관</a>
              <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-white transition-colors">문의하기</a>
            </div>

            {/* 저작권 */}
            <p className="text-sm text-gray-500">
              © 2026 META 학습심리정서검사
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
