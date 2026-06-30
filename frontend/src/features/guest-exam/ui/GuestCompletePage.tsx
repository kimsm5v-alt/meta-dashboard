/**
 * 게스트 검사 완료 페이지
 * 검사 완료 후 PDF 발송 안내 및 회원 전환 유도
 */

import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Mail, UserPlus, Home } from 'lucide-react';
import styled from '@emotion/styled';
import { useAuth } from '@features/auth/model/AuthContext';

// ============================================================
// Styled Components
// ============================================================

const PageRoot = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, #ecfdf5, white, #f0fdfa);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const Inner = styled.div`
  width: 100%;
  max-width: 448px;
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const SuccessCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #dcfce7;
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  svg {
    width: 48px;
    height: 48px;
    color: #16a34a;
  }
`;

const HeroTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const HeroSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

const IconCircle = styled.div<{ $bg: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
  }
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoTitle = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const InfoDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const EmailBox = styled.div`
  background: ${({ theme }) => theme.colors.background.elevated};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
`;

const EmailLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const EmailValue = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CTACard = styled.div`
  background: linear-gradient(to right, #ede9fe, #eef2ff);
  border-radius: ${({ theme }) => theme.radius['2xl']};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

const CTAIconCircle = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const CTAContent = styled.div`
  flex: 1;
`;

const CTATitle = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const CTADesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const CTAButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border: none;
  border-radius: ${({ theme }) => theme.radius.xl};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const ButtonStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const BackButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl}`};
  background: ${({ theme }) => theme.colors.background.paper};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const CloseButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl}`};
  background: none;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[700]};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FooterNote = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

// ============================================================
// Component
// ============================================================

export const GuestCompletePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleConvertToMember = () => {
    navigate('/signup', { state: { email: user?.email, fromGuest: true } });
  };

  const handleClose = () => {
    logout();
    navigate('/');
  };

  return (
    <PageRoot>
      <Inner>
        <HeroSection>
          <SuccessCircle>
            <CheckCircle2 />
          </SuccessCircle>
          <HeroTitle>검사 완료!</HeroTitle>
          <HeroSubtitle>{user?.name ?? '게스트'}님, 수고하셨습니다.</HeroSubtitle>
        </HeroSection>

        {/* 이메일 발송 안내 */}
        <InfoCard>
          <IconCircle $bg='#dcfce7'>
            <Mail style={{ color: '#16a34a' }} />
          </IconCircle>
          <InfoContent>
            <InfoTitle>결과 PDF 발송 예정</InfoTitle>
            <InfoDesc>
              검사가 종료되면 아래 이메일로
              <br />
              결과 PDF가 발송됩니다.
            </InfoDesc>
            <EmailBox>
              <EmailLabel>발송 이메일</EmailLabel>
              <EmailValue>{user?.email ?? '-'}</EmailValue>
            </EmailBox>
          </InfoContent>
        </InfoCard>

        {/* 회원 전환 유도 */}
        <CTACard>
          <CTAIconCircle>
            <UserPlus />
          </CTAIconCircle>
          <CTAContent>
            <CTATitle>회원가입 하시겠어요?</CTATitle>
            <CTADesc>
              회원이 되면 결과를 웹에서 바로 확인하고,
              <br />
              언제든 다시 볼 수 있어요.
            </CTADesc>
            <CTAButton onClick={handleConvertToMember}>회원으로 전환하기</CTAButton>
          </CTAContent>
        </CTACard>

        <ButtonStack>
          <BackButton onClick={() => navigate('/guest/exams')}>검사 목록으로 돌아가기</BackButton>
          <CloseButton onClick={handleClose}>
            <Home />
            종료
          </CloseButton>
        </ButtonStack>

        <FooterNote>메일이 도착하지 않으면 스팸함을 확인해주세요.</FooterNote>
      </Inner>
    </PageRoot>
  );
};
