import styled from '@emotion/styled';
import { BarChart3, Users, Brain } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
}

const FEATURES: Feature[] = [
  {
    icon: BarChart3,
    title: '학급 분석',
    description: '유형 분포와 변화 추이를 한눈에 파악하고, 학급 특성을 분석합니다.',
    bgColor: '#dbeafe',
    iconColor: '#2563eb',
  },
  {
    icon: Users,
    title: '개인 진단',
    description: '38개 요인 분석으로 학생별 강점과 약점, 유형별 특이점을 발견합니다.',
    bgColor: '#dcfce7',
    iconColor: '#16a34a',
  },
  {
    icon: Brain,
    title: 'AI 코칭',
    description: 'AI가 분석한 맞춤형 개입 전략과 학급 활동을 추천받습니다.',
    bgColor: '#f3e8ff',
    iconColor: '#9333ea',
  },
];

const Section = styled.section`
  padding: 80px 24px;
  background: white;
`;

const Container = styled.div`
  max-width: 1152px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 64px;
`;

const Label = styled.span`
  color: ${({ theme }) => theme.colors.primary[500]};
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Title = styled.h2`
  font-size: 30px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-top: 8px;
  margin-bottom: 16px;

  @media (min-width: 768px) {
    font-size: 36px;
  }
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  max-width: 672px;
  margin: 0 auto;
`;

const Grid = styled.div`
  display: grid;
  gap: 32px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.div`
  padding: 32px;
  text-align: center;
  background: white;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
`;

const IconWrapper = styled.div<{ $bgColor: string }>`
  width: 64px;
  height: 64px;
  background: ${({ $bgColor }) => $bgColor};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
`;

const CardTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 12px;
`;

const CardDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: 1.7;
`;

export const FeaturesSection = () => {
  return (
    <Section>
      <Container>
        <Header>
          <Label>Features</Label>
          <Title>주요 기능</Title>
          <Description>
            비상교육 대시보드로 학생들의 학습심리정서를 체계적으로 분석하고 관리하세요.
          </Description>
        </Header>

        <Grid>
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <IconWrapper $bgColor={feature.bgColor}>
                <feature.icon size={32} color={feature.iconColor} />
              </IconWrapper>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </Card>
          ))}
        </Grid>
      </Container>
    </Section>
  );
};
