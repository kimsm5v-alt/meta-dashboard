import type React from 'react';
import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { SUB_CATEGORY_FACTORS, FACTOR_DEFINITIONS } from '@shared/data/factors';
import { CATEGORY_COLORS } from '@shared/data/lpaProfiles';
import { lightenColor } from '@shared/utils/colorUtils';
import { DualBar } from '@features/student-dashboard/ui/four-step/DualBar';

const Container = styled.div``;

const Row = styled.div<{ $hasSubFactors: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: ${({ $hasSubFactors }) => ($hasSubFactors ? 'pointer' : 'default')};
`;

const Label = styled.div`
  width: 10rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
`;

const ChevronIcon = styled.span`
  width: 0.875rem;
  height: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  flex-shrink: 0;
  display: inline-flex;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const NegativeLabel = styled.span`
  font-size: 10px;
  color: #ef4444;
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const ScoreValue = styled.div`
  width: 3rem;
  text-align: right;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const SubFactorList = styled.div`
  margin-top: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SubFactorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SubFactorLabel = styled.div`
  width: 10rem;
  padding-left: 1.5rem;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.gray[500]};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const SubFactorPrefix = styled.span`
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const SubFactorScore = styled.div`
  width: 3rem;
  text-align: right;
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

// ============================================================
// BarItem Props
// ============================================================

export interface BarItemProps {
  label: string;
  score: number;
  prevScore?: number;
  isNegative?: boolean;
  subCategoryKey?: string;
  tScores?: number[];
  prevTScores?: number[];
}

// ============================================================
// BarItem (2depth 중분류)
// ============================================================

export const BarItem: React.FC<BarItemProps> = ({
  label,
  score,
  prevScore,
  isNegative = false,
  subCategoryKey,
  tScores,
  prevTScores,
}) => {
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
    <Container>
      <Row $hasSubFactors={hasSubFactors} onClick={() => hasSubFactors && setIsExpanded(!isExpanded)}>
        <Label>
          {hasSubFactors && (
            <ChevronIcon>
              {isExpanded ? <ChevronDown /> : <ChevronRight />}
            </ChevronIcon>
          )}
          {label}
          {isNegative && <NegativeLabel>(부적)</NegativeLabel>}
        </Label>
        <DualBar score={score} prevScore={prevScore} color={barHex} />
        <ScoreValue>{score.toFixed(0)}</ScoreValue>
      </Row>

      {/* 하위 요인 드롭다운 */}
      {isExpanded && hasSubFactors && (
        <SubFactorList>
          {subFactors.map((factor) => (
            <SubFactorRow key={factor.name}>
              <SubFactorLabel>
                <SubFactorPrefix>└</SubFactorPrefix>
                {factor.name}
              </SubFactorLabel>
              <DualBar
                score={factor.score}
                prevScore={factor.prevScore}
                color={lightenColor(barHex)}
                height='h-5'
                radius='0 3px 3px 0'
                showLabel={false}
                labelSize='text-[10px]'
              />
              <SubFactorScore>{factor.score.toFixed(0)}</SubFactorScore>
            </SubFactorRow>
          ))}
        </SubFactorList>
      )}
    </Container>
  );
};
