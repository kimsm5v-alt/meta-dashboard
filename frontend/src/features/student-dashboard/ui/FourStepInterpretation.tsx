import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import {
  calculate4StepDiagnosis,
  getLevel,
  type Level,
} from '@shared/utils/calculate4StepDiagnosis';
import { SUB_CATEGORY_FACTORS, FACTOR_DEFINITIONS } from '@shared/data/factors';
import { CATEGORY_COLORS } from '@shared/data/lpaProfiles';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { getBarPercent, PREV_COLOR } from '@shared/utils/chartUtils';
import { lightenColor } from '@shared/utils/colorUtils';

// ============================================================
// Props
// ============================================================

interface FourStepInterpretationProps {
  tScores: number[];
  prevTScores?: number[];
  studentName: string;
}

// ============================================================
// 상수
// ============================================================

const T50_PERCENT = getBarPercent(50); // 50% — 정중앙

// Level 배지 색상 (Emotion 스타일)
const LEVEL_COLORS_POSITIVE: Record<Level, { bg: string; color: string }> = {
  매우높음: { bg: '#d1fae5', color: '#047857' },
  높음: { bg: '#ecfdf5', color: '#059669' },
  보통: { bg: '#f3f4f6', color: '#4b5563' },
  낮음: { bg: '#fff7ed', color: '#ea580c' },
  매우낮음: { bg: '#fee2e2', color: '#b91c1c' },
};

const LEVEL_COLORS_NEGATIVE: Record<Level, { bg: string; color: string }> = {
  매우높음: { bg: '#fee2e2', color: '#b91c1c' },
  높음: { bg: '#fff7ed', color: '#ea580c' },
  보통: { bg: '#f3f4f6', color: '#4b5563' },
  낮음: { bg: '#ecfdf5', color: '#059669' },
  매우낮음: { bg: '#d1fae5', color: '#047857' },
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  '1-1': '학습 동기, 자원, 기술 모두 우수한 이상적인 상태입니다. 자율적 심화 학습이 가능합니다.',
  '1-2':
    '학습 의욕과 자원은 충분하나 학습 방법 개선이 필요합니다. 효과적인 학습 전략 코칭으로 빠른 성장이 가능합니다.',
  '2-1':
    '높은 의지와 기술을 가졌으나 자원 부족으로 어려움을 겪고 있습니다. 환경 지원과 스트레스 관리가 우선입니다.',
  '2-2': '학습 의욕은 있으나 자원과 기술이 부족합니다. 환경 개선과 학습법 지도를 병행해야 합니다.',
  '3-1': '학습 기술은 있으나 동기와 자원이 부족합니다. 공부 이유 탐색과 자원 확보가 필요합니다.',
  '3-2': '동기, 자원, 기술 모두 낮은 상태입니다. 단계적이고 종합적인 지원이 시급합니다.',
  '4-1': '자원은 있으나 학습 동기가 낮습니다. 공부 흥미 회복과 동기 부여가 필요합니다.',
  '4-2': '자원은 있으나 동기와 기술이 부족합니다. 학습 흥미 발견과 방법 지도가 필요합니다.',
};

// ============================================================
// Styled Components
// ============================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GuideHeader = styled.div`
  margin-bottom: 0.5rem;
`;

const GuideTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const GuideDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const PrimaryText = styled.span`
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

// StepCard Styled Components
const StepCardWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  overflow: hidden;
`;

const StepCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const StepBadge = styled.span`
  padding: 0.25rem 0.625rem;
  background: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  border-radius: 0.375rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  white-space: nowrap;
`;

const StepTitleWrapper = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const StepSubtitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const LegendWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
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

const LegendDot = styled.span<{ $color: string }>`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 0.25rem;
  background: ${({ $color }) => $color};
`;

const ChevronIcon = styled(ChevronRight)<{ $isExpanded: boolean }>`
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  transition: transform 0.15s ease;
  transform: ${({ $isExpanded }) => ($isExpanded ? 'rotate(90deg)' : 'rotate(0)')};
`;

const StepCardContent = styled.div`
  padding: 1rem;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// SubSection Styled Components
const SubSectionWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  background: white;
  padding: 0.75rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const SubSectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.625rem;
`;

const SubSectionTitle = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const LevelBadge = styled.span<{ $bg: string; $color: string }>`
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
`;

const NegativeHint = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const SubSectionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

// DualBar Styled Components
const BarContainer = styled.div<{ $height: string }>`
  flex: 1;
  height: ${({ $height }) => $height};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 0.25rem;
  overflow: hidden;
  position: relative;
`;

const T50Line = styled.div<{ $left: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  border-left: 1px dashed ${({ theme }) => theme.colors.gray[600]};
  left: ${({ $left }) => $left}%;
  z-index: 1;
`;

const BarFill = styled.div<{ $width: number; $color: string; $left?: number; $radius?: string }>`
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.3s ease;
  width: ${({ $width }) => $width}%;
  background-color: ${({ $color }) => $color};
  left: ${({ $left }) => ($left !== undefined ? `${$left}%` : '0')};
  border-radius: ${({ $radius }) => $radius || '0'};
`;

const BarLabelWrapper = styled.div<{ $width: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  z-index: 20;
  pointer-events: none;
  width: ${({ $width }) => $width}%;
`;

const BarLabel = styled.span<{ $size: string }>`
  font-size: ${({ $size }) => $size};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: white;
  white-space: nowrap;
`;

const SingleBarFill = styled.div<{ $width: number; $color: string; $radius?: string }>`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  transition: all 0.3s ease;
  width: ${({ $width }) => $width}%;
  background-color: ${({ $color }) => $color};
  border-radius: ${({ $radius }) => $radius || '0'};
`;

// LeafFactorItem & BarItem Styled Components
const FactorRow = styled.div<{ $clickable?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  ${({ $clickable }) => $clickable && 'cursor: pointer;'}
`;

const FactorLabel = styled.div`
  width: 10rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
`;

const LeafLabel = styled.div`
  width: 10rem;
  padding-left: 1.5rem;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.gray[500]};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const TreeBranch = styled.span`
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const NegativeLabel = styled.span`
  font-size: 10px;
  color: #ef4444;
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const ScoreValue = styled.div<{ $size?: string; $color?: string }>`
  width: 3rem;
  text-align: right;
  font-size: ${({ $size, theme }) => $size || theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ $color, theme }) => $color || theme.colors.gray[600]};
`;

const SmallScoreValue = styled.div`
  width: 3rem;
  text-align: right;
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const SubFactorsContainer = styled.div`
  margin-top: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ChevronSmall = styled.div`
  width: 0.875rem;
  height: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  flex-shrink: 0;
`;

// Step 4 Styled Components
const Step4Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: 1rem;
`;

const QuadrantWrapper = styled.div`
  grid-column: span 2 / span 2;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray[50]};

  @media (min-width: 768px) {
    grid-column: span 1 / span 1;
  }
`;

const QuadrantContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const YAxisLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 0.25rem;
`;

const QuadrantRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

const QuadrantChart = styled.div`
  position: relative;
  flex: 1;
  aspect-ratio: 4 / 3;
  background: white;
  border-radius: 0.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const QuadrantBg = styled.div`
  position: absolute;
  inset: 0;
`;

const QuadrantCell = styled.div<{
  $position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  $bgColor: string;
}>`
  position: absolute;
  width: 50%;
  height: 50%;
  background: ${({ $bgColor }) => $bgColor};
  opacity: 0.3;
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ $position }) => {
    switch ($position) {
      case 'top-left':
        return 'top: 0; left: 0; border-right: 1px solid #4b5563; border-bottom: 1px solid #4b5563;';
      case 'top-right':
        return 'top: 0; right: 0; border-bottom: 1px solid #4b5563;';
      case 'bottom-left':
        return 'bottom: 0; left: 0; border-right: 1px solid #4b5563;';
      case 'bottom-right':
        return 'bottom: 0; right: 0;';
    }
  }}
`;

