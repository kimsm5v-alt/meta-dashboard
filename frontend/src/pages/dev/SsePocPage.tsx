import styled from '@emotion/styled';
import { SsePocPanel } from '@widgets/dev/SsePocPanel';
import { useAuth } from '@features/auth/model/AuthContext';

export const SsePocPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Container>
      <Title>SSE POC</Title>
      <Info>
        <li>
          로그인 상태: <strong>{isAuthenticated ? 'YES' : 'NO'}</strong>
        </li>
        <li>
          사용자: <strong>{user?.name ?? '(로그인 필요)'}</strong>
        </li>
        <li>우측 하단 패널에서 연결 상태 확인 및 테스트 알림 발송 가능합니다.</li>
        <li>
          BE는 <code>/api/v1/notifications/stream</code>으로 SSE 연결, <code>/test-send</code>로
          본인에게 메시지 푸시.
        </li>
      </Info>
      <SsePocPanel />
    </Container>
  );
};

const Container = styled.div`
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
`;

const Info = styled.ul`
  list-style: disc;
  padding-left: 20px;
  line-height: 1.8;
  color: ${({ theme }) => theme.colors.gray[700]};
`;
