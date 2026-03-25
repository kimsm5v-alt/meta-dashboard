import { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { X, CheckSquare, Square, Lightbulb, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import {
  getKnowledgeGraphModerationEffects,
  getKnowledgeGraphGroupInfo,
} from '@shared/data/lpaProfiles';
import { rankInterventions } from '@shared/utils/interventionRanker';
import type { StudentType, SchoolLevel, RankedIntervention } from '@shared/types';

interface CoachingStrategyProps {
  predictedType: StudentType;
  schoolLevel: SchoolLevel;
  tScores: number[];
  isOpen: boolean;
  onClose: () => void;
}

const SOURCE_LABELS: Record<string, { text: string; bg: string; color: string }> = {
  KG_INTERVENTION: { text: 'β 없음', bg: '#fffbeb', color: '#d97706' },
  INFERRED: { text: 'AI 추론', bg: '#faf5ff', color: '#a855f7' },
};

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
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 72rem;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  flex-shrink: 0;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const CloseButton = styled.button`
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: 1rem;
`;

const SectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const InfoIconWrapper = styled.div`
  position: relative;

  &:hover > div {
    display: block;
  }
`;

const InfoIcon = styled(Info)`
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  cursor: help;
`;

const Tooltip = styled.div`
  position: absolute;
  left: 0;
  top: 1.5rem;
  z-index: 10;
  display: none;
  width: 20rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: 1rem;
`;

const TooltipTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.5rem;
`;

const TooltipItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

const TooltipBadge = styled.span<{ $bg: string; $color: string }>`
  padding: 0.125rem 0.375rem;
  font-size: 10px;
  border-radius: 0.25rem;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  flex-shrink: 0;
  margin-top: 2px;
`;

const TooltipText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const TooltipLabel = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const TooltipSpace = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const EmptyState = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const PathList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PathCard = styled.div<{ $selected: boolean; $isExtra: boolean }>`
  padding: 1rem;
  border: 2px solid;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
  opacity: ${({ $isExtra }) => ($isExtra ? 0.8 : 1)};
  border-color: ${({ $selected, $isExtra, theme }) =>
    $selected ? theme.colors.primary[500] : $isExtra ? theme.colors.gray[100] : theme.colors.gray[200]};
  background: ${({ $selected, $isExtra, theme }) =>
    $selected ? theme.colors.primary[50] : $isExtra ? theme.colors.gray[50] : 'white'};

  &:hover {
    border-color: ${({ $selected, theme }) =>
      $selected ? theme.colors.primary[500] : theme.colors.gray[300]};
  }
`;

const ExtraLabel = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const PathRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const CheckIcon = styled(CheckSquare)`
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.primary[500]};
  flex-shrink: 0;
  margin-top: 2px;
`;

const UncheckedIcon = styled(Square)`
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  flex-shrink: 0;
  margin-top: 2px;
`;

const PathContent = styled.div`
  flex: 1;
`;

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
`;

const PathNumber = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const EffectBadge = styled.span`
  padding: 0.125rem 0.5rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: 0.25rem;
`;

const RelevanceBadge = styled.span<{ $score: number }>`
  padding: 0.125rem 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: 0.25rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  ${({ $score }) => {
    if ($score >= 50) return 'background: #fee2e2; color: #b91c1c;';
    if ($score >= 25) return 'background: #fef3c7; color: #b45309;';
    return 'background: #f3f4f6; color: #6b7280;';
  }}
`;

const BetaBadge = styled.span`
  padding: 0.125rem 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: 0.25rem;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const SourceBadge = styled.span<{ $bg: string; $color: string }>`
  padding: 0.125rem 0.375rem;
  font-size: 10px;
  border-radius: 0.25rem;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
`;

const PathFormula = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.25rem;
`;

const PathDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const FactorBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
`;

const TrendIcon = styled(TrendingDown)`
  width: 0.75rem;
  height: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  flex-shrink: 0;
`;

const FactorBadge = styled.span<{ $highlight: boolean }>`
  padding: 0.125rem 0.375rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: 0.25rem;
  background: ${({ $highlight }) => ($highlight ? '#fef2f2' : '#f9fafb')};
  color: ${({ $highlight }) => ($highlight ? '#dc2626' : '#6b7280')};
`;

const FactorMean = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-left: 0.25rem;
`;

const ShowMoreButton = styled.button`
  width: 100%;
  padding: 0.625rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.primary[500]};
  border: 1px dashed ${({ theme }) => theme.colors.gray[300]};
  border-radius: 0.5rem;
  transition: all 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
    border-color: ${({ theme }) => theme.colors.primary[300]};
  }
`;

// Right panel - Strategy detail
const StrategyPanel = styled.div`
  background: #eff6ff;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #bfdbfe;
`;

const StrategyContent = styled.div`
  max-width: none;
`;

const StrategySection = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StrategyTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[700]};
  margin-bottom: 0.5rem;