const QuadrantNumber = styled.span`
  font-size: 9px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const ConnectorLine = styled.line`
  stroke: ${({ theme }) => theme.colors.gray[400]};
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
`;

const PrevDot = styled.div<{ $left: number; $top: number }>`
  position: absolute;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: ${({ theme }) => theme.colors.gray[400]};
  transform: translate(-50%, -50%);
  z-index: 10;
  opacity: 0.6;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
`;

const PrevDotLabel = styled.div`
  position: absolute;
  top: -1.25rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 8px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  white-space: nowrap;
  background: ${({ theme }) => theme.colors.gray[400]};
  color: white;
`;

const CurrentDot = styled.div<{ $left: number; $top: number; $isHighSkill: boolean }>`
  position: absolute;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: 2px solid white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translate(-50%, -50%);
  z-index: 20;
  background: ${({ $isHighSkill }) => ($isHighSkill ? '#2563eb' : '#ef4444')};
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
`;

const CurrentDotLabel = styled.div<{ $isHighSkill: boolean }>`
  position: absolute;
  top: -1.75rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: ${({ $isHighSkill }) => ($isHighSkill ? '#2563eb' : '#ef4444')};
  color: white;
`;

const XAxisLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-left: 0.25rem;
  writing-mode: vertical-lr;
`;

const LegendContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.625rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const LegendTitle = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const LegendCircle = styled.div<{ $color: string; $opacity?: number }>`
  width: 0.75rem;
  height: 0.75rem;
  background: ${({ $color }) => $color};
  border-radius: 9999px;
  ${({ $opacity }) => $opacity && `opacity: ${$opacity};`}
`;

const LegendLabel = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

// Type Info Panel
const TypeInfoPanel = styled.div`
  grid-column: span 2 / span 2;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  background: white;
  overflow: hidden;

  @media (min-width: 768px) {
    grid-column: span 1 / span 1;
  }
`;

const TypeInfoHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const TypeInfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TypeCodeBadge = styled.span`
  padding: 0.125rem 0.5rem;
  background: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  border-radius: 0.25rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const TypeName = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const PrevTypeHint = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const TypeDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-top: 0.375rem;
  line-height: 1.6;
`;

const ScoresSection = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const ScoresGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
`;

const ScoreItem = styled.div`
  text-align: center;
`;

const ScoreItemLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.25rem;
`;

const ScoreItemValueRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
`;

const ScoreItemValue = styled.div<{ $color: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $color }) => $color};
`;

const DeltaValue = styled.span<{ $positive: boolean }>`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ $positive }) => ($positive ? '#10b981' : '#ef4444')};
`;

const ScoreProgressBar = styled.div`
  height: 0.25rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 9999px;
  margin-top: 0.25rem;
  overflow: hidden;
`;

const ScoreProgressFill = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  border-radius: 9999px;
  width: ${({ $width }) => $width}%;
  background-color: ${({ $color }) => $color};
`;

const CoachingSection = styled.div`
  padding: 0.75rem 1rem;
`;

const CoachingTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: 0.5rem;
`;

const CoachingList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const CoachingItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const CoachingBullet = styled.span`
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-top: 1px;
`;

// ============================================================
// 메인 컴포넌트
// ============================================================

