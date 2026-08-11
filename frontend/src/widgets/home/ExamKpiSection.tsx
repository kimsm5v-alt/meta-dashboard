import styled from '@emotion/styled';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card } from '@shared/components';
import { useHomeExamStats } from '@features/home/model/useHomeExamStats';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

type Tone = 'default' | 'warning' | 'success' | 'error';

const MetricCard = styled.div`
  padding: 20px;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const Label = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Value = styled.p<{ $tone: Tone }>`
  margin: 0;
  color: ${({ theme, $tone }) => {
    if ($tone === 'warning') return theme.colors.warning.dark;
    if ($tone === 'success') return theme.colors.success.dark;
    if ($tone === 'error') return theme.colors.error.main;
    return theme.colors.text.primary;
  }};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Unit = styled.span`
  margin-left: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const Description = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
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

export const ExamKpiSection = () => {
  const { summary, isLoading, error, refetch } = useHomeExamStats();

  if (isLoading) {
    return (
      <Card>
        <CenterBox>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </CenterBox>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CenterBox style={{ flexDirection: 'column' }}>
          <p style={{ margin: 0 }}>주요 지표를 불러오지 못했습니다.</p>
          <RetryButton onClick={refetch}>
            <RefreshCw size={14} /> 다시 시도
          </RetryButton>
        </CenterBox>
      </Card>
    );
  }

  return (
    <Grid>
      <MetricCard>
        <Label>관리 중인 반</Label>
        <Value $tone='default'>
          {summary.totalClasses}
          <Unit>개</Unit>
        </Value>
      </MetricCard>
      <MetricCard>
        <Label>진행 중 검사</Label>
        <Value $tone='warning'>
          {summary.inProgressExams}
          <Unit>건</Unit>
        </Value>
        <Description>현재 응시 진행 중</Description>
      </MetricCard>
      <MetricCard>
        <Label>결과 확인 가능</Label>
        <Value $tone='success'>
          {summary.completedExams}
          <Unit>건</Unit>
        </Value>
        <Description>결과보기에서 확인</Description>
      </MetricCard>
      <MetricCard>
        <Label>미응시 학생</Label>
        <Value $tone='error'>
          {summary.pendingStudents}
          <Unit>명</Unit>
        </Value>
        <Description>응시 독려 필요</Description>
      </MetricCard>
    </Grid>
  );
};
