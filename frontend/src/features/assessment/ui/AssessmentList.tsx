import styled from '@emotion/styled';
import {
  Eye,
  Users,
  Calendar,
  Clock,
  StopCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserX,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ManagedAssessment } from '@shared/types';
import { fetchNotSubmittedStudents, type NotSubmittedStudent } from '../api/assessmentService';

const Container = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};

  > * {
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};

    &:last-child {
      border-bottom: none;
    }
  }
`;

const ItemContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const ItemTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Title = styled.h5`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const StatusBadge = styled.span<{ $color: 'gray' | 'green' | 'blue' }>`
  padding: 0.125rem 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $color }) =>
    $color === 'gray' ? '#f3f4f6' : $color === 'green' ? '#dcfce7' : '#dbeafe'};
  color: ${({ $color }) =>
    $color === 'gray' ? '#4b5563' : $color === 'green' ? '#16a34a' : '#2563eb'};
`;

const RoundBadge = styled.span`
  padding: 0.125rem 0.5rem;
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'warning' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
  color: ${({ $variant, theme }) =>
    $variant === 'primary'
      ? theme.colors.primary[600]
      : $variant === 'warning'
        ? '#d97706'
        : '#dc2626'};
  background: transparent;

  &:hover {
    background: ${({ $variant, theme }) =>
      $variant === 'primary'
        ? theme.colors.primary[50]
        : $variant === 'warning'
          ? '#fef3c7'
          : '#fee2e2'};
  }
`;

const ItemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ToggleButton = styled.button<{ $hasNotSubmitted: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: transparent;
  border: none;
  cursor: ${({ $hasNotSubmitted }) => ($hasNotSubmitted ? 'pointer' : 'default')};
  color: ${({ $hasNotSubmitted }) => ($hasNotSubmitted ? '#d97706' : 'inherit')};
  transition: color 0.15s ease;

  &:hover {
    color: ${({ $hasNotSubmitted }) => ($hasNotSubmitted ? '#b45309' : 'inherit')};
  }

  &:disabled {
    cursor: default;
  }
`;

const NotSubmittedCount = styled.span`
  margin-left: 0.25rem;
  color: #d97706;
`;

const NotSubmittedPanel = styled.div`
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #fffbeb;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid #fde68a;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: #b45309;
`;

const LoadingText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #d97706;
`;

const StudentList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const StudentBadge = styled.span`
  padding: 0.25rem 0.5rem;
  background: ${({ theme }) => theme.colors.background.paper};
  color: #b45309;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid #fde68a;
`;

interface AssessmentListProps {
  assessments: ManagedAssessment[];
  onViewCode: (assessment: ManagedAssessment) => void;
  onEndExam?: (assessment: ManagedAssessment) => void;
  onCancelExam?: (assessment: ManagedAssessment) => void;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const getStatusBadge = (assessment: ManagedAssessment) => {
  // isActive 필드가 있으면 우선 사용 (API 응답 기준)
  if (assessment.isActive === false) {
    return <StatusBadge $color='gray'>종료됨</StatusBadge>;
  }
  if (assessment.isActive === true) {
    return <StatusBadge $color='green'>진행중</StatusBadge>;
  }

  // isActive가 없으면 날짜로 판단 (레거시)
  const now = new Date();
  const endDate = assessment.endDate ? new Date(assessment.endDate) : null;
  const startDate = new Date(assessment.startDate);

  if (endDate && now > endDate) {
    return <StatusBadge $color='gray'>종료됨</StatusBadge>;
  }
  if (now < startDate) {
    return <StatusBadge $color='blue'>예정</StatusBadge>;
  }
  return <StatusBadge $color='green'>진행중</StatusBadge>;
};

/** 개별 검사 항목 컴포넌트 */
const AssessmentItem: React.FC<{
  assessment: ManagedAssessment;
  onViewCode: (assessment: ManagedAssessment) => void;
  onEndExam?: (assessment: ManagedAssessment) => void;
  onCancelExam?: (assessment: ManagedAssessment) => void;
}> = ({ assessment, onViewCode, onEndExam, onCancelExam }) => {
  const [showNotSubmitted, setShowNotSubmitted] = useState(false);
  const [notSubmittedStudents, setNotSubmittedStudents] = useState<NotSubmittedStudent[]>([]);
  const [loading, setLoading] = useState(false);

  const notSubmittedCount = assessment.studentCount - assessment.completedCount;
  console.log(assessment, 'sss');

  useEffect(() => {
    if (showNotSubmitted && notSubmittedStudents.length === 0 && notSubmittedCount > 0) {
      setLoading(true);
      fetchNotSubmittedStudents(assessment.dgnssId)
        .then(setNotSubmittedStudents)
        .catch(() => setNotSubmittedStudents([]))
        .finally(() => setLoading(false));
    }
  }, [showNotSubmitted, assessment.dgnssId, notSubmittedStudents.length, notSubmittedCount]);

  const handleToggleNotSubmitted = () => {
    if (notSubmittedCount > 0) {
      setShowNotSubmitted(!showNotSubmitted);
    }
  };

  return (
    <ItemContainer>
      <ItemHeader>
        <ItemTitle>
          <Title>{assessment.name}</Title>
          {getStatusBadge(assessment)}
          <RoundBadge>{assessment.round}차</RoundBadge>
        </ItemTitle>
        <Actions>
          <ActionButton onClick={() => onViewCode(assessment)} $variant='primary'>
            <Eye className='w-4 h-4' />
            코드 보기
          </ActionButton>
          {assessment.isActive && onEndExam && (
            <ActionButton onClick={() => onEndExam(assessment)} $variant='warning'>
              <StopCircle className='w-4 h-4' />
              종료
            </ActionButton>
          )}
          {onCancelExam && (
            <ActionButton onClick={() => onCancelExam(assessment)} $variant='danger'>
              <Trash2 className='w-4 h-4' />
              취소
            </ActionButton>
          )}
        </Actions>
      </ItemHeader>
      <ItemMeta>
        <MetaItem>
          <Users className='w-4 h-4' />
          {assessment.grade}학년 {assessment.classNumber}반
        </MetaItem>
        <ToggleButton
          onClick={handleToggleNotSubmitted}
          $hasNotSubmitted={notSubmittedCount > 0}
          disabled={notSubmittedCount === 0}
        >
          <Clock className='w-4 h-4' />
          {assessment.completedCount}/{assessment.studentCount}명 완료
          {notSubmittedCount > 0 && (
            <>
              <NotSubmittedCount>({notSubmittedCount}명 미제출)</NotSubmittedCount>
              {showNotSubmitted ? (
                <ChevronUp className='w-4 h-4 ml-0.5' />
              ) : (
                <ChevronDown className='w-4 h-4 ml-0.5' />
              )}
            </>
          )}
        </ToggleButton>
        <MetaItem>
          <Calendar className='w-4 h-4' />
          {formatDate(assessment.startDate)}
          {assessment.endDate ? ` ~ ${formatDate(assessment.endDate)}` : ' ~'}
        </MetaItem>
      </ItemMeta>

      {/* 미제출 학생 목록 */}
      {showNotSubmitted && notSubmittedCount > 0 && (
        <NotSubmittedPanel>
          <PanelHeader>
            <UserX className='w-4 h-4' />
            미제출 학생 ({notSubmittedCount}명)
          </PanelHeader>
          {loading ? (
            <LoadingText>불러오는 중...</LoadingText>
          ) : notSubmittedStudents.length > 0 ? (
            <StudentList>
              {notSubmittedStudents.map((student, idx) => (
                <StudentBadge key={idx}>{student.nickname}</StudentBadge>
              ))}
            </StudentList>
          ) : (
            <LoadingText>미제출 학생 정보를 불러올 수 없습니다.</LoadingText>
          )}
        </NotSubmittedPanel>
      )}
    </ItemContainer>
  );
};

export const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  onViewCode,
  onEndExam,
  onCancelExam,
}) => {
  return (
    <Container>
      {assessments.map((assessment) => (
        <AssessmentItem
          key={assessment.id}
          assessment={assessment}
          onViewCode={onViewCode}
          onEndExam={onEndExam}
          onCancelExam={onCancelExam}
        />
      ))}
    </Container>
  );
};
