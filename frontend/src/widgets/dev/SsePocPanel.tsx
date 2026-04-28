import { useState } from 'react';
import styled from '@emotion/styled';
import { apiClient } from '@shared/api/client';
import { useSsePoc } from '@shared/hooks/useSsePoc';

/**
 * SSE 찍먹 테스트 패널.
 * 페이지에 박아두면 우하단에 고정 위치로 표시됨.
 */
export const SsePocPanel: React.FC = () => {
  const { messages, connected } = useSsePoc(true);
  const [sending, setSending] = useState(false);

  const sendTest = async () => {
    setSending(true);
    try {
      await apiClient.post(
        `/api/v1/notifications/test-send?msg=${encodeURIComponent('안녕 ' + new Date().toLocaleTimeString())}`,
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Panel>
      <Header>
        <Title>SSE POC</Title>
        <StatusDot $connected={connected} title={connected ? '연결됨' : '연결 끊김'} />
      </Header>
      <SendButton onClick={sendTest} disabled={sending}>
        {sending ? '전송 중...' : '테스트 알림 보내기'}
      </SendButton>
      <MessageList>
        {messages.length === 0 && <Empty>아직 받은 알림 없음</Empty>}
        {messages.map((m, i) => (
          <MessageItem key={`${m.at}-${i}`}>
            <MsgContent>{m.content}</MsgContent>
            <MsgTime>{new Date(m.at).toLocaleTimeString()}</MsgTime>
          </MessageItem>
        ))}
      </MessageList>
    </Panel>
  );
};

const Panel = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  max-height: 400px;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 14px;
`;

const StatusDot = styled.span<{ $connected: boolean }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $connected }) => ($connected ? '#16a34a' : '#dc2626')};
`;

const SendButton = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const MessageList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  max-height: 280px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Empty = styled.li`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 12px;
  text-align: center;
  padding: 12px 0;
`;

const MessageItem = styled.li`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
`;

const MsgContent = styled.div`
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const MsgTime = styled.div`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 11px;
  margin-top: 2px;
`;
