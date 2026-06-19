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
  RefreshCw,
  Upload,
  Download,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ConfirmBackground = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
`;

const ConfirmCard = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
  width: 100%;
  max-width: 420px;
  margin: 0 ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ConfirmTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ConfirmDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ConfirmButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
`;

const ConfirmButton = styled.button<{ $primary?: boolean }>`
  padding: 0.5rem 1.25rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  border: none;
  transition: background-color 0.15s ease;
  background: ${({ $primary, theme }) => ($primary ? theme.colors.primary[600] : theme.colors.gray[100])};
  color: ${({ $primary, theme }) => ($primary ? 'white' : theme.colors.gray[700])};

  &:hover {
    background: ${({ $primary, theme }) =>
      $primary ? theme.colors.primary[700] : theme.colors.gray[200]};
  }
`;

interface AssessmentListProps {
  assessments: ManagedAssessment[];
  onViewCode: (assessment: ManagedAssessment) => void;
  onEndExam?: (assessment: ManagedAssessment) => void;
  onCancelExam?: (assessment: ManagedAssessment) => void;
  onRestartExam?: (assessment: ManagedAssessment) => void;
  onExcelUpload?: (assessment: ManagedAssessment, file: File) => void;
  onTemplateDownload?: (assessment: ManagedAssessment) => void;
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
  allAssessments: ManagedAssessment[];
  onViewCode: (assessment: ManagedAssessment) => void;
  onEndExam?: (assessment: ManagedAssessment) => void;
  onCancelExam?: (assessment: ManagedAssessment) => void;
  onRestartExam?: (assessment: ManagedAssessment) => void;
  onExcelUpload?: (assessment: ManagedAssessment, file: File) => void;
  onTemplateDownload?: (assessment: ManagedAssessment) => void;
}> = ({
  assessment,
  allAssessments,
  onViewCode,
  onEndExam,
  onCancelExam,
  onRestartExam,
  onExcelUpload,
  onTemplateDownload,
}) => {
  const [showNotSubmitted, setShowNotSubmitted] = useState(false);
  const [notSubmittedStudents, setNotSubmittedStudents] = useState<NotSubmittedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notSubmittedCount = assessment.studentCount - assessment.completedCount;

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

  // "추가 진행하기" 버튼 노출 조건:
  // 1) 종료된 검사 (isActive === false)
  // 2) 미제출 학생 존재
  // 3) 1차 검사인 경우 동일 claId의 2차 검사가 아직 시작되지 않음
  const hasRound2Started =
    assessment.round === 1 &&
    allAssessments.some((a) => a.claId === assessment.claId && a.round === 2);
  const showRestartButton =
    assessment.isActive === false && notSubmittedCount > 0 && !hasRound2Started;

  const handleRestartConfirm = () => {
    setShowRestartConfirm(false);
    onRestartExam?.(assessment);
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
          {assessment.isActive === true && onExcelUpload && (
            <>
              <input
                ref={fileInputRef}
                type='file'
                accept='.xlsx,.xls'
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onExcelUpload(assessment, file);
                  e.target.value = '';
                }}
              />
              <ActionButton onClick={() => fileInputRef.current?.click()} $variant='primary'>
                <Upload className='w-4 h-4' />
                엑셀 업로드
              </ActionButton>
            </>
          )}
          {assessment.isActive === true && onTemplateDownload && (
            <ActionButton onClick={() => onTemplateDownload(assessment)} $variant='primary'>
              <Download className='w-4 h-4' />
              양식 다운로드
            </ActionButton>
          )}
          {assessment.isActive !== false && (
            <ActionButton onClick={() => onViewCode(assessment)} $variant='primary'>
              <Eye className='w-4 h-4' />
              코드 보기
            </ActionButton>
          )}
          {showRestartButton && onRestartExam && (
            <ActionButton onClick={() => setShowRestartConfirm(true)} $variant='primary'>
              <RefreshCw className='w-4 h-4' />
              추가 진행하기
            </ActionButton>
          )}
          {assessment.isActive && onEndExam && (
            <ActionButton onClick={() => onEndExam(assessment)} $variant='warning'>
              <StopCircle className='w-4 h-4' />
              종료
            </ActionButton>
          )}
          {assessment.isActive !== false && onCancelExam && (
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

      {/* 추가 진행하기 확인 모달 */}
      {showRestartConfirm && (
        <ConfirmOverlay>
          <ConfirmBackground onClick={() => setShowRestartConfirm(false)} />
          <ConfirmCard>
            <ConfirmTitle>추가 진행하시겠습니까?</ConfirmTitle>
            <ConfirmDescription>
              미제출 학생이나 추가된 학생을 위해 추가 진행하기를 할 경우 현재 결과가 업데이트
              됩니다.
            </ConfirmDescription>
            <ConfirmButtons>
              <ConfirmButton onClick={() => setShowRestartConfirm(false)}>아니오</ConfirmButton>
              <ConfirmButton $primary onClick={handleRestartConfirm}>
                예
              </ConfirmButton>
            </ConfirmButtons>
          </ConfirmCard>
        </ConfirmOverlay>
      )}
    </ItemContainer>
  );
};

export const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  onViewCode,
  onEndExam,
  onCancelExam,
  onRestartExam,
  onExcelUpload,
  onTemplateDownload,
}) => {
  return (
    <Container>
      {assessments.map((assessment) => (
        <AssessmentItem
          key={assessment.id}
          assessment={assessment}
          allAssessments={assessments}
          onViewCode={onViewCode}
          onEndExam={onEndExam}
          onCancelExam={onCancelExam}
          onRestartExam={onRestartExam}
          onExcelUpload={onExcelUpload}
          onTemplateDownload={onTemplateDownload}
        />
      ))}
    </Container>
  );
};
