import styled from '@emotion/styled';
import { ArrowRight } from 'lucide-react';
import { Button } from '@shared/components';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const Section = styled.section`
  position: relative;
  background: linear-gradient(to bottom right, #faf5ff, #ffffff, #eff6ff);
  padding: 80px 24px;

  @media (min-width: 1024px) {
    padding: 128px 24px;
  }
`;

const Container = styled.div`
  max-width: 1152px;
  margin: 0 auto;
`;

const TextCenter = styled.div`
  text-align: center;
  max-width: 768px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  line-height: 1.2;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    font-size: 48px;
  }

  @media (min-width: 1024px) {
    font-size: 60px;
  }
`;

const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.primary[500]};
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 40px;
  line-height: 1.7;

  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;

  @media (min-width: 640px) {
    flex-direction: row;
  }
`;

const PreviewContainer = styled.div`
  margin-top: 64px;
  position: relative;
`;

const PreviewCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  padding: 16px;
  max-width: 896px;
  margin: 0 auto;

  @media (min-width: 768px) {
    padding: 24px;
  }
`;

const PreviewInner = styled.div`
  background: linear-gradient(
    to bottom right,
    ${({ theme }) => theme.colors.gray[50]},
    ${({ theme }) => theme.colors.gray[100]}
  );
  border-radius: 12px;
  height: 256px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (min-width: 768px) {
    height: 320px;
  }
`;

const PreviewContent = styled.div`
  text-align: center;
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  background: ${({ theme }) => theme.colors.primary[100]};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 24px;
`;

const PreviewText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 14px;
`;

const Decoration1 = styled.div`
  position: absolute;
  top: -16px;
  right: -16px;
  width: 96px;
  height: 96px;
  background: ${({ theme }) => theme.colors.primary[100]};
  border-radius: 50%;
  filter: blur(32px);
  opacity: 0.5;
`;

const Decoration2 = styled.div`
  position: absolute;
  bottom: -16px;
  left: -16px;
  width: 128px;
  height: 128px;
  background: #dbeafe;
  border-radius: 50%;
  filter: blur(32px);
  opacity: 0.5;
`;

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <Section>
      <Container>
        <TextCenter>
          <Title>
            학생의 마음을 읽고,
            <br />
            <Highlight>맞춤형 코칭</Highlight>을 시작하세요
          </Title>
          <Subtitle>
            비상교육 학습심리정서검사로 학생 개개인의 학습 유형을 파악하고,
            <br />
            AI 기반 맞춤형 코칭 전략을 받아보세요.
          </Subtitle>
          <ButtonGroup>
            <Button size='lg' onClick={onGetStarted}>
              시작하기
              <ArrowRight size={20} style={{ marginLeft: 8 }} />
            </Button>
            <Button variant='outline' size='lg'>
              자세히 알아보기
            </Button>
          </ButtonGroup>
        </TextCenter>

        <PreviewContainer>
          <PreviewCard>
            <PreviewInner>
              <PreviewContent>
                <IconWrapper>📊</IconWrapper>
                <PreviewText>대시보드 미리보기</PreviewText>
              </PreviewContent>
            </PreviewInner>
          </PreviewCard>
          <Decoration1 />
          <Decoration2 />
        </PreviewContainer>
      </Container>
    </Section>
  );
};
