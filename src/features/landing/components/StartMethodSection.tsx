import { BookOpen, User } from 'lucide-react';
import { Card, Button } from '@/shared/components';

interface StartMethodSectionProps {
  onVivasamClick: () => void;
  onSocialClick: () => void;
}

export const StartMethodSection: React.FC<StartMethodSectionProps> = ({
  onVivasamClick,
  onSocialClick,
}) => {
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <span className="text-primary-500 font-medium text-sm uppercase tracking-wider">
            Get Started
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
            시작 방법
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            비바샘 회원이시라면 기존 검사 결과가 자동으로 연동됩니다.
          </p>
        </div>

        {/* 시작 방법 카드 */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* 비바샘 회원 */}
          <Card className="p-8 border-2 border-primary-100 hover:border-primary-300 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-7 h-7 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  비바샘 회원
                </h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  비바샘에서 검사했다면 결과가 자동으로 연동됩니다.
                  기존 학급/학생 정보도 함께 가져옵니다.
                </p>
                <Button onClick={onVivasamClick}>
                  비바샘으로 시작
                </Button>
              </div>
            </div>
          </Card>

          {/* 일반 회원 */}
          <Card className="p-8 border-2 border-gray-100 hover:border-gray-300 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  일반 회원
                </h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  구글, 카카오, 네이버로 간편하게 가입하고
                  검사 코드를 생성하여 이용하세요.
                </p>
                <Button variant="outline" onClick={onSocialClick}>
                  소셜로 시작
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
