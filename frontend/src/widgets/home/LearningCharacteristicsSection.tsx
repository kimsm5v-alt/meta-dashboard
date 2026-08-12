import styled from '@emotion/styled';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card } from '@shared/components';
import { CategoryComparisonChart } from '@features/teacher-dashboard/ui';
import { useHomeClassStats } from '@features/home/model/useHomeClassStats';

const Title = styled.h3`
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Subtitle = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
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

export const LearningCharacteristicsSection = () => {
  const { classes, isLoading, error, refetch } = useHomeClassStats();

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
          <p style={{ margin: 0 }}>반별 학습 특성 데이터를 불러오지 못했습니다.</p>
          <RetryButton onClick={refetch}>
            <RefreshCw size={14} /> 다시 시도
          </RetryButton>
        </CenterBox>
      </Card>
    );
  }

  if (classes.length === 0) {
    return null;
  }

  return (
    <Card>
      <Title>반별 학습 특성 비교</Title>
      <Subtitle>5대 영역별 평균 T점수 (점선 50 = 전국 평균)</Subtitle>
      <CategoryComparisonChart classes={classes} />
    </Card>
  );
};
