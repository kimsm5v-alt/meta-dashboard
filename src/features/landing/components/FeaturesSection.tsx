import { BarChart3, Users, Brain } from 'lucide-react';
import { Card } from '@/shared/components';

const FEATURES = [
  {
    icon: BarChart3,
    title: '학급 분석',
    description: '유형 분포와 변화 추이를 한눈에 파악하고, 학급 특성을 분석합니다.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Users,
    title: '개인 진단',
    description: '38개 요인 분석으로 학생별 강점과 약점, 유형별 특이점을 발견합니다.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Brain,
    title: 'AI 코칭',
    description: 'AI가 분석한 맞춤형 개입 전략과 학급 활동을 추천받습니다.',
    color: 'bg-purple-100 text-purple-600',
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <span className="text-primary-500 font-medium text-sm uppercase tracking-wider">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
            주요 기능
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            META 대시보드로 학생들의 학습심리정서를 체계적으로 분석하고 관리하세요.
          </p>
        </div>

        {/* 기능 카드 */}
        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="p-8 text-center hover:shadow-lg transition-shadow">
              <div
                className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}
              >
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
