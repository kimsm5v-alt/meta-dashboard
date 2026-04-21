import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { useAuth } from '@features/auth/model/AuthContext';
import { Button } from '@shared/components';
import { HeroSection, FeaturesSection } from '@features/landing/ui';
import serviceLogo from '@/assets/logo_2.png';

const PageContainer = styled.div`
  min-height: 100vh;
`;

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  z-index: 50;
`;

const HeaderContent = styled.div`
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.img`
  height: 20px;
`;

const NavButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Main = styled.main`
  padding-top: 64px;
`;

const Footer = styled.footer`
  background: ${({ theme }) => theme.colors.gray[900]};
  color: white;
  padding: 48px 0;
`;

const FooterContent = styled.div`
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px;
`;

const FooterInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const FooterLogo = styled.img`
  height: 20px;
  filter: brightness(0) invert(1);
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const FooterLink = styled.a`
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: white;
  }
`;

const Copyright = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <PageContainer>
      <Header>
        <HeaderContent>
          <div>
            <Logo src={serviceLogo} alt='학습심리정서검사' />
          </div>
          <NavButtons>
            <Button variant='outline' size='sm' onClick={() => navigate('/login')}>
              로그인
            </Button>
            <Button size='sm' onClick={() => navigate('/login')}>
              시작하기
            </Button>
          </NavButtons>
        </HeaderContent>
      </Header>

      <Main>
        <HeroSection onGetStarted={handleGetStarted} />
        <FeaturesSection />
      </Main>

      <Footer>
        <FooterContent>
          <FooterInner>
            <div>
              <FooterLogo src={serviceLogo} alt='학습심리정서검사' />
            </div>
            <FooterLinks>
              <FooterLink href='#'>이용약관</FooterLink>
              <FooterLink href='#'>개인정보처리방침</FooterLink>
              <FooterLink href='#'>문의하기</FooterLink>
            </FooterLinks>
            <Copyright>© 2026 비상교육 학습심리정서검사</Copyright>
          </FooterInner>
        </FooterContent>
      </Footer>
    </PageContainer>
  );
};