export function FourStepInterpretation({
  tScores,
  prevTScores,
  studentName,
}: FourStepInterpretationProps) {
  const diagnosis = useMemo(() => calculate4StepDiagnosis(tScores), [tScores]);
  const prevDiagnosis = useMemo(
    () => (prevTScores ? calculate4StepDiagnosis(prevTScores) : null),
    [prevTScores],
  );
  const isCompare = !!prevDiagnosis;

  return (
    <Container>
      {/* 가이드 헤더 */}
      <GuideHeader>
        <GuideTitle>4단계 해석 가이드</GuideTitle>
        <GuideDescription>
          보다 학생을 더 잘 이해하기 위해 검사 결과를 4단계로 나눠서 봅니다.
        </GuideDescription>
      </GuideHeader>

      {/* Step 1: 공부 마음 */}
      <StepCard
        step={1}
        title={'공부 마음 : "공부하고 싶은 마음이 있나요?"'}
        subtitle={
          <>
            <span>학업열의·성장 동기가 있는지, 학업소진·번아웃 상태는 아닌지</span>
            <br />
            <PrimaryText>→ 동기가 없으면 아무리 가르쳐도 소용없어요</PrimaryText>
          </>
        }
        showBarLegend
        isCompare={isCompare}
      >
        <SubSection title="긍정적 공부 마음" level={getLevel(diagnosis.step1.긍정.종합)}>
          <BarItem
            label="학업열의"
            score={diagnosis.step1.긍정.학업열의}
            prevScore={prevDiagnosis?.step1.긍정.학업열의}
            subCategoryKey="학업열의"
            tScores={tScores}
            prevTScores={prevTScores}
          />
          <BarItem
            label="성장력"
            score={diagnosis.step1.긍정.성장력}
            prevScore={prevDiagnosis?.step1.긍정.성장력}
            subCategoryKey="성장력"
            tScores={tScores}
            prevTScores={prevTScores}
          />
        </SubSection>

        <SubSection
          title="부정적 공부 마음"
          level={getLevel(diagnosis.step1.부정.학업소진)}
          isNegativeSection
        >
          <BarItem
            label="학업소진"
            score={diagnosis.step1.부정.학업소진}
            prevScore={prevDiagnosis?.step1.부정.학업소진}
            isNegative
            subCategoryKey="학업소진"
            tScores={tScores}
            prevTScores={prevTScores}
          />
        </SubSection>
      </StepCard>

      {/* Step 2: 공부 자원 */}
      <StepCard
        step={2}
        title={'공부 자원 : "공부할 수 있는 환경이 되나요?"'}
        subtitle={
          <>
            <span>자존감·자신감·지지 관계가 있는지, 스트레스·방해 요인은 없는지</span>
            <br />
            <PrimaryText>→ 환경이 안 받쳐주면 마음만으론 안 돼요</PrimaryText>
          </>
        }
        showBarLegend
        isCompare={isCompare}
      >
        <SubSection title="개인 자원" level={getLevel(diagnosis.step2.개인.종합)}>
          <BarItem
            label="긍정적자아"
            score={diagnosis.step2.개인.긍정적자아}
            prevScore={prevDiagnosis?.step2.개인.긍정적자아}
            subCategoryKey="긍정적자아"
            tScores={tScores}
            prevTScores={prevTScores}
          />
          <BarItem
            label="대인관계능력"
            score={diagnosis.step2.개인.대인관계능력}
            prevScore={prevDiagnosis?.step2.개인.대인관계능력}
            subCategoryKey="대인관계능력"
            tScores={tScores}
            prevTScores={prevTScores}
          />
        </SubSection>

        <SubSection title="환경 자원" level={getLevel(diagnosis.step2.환경.종합)}>
          <BarItem
            label="지지적관계"
            score={diagnosis.step2.환경.지지적관계}
            prevScore={prevDiagnosis?.step2.환경.지지적관계}
            subCategoryKey="지지적관계"
            tScores={tScores}
            prevTScores={prevTScores}
          />
        </SubSection>

        <SubSection
          title="자원 방해"
          level={getLevel(diagnosis.step2.방해.학업스트레스)}
          isNegativeSection
        >
          <BarItem
            label="학업스트레스"
            score={diagnosis.step2.방해.학업스트레스}
            prevScore={prevDiagnosis?.step2.방해.학업스트레스}
            isNegative
            subCategoryKey="학업스트레스"
            tScores={tScores}
            prevTScores={prevTScores}
          />
          <BarItem
            label="학습방해물"
            score={diagnosis.step2.방해.학습방해물}
            prevScore={prevDiagnosis?.step2.방해.학습방해물}
            isNegative
            subCategoryKey="학습방해물"
            tScores={tScores}
            prevTScores={prevTScores}
          />
          <BarItem
            label="학업관계스트레스"
            score={diagnosis.step2.방해.학업관계스트레스}
            prevScore={prevDiagnosis?.step2.방해.학업관계스트레스}
            isNegative
            subCategoryKey="학업관계스트레스"
            tScores={tScores}
            prevTScores={prevTScores}
          />
        </SubSection>
      </StepCard>

      {/* Step 3: 공부 기술 */}
      <StepCard
        step={3}
        title={'공부 기술 : "어떻게 공부하는지 알고 있나요?"'}
        subtitle={
          <>
            <span>계획·시간 관리·학습 전략을 아는지, 감정 조절·집중력은 어떤지</span>
            <br />
            <PrimaryText>→ 방법을 모르면 노력해도 성적이 안 나와요</PrimaryText>
          </>
        }
        showBarLegend
        isCompare={isCompare}
      >
        <SubSection title="학습 재설계" level={getLevel(diagnosis.step3.학습.종합)}>
          <BarItem
            label="메타인지"
            score={diagnosis.step3.학습.메타인지}
            prevScore={prevDiagnosis?.step3.학습.메타인지}
            subCategoryKey="메타인지"
            tScores={tScores}
            prevTScores={prevTScores}
          />
          <BarItem
            label="학습기술"
            score={diagnosis.step3.학습.학습기술}
            prevScore={prevDiagnosis?.step3.학습.학습기술}
            subCategoryKey="학습기술"
            tScores={tScores}
            prevTScores={prevTScores}
          />
        </SubSection>

        <SubSection title="마음 재설계" level={getLevel(diagnosis.step3.마음.종합)}>
          <LeafFactorItem
            label="자기정서조절"
            score={diagnosis.step3.마음.자기정서조절}
            prevScore={prevDiagnosis?.step3.마음.자기정서조절}
            color={CATEGORY_COLORS['대인관계능력'] ?? '#9CA3AF'}
          />
        </SubSection>
      </StepCard>

      {/* Step 4: 학습 유형 */}
      <StepCard
        step={4}
        title={'학습 유형 : "그래서 이 학생에게 뭐가 필요한가요?"'}
        subtitle={
          <>
            <span>1~3단계를 종합하여 8가지 유형 판정 및 맞춤 코칭 전략 제시</span>
            <br />
            <PrimaryText>→ 이 학생에게 지금 가장 필요한 게 뭔지 알려줘요</PrimaryText>
          </>
        }
      >
        <Step4Grid>
          {/* 사분면 그래프 */}
          <QuadrantWrapper>
            <QuadrantContainer>
              {/* Y축 레이블 */}
              <YAxisLabel>공부마음 ↑</YAxisLabel>

              <QuadrantRow>
                <QuadrantChart>
                  {/* 사분면 배경 */}
                  <QuadrantBg>
                    <QuadrantCell $position="top-left" $bgColor="#dbeafe">
                      <QuadrantNumber>2</QuadrantNumber>
                    </QuadrantCell>
                    <QuadrantCell $position="top-right" $bgColor="#dcfce7">
                      <QuadrantNumber>1</QuadrantNumber>
                    </QuadrantCell>
                    <QuadrantCell $position="bottom-left" $bgColor="#fee2e2">
                      <QuadrantNumber>3</QuadrantNumber>
                    </QuadrantCell>
                    <QuadrantCell $position="bottom-right" $bgColor="#fef9c3">
                      <QuadrantNumber>4</QuadrantNumber>
                    </QuadrantCell>
                  </QuadrantBg>

                  {/* 1차 위치 (비교 모드) */}
                  {prevDiagnosis && (
                    <>
                      {/* 1차→2차 연결선 */}
                      <svg
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          zIndex: 10,
                          pointerEvents: 'none',
                        }}
                      >
                        <ConnectorLine
                          x1={`${clamp(((prevDiagnosis.step4.공부자원 - 20) / 60) * 100)}%`}
                          y1={`${clamp(100 - ((prevDiagnosis.step4.공부마음 - 20) / 60) * 100)}%`}
                          x2={`${clamp(((diagnosis.step4.공부자원 - 20) / 60) * 100)}%`}
                          y2={`${clamp(100 - ((diagnosis.step4.공부마음 - 20) / 60) * 100)}%`}
                        />
                      </svg>
                      <PrevDot
                        $left={clamp(((prevDiagnosis.step4.공부자원 - 20) / 60) * 100)}
                        $top={clamp(100 - ((prevDiagnosis.step4.공부마음 - 20) / 60) * 100)}
                      >
                        <PrevDotLabel>1차</PrevDotLabel>
                      </PrevDot>
                    </>
                  )}

                  {/* 2차(현재) 위치 */}
                  <CurrentDot
                    $left={clamp(((diagnosis.step4.공부자원 - 20) / 60) * 100)}
                    $top={clamp(100 - ((diagnosis.step4.공부마음 - 20) / 60) * 100)}
                    $isHighSkill={diagnosis.step4.공부기술 >= 50}
                  >
                    <CurrentDotLabel $isHighSkill={diagnosis.step4.공부기술 >= 50}>
                      {isCompare ? '2차' : studentName}
                    </CurrentDotLabel>
                  </CurrentDot>
                </QuadrantChart>

                <XAxisLabel>공부자원 ↑</XAxisLabel>
              </QuadrantRow>

              {/* 범례 */}
              <LegendContainer>
                <LegendTitle>공부기술</LegendTitle>
                <LegendItem>
                  <LegendCircle $color="#2563eb" />
                  <LegendLabel>높음(≥50)</LegendLabel>
                </LegendItem>
                <LegendItem>
                  <LegendCircle $color="#ef4444" />
                  <LegendLabel>낮음(&lt;50)</LegendLabel>
                </LegendItem>
                {isCompare && (
                  <LegendItem>
                    <LegendCircle $color="#9ca3af" $opacity={0.6} />
                    <LegendLabel>1차</LegendLabel>
                  </LegendItem>
                )}
              </LegendContainer>
            </QuadrantContainer>
          </QuadrantWrapper>

          {/* 유형 정보 */}
          <TypeInfoPanel>
            {/* 유형명 헤더 */}
            <TypeInfoHeader>
              <TypeInfoRow>
                <TypeCodeBadge>{diagnosis.step4.유형코드}</TypeCodeBadge>
                <TypeName>{diagnosis.step4.유형명}</TypeName>
                {isCompare &&
                  prevDiagnosis &&
                  prevDiagnosis.step4.유형코드 !== diagnosis.step4.유형코드 && (
                    <PrevTypeHint>
                      (1차: {prevDiagnosis.step4.유형코드} {prevDiagnosis.step4.유형명})
                    </PrevTypeHint>
                  )}
              </TypeInfoRow>
              <TypeDescription>
                {TYPE_DESCRIPTIONS[diagnosis.step4.유형코드] || ''}
              </TypeDescription>
            </TypeInfoHeader>

            {/* 3개 점수 */}
            <ScoresSection>
              <ScoresGrid>
                {(
                  [
                    {
                      label: '공부 마음',
                      value: diagnosis.step4.공부마음,
                      prev: prevDiagnosis?.step4.공부마음,
                      color: '#3B82F6',
                    },
                    {
                      label: '공부 자원',
                      value: diagnosis.step4.공부자원,
                      prev: prevDiagnosis?.step4.공부자원,
                      color: '#10B981',
                    },
                    {
                      label: '공부 기술',
                      value: diagnosis.step4.공부기술,
                      prev: prevDiagnosis?.step4.공부기술,
                      color: '#8B5CF6',
                    },
                  ] as const
                ).map((item) => {
                  const delta = item.prev != null ? item.value - item.prev : null;
                  return (
                    <ScoreItem key={item.label}>
                      <ScoreItemLabel>{item.label}</ScoreItemLabel>
                      <ScoreItemValueRow>
                        <ScoreItemValue $color={item.color}>
                          {item.value.toFixed(0)}
                        </ScoreItemValue>
                        {delta != null && Math.abs(delta) >= 0.5 && (
                          <DeltaValue $positive={delta > 0}>
                            {delta > 0 ? '+' : ''}
                            {delta.toFixed(0)}
                          </DeltaValue>
                        )}
                      </ScoreItemValueRow>
                      <ScoreProgressBar>
                        <ScoreProgressFill
                          $width={clamp(((item.value - 20) / 60) * 100)}
                          $color={item.color}
                        />
                      </ScoreProgressBar>
                    </ScoreItem>
                  );
                })}
              </ScoresGrid>
            </ScoresSection>

            {/* 코칭 전략 */}
            <CoachingSection>
              <CoachingTitle>맞춤 코칭 전략</CoachingTitle>
              <CoachingList>
                {diagnosis.step4.코칭전략.map((strategy, i) => (
                  <CoachingItem key={i}>
                    <CoachingBullet>·</CoachingBullet>
                    <span>{strategy}</span>
                  </CoachingItem>
                ))}
              </CoachingList>
            </CoachingSection>
          </TypeInfoPanel>
        </Step4Grid>
      </StepCard>
    </Container>
  );
}

