import styled from '@emotion/styled';
import type { Level } from '@shared/utils/calculate4StepDiagnosis';
import {
  COLORS_POSITIVE,
  COLORS_NEGATIVE,
} from '@features/student-dashboard/ui/four-step/constants';

// ============================================================
// SubSection Props
// ============================================================

export interface SubSectionProps {
  title: string;
  level: Level;
  isNegativeSection?: boolean;
  children: React.ReactNode;
}

// ============================================================
// Styled Components
// ============================================================

const Container = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.background.paper};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: 10px;
`;

const Title = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Badge = styled.span<{ $bg: string; $text: string }>`
  padding: 2px ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
`;

const HintText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

// ============================================================
// SubSection
// ============================================================

export function SubSection({ title, level, isNegativeSection = false, children }: SubSectionProps) {
  const badgeColor = isNegativeSection ? COLORS_NEGATIVE[level] : COLORS_POSITIVE[level];

  return (
    <Container>
      <Header>
        <Title>{title}</Title>
        <Badge $bg={badgeColor.bg} $text={badgeColor.text}>{level}</Badge>
        {isNegativeSection && <HintText>↓ 낮을수록 좋아요</HintText>}
      </Header>
      <Content>{children}</Content>
    </Container>
  );
}