`;

const StrategyInterpretation = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.75rem;
  font-style: italic;
`;

const StrategyBox = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #dbeafe;
`;

const StrategyLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 0.5rem;
`;

const StrategyList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StrategyItem = styled.li`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

const StrategyNumber = styled.span`
  color: ${({ theme }) => theme.colors.primary[500]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  flex-shrink: 0;
`;

// Bottom section
const BottomSection = styled.div`
  padding: 0 1.5rem 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding-top: 1.5rem;
`;

const BottomTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LightbulbIcon = styled(Lightbulb)`
  width: 1.25rem;
  height: 1.25rem;
  color: #f59e0b;
`;

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const TraitCard = styled.div`
  background: linear-gradient(to bottom right, #eff6ff, #eef2ff);
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #bfdbfe;
`;

const TraitHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const TraitTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: #1e40af;
`;

const TraitList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TraitItem = styled.li`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[700]};
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

const TraitBullet = styled.span`
  color: #3b82f6;
  margin-top: 2px;
`;

const WarningCard = styled.div`
  background: linear-gradient(to bottom right, #fffbeb, #fff7ed);
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #fcd34d;
`;

const WarningHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const WarningIcon = styled(AlertTriangle)`
  width: 1rem;
  height: 1rem;
  color: #d97706;
`;

const WarningTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: #92400e;
`;

const WarningList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const WarningItem = styled.div<{ $hasBorder: boolean }>`
  ${({ $hasBorder }) => $hasBorder && 'border-top: 1px solid #fcd34d; padding-top: 0.75rem;'}
`;

const WarningFormula = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.25rem;
`;

const WarningVariable = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: #b45309;
`;

const WarningBeta = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-left: 0.25rem;
`;

const WarningDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 0.5rem;
`;

const WarningRec = styled.div`
  padding: 0.375rem 0.75rem;
  background: #fef3c7;
  border-radius: 0.25rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: #92400e;
`;

const WarningRecLabel = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

// Footer
const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.gray[50]};
  flex-shrink: 0;
`;

const CloseBtn = styled.button`
  padding: 0.5rem 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 0.5rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
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
  const [selectedPaths, setSelectedPaths] = useState<number[]>([0]);
  const [showAll, setShowAll] = useState(false);

  // 개인별 랭킹된 interventions
  const rankedInterventions = useMemo(
    () => rankInterventions(tScores, predictedType, schoolLevel),
    [tScores, predictedType, schoolLevel],
  );

  const TOP_N = 5;
  const displayedInterventions = showAll
    ? rankedInterventions
    : rankedInterventions.slice(0, TOP_N);
  const hasMore = rankedInterventions.length > TOP_N;

  // 지식그래프에서 추가 정보 조회
  const kgModerationEffects = getKnowledgeGraphModerationEffects(schoolLevel, predictedType);
  const kgGroupInfo = getKnowledgeGraphGroupInfo(schoolLevel, predictedType);

  if (!isOpen) return null;

  const togglePath = (index: number) => {
    setSelectedPaths((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const selectedItems: RankedIntervention[] = selectedPaths
    .map((idx) => rankedInterventions[idx])
    .filter(Boolean);

  return (
    <Overlay>
      <ModalContainer>
        {/* Header */}
        <Header>
          <Title>코칭 전략</Title>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        {/* Scrollable Body */}
        <Body>
          {/* Content */}
          <ContentGrid>
            {/* 좌측: 코칭 전략 목록 */}
            <div>
              <SectionTitleRow>
                <SectionTitle style={{ marginBottom: 0 }}>추천 코칭 경로</SectionTitle>
                <InfoIconWrapper>
                  <InfoIcon />
                  <Tooltip>
                    <TooltipTitle>경로 데이터 출처 안내</TooltipTitle>
                    <TooltipSpace>
                      <TooltipItem>
                        <TooltipBadge $bg="#eef2ff" $color="#4f46e5">
                          β=0.XXX
                        </TooltipBadge>
                        <TooltipText>
                          <TooltipLabel>KG 통계 검증</TooltipLabel> — 지식그래프의 매개경로 또는
                          조절효과에서 도출. 통계적으로 검증된 효과크기(β)가 있어 신뢰도가 가장 높음.
                        </TooltipText>
                      </TooltipItem>
                      <TooltipItem>
                        <TooltipBadge $bg="#fffbeb" $color="#d97706">
                          β 없음
                        </TooltipBadge>
                        <TooltipText>
                          <TooltipLabel>KG 개입전략 노드</TooltipLabel> — 지식그래프에 개입전략
                          노드가 존재하나, 매개/조절 분석이 수행되지 않아 β 계수가 없음. 경로의
                          방향성은 KG에 근거하지만 효과크기는 미검증.
                        </TooltipText>
                      </TooltipItem>
                      <TooltipItem>
                        <TooltipBadge $bg="#faf5ff" $color="#a855f7">
                          AI 추론
                        </TooltipBadge>
                        <TooltipText>
                          <TooltipLabel>AI 추론 경로</TooltipLabel> — 지식그래프에 직접적 근거가
                          없으며, 유형 특성과 요인 프로필을 바탕으로 AI가 생성한 경로. β 계수 없음.
                          추후 통계 검증이 필요함.
                        </TooltipText>
                      </TooltipItem>
                    </TooltipSpace>
                  </Tooltip>
                </InfoIconWrapper>
              </SectionTitleRow>
              {rankedInterventions.length === 0 ? (
                <EmptyState>
                  <EmptyText>코칭 전략 데이터를 준비 중입니다.</EmptyText>
                </EmptyState>
              ) : (
                <PathList>
                  {displayedInterventions.map((ranked, idx) => {
                    const inv = ranked.intervention;
                    const sourceLabel = inv.source ? SOURCE_LABELS[inv.source] : null;
                    const isExtra = idx >= TOP_N;
                    return (
                      <PathCard
                        key={idx}
                        onClick={() => togglePath(idx)}
                        $selected={selectedPaths.includes(idx)}
                        $isExtra={isExtra}
                      >
                        {isExtra && idx === TOP_N && <ExtraLabel>추가 추천 경로</ExtraLabel>}
                        <PathRow>
                          {selectedPaths.includes(idx) ? <CheckIcon /> : <UncheckedIcon />}
                          <PathContent>
                            <BadgeRow>
                              <PathNumber>경로 {idx + 1}</PathNumber>
                              <EffectBadge>{inv.effectType}</EffectBadge>
                              {ranked.relevanceScore > 0 && (
                                <RelevanceBadge $score={ranked.relevanceScore}>
                                  관련도 {ranked.relevanceScore}
                                </RelevanceBadge>
                              )}
                              {inv.beta && <BetaBadge>β={inv.beta.toFixed(3)}</BetaBadge>}
                              {sourceLabel && (
                                <SourceBadge $bg={sourceLabel.bg} $color={sourceLabel.color}>
                                  {sourceLabel.text}
                                </SourceBadge>
                              )}
                            </BadgeRow>
                            <PathFormula>
                              {inv.x} {inv.z ? `× ${inv.z}` : ''} → {inv.y}
                            </PathFormula>
                            <PathDescription>{inv.interpretation}</PathDescription>
                            {/* 관련 요인 T점수 배지 */}
                            {ranked.involvedFactors.length > 0 &&
                              ranked.relevanceReason !== '유형 기본 전략' && (
                                <FactorBadges>
                                  <TrendIcon />
                                  {ranked.involvedFactors.map((f, fi) => {
                                    const highlight =
                                      f.typeMean !== null &&
                                      ((f.score < f.typeMean && f.score < 45) ||
                                        (f.score > f.typeMean && f.score > 55));
                                    return (
                                      <FactorBadge key={fi} $highlight={highlight}>
                                        {f.name} T={f.score}
                                        {f.typeMean !== null && (
                                          <FactorMean>(평균 {f.typeMean})</FactorMean>
                                        )}
                                      </FactorBadge>
                                    );
                                  })}
                                </FactorBadges>
                              )}
                          </PathContent>
                        </PathRow>
                      </PathCard>
                    );
                  })}
                  {/* 더보기/접기 버튼 */}
                  {hasMore && (
                    <ShowMoreButton onClick={() => setShowAll(!showAll)}>
                      {showAll
                        ? '상위 5개만 보기'
                        : `나머지 ${rankedInterventions.length - TOP_N}개 경로 더보기`}
                    </ShowMoreButton>
                  )}
                </PathList>
              )}
            </div>

            {/* 우측: 구체적인 코칭 세부 전략 */}
            <div>
              <SectionTitle>구체적인 코칭 세부 전략</SectionTitle>
              {selectedItems.length === 0 ? (
                <EmptyState>
                  <EmptyText>좌측에서 코칭 경로를 선택해주세요.</EmptyText>
                </EmptyState>
              ) : (
                <StrategyPanel>
                  <StrategyContent>
                    {selectedItems.map((ranked, idx) => {
                      const inv = ranked.intervention;
                      return (
                        <StrategySection key={idx}>
                          <StrategyTitle>
                            경로 {selectedPaths[idx] + 1}: {inv.x}
                            {inv.z ? ` × ${inv.z}` : ''} → {inv.y}
                          </StrategyTitle>
                          <StrategyInterpretation>{inv.interpretation}</StrategyInterpretation>
                          <StrategyBox>
                            <StrategyLabel>구체적 실행 전략:</StrategyLabel>
                            <StrategyList>
                              {inv.strategies.map((strategy, i) => (
                                <StrategyItem key={i}>
                                  <StrategyNumber>{i + 1}.</StrategyNumber>
                                  <span>{strategy}</span>
                                </StrategyItem>
                              ))}
                            </StrategyList>
                          </StrategyBox>
                        </StrategySection>
                      );
                    })}
                  </StrategyContent>
                </StrategyPanel>
              )}
            </div>
          </ContentGrid>

          {/* 학생 특성 및 주의사항 */}
          {(kgModerationEffects.length > 0 || kgGroupInfo) && (
            <BottomSection>
              <BottomTitle>
                <LightbulbIcon />
                학생 특성 및 주의사항
              </BottomTitle>
              <BottomGrid>
                {/* 핵심 특성 */}
                {kgGroupInfo && kgGroupInfo.핵심특성 && (
                  <TraitCard>
                    <TraitHeader>
                      <TraitTitle>이 유형 학생의 특성</TraitTitle>
                    </TraitHeader>
                    <TraitList>
                      {kgGroupInfo.핵심특성.map((trait: string, i: number) => (
                        <TraitItem key={i}>
                          <TraitBullet>•</TraitBullet>
                          <span>{trait}</span>
                        </TraitItem>
                      ))}
                    </TraitList>
                  </TraitCard>
                )}

                {/* 조절효과 주의사항 (다중) */}
                {kgModerationEffects.length > 0 && (
                  <WarningCard>
                    <WarningHeader>
                      <WarningIcon />
                      <WarningTitle>
                        코칭 시 주의사항 ({kgModerationEffects.length}개)
                      </WarningTitle>
                    </WarningHeader>
                    <WarningList>
                      {kgModerationEffects.map((effect, i) => {
                        const props = effect.properties as {
                          독립변수?: string;
                          조절변수?: string;
                          해석?: string;
                          개입전략?: string;
                          상호작용_β?: number;
                        };
                        return (
                          <WarningItem key={i} $hasBorder={i > 0}>
                            <WarningFormula>
                              <WarningVariable>{props.독립변수}</WarningVariable>
                              {' × '}
                              <WarningVariable>{props.조절변수}</WarningVariable>
                              {props.상호작용_β && (
                                <WarningBeta>(β={props.상호작용_β})</WarningBeta>
                              )}
                            </WarningFormula>
                            <WarningDesc>{props.해석}</WarningDesc>
                            <WarningRec>
                              <WarningRecLabel>권장:</WarningRecLabel> {props.개입전략}
                            </WarningRec>
                          </WarningItem>
                        );
                      })}
                    </WarningList>
                  </WarningCard>
                )}
              </BottomGrid>
            </BottomSection>
          )}
        </Body>

        {/* Footer */}
        <Footer>
          <CloseBtn onClick={onClose}>닫기</CloseBtn>
        </Footer>
      </ModalContainer>
    </Overlay>
  );
};

export default CoachingStrategy;
