import { ArrowRight } from 'lucide-react';
import { Button } from '../../../shared/components';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-blue-50 py-20 lg:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          {/* 타이틀 */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            학생의 마음을 읽고,
            <br />
            <span className="text-primary-500">맞춤형 코칭</span>을 시작하세요
          </h1>

          {/* 서브타이틀 */}
          <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
            META 학습심리정서검사로 학생 개개인의 학습 유형을 파악하고,
            <br className="hidden md:block" />
            AI 기반 맞춤형 코칭 전략을 받아보세요.
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={onGetStarted}>
              시작하기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg">
              자세히 알아보기
            </Button>
          </div>
        </div>

        {/* 대시보드 미리보기 이미지 */}
        <div className="mt-16 relative">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 md:p-6 mx-auto max-w-4xl">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl h-64 md:h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-gray-500 text-sm">대시보드 미리보기</p>
              </div>
            </div>
          </div>

          {/* 장식 요소 */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-100 rounded-full blur-2xl opacity-50" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-50" />
        </div>
      </div>
    </section>
  );
};
