import styled from '@emotion/styled';
import { useAuth } from '@features/auth/model/AuthContext';
import { useHomeExamStats } from '@features/home/model/useHomeExamStats';

const Band = styled.div`
  position: relative;
  overflow: hidden;
  padding: 28px 32px 66px;
  background: ${({ theme }) => theme.colors.primary[700]};
`;

const DecorCircleTop = styled.div`
  position: absolute;
  top: -70px;
  right: -60px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary[600]};
`;

const DecorCircleBottom = styled.div`
  position: absolute;
  right: 100px;
  bottom: -80px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary[600]};
  opacity: 0.6;
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
`;

const Greeting = styled.h1`
  margin: 0;
  color: white;
  font-size: 26px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const Subtitle = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.primary[300]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const HomeGreetingBand = () => {
  const { user } = useAuth();
  const { summary, isLoading } = useHomeExamStats();

  return (
    <Band>
      <DecorCircleTop />
      <DecorCircleBottom />
      <Content>
        <Greeting>안녕하세요, {user?.name ?? '선생님'} 선생님 👋</Greeting>
        <Subtitle>
          {isLoading
            ? '학습 현황을 불러오는 중입니다'
            : `${summary.totalClasses}개 반의 학습 현황을 한눈에 확인하세요`}
        </Subtitle>
      </Content>
    </Band>
  );
};
