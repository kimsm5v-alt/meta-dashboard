import styled from '@emotion/styled';
import { Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { Card } from '@shared/components';
import { useTrackingStudentData } from '@features/exam-tracking/model/useTrackingStudentData';
import { TYPE_COLORS } from '@features/class-dashboard/lib/typeUtils';
import { StudentFactorChangeList } from './StudentFactorChangeList';
import { InterventionTimeline } from './InterventionTimeline';

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StudentName = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ClassLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const TypeBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const TypeBadge = styled.span<{ $color: string }>`
  padding: 4px 12px;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}20`};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
`;

const EmptyText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  padding: 48px 0;
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: 6px 12px;
  color: ${({ theme }) => theme.colors.primary[700]};
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
`;

const NoticeBox = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.warning.light};
  border: 1px solid ${({ theme }) => theme.colors.warning.main};
  border-radius: ${({ theme }) => theme.radius.xl};
  text-align: center;
`;

const NoticeText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.warning.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

interface StudentTrackingSectionProps {
  classId: string;
  studentId: string;
}

export const StudentTrackingSection = ({ classId, studentId }: StudentTrackingSectionProps) => {
  const { classData, student, isLoading, error, refetch } = useTrackingStudentData(
    classId,
    studentId,
  );

  if (isLoading) {
    return (
      <Wrapper>
        <Card>
          <CenterBox>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </CenterBox>
        </Card>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <Card>
          <CenterBox style={{ flexDirection: 'column' }}>
            <EmptyText style={{ padding: 0 }}>학생 정보를 불러오지 못했습니다.</EmptyText>
            <RetryButton onClick={refetch}>
              <RefreshCw size={14} /> 다시 시도
            </RetryButton>
          </CenterBox>
        </Card>
      </Wrapper>
    );
  }

  if (!classData || !student) {
    return (
      <Wrapper>
        <Card>
          <EmptyText>선택한 학생을 찾을 수 없습니다.</EmptyText>
        </Card>
      </Wrapper>
    );
  }

  const round1 = student.assessments.find((a) => a.round === 1);
  const round2 = student.assessments.find((a) => a.round === 2);

  if (!round2) {
    return (
      <Wrapper>
        <HeaderRow>
          <StudentName>
            {student.number}. {student.name}
          </StudentName>
          <ClassLabel>
            {classData.grade}-{classData.classNumber}반
          </ClassLabel>
        </HeaderRow>
        <NoticeBox>
          <NoticeText>이 학생은 아직 2차 검사를 응시하지 않았습니다.</NoticeText>
        </NoticeBox>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <HeaderRow>
        <StudentName>
          {student.number}. {student.name}
        </StudentName>
        <ClassLabel>
          {classData.grade}-{classData.classNumber}반
        </ClassLabel>
      </HeaderRow>

      {round1 && (
        <TypeBadgeRow>
          <TypeBadge $color={TYPE_COLORS[round1.predictedType] ?? '#6B7280'}>
            {round1.predictedType}
          </TypeBadge>
          <ArrowRight size={16} color='#9CA3AF' />
          <TypeBadge $color={TYPE_COLORS[round2.predictedType] ?? '#6B7280'}>
            {round2.predictedType}
          </TypeBadge>
        </TypeBadgeRow>
      )}

      {round1 && (
        <StudentFactorChangeList round1TScores={round1.tScores} round2TScores={round2.tScores} />
      )}

      <InterventionTimeline studentId={student.id} classId={classData.id} />
    </Wrapper>
  );
};
