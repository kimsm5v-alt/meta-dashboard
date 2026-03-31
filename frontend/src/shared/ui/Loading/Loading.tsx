import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

interface PageLoadingProps {
  text?: string;
}

interface PanelLoadingProps {
  height?: string;
}

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Spinner = styled.svg<{ $size: 'sm' | 'md' | 'lg' }>`
  animation: ${spin} 1s linear infinite;
  color: ${({ theme }) => theme.colors.primary[500]};
  width: ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return '16px';
      case 'lg':
        return '48px';
      default:
        return '32px';
    }
  }};
  height: ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return '16px';
      case 'lg':
        return '48px';
      default:
        return '32px';
    }
  }};
`;

const Circle = styled.circle`
  opacity: 0.25;
`;

const Path = styled.path`
  opacity: 0.75;
`;

const Text = styled.p`
  margin-top: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const PageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;

const PanelContainer = styled.div<{ $height?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${({ $height }) => $height || '160px'};
`;

const PanelSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid ${({ theme }) => theme.colors.primary[500]};
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

export const Loading = ({ size = 'md', text }: LoadingProps) => (
  <Container>
    <Spinner $size={size} xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
      <Circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
      <Path
        fill='currentColor'
        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
      />
    </Spinner>
    {text && <Text>{text}</Text>}
  </Container>
);

export const PageLoading = ({ text = '로딩 중...' }: PageLoadingProps) => (
  <PageContainer>
    <Loading size='lg' text={text} />
  </PageContainer>
);

export const PanelLoading = ({ height }: PanelLoadingProps) => (
  <PanelContainer $height={height}>
    <PanelSpinner />
  </PanelContainer>
);