// ============================================================
// StepCard (아코디언)
// ============================================================

function StepCard({
  step,
  title,
  subtitle,
  showBarLegend = false,
  isCompare = false,
  children,
}: {
  step: number;
  title: string;
  subtitle: React.ReactNode;
  showBarLegend?: boolean;
  isCompare?: boolean;
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <StepCardWrapper>
      <StepCardHeader onClick={() => setIsExpanded(!isExpanded)}>
        <StepBadge>{step}단계</StepBadge>
        <StepTitleWrapper>
          <StepTitle>{title}</StepTitle>
          <StepSubtitle>{subtitle}</StepSubtitle>
        </StepTitleWrapper>
        {showBarLegend && isExpanded && (
          <LegendWrapper>
            <span>점선: T=50</span>
            {isCompare && (
              <>
                <LegendDivider>|</LegendDivider>
                <LegendItem>
                  <LegendDot $color="#9ca3af" /> 1차
                </LegendItem>
                <LegendItem>
                  <LegendDot $color="#818cf8" /> 2차
                </LegendItem>
              </>
            )}
          </LegendWrapper>
        )}
        <ChevronIcon $isExpanded={isExpanded} />
      </StepCardHeader>

      {isExpanded && <StepCardContent>{children}</StepCardContent>}
    </StepCardWrapper>
  );
}

