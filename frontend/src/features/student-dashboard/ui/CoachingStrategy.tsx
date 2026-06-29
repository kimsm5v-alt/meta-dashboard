import { useState } from 'react';
import styled from '@emotion/styled';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import type { ModerationPath, Strength, Weakness } from '@shared/services/dashboardService';
import { FACTOR_DEFINITIONS } from '@shared/data/factors';
import scriptsData from '@shared/data/scripts_depth3.json';

// ============================================================
// 대분류별 해시태그 색상
// ============================================================

const CATEGORY_COLOR_MAP: Record<string, string> = {
  자아강점: '#00D282',
  학습디딤돌: '#4BC1FF',
  긍정적공부마음: '#67A7FF',
  학습걸림돌: '#FF849F',
  부정적공부마음: '#FF87D4',
};

// ============================================================
// 유틸
// ============================================================

const getFactorCategory = (factorName: string): string => {
  const normalized = factorName.replace(/\s+/g, '');
  const factor = FACTOR_DEFINITIONS.find((f) => f.name.replace(/\s+/g, '') === normalized);
  return factor?.category ?? '';
};

const getFactorSummary = (factorName: string, tScore: number): string => {
  const normalized = factorName.replace(/\s+/g, '');
  const entry = (
    scriptsData as {
      scripts: {
        depth3: string;
        tScore_lower: number | null;
        tScore_upper: number | null;
        summary: string;
      }[];
    }
  ).scripts.find((s) => {
    if (s.depth3.replace(/\s+/g, '') !== normalized) return false;
    const lower = s.tScore_lower ?? -Infinity;
    const upper = s.tScore_upper ?? Infinity;
    return tScore >= lower && tScore <= upper;
  });
  return entry?.summary ?? '';
};

// ============================================================
// Props
// ============================================================

interface CoachingStrategyProps {
  moderationPaths?: ModerationPath[];
  strengths?: Strength[];
  weaknesses?: Weakness[];
  typeName?: string;
  typeColor?: string;
  isLoading?: boolean;
}

// ============================================================
// Styled components
// ============================================================

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

// const TypeBadge = styled.span<{ $color?: string }>`
//   padding: 3px 10px;
//   border-radius: ${({ theme }) => theme.radius.full};
//   font-size: ${({ theme }) => theme.typography.fontSize.xs};
//   font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
//   color: white;
//   background: ${({ $color, theme }) => $color || theme.colors.primary[500]};
// `;

/* ── 강점/보완점 카드 영역 ── */

const FactorCardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
`;

const FactorCard = styled.div<{ $type: 'strength' | 'weakness' }>`
  padding: 1rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ $type }) => ($type === 'strength' ? '#ecfdf5' : '#fffbeb')};
  border: 1px solid ${({ $type }) => ($type === 'strength' ? '#a7f3d0' : '#fde68a')};
`;

const FactorBadge = styled.span<{ $type: 'strength' | 'weakness' }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: 0.5rem;
  background: ${({ $type }) => ($type === 'strength' ? '#d1fae5' : '#fef3c7')};
  color: ${({ $type }) => ($type === 'strength' ? '#065f46' : '#92400e')};
`;

const CategoryTag = styled.span<{ $color: string }>`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ $color }) => $color};
  margin-bottom: 0.375rem;
`;

const FactorName = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.375rem;
`;

const FactorDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: 1.5;
`;

/* ── 아코디언 영역 ── */

const AccordionList = styled.div`
  padding: 0 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AccordionItem = styled.div<{ $expanded: boolean }>`
  border: 1px solid
    ${({ $expanded, theme }) => ($expanded ? theme.colors.primary[300] : theme.colors.gray[200])};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  transition: border-color 0.15s ease;
  ${({ $expanded }) => $expanded && 'box-shadow: 0 1px 4px rgba(0,0,0,0.07);'}
`;

const AccordionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.625rem;
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

const AccordionLabelBadge = styled.span<{ $type: 'strength' | 'weakness' }>`
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ $type }) => ($type === 'strength' ? '#d1fae5' : '#fef3c7')};
  color: ${({ $type }) => ($type === 'strength' ? '#065f46' : '#92400e')};
`;

const AccordionLabel = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const ChevronIcon = styled.div`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const AccordionBody = styled.div`
  padding: 0.75rem 1rem 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  background: ${({ theme }) => theme.colors.gray[50]};
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PathBox = styled.div`
  background: #f3f4f6;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  padding: 1rem;
`;

const PathLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.375rem;
`;

const PathFormula = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const YSpan = styled.span`
  color: #9333ea;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const SubTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.5rem;
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

const SubSectionWrapper = styled.div`
  display: flex;
  gap: 1rem;
`;

const SubSectionInterpret = styled.div`
  width: 50%;
`;

const SubSectionStrategy = styled.div`
  width: 50%;
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

// ============================================================
// Component
// ============================================================

