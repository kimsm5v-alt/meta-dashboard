import styled from '@emotion/styled';
import { Card } from '@shared/components';

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const StatusPill = styled.span`
  padding: 4px 10px;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  text-align: center;
`;

const EmptyTitle = styled.p`
  margin: 0 0 8px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const EmptyDescription = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const StartButton = styled.button`
  width: 100%;
  padding: 10px;
  color: white;
  background: ${({ theme }) => theme.colors.gray[300]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: not-allowed;
`;

/**
 * 수업 기능은 소켓/데이터 연동이 별도 담당(타 팀) 소관이라 실데이터 훅 없이
 * 프로토타입의 "진행 중·예정 없음" 기본 상태만 보여주는 UI 셸이다.
 */
export const InProgressLessonCard = () => (
  <Card>
    <Header>
      <Title>진행 중인 수업</Title>
      <StatusPill>없음</StatusPill>
    </Header>
    <EmptyState>
      <EmptyTitle>진행 중인 수업이 없습니다</EmptyTitle>
      <EmptyDescription>새 수업을 시작해보세요</EmptyDescription>
      <StartButton disabled title='준비 중'>
        수업 시작하기
      </StartButton>
    </EmptyState>
  </Card>
);
