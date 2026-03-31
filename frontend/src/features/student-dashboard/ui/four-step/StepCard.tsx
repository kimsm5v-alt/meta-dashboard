import styled from '@emotion/styled';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const Container = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.gray[50]};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const StepBadge = styled.span`
  padding: 0.25rem 0.625rem;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  white-space: nowrap;
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const Subtitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  flex-shrink: 0;
`;

const LegendDivider = styled.span`
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const LegendItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const LegendColor = styled.span<{ $color: string }>`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ $color }) => $color};
`;

const ChevronIcon = styled(ChevronRight)<{ $isExpanded: boolean }>`
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  transition: transform 0.15s ease;
  transform: ${({ $isExpanded }) => ($isExpanded ? 'rotate(90deg)' : 'rotate(0deg)')};
`;

const Content = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background.paper};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

// ============================================================
// StepCard Props
// ============================================================

export interface StepCardProps {
  step: number;
  title: string;
  subtitle: React.ReactNode;
  showBarLegend?: boolean;
  isCompare?: boolean;
  children: React.ReactNode;
}

// ============================================================
// StepCard (아코디언)
// ============================================================

export function StepCard({
  step,
  title,
  subtitle,
  showBarLegend = false,
  isCompare = false,
  children,
}: StepCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Container>
      <Header onClick={() => setIsExpanded(!isExpanded)}>
        <StepBadge>{step}단계</StepBadge>
        <TitleSection>
          <Title>{title}</Title>
          <Subtitle>{subtitle}</Subtitle>
        </TitleSection>
        {showBarLegend && isExpanded && (
          <Legend>
            <span>점선: T=50</span>
            {isCompare && (
              <>
                <LegendDivider>|</LegendDivider>
                <LegendItem>
                  <LegendColor $color='#9ca3af' /> 1차
                </LegendItem>
                <LegendItem>
                  <LegendColor $color='#818cf8' /> 2차
                </LegendItem>
              </>
            )}
          </Legend>
        )}
        <ChevronIcon $isExpanded={isExpanded} />
      </Header>

      {isExpanded && <Content>{children}</Content>}
    </Container>
  );
}
