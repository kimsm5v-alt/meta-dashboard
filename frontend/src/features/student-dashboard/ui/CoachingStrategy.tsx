import { useState } from 'react';
import styled from '@emotion/styled';
import { X } from 'lucide-react';
import type { ModerationPath } from '@shared/services/dashboardService';

interface CoachingStrategyProps {
  moderationPaths?: ModerationPath[];
  typeName?: string;
  typeColor?: string;
  typeDescription?: string;
  isOpen: boolean;
  onClose: () => void;
  // Legacy Prototype props (fallback)
  predictedType?: string;
  schoolLevel?: string;
  tScores?: number[];
}

// ============================================================
// Styled Components
// ============================================================

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: ${({ theme }) => theme.spacing.md};
`;

const ModalContainer = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
  width: 100%;
  max-width: 1152px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  flex-shrink: 0;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.gray[500]};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.gray[700]};
  }
`;

const TypeSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  flex-shrink: 0;
`;

const TypeBadge = styled.span<{ $color?: string }>`
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: white;
  background: ${({ $color, theme }) => $color || theme.colors.primary[500]};
  flex-shrink: 0;
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: ${({ theme }) => theme.colors.gray[300]};
  flex-shrink: 0;
`;

const TypeDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
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

  @media (max-width: 768px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  }
`;

const LeftHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const LeftTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const CountBadge = styled.span`
  padding: 2px 8px;
  background: ${({ theme }) => theme.colors.gray[200]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const PathListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.gray[300]};
    border-radius: ${({ theme }) => theme.radius.full};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const PathCard = styled.div<{ $selected: boolean }>`
  position: relative;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background.paper};
  border: ${({ theme, $selected }) =>
    $selected
      ? `2px solid ${theme.colors.primary[500]}`
      : `1px solid ${theme.colors.gray[200]}`};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: all 0.2s;

  ${({ $selected, theme }) =>
    $selected &&
    `
    box-shadow: ${theme.shadows.md};
  `}

  &:hover {
    border-color: ${({ theme, $selected }) =>
      $selected ? theme.colors.primary[500] : theme.colors.gray[300]};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const AccentBar = styled.div`
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: ${({ theme }) => theme.colors.primary[500]};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const PathNumberRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
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

const PathTypeBadge = styled.div`
  display: inline-block;
  padding: 2px 8px;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: ${({ theme }) => theme.radius.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const RightPanel = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.background.paper};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.gray[300]};
    border-radius: ${({ theme }) => theme.radius.full};
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const RightContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const RightEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const DetailHeader = styled.div``;

const DetailBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const PathIndexBadge = styled.span`
  padding: 4px 10px;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const PathTypeTag = styled.span`
  padding: 2px 8px;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const DetailFormula = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};

  span {
    color: ${({ theme }) => theme.colors.gray[800]};
  }
`;

const DetailYVar = styled.span`
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SectionTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const InterpretationBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.warning.light};
  border: 1px solid #fbbf24;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const StrategyBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StrategyParagraph = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

// ============================================================
// Component
// ============================================================

/**
 * 지식그래프 기반 코칭 전략 모달 (Backend Neo4j API)
 * Backend에서 제공한 5개 추천 경로를 표시
 */
export const CoachingStrategy: React.FC<CoachingStrategyProps> = ({
  moderationPaths = [],
  typeName = '',
  typeColor,
  typeDescription,
  isOpen,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedPath = moderationPaths[selectedIndex] || null;

  if (!isOpen) return null;

  // Legacy Prototype 방식은 아직 지원하지 않음 (빈 상태 표시)
  // TODO: Backend API graphYn='Y' 호출로 moderationPaths 전달 필요

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <Header>
          <Title>코칭 전략</Title>
          <CloseButton onClick={onClose} aria-label="닫기">
            <X size={20} />
          </CloseButton>
        </Header>

        {/* Type Section */}
        {typeName && (
          <TypeSection>
            <TypeBadge $color={typeColor}>{typeName}</TypeBadge>
            {typeDescription && (
              <>
                <Divider />
                <TypeDescription>{typeDescription}</TypeDescription>
              </>
            )}
          </TypeSection>
        )}

        {/* Body */}
        <BodyContainer>
          {/* Left Panel */}
          <LeftPanel>
            <LeftHeader>
              <LeftTitle>추천 코칭 경로</LeftTitle>
              <CountBadge>{moderationPaths.length}개</CountBadge>
            </LeftHeader>

            <PathListContainer>
              {moderationPaths.length === 0 ? (
                <EmptyState>추천 경로가 없습니다.</EmptyState>
              ) : (
                moderationPaths.map((path, idx) => {
                  const isSelected = idx === selectedIndex;

                  return (
                    <PathCard
                      key={path.id}
                      onClick={() => setSelectedIndex(idx)}
                      $selected={isSelected}
                    >
                      {isSelected && <AccentBar />}

                      <PathNumberRow>
                        <PathNumber>#{idx + 1}</PathNumber>
                        <PathFormula>
                          <XVariable>{path.x}</XVariable>
                          {path.z && (
                            <>
                              {' × '}
                              <ZVariable>{path.z}</ZVariable>
                            </>
                          )}
                          {path.y && (
                            <>
                              {' → '}
                              <YVariable>{path.y}</YVariable>
                            </>
                          )}
                        </PathFormula>
                      </PathNumberRow>

                      {path.pathType && <PathTypeBadge>{path.pathType}</PathTypeBadge>}
                    </PathCard>
                  );
                })
              )}
            </PathListContainer>
          </LeftPanel>

          {/* Right Panel */}
          <RightPanel>
            {selectedPath ? (
              <RightContent>
                <DetailHeader>
                  <DetailBadgeRow>
                    <PathIndexBadge>경로 {selectedIndex + 1}</PathIndexBadge>
                    {selectedPath.pathType && (
                      <PathTypeTag>{selectedPath.pathType}</PathTypeTag>
                    )}
                  </DetailBadgeRow>

                  <DetailFormula>
                    <span>{selectedPath.x}</span>
                    {selectedPath.z && (
                      <>
                        {' × '}
                        <span>{selectedPath.z}</span>
                      </>
                    )}
                    {selectedPath.y && (
                      <>
                        {' → '}
                        <DetailYVar>{selectedPath.y}</DetailYVar>
                      </>
                    )}
                  </DetailFormula>
                </DetailHeader>

                {/* 해석 (있는 경우) */}
                {selectedPath.interpretation && (
                  <Section>
                    <SectionTitle>왜 이 경로가 중요한가요?</SectionTitle>
                    <InterpretationBox>{selectedPath.interpretation}</InterpretationBox>
                  </Section>
                )}

                {/* 실행 전략 */}
                <Section>
                  <SectionTitle>구체적 실행 전략</SectionTitle>
                  <StrategyBox>
                    {selectedPath.strategy.split(/(?<=\.) /).map((sentence, i) => (
                      <StrategyParagraph key={i}>{sentence}</StrategyParagraph>
                    ))}
                  </StrategyBox>
                </Section>
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