// ============================================================
// SubSection
// ============================================================

function SubSection({
  title,
  level,
  isNegativeSection = false,
  children,
}: {
  title: string;
  level: Level;
  isNegativeSection?: boolean;
  children: React.ReactNode;
}) {
  const colors = isNegativeSection ? LEVEL_COLORS_NEGATIVE[level] : LEVEL_COLORS_POSITIVE[level];

  return (
    <SubSectionWrapper>
      <SubSectionHeader>
        <SubSectionTitle>{title}</SubSectionTitle>
        <LevelBadge $bg={colors.bg} $color={colors.color}>
          {level}
        </LevelBadge>
        {isNegativeSection && <NegativeHint>↓ 낮을수록 좋아요</NegativeHint>}
      </SubSectionHeader>
      <SubSectionContent>{children}</SubSectionContent>
    </SubSectionWrapper>
  );
}

// ============================================================
// DualBar (이중 막대 렌더링 유틸)
// ============================================================

function DualBar({
  score,
  prevScore,
  color,
  height = '1.75rem',
  radius = '0 4px 4px 0',
  showLabel = true,
  labelSize = '0.75rem',
}: {
  score: number;
  prevScore?: number;
  color: string;
  height?: string;
  radius?: string;
  showLabel?: boolean;
  labelSize?: string;
}) {
  const curPct = Math.max(0, Math.min(getBarPercent(score), 100));
  const hasPrev = prevScore != null;
  const prevPct = hasPrev ? Math.max(0, Math.min(getBarPercent(prevScore), 100)) : 0;

  return (
    <BarContainer $height={height}>
      {/* T=50 기준선 */}
      <T50Line $left={T50_PERCENT} />

      {hasPrev && prevScore !== score ? (
        prevPct > curPct ? (
          <>
            {/* 1차 > 2차: [0..2차]=색상, [2차..1차]=회색 */}
            <BarFill $width={curPct} $color={color} />
            <BarFill
              $width={prevPct - curPct}
              $left={curPct}
              $color={PREV_COLOR}
              $radius={radius}
            />
            {showLabel && curPct > 20 && (
              <BarLabelWrapper $width={curPct}>
                <BarLabel $size={labelSize}>T={score.toFixed(0)}</BarLabel>
              </BarLabelWrapper>
            )}
          </>
        ) : (
          <>
            {/* 1차 < 2차: [0..1차]=회색, [1차..2차]=색상 */}
            <BarFill $width={prevPct} $color={PREV_COLOR} />
            <BarFill
              $width={curPct - prevPct}
              $left={prevPct}
              $color={color}
              $radius={radius}
            />
            {showLabel && curPct > 20 && (
              <BarLabelWrapper $width={curPct}>
                <BarLabel $size={labelSize}>T={score.toFixed(0)}</BarLabel>
              </BarLabelWrapper>
            )}
          </>
        )
      ) : (
        /* 단일 막대 (1차 없거나 동일) */
        <SingleBarFill $width={curPct} $color={color} $radius={radius}>
          {showLabel && curPct > 20 && (
            <BarLabel $size={labelSize}>T={score.toFixed(0)}</BarLabel>
          )}
        </SingleBarFill>
      )}
    </BarContainer>
  );
}

