import styled from '@emotion/styled';

const Container = styled.main`
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 1.5rem;
  background: #f8fafc;
`;

const Card = styled.section`
  width: min(100%, 30rem);
  padding: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08);
  text-align: center;
`;

const RetryButton = styled.button`
  min-height: 2.5rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: #7c3aed;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
`;

/** React 앱을 렌더하기 전 초기화가 실패했을 때 보여 주는 최소 복구 화면. */
export const BootstrapErrorScreen = () => (
  <Container>
    <Card aria-labelledby='bootstrap-error-title'>
      <div aria-hidden='true' style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>
        ⚠️
      </div>
      <h1 id='bootstrap-error-title' style={{ margin: 0, color: '#111827', fontSize: '1.25rem' }}>
        서비스를 준비하지 못했어요
      </h1>
      <p
        style={{
          margin: '0.5rem 0 1.5rem',
          color: '#6b7280',
          fontSize: '0.875rem',
          lineHeight: 1.6,
        }}
      >
        네트워크 상태를 확인한 후 다시 시도해 주세요.
      </p>
      <RetryButton type='button' onClick={() => window.location.reload()}>
        다시 시도
      </RetryButton>
    </Card>
  </Container>
);
