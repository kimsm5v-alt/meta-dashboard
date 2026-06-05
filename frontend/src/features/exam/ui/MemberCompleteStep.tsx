/**
 * 회원용 검사 완료 화면
 * 이메일 입력 없이 바로 완료 메시지 표시
 */

import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, BarChart3, ClipboardList } from 'lucide-react';
import type { FC } from 'react';

interface MemberCompleteStepProps {
  userName: string;
}

const PageRoot = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, #d1fae5, #ffffff, #ccfbf1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const Container = styled.div`
  width: 100%;
  max-width: 28rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const CompleteIconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  background-color: #d1fae5;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const InfoContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

const InfoIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #d1fae5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const InfoText = styled.div`
  flex: 1;
`;

const InfoTitle = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const InfoDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
`;

const ButtonArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PrimaryButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background-color: #059669;
  color: white;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: none;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: #047857;
  }
`;

export const MemberCompleteStep: FC<MemberCompleteStepProps> = ({ userName }) => {
  const navigate = useNavigate();

  const handleBackToList = () => {
    navigate('/student/exams');
  };

  return (
    <PageRoot>
      <Container>
        {/* 완료 메시지 */}
        <Header>
          <CompleteIconWrapper>
            <CheckCircle2 size={48} color="#059669" />
          </CompleteIconWrapper>
          <Title>검사 완료!</Title>
          <Description>{userName}님, 수고하셨습니다.</Description>
        </Header>

        {/* 안내 카드 */}
        <InfoCard>
          <InfoContent>
            <InfoIcon>
              <BarChart3 size={24} color="#059669" />
            </InfoIcon>
            <InfoText>
              <InfoTitle>결과 확인 안내</InfoTitle>
              <InfoDescription>
                검사가 종료되면 대시보드에서
                <br />
                결과를 확인할 수 있습니다.
              </InfoDescription>
            </InfoText>
          </InfoContent>
        </InfoCard>

        {/* 버튼 영역 */}
        <ButtonArea>
          <PrimaryButton onClick={handleBackToList}>
            <ClipboardList size={20} />
            검사 목록으로
          </PrimaryButton>
        </ButtonArea>
      </Container>
    </PageRoot>
  );
};