// ============================================================
// LeafFactorItem (3depth 소분류 단일 요인)
// ============================================================

function LeafFactorItem({
  label,
  score,
  prevScore,
  color,
}: {
  label: string;
  score: number;
  prevScore?: number;
  color: string;
}) {
  return (
    <FactorRow>
      <LeafLabel>
        <TreeBranch>└</TreeBranch>
        {label}
      </LeafLabel>
      <DualBar
        score={score}
        prevScore={prevScore}
        color={lightenColor(color)}
        height="1.25rem"
        radius="0 3px 3px 0"
        showLabel={false}
        labelSize="10px"
      />
      <SmallScoreValue>{score.toFixed(0)}</SmallScoreValue>
    </FactorRow>
  );
}

// ============================================================
// BarItem (2depth 중분류)
// ============================================================

function BarItem({
  label,
  score,
  prevScore,
  isNegative = false,
  subCategoryKey,
  tScores,
  prevTScores,
}: {
  label: string;
  score: number;
  prevScore?: number;
  isNegative?: boolean;
  subCategoryKey?: string;
  tScores?: number[];
  prevTScores?: number[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const barHex = subCategoryKey ? (CATEGORY_COLORS[subCategoryKey] ?? '#9CA3AF') : '#9CA3AF';

  const subFactors = useMemo(() => {
    if (!subCategoryKey || !tScores) return [];
    const indices = SUB_CATEGORY_FACTORS[subCategoryKey];
    if (!indices) return [];
    return indices.map((idx) => ({
      name: FACTOR_DEFINITIONS[idx].name,
      score: tScores[idx],
      prevScore: prevTScores ? prevTScores[idx] : undefined,
    }));
  }, [subCategoryKey, tScores, prevTScores]);

  const hasSubFactors = subFactors.length > 1;

  return (
    <div>
      <FactorRow
        $clickable={hasSubFactors}
        onClick={() => hasSubFactors && setIsExpanded(!isExpanded)}
      >
        <FactorLabel>
          {hasSubFactors && (
            <ChevronSmall>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </ChevronSmall>
          )}
          {label}
          {isNegative && <NegativeLabel>(부적)</NegativeLabel>}
        </FactorLabel>
        <DualBar score={score} prevScore={prevScore} color={barHex} />
        <ScoreValue>{score.toFixed(0)}</ScoreValue>
      </FactorRow>

      {/* 하위 요인 드롭다운 */}
      {isExpanded && hasSubFactors && (
        <SubFactorsContainer>
          {subFactors.map((factor) => (
            <FactorRow key={factor.name}>
              <LeafLabel>
                <TreeBranch>└</TreeBranch>
                {factor.name}
              </LeafLabel>
              <DualBar
                score={factor.score}
                prevScore={factor.prevScore}
                color={lightenColor(barHex)}
                height="1.25rem"
                radius="0 3px 3px 0"
                showLabel={false}
                labelSize="10px"
              />
              <SmallScoreValue>{factor.score.toFixed(0)}</SmallScoreValue>
            </FactorRow>
          ))}
        </SubFactorsContainer>
      )}
    </div>
  );
}

// ============================================================
// 유틸리티
// ============================================================

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}
