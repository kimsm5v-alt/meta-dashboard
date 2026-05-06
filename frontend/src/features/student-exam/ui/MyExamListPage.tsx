/**
 * 학생용 검사 목록 페이지
 * 학생이 자신의 검사 현황을 확인하고 응시/결과 조회하는 페이지
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  RefreshCw,
  Play,
  RotateCcw,
  RefreshCw as Restart,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useAuth } from '@features/auth/model/AuthContext';
import { getMyGroups } from '@features/groups/api/groupService';
import { getStudentExamList, getStatusLabel, getStatusColor } from '../api/studentExamService';
import type { StudentExamListItem } from '../types';

// ============================================================
// Styled Components
// ============================================================

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const HeaderIconBox = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: #ede9fe;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PageSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 2px;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const SkeletonStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SkeletonCard = styled.div`
  height: 120px;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const EmptyState = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 48px ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const EmptyIconCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.gray[100]};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  svg {
    width: 32px;
    height: 32px;
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const EmptyDesc = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ExamList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ExamCardRoot = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ExamIconBox = styled.div<{ $status: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ $status }) =>
    $status === 'completed' || $status === 'result_ready'
      ? '#dcfce7'
      : $status === 'in_progress'
        ? '#fef3c7'
        : '#ede9fe'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ $status }) =>
      $status === 'completed' || $status === 'result_ready'
        ? '#16a34a'
        : $status === 'in_progress'
          ? '#d97706'
          : '#7c3aed'};
  }
`;

const ExamCardBody = styled.div`
  flex: 1;
`;

const ExamCardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ExamName = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StatusBadge = styled.span<{ $bg: string; $text: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};

  svg {
    width: 12px;
    height: 12px;
  }
`;

const ExamActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border: none;
  background: ${({ $variant, theme }) =>
    $variant === 'success'
      ? '#dcfce7'
      : $variant === 'secondary'
        ? theme.colors.gray[100]
        : theme.colors.primary[600]};
  color: ${({ $variant, theme }) =>
    $variant === 'success'
      ? '#15803d'
      : $variant === 'secondary'
        ? theme.colors.gray[700]
        : 'white'};

  &:hover {
    background: ${({ $variant, theme }) =>
      $variant === 'success'
        ? '#bbf7d0'
        : $variant === 'secondary'
          ? theme.colors.gray[200]
          : theme.colors.primary[700]};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const HintBox = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #1d4ed8;
`;

// ============================================================
// ExamCard
// ============================================================

interface ExamCardProps {
  exam: StudentExamListItem;
  onStartExam: (exam: StudentExamListItem) => void;
  onResumeExam: (exam: StudentExamListItem) => void;
  onRestartExam: (exam: StudentExamListItem) => void;
  onViewResult: (exam: StudentExamListItem) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onStartExam,
  onResumeExam,
  onRestartExam,
  onViewResult,
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
      case 'result_ready':
        return <CheckCircle2 />;
      default:
        return null;
    }
  };

  const renderActions = () => {
    switch (exam.status) {
      case 'waiting':
        return (
          <ActionButton onClick={() => onStartExam(exam)}>
            <Play />
            검사 시작
          </ActionButton>
        );
      case 'in_progress':
        return (
          <>
            <ActionButton onClick={() => onResumeExam(exam)}>
              <RotateCcw />
              이어하기
            </ActionButton>
            <ActionButton $variant='secondary' onClick={() => onRestartExam(exam)}>
              <Restart />
              새로하기
            </ActionButton>
          </>
        );
      case 'completed':
        return (
          <ActionButton $variant='secondary' disabled>
            결과 대기 중
          </ActionButton>
        );
      case 'result_ready':
        return (
          <ActionButton
            $variant='success'
            onClick={() => {
              onViewResult(exam);
            }}
          >
            <CheckCircle2 />
            결과 보기
          </ActionButton>
        );
      default:
        return null;
    }
  };

  return (
    <ExamCardRoot>
      <ExamIconBox $status={exam.status}>
        <ClipboardList />
      </ExamIconBox>
      <ExamCardBody>
        <ExamCardTop>
          <ExamName>{exam.name}</ExamName>
          <StatusBadge $bg={statusColor.bg} $text={statusColor.text}>
            {renderStatusIcon()}
            {statusLabel}
          </StatusBadge>
        </ExamCardTop>
        <ExamActions>{renderActions()}</ExamActions>
      </ExamCardBody>
    </ExamCardRoot>
  );
};

// ============================================================
// Page Component
// ============================================================

export const MyExamListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState<StudentExamListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadExams = useCallback(
    async (showRefreshIndicator = false) => {
      if (!user) return;

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        if (!user.stdtId) {
          setExams([]);
          return;
        }

        const groups = await getMyGroups(user.id);
        const memberGroups = groups.filter((g) => g.myRole === 'member');

        if (memberGroups.length === 0) {
          setExams([]);
          return;
        }

        const results = await Promise.all(
          memberGroups.map((g) => getStudentExamList(g.claId, user.stdtId!)),
        );

        // 중복 제거 (dgnssResultId 기준)
        const seen = new Set<number>();
        const flat = results.flat().filter((e) => {
          if (seen.has(e.dgnssResultId)) return false;
          seen.add(e.dgnssResultId);
          return true;
        });
        setExams(flat);
      } catch {
        setExams([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user],
  );

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const navigate2Exam = (exam: StudentExamListItem, extra?: Record<string, unknown>) => {
    navigate('/exam/student', {
      state: {
        dgnssResultId: exam.dgnssResultId,
        dgnssId: exam.dgnssId,
        ordNo: exam.ordNo,
        examName: exam.name,
        ...extra,
      },
    });
  };

  if (isLoading) {
    return (
      <PageRoot>
        <PageHeader>
          <div>
            <PageTitle>나의 검사</PageTitle>
            <PageSubtitle>검사 현황을 확인하고 응시하세요</PageSubtitle>
          </div>
        </PageHeader>
        <SkeletonStack>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </SkeletonStack>
      </PageRoot>
    );
  }

  return (
    <PageRoot>
      <PageHeader>
        <HeaderLeft>
          <HeaderIconBox>
            <ClipboardList />
          </HeaderIconBox>
          <div>
            <PageTitle>나의 검사</PageTitle>
            <PageSubtitle>검사 현황을 확인하고 응시하세요</PageSubtitle>
          </div>
        </HeaderLeft>
        <RefreshButton onClick={() => loadExams(true)} disabled={isRefreshing}>
          <RefreshCw />
          새로고침
        </RefreshButton>
      </PageHeader>

      {exams.length === 0 ? (
        <EmptyState>
          <EmptyIconCircle>
            <ClipboardList />
          </EmptyIconCircle>
          <EmptyTitle>현재 응시할 검사가 없습니다</EmptyTitle>
          <EmptyDesc>선생님이 검사를 시작하면 여기에 표시됩니다.</EmptyDesc>
        </EmptyState>
      ) : (
        <ExamList>
          {exams.map((exam) => (
            <ExamCard
              key={exam.dgnssResultId}
              exam={exam}
              onStartExam={(e) => navigate2Exam(e)}
              onResumeExam={(e) => navigate2Exam(e, { resume: true })}
              onRestartExam={(e) => navigate2Exam(e, { restart: true })}
              onViewResult={(e) => navigate(`/student/result/${e.dgnssResultId}`)}
            />
          ))}
        </ExamList>
      )}

      <HintBox>
        <strong>안내:</strong> 검사는 중간에 저장되므로, 나중에 이어서 응시할 수 있습니다. 모든
        문항에 응답한 후 제출하면 결과를 확인할 수 있습니다.
      </HintBox>
    </PageRoot>
  );
};