export const CoachingStrategy: React.FC<CoachingStrategyProps> = ({
  moderationPaths = [],
  strengths = [],
  weaknesses = [],
  typeName,
  typeColor,
  isLoading = false,
}) => {
  console.log('Received props:', {
    moderationPaths,
    strengths,
    weaknesses,
    typeName,
    typeColor,
    isLoading,
  });
  const [openIndex, setOpenIndex] = useState(-1);

  const strength = strengths[0];
  const weakness = weaknesses[0];

  const strengthCategory = strength ? getFactorCategory(strength.factorName) : '';
  const weaknessCategory = weakness ? getFactorCategory(weakness.factorName) : '';

  const hasFactorData = !!strength || !!weakness;
  const hasCoachingPaths = moderationPaths.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>추천 코칭 전략</CardTitle>
      </CardHeader>

      {isLoading ? (
        <LoadingRow>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          코칭 전략 불러오는 중...
        </LoadingRow>
      ) : !hasFactorData && !hasCoachingPaths ? (
        <EmptyState>추천 경로가 없습니다.</EmptyState>
      ) : (
        <>
          {/* 강점/보완점 카드 */}
          {hasFactorData && (
            <FactorCardGrid>
              {strength && (
                <FactorCard $type='strength'>
                  <FactorBadge $type='strength'>강점</FactorBadge>
                  {strengthCategory && (
                    <CategoryTag $color={CATEGORY_COLOR_MAP[strengthCategory] ?? '#6b7280'}>
                      #{strengthCategory}
                    </CategoryTag>
                  )}
                  <FactorName>{strength.factorName}</FactorName>
                  <FactorDesc>
                    {getFactorSummary(strength.factorName, strength.individualT)}
                  </FactorDesc>
                </FactorCard>
              )}

              {weakness && (
                <FactorCard $type='weakness'>
                  <FactorBadge $type='weakness'>보완점</FactorBadge>
                  {weaknessCategory && (
                    <CategoryTag $color={CATEGORY_COLOR_MAP[weaknessCategory] ?? '#6b7280'}>
                      #{weaknessCategory}
                    </CategoryTag>
                  )}
                  <FactorName>{weakness.factorName}</FactorName>
                  <FactorDesc>
                    {getFactorSummary(weakness.factorName, weakness.individualT)}
                  </FactorDesc>
                </FactorCard>
              )}
            </FactorCardGrid>
          )}

          {/* 코칭 경로 아코디언 */}
          {hasCoachingPaths && (
            <AccordionList>
              {moderationPaths.map((path, idx) => {
                const isStrength = path.category === 'strength';
                const factorName = isStrength ? strength?.factorName : weakness?.factorName;
                const label = isStrength ? `${factorName ?? ''}` : `${factorName ?? ''}`;
                const isExpanded = openIndex === idx;
                const steps = path.strategy.split(/(?<=\.) /).filter(Boolean);

                return (
                  <AccordionItem key={path.id ?? idx} $expanded={isExpanded}>
                    <AccordionHeader onClick={() => setOpenIndex(isExpanded ? -1 : idx)}>
                      <AccordionLabelBadge $type={isStrength ? 'strength' : 'weakness'}>
                        {isStrength ? '강점 코칭' : '보완 코칭'}
                      </AccordionLabelBadge>
                      <AccordionLabel>{label}</AccordionLabel>
                      <ChevronIcon>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </ChevronIcon>
                    </AccordionHeader>

                    {isExpanded && (
                      <AccordionBody>
                        {/* 코칭 경로 소제목 회색 박스 */}
                        <PathBox>
                          <PathLabel>코칭 경로</PathLabel>
                          <PathFormula>
                            {path.x}
                            {path.z && <> × {path.z}</>}
                            {' → '}
                            <YSpan>{path.y}</YSpan>
                          </PathFormula>
                        </PathBox>

                        {/* 왜 이 경로가 중요한가요? */}
                        <SubSectionWrapper>
                          {path.interpretation && (
                            <SubSectionInterpret>
                              <SubTitle>왜 이 경로가 중요한가요?</SubTitle>
                              <InterpretBox>{path.interpretation}</InterpretBox>
                            </SubSectionInterpret>
                          )}

                          {/* 구체적 실행 전략 */}
                          <SubSectionStrategy>
                            <SubTitle>구체적 실행 전략</SubTitle>
                            <StrategyBox>
                              {steps.map((step, si) => (
                                <StrategyStep key={si}>
                                  <StepNum>{si + 1}</StepNum>
                                  <StepText>{step.trim()}</StepText>
                                </StrategyStep>
                              ))}
                            </StrategyBox>
                          </SubSectionStrategy>
                        </SubSectionWrapper>
                      </AccordionBody>
                    )}
                  </AccordionItem>
                );
              })}
            </AccordionList>
          )}
        </>
      )}
    </Card>
  );
};

export default CoachingStrategy;
