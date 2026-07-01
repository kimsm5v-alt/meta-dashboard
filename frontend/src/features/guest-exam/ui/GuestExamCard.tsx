/**
 * 게스트용 검사 카드 컴포넌트
 * 상태(waiting/in_progress/completed)에 따라 다른 버튼 표시
 */

import styled from '@emotion/styled';
import { ClipboardList, Play, RotateCcw, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { getStatusLabel, getStatusColor } from '../api/guestExamService';
import type { StudentExamListItem } from '@features/student-exam/types';

interface GuestExamCardProps {
  exam: StudentExamListItem;
  onStartExam: (exam: StudentExamListItem) => void;
  onResumeExam: (exam: StudentExamListItem) => void;
  onRestartExam: (exam: StudentExamListItem) => void;
}

// ============================================================
// Styled Components
// ============================================================

const CardRoot = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ExamIconWrapper = styled.div<{ $status: string }>`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radius.xl};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $status }) =>
    $status === 'completed' ? '#dcfce7' : $status === 'in_progress' ? '#fef3c7' : '#ede9fe'};
  flex-shrink: 0;

  svg {
    width: 28px;
    height: 28px;
    color: ${({ $status }) =>
      $status === 'completed' ? '#16a34a' : $status === 'in_progress' ? '#d97706' : '#7c3aed'};
  }
`;

const CardMeta = styled.div`
  flex: 1;
`;

const ExamName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatusBadge = styled.span<{ $bg: string; $text: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const StatusMessage = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const StatusText = styled.p<{ $color: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ $color }) => $color};
`;

const ActionArea = styled.div``;

const StartButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
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

  svg {
    width: 20px;
    height: 20px;
  }
`;

const DualButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ResumeButton = styled(StartButton)`
  flex: 1;
`;

const RestartButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  border-radius: ${({ theme }) => theme.radius.xl};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const CompletedDisplay = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  background: #dcfce7;
  color: #15803d;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.xl};

  svg {
    width: 20px;
    height: 20px;
  }
`;

// ============================================================
// Component
// ============================================================

export const GuestExamCard: React.FC<GuestExamCardProps> = ({
  exam,
  onStartExam,
  onResumeExam,
  onRestartExam,
}) => {
  const statusColor = getStatusColor(exam.status);
  const statusLabel = getStatusLabel(exam.status);

  const renderStatusIcon = () => {
    switch (exam.status) {
      case 'waiting':
        return <Clock />;
      case 'in_progress':
        return <RotateCcw />;
      case 'completed':
        return <CheckCircle2 />;
      default:
        return null;
    }
  };

  const renderStatusMessage = () => {
    switch (exam.status) {
      case 'waiting':
        return <StatusText $color='#2563eb'>검사를 시작해주세요.</StatusText>;
      case 'in_progress':
        return <StatusText $color='#d97706'>검사가 중단되었어요. 이어서 진행해주세요.</StatusText>;
      case 'completed':
        return (
          <StatusText $color='#16a34a'>
            검사가 완료되었습니다. 결과는 이메일로 발송됩니다.
          </StatusText>
        );
      default:
        return null;
    }
  };

  const renderActionButton = () => {
    switch (exam.status) {
      case 'waiting':
        return (
          <StartButton onClick={() => onStartExam(exam)}>
            <Play />
            검사 시작
          </StartButton>
        );
      case 'in_progress':
        return (
          <DualButtonRow>
            <ResumeButton onClick={() => onResumeExam(exam)}>
              <RotateCcw />
              이어하기
            </ResumeButton>
            <RestartButton onClick={() => onRestartExam(exam)}>
              <RefreshCw />
              새로하기
            </RestartButton>
          </DualButtonRow>
        );
      case 'completed':
        return (
          <CompletedDisplay>
            <CheckCircle2 />
            검사 완료
          </CompletedDisplay>
        );
      default:
        return null;
    }
  };

  return (
    <CardRoot>
      <CardHeader>
        <ExamIconWrapper $status={exam.status}>
          <ClipboardList />
        </ExamIconWrapper>
        <CardMeta>
          <ExamName>{exam.name}</ExamName>
          <StatusBadge $bg={statusColor.bg} $text={statusColor.text}>
            {renderStatusIcon()}
            {statusLabel}
          </StatusBadge>
        </CardMeta>
      </CardHeader>

      <StatusMessage>{renderStatusMessage()}</StatusMessage>

      <ActionArea>{renderActionButton()}</ActionArea>
    </CardRoot>
  );
};
