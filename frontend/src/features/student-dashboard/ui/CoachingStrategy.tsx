import { useState } from 'react';
import styled from '@emotion/styled';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import type { ModerationPath } from '@shared/services/dashboardService';

interface CoachingStrategyProps {
  moderationPaths?: ModerationPath[];
  typeName?: string;
  typeColor?: string;
  isLoading?: boolean;
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TypeBadge = styled.span<{ $color?: string }>`
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: white;
  background: ${({ $color, theme }) => $color || theme.colors.primary[500]};
`;

const AccordionList = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AccordionItem = styled.div<{ $expanded: boolean }>`
  border: 1px solid ${({ $expanded, theme }) =>
    $expanded ? theme.colors.primary[300] : theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  transition: border-color 0.15s ease;
  ${({ $expanded }) => $expanded && 'box-shadow: 0 1px 4px rgba(0,0,0,0.07);'}
`;

const AccordionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const IndexBadge = styled.span`
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: #eef2ff;
  color: #4338ca;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Formula = styled.div`
  flex: 1;
  min-width: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const XVar = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const YVar = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const ChevronIcon = styled.div`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const AccordionBody = styled.div`
  padding: 0.75rem 1rem 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  background: ${({ theme }) => theme.colors.gray[50]};
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const SubSection = styled.div``;

const SubTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.5rem;
`;

const InterpretBox = styled.div`
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 0.75rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
`;

const StrategyBox = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StrategyStep = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

const StepNum = styled.span`
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: #eef2ff;
  color: #4338ca;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
`;

const StepText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const CoachingStrategy: React.FC<CoachingStrategyProps> = ({
  moderationPaths = [],
  typeName,
  typeColor,
  isLoading = false,
}) => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>추천 코칭 전략</CardTitle>
        {typeName && <TypeBadge $color={typeColor}>{typeName}</TypeBadge>}
      </CardHeader>

      <AccordionList>
        {isLoading ? (
          <LoadingRow>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            코칭 전략 불러오는 중...
          </LoadingRow>
        ) : moderationPaths.length === 0 ? (
          <EmptyState>추천 경로가 없습니다.</EmptyState>
        ) : (
          moderationPaths.map((path, idx) => {
            const isExpanded = openIndex === idx;
            const steps = path.strategy.split(/(?<=\.) /).filter(Boolean);

            return (
              <AccordionItem key={path.id ?? idx} $expanded={isExpanded}>
                <AccordionHeader onClick={() => setOpenIndex(isExpanded ? -1 : idx)}>
                  <IndexBadge>{idx + 1}</IndexBadge>
                  <Formula>
                    <XVar>{path.x}</XVar>
                    {path.z && <> × <XVar>{path.z}</XVar></>}
                    {' → '}
                    <YVar>{path.y}</YVar>
                  </Formula>
                  <ChevronIcon>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </ChevronIcon>
                </AccordionHeader>

                {isExpanded && (
                  <AccordionBody>
                    {path.interpretation && (
                      <SubSection>
                        <SubTitle>왜 이 경로가 중요한가요?</SubTitle>
                        <InterpretBox>{path.interpretation}</InterpretBox>
                      </SubSection>
                    )}
                    <SubSection>
                      <SubTitle>구체적 실행 전략</SubTitle>
                      <StrategyBox>
                        {steps.map((step, si) => (
                          <StrategyStep key={si}>
                            <StepNum>{si + 1}</StepNum>
                            <StepText>{step.trim()}</StepText>
                          </StrategyStep>
                        ))}
                      </StrategyBox>
                    </SubSection>
                  </AccordionBody>
                )}
              </AccordionItem>
            );
          })
        )}
      </AccordionList>
    </Card>
  );
};

export default CoachingStrategy;
