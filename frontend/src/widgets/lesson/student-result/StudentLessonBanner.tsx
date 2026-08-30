import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import type { MyActivity } from '@features/lesson';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.success.main};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.success.light};
`;

const Dot = styled.span`
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.success.main};
  animation: ${pulse} 2s ease-in-out infinite;
`;

const Copy = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.div`
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Sub = styled.div`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const JoinButton = styled.button`
  flex: none;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.success.dark};
  color: ${({ theme }) => theme.colors.background.paper};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: filter ${({ theme }) => theme.transitions.fast};

  &:hover {
    filter: brightness(0.92);
  }
`;

interface StudentLessonBannerProps {
  activity: MyActivity;
}

export const StudentLessonBanner = ({ activity }: StudentLessonBannerProps) => {
  const navigate = useNavigate();

  const handleJoin = () => {
    navigate(`/student/lesson/${encodeURIComponent(activity.accessKey)}`);
  };

  return (
    <Banner>
      <Dot />
      <Copy>
        <Title>수업이 진행 중이에요</Title>
        <Sub>{activity.title}</Sub>
      </Copy>
      <JoinButton type='button' onClick={handleJoin}>
        참여하기
      </JoinButton>
    </Banner>
  );
};
