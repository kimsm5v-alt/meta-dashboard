import styled from '@emotion/styled';
import { Loader2, AlertTriangle } from 'lucide-react';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
`;

const Content = styled.div`
  text-align: center;
`;

const SpinningLoader = styled(Loader2)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme }) => theme.colors.primary[500]};
  animation: spin 1s linear infinite;
  margin: 0 auto 0.5rem;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const Text = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const SubText = styled.p`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: 0.25rem;
`;

const WarningIcon = styled(AlertTriangle)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme }) => theme.colors.warning.main};
  margin: 0 auto 0.5rem;
`;

const InProgressIconWrapper = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: ${({ theme }) => theme.colors.info.light};
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const InProgressLoader = styled(Loader2)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme }) => theme.colors.info.main};
`;

const InProgressTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.5rem;
`;

export const LoadingState = () => (
  <Container>
    <Content>
      <SpinningLoader />
      <Text>학급 데이터를 불러오는 중...</Text>
      <SubText>API 연결 확인 중</SubText>
    </Content>
  </Container>
);

interface ErrorStateProps {
  error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => (
  <Container>
    <Content>
      <WarningIcon />
      <Text>데이터 로드 실패: {error}</Text>
    </Content>
  </Container>
);

export const InProgressState = () => (
  <Container>
    <Content>
      <InProgressIconWrapper>
        <InProgressLoader />
      </InProgressIconWrapper>
      <InProgressTitle>검사가 진행 중이에요</InProgressTitle>
      <Text>검사가 종료된 후 결과를 확인할 수 있습니다.</Text>
      <SubText>[검사하기] 메뉴에서 검사를 종료해 주세요.</SubText>
    </Content>
  </Container>
);

export const NoExamsState = () => (
  <Container>
    <Content>
      <Text>등록된 검사가 없습니다.</Text>
      <SubText>[검사하기] 메뉴에서 검사를 생성해 주세요.</SubText>
    </Content>
  </Container>
);

export const NoClassesState = () => (
  <Container>
    <Content>
      <Text>등록된 학급이 없습니다.</Text>
      <SubText>데이터를 업로드하거나 API 설정을 확인해주세요.</SubText>
    </Content>
  </Container>
);
