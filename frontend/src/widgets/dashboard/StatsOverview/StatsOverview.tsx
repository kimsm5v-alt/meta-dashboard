import styled from '@emotion/styled';
import { Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ComponentType } from 'react';
import { Card, Skeleton } from '@shared/ui';
import { useTeacherStats } from '@features/dashboard';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const StatCardWrapper = styled(Card)`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const IconWrapper = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ $color }) => `${$color}20`};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const iconMap: Record<string, ComponentType<LucideProps>> = {
  Users,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
};

export const StatsOverview = () => {
  const { data: stats, isLoading } = useTeacherStats();

  if (isLoading) {
    return (
      <Grid>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height='120px' borderRadius='16px' />
        ))}
      </Grid>
    );
  }

  return (
    <Grid>
      {stats?.map((stat) => {
        const Icon = iconMap[stat.iconName];
        return (
          <StatCardWrapper key={stat.label} variant='glass'>
            <StatHeader>
              <IconWrapper $color={stat.color}>{Icon && <Icon size={24} />}</IconWrapper>
            </StatHeader>
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </StatCardWrapper>
        );
      })}
    </Grid>
  );
};
