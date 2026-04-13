import { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { X } from 'lucide-react';
import { getKnowledgeGraphGroupInfo, TYPE_COLORS } from '@shared/data/lpaProfiles';
import { rankInterventions } from '@shared/utils/interventionRanker';
import type { StudentType, SchoolLevel, RankedIntervention } from '@shared/types';

interface CoachingStrategyProps {
  predictedType: StudentType;
  schoolLevel: SchoolLevel;
  tScores: number[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 관련도 점수에 따른 프로그레스 바 색상 반환
 */
function getRelevanceBarColor(relevance: number): string {
  if (relevance >= 40) return '#ef4444'; // red-500
  if (relevance >= 20) return '#f59e0b'; // amber-500
  return '#9ca3af'; // gray-400
}

// ============================================================
// Styled Components
// ============================================================

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 72rem;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: 1rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  flex-shrink: 0;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const CloseButton = styled.button`
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const TypeSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  flex-shrink: 0;
`;

const TypeBadge = styled.span<{ $color: string }>`
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: white;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const Divider = styled.div`
  width: 1px;
  height: 1.5rem;
  background: ${({ theme }) => theme.colors.gray[300]};
`;

const TypeDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const BodyContainer = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
`;

const LeftPanel = styled.div`
  width: 400px;
  flex-shrink: 0;
  border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const LeftHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const LeftHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LeftTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const CountBadge = styled.span`
  padding: 0.125rem 0.5rem;
  background: ${({ theme }) => theme.colors.gray[200]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: 9999px;
`;

const PathListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const PathCard = styled.div<{ $selected: boolean }>`
  position: relative;
  padding: 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
  background: white;
  border: 2px solid
    ${({ $selected, theme }) => ($selected ? theme.colors.primary[500] : theme.colors.gray[200])};
  box-shadow: ${({ $selected }) =>
    $selected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'};

  &:hover {
    border-color: ${({ $selected, theme }) =>
      $selected ? theme.colors.primary[500] : theme.colors.gray[300]};
    box-shadow: ${({ $selected }) =>
      $selected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'};
  }
`;

const AccentBar = styled.div<{ $visible: boolean }>`
  position: absolute;
  left: 0;
  top: 0.5rem;
  bottom: 0.5rem;
  width: 3px;
  border-radius: 9999px;
  background: ${({ theme }) => theme.colors.primary[500]};
  display: ${({ $visible }) => ($visible ? 'block' : 'none')};
`;

const PathNumberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const PathNumber = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const PathFormula = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const XVariable = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ZVariable = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const YVariable = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const RelevanceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const RelevanceLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  flex-shrink: 0;
`;

const ProgressBarContainer = styled.div`
  flex: 1;
  height: 0.5rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 9999px;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  border-radius: 9999px;
  background: ${({ $color }) => $color};
  width: ${({ $width }) => $width}%;
  transition: width 0.3s ease;
`;

const RelevanceScore = styled.span<{ $score: number }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ $score }) => {
    if ($score >= 40) return '#dc2626'; // red-600
    if ($score >= 20) return '#d97706'; // amber-600
    return '#6b7280'; // gray-500
  }};
  flex-shrink: 0;
`;

const FactorChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

const FactorChip = styled.span`
  padding: 0.125rem 0.5rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: 0.25rem;
`;

const FactorMean = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-left: 0.125rem;
`;

const RightPanel = styled.div`
  flex: 1;
  overflow-y: auto;
  background: white;
`;

const RightContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const RightEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const DetailHeader = styled.div`
  margin-bottom: 0.5rem;
`;

const DetailBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
`;

const PathIndexBadge = styled.span`
  padding: 0.25rem 0.625rem;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: 0.25rem;
`;

const EffectTypeBadge = styled.span<{ $bg: string; $color: string }>`
  padding: 0.125rem 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: 0.25rem;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
`;

const RelevanceBadge = styled.span<{ $score: number }>`
  padding: 0.125rem 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: 0.25rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: ${({ $score }) => {
    if ($score >= 40) return '#fee2e2';
    if ($score >= 20) return '#fef3c7';
    return '#f3f4f6';
  }};
  color: ${({ $score }) => {
    if ($score >= 40) return '#b91c1c';
    if ($score >= 20) return '#b45309';
    return '#6b7280';
  }};
`;

const DetailFormula = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const DetailXVar = styled.span`
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const DetailZVar = styled.span`
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const DetailYVar = styled.span`
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const InterpretationSection = styled.div`
  margin-bottom: 1.5rem;
`;

const InterpretationTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.5rem;
`;

const InterpretationBox = styled.div`
  padding: 1rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 0.5rem;
`;

const InterpretationText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
`;

const StrategySection = styled.div``;

const StrategyTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.75rem;
`;

const StrategyBox = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
`;

const StrategyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StrategyItem = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
`;

// ============================================================
// Component
// ============================================================

export const CoachingStrategy: React.FC<CoachingStrategyProps> = ({
  predictedType,
  schoolLevel,
  tScores,
  isOpen,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const rankedInterventions = useMemo(
    () => rankInterventions(tScores, predictedType, schoolLevel),
    [tScores, predictedType, schoolLevel],
  );

  const displayPaths = useMemo(() => rankedInterventions.slice(0, 5), [rankedInterventions]);

  const maxRelevance = useMemo(() => {
    if (displayPaths.length === 0) return 1;
    return Math.max(...displayPaths.map((p) => p.relevanceScore), 1);
  }, [displayPaths]);

  const selectedRanked: RankedIntervention | null = displayPaths[selectedIndex] || null;

  const kgGroupInfo = getKnowledgeGraphGroupInfo(schoolLevel, predictedType);
  const typeDescription = kgGroupInfo?.핵심특성?.[0] || predictedType;
  const typeColor = TYPE_COLORS[predictedType] || '#6B7280';

  if (!isOpen) return null;

  return (
    <Overlay>
      <ModalContainer>
        {/* Header */}
        <Header>
          <Title>코칭 전략</Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        {/* Type Section */}
        <TypeSection>
          <TypeBadge $color={typeColor}>{predictedType}</TypeBadge>
          <Divider />
          <TypeDescription>{typeDescription}</TypeDescription>
        </TypeSection>

        {/* Body */}
        <BodyContainer>
          {/* Left Panel */}
          <LeftPanel>
            <LeftHeader>
              <LeftHeaderRow>
                <LeftTitle>추천 코칭 경로</LeftTitle>
                <CountBadge>{displayPaths.length}개</CountBadge>
              </LeftHeaderRow>
            </LeftHeader>
            <PathListContainer>
              {displayPaths.length === 0 ? (
                <EmptyState>추천 경로가 없습니다.</EmptyState>
              ) : (
                displayPaths.map((ranked, idx) => {
                  const inv = ranked.intervention;
                  const isSelected = idx === selectedIndex;
                  const barWidth = (ranked.relevanceScore / maxRelevance) * 100;

                  return (
                    <PathCard
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      $selected={isSelected}
                    >
                      <AccentBar $visible={isSelected} />
                      <PathNumberRow>
                        <PathNumber>#{idx + 1}</PathNumber>
                        <PathFormula>
                          <XVariable>{inv.x}</XVariable>
                          {inv.z && (
                            <>
                              {' × '}
                              <ZVariable>{inv.z}</ZVariable>
                            </>
                          )}
                          {' → '}
                          <YVariable>{inv.y}</YVariable>
                        </PathFormula>
                      </PathNumberRow>

                      <RelevanceRow>
                        <RelevanceLabel>관련도</RelevanceLabel>
                        <ProgressBarContainer>
                          <ProgressBar
                            $width={barWidth}
                            $color={getRelevanceBarColor(ranked.relevanceScore)}
                          />
                        </ProgressBarContainer>
                        <RelevanceScore $score={ranked.relevanceScore}>
                          {ranked.relevanceScore}
                        </RelevanceScore>
                      </RelevanceRow>

                      {ranked.involvedFactors.length > 0 && (
                        <FactorChips>
                          {ranked.involvedFactors.map((f, fi) => (
                            <FactorChip key={fi}>
                              {f.name} T={f.score}
                              {f.typeMean !== null && (
                                <FactorMean>(평균 {f.typeMean})</FactorMean>
                              )}
                            </FactorChip>
                          ))}
                        </FactorChips>
                      )}
                    </PathCard>
                  );
                })
              )}
            </PathListContainer>
          </LeftPanel>

          {/* Right Panel */}
          <RightPanel>
            {selectedRanked ? (
              <RightContent>
                <DetailHeader>
                  <DetailBadgeRow>
                    <PathIndexBadge>경로 {selectedIndex + 1}</PathIndexBadge>
                    <EffectTypeBadge $bg="#f3f4f6" $color="#6b7280">
                      {selectedRanked.intervention.effectType}
                    </EffectTypeBadge>
                    <RelevanceBadge $score={selectedRanked.relevanceScore}>
                      관련도 {selectedRanked.relevanceScore}
                    </RelevanceBadge>
                  </DetailBadgeRow>
                  <DetailFormula>
                    <DetailXVar>{selectedRanked.intervention.x}</DetailXVar>
                    {selectedRanked.intervention.z && (
                      <>
                        {' × '}
                        <DetailZVar>{selectedRanked.intervention.z}</DetailZVar>
                      </>
                    )}
                    {' → '}
                    <DetailYVar>{selectedRanked.intervention.y}</DetailYVar>
                  </DetailFormula>
                </DetailHeader>

                <InterpretationSection>
                  <InterpretationTitle>왜 이 경로가 중요한가요?</InterpretationTitle>
                  <InterpretationBox>
                    <InterpretationText>
                      {selectedRanked.intervention.interpretation}
                    </InterpretationText>
                  </InterpretationBox>
                </InterpretationSection>

                <StrategySection>
                  <StrategyTitle>구체적 실행 전략</StrategyTitle>
                  <StrategyBox>
                    <StrategyList>
                      {selectedRanked.intervention.strategies.map(
                        (strategy: string, i: number) => (
                          <StrategyItem key={i}>{strategy}</StrategyItem>
                        ),
                      )}
                    </StrategyList>
                  </StrategyBox>
                </StrategySection>
              </RightContent>
            ) : (
              <RightEmpty>좌측에서 경로를 선택해주세요.</RightEmpty>
            )}
          </RightPanel>
        </BodyContainer>
      </ModalContainer>
    </Overlay>
  );
};

export default CoachingStrategy;
