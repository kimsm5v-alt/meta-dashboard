import styled from '@emotion/styled';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card } from '@shared/components';
import { useTrackingClassData } from '@features/exam-tracking/model/useTrackingClassData';
import { TopChangeSummary } from './TopChangeSummary';
import { CategoryChangeList } from './CategoryChangeList';
import { SignificantFactorChanges } from './SignificantFactorChanges';
import { TypeChangeStudents } from './TypeChangeStudents';
import { ClassInterventionTimeline } from './ClassInterventionTimeline';

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Description = styled.p`
  margin: -${({ theme }) => theme.spacing.md} 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
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

interface ClassTrackingSectionProps {
  classId: string;
}

export const ClassTrackingSection = ({ classId }: ClassTrackingSectionProps) => {
  const { classData, isLoading, error, refetch } = useTrackingClassData(classId);

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
            <EmptyText style={{ padding: 0 }}>반 정보를 불러오지 못했습니다.</EmptyText>
            <RetryButton onClick={refetch}>
              <RefreshCw size={14} /> 다시 시도
            </RetryButton>
          </CenterBox>
        </Card>
      </Wrapper>
    );
  }

  if (!classData) {
    return (
      <Wrapper>
        <Card>
          <EmptyText>선택한 반을 찾을 수 없습니다.</EmptyText>
        </Card>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Title>
        {classData.grade}-{classData.classNumber}반 변화추적
      </Title>
      <Description>1차 검사와 2차 검사 결과를 비교하여 학생들의 변화를 확인합니다.</Description>
      <CategoryChangeList classData={classData} />
      <SignificantFactorChanges classData={classData} />
      <TopChangeSummary classData={classData} />
      <TypeChangeStudents classData={classData} />
      <ClassInterventionTimeline classId={classData.id} />
    </Wrapper>
  );
};
