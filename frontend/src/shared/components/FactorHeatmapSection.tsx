import { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import type { DomainData, SubCategoryData } from '@shared/types';
import { LevelBadge } from '@shared/ui/LevelBadge';
import { lightenColor } from '@shared/utils/colorUtils';
import { PREV_COLOR } from '@shared/utils/chartUtils';

// ============================================================
// 상수
// ============================================================

const CHART_H = 240; // 차트 영역 높이 (px)
const T_MIN = 0;
const T_MAX = 100;
const T_RANGE = T_MAX - T_MIN; // 100

/** T점수 → 막대 높이(px) */
const toH = (t: number) => Math.max(0, Math.min(CHART_H, ((t - T_MIN) / T_RANGE) * CHART_H));

/** T=50 기준선의 bottom 위치(px) */
const REF_BOTTOM = toH(50);

// ============================================================
// Styled Components - DeltaBadge
// ============================================================

const DeltaBadgeContainer = styled.span<{ $variant: 'neutral' | 'good' | 'bad' }>`
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.375rem;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};

  ${({ $variant }) => {
    switch ($variant) {
      case 'neutral':
        return 'background: #f3f4f6; color: #9ca3af;';
      case 'good':
        return 'background: #ecfdf5; color: #059669;';
      case 'bad':
        return 'background: #fef2f2; color: #dc2626;';
    }
  }}
`;

// ============================================================
// DeltaBadge
// ============================================================

const DeltaBadge: React.FC<{ delta: number; isPositive: boolean }> = ({ delta, isPositive }) => {
  const isGood = isPositive ? delta > 0 : delta < 0;
  const isBad = isPositive ? delta < 0 : delta > 0;
  const absDelta = Math.abs(delta);

  if (absDelta < 0.5) {
    return <DeltaBadgeContainer $variant='neutral'>0</DeltaBadgeContainer>;
  }
  if (isGood) {
    return <DeltaBadgeContainer $variant='good'>+{absDelta.toFixed(0)}</DeltaBadgeContainer>;
  }
  if (isBad) {
    return <DeltaBadgeContainer $variant='bad'>-{absDelta.toFixed(0)}</DeltaBadgeContainer>;
  }
  return null;
};

// ============================================================
// 6자 이상 요인명 2줄 포맷
// ============================================================

const KNOWN_PREFIXES = [
  '스마트폰',
  '학업관계',
  '대인관계',
  '학업',
  '부모',
  '친구',
  '교사',
  '자기',
  '타인',
  '성장',
  '자아',
  '게임',
];

/** 요인명을 의미 단위로 줄바꿈 (6자+: 항상 2줄, 4-5자: 좁을 때만) */
const formatFactorLabel = (name: string): React.ReactNode => {
  if (name.length < 4) return name;

  let breakAt = -1;
  for (const p of KNOWN_PREFIXES) {
    if (name.startsWith(p)) {
      breakAt = p.length;
      break;
    }
  }
  if (breakAt === -1) breakAt = Math.ceil(name.length / 2);

  // 6자 이상: 항상 2줄
  if (name.length >= 6) {
    return (
      <>
        {name.slice(0, breakAt)}
        <br />
        {name.slice(breakAt)}
      </>
    );
  }
  // 4-5자: 좁으면 줄바꿈 (zero-width space)
  return (
    <>
      {name.slice(0, breakAt)}
      {'\u200B'}
      {name.slice(breakAt)}
    </>
  );
};

// ============================================================
// Styled Components - SingleBar
// ============================================================

const SingleBarContainer = styled.div<{ $height: number }>`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: ${({ $height }) => $height}px;
`;

const ScoreLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.125rem;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  white-space: nowrap;
`;

const BarElement = styled.div<{ $height: number; $color: string }>`
  width: 75%;
  max-width: 36px;
  min-width: 12px;
  height: ${({ $height }) => $height}px;
  background-color: ${({ $color }) => $color};
  border-top-left-radius: ${({ theme }) => theme.radius.md};
  border-top-right-radius: ${({ theme }) => theme.radius.md};
  transition: all 0.3s ease-out;
  flex-shrink: 0;
  margin: 0 auto;
`;

// ============================================================
// 단일 막대 (flex-1 컬럼 기반)
// ============================================================

const SingleBar: React.FC<{
  score: number;
  color: string;
}> = ({ score, color }) => (
  <SingleBarContainer $height={CHART_H}>
    <ScoreLabel>{Math.round(score)}</ScoreLabel>
    <BarElement $height={toH(score)} $color={color} />
  </SingleBarContainer>
);

// ============================================================
// Styled Components - CompareBar
// ============================================================

const CompareBarContainer = styled.div<{ $height: number }>`
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: ${({ $height }) => $height}px;
`;

const DeltaBadgeWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 10;
`;

const CompareBarsGroup = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 1px;
  flex-shrink: 0;
  width: 85%;
  max-width: 64px;
  margin: 0 auto;
`;

const CompareBarColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
`;

const PrevScoreLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-bottom: 0.125rem;
  position: relative;
  z-index: 10;
  white-space: nowrap;
`;

const CompareBarElement = styled.div<{ $height: number; $color: string }>`
  width: 100%;
  height: ${({ $height }) => $height}px;
  background-color: ${({ $color }) => $color};
  border-top-left-radius: ${({ theme }) => theme.radius.md};
  border-top-right-radius: ${({ theme }) => theme.radius.md};
  transition: all 0.3s ease-out;
`;

// ============================================================
// 비교 쌍 막대 (1차 + 2차, flex-1 컬럼 기반)
// ============================================================

/** D3용 연한 회색 (1차 막대) */
const PREV_COLOR_LIGHT = '#D1D5DB';

const CompareBar: React.FC<{
  score: number;
  prevScore: number;
  color: string;
  prevColor?: string;
  isPositive: boolean;
}> = ({ score, prevScore, color, prevColor = PREV_COLOR, isPositive }) => {
  const delta = Math.round(score - prevScore);
  return (
    <CompareBarContainer $height={CHART_H}>
      <DeltaBadgeWrapper>
        <DeltaBadge delta={delta} isPositive={isPositive} />
      </DeltaBadgeWrapper>
      <CompareBarsGroup>
        <CompareBarColumn>
          <PrevScoreLabel>{Math.round(prevScore)}</PrevScoreLabel>
          <CompareBarElement $height={toH(prevScore)} $color={prevColor} />
        </CompareBarColumn>
        <CompareBarColumn>
          <ScoreLabel>{Math.round(score)}</ScoreLabel>
          <CompareBarElement $height={toH(score)} $color={color} />
        </CompareBarColumn>
      </CompareBarsGroup>
    </CompareBarContainer>
  );
};

// ============================================================
// Styled Components - SubCatGroup
// ============================================================

const SubCatGroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const BarsRow = styled.div`
  display: flex;
  align-items: flex-end;
`;

const LabelsRow = styled.div`
  display: flex;
  margin-top: 0.5rem;
`;

const D2LabelContainer = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0 0.125rem;
`;

const D2Label = styled.span<{ $isCompact: boolean; $color: string }>`
  font-size: ${({ $isCompact, theme }) =>
    $isCompact ? theme.typography.fontSize.sm : theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $color }) => $color};
  text-align: center;
  line-height: 1.25;
  word-break: keep-all;
`;

const D3LabelContainer = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0.125rem;
`;

const D3Label = styled.span<{ $isCompact: boolean }>`
  font-size: ${({ $isCompact, theme }) =>
    $isCompact ? theme.typography.fontSize.xs : theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  text-align: center;
  line-height: 1.25;
  word-break: keep-all;
`;

// ============================================================
// D2 그룹 (중분류 평균 + D3 요인들) — flex-1 컬럼 기반
// ============================================================

const SubCatGroup: React.FC<{
  subCat: SubCategoryData;
  isCompare: boolean;
  isCompact: boolean;
  prevSubCatT?: number;
  prevFactorLookup: Record<number, number>;
}> = ({ subCat, isCompare, isCompact, prevSubCatT, prevFactorLookup }) => {
  const color = subCat.color;
  const lightColor = lightenColor(color, 0.55);

  return (
    <SubCatGroupContainer>
      {/* 막대 영역 */}
      <BarsRow>
        {/* D2 평균 막대 */}
        {isCompare && prevSubCatT != null ? (
          <CompareBar
            score={subCat.avgTScore}
            prevScore={prevSubCatT}
            color={color}
            isPositive={subCat.isPositive}
          />
        ) : (
          <SingleBar score={subCat.avgTScore} color={color} />
        )}

        {/* D3 요인 막대들 */}
        {subCat.factors.map((f) => {
          const prevT = prevFactorLookup[f.index];
          return isCompare && prevT != null ? (
            <CompareBar
              key={f.index}
              score={f.avgTScore}
              prevScore={prevT}
              color={lightColor}
              prevColor={PREV_COLOR_LIGHT}
              isPositive={f.isPositive}
            />
          ) : (
            <SingleBar key={f.index} score={f.avgTScore} color={lightColor} />
          );
        })}
      </BarsRow>

      {/* 라벨 행 */}
      <LabelsRow>
        {/* D2 라벨 */}
        <D2LabelContainer>
          <D2Label $isCompact={isCompact} $color={color}>
            {formatFactorLabel(subCat.displayName)}
          </D2Label>
          <LevelBadge level={subCat.level} isPositive={subCat.isPositive} size='sm' />
        </D2LabelContainer>

        {/* D3 라벨 */}
        {subCat.factors.map((f) => (
          <D3LabelContainer key={f.index}>
            <D3Label $isCompact={isCompact}>{formatFactorLabel(f.name)}</D3Label>
          </D3LabelContainer>
        ))}
      </LabelsRow>
    </SubCatGroupContainer>
  );
};

// ============================================================
// Styled Components - Main
// ============================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TabsRow = styled.div`
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
`;

const TabButton = styled.button<{ $isActive: boolean; $bgColor?: string }>`
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  transition: all 0.15s ease;
  border: none;
  cursor: pointer;

  ${({ $isActive, $bgColor, theme }) =>
    $isActive
      ? `
    background: ${$bgColor ?? theme.colors.gray[600]};
    color: white;
    box-shadow: ${theme.shadows.sm};
  `
      : `
    background: ${theme.colors.gray[100]};
    color: ${theme.colors.gray[600]};

    &:hover {
      background: ${theme.colors.gray[200]};
    }
  `}
`;

const TypeBadge = styled.div<{ $isPositive: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};

  ${({ $isPositive }) =>
    $isPositive
      ? `
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  `
      : `
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  `}
`;

const TypeBadgeSeparator = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const TypeBadgeDescription = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const LegendSeparator = styled.span`
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const LegendItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const LegendColorBox = styled.span<{ $color: string }>`
  width: 0.625rem;
  height: 0.625rem;
  background: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const ChartContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`;

const ChartInner = styled.div`
  position: relative;
  padding: 1.5rem 1rem 1rem;
`;

const ReferenceLine = styled.div<{ $top: string }>`
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  top: ${({ $top }) => $top};
  border-top: 1px dashed ${({ theme }) => theme.colors.gray[300]};
  pointer-events: none;
`;

const BarsContainer = styled.div`
  display: flex;
  width: 100%;
`;

const SubCatWrapper = styled.div<{ $flex: number }>`
  flex: ${({ $flex }) => $flex};
  min-width: 0;
`;

const Divider = styled.div`
  width: 1px;
  margin: 0 0.5rem;
  background: ${({ theme }) => theme.colors.gray[200]};
  align-self: stretch;
  flex-shrink: 0;
`;

// ============================================================
// Props
// ============================================================

interface FactorHeatmapSectionProps {
  domainData: DomainData[];
  prevDomainData?: DomainData[];
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export const FactorHeatmapSection: React.FC<FactorHeatmapSectionProps> = ({
  domainData,
  prevDomainData,
}) => {
  const [selectedDomain, setSelectedDomain] = useState(0);
  const isCompare = !!prevDomainData;

  const prevFactorLookup = useMemo(() => {
    if (!prevDomainData) return {} as Record<number, number>;
    const lookup: Record<number, number> = {};
    for (const d of prevDomainData)
      for (const sc of d.subCategories) for (const f of sc.factors) lookup[f.index] = f.avgTScore;
    return lookup;
  }, [prevDomainData]);

  const prevSubCatLookup = useMemo(() => {
    if (!prevDomainData) return {} as Record<string, number>;
    const lookup: Record<string, number> = {};
    for (const d of prevDomainData)
      for (const sc of d.subCategories) lookup[sc.name] = sc.avgTScore;
    return lookup;
  }, [prevDomainData]);

  const domain = domainData[selectedDomain];

  // 총 막대 수 기반 밀집 모드 판단
  const totalBars = domain.subCategories.reduce((sum, sc) => sum + 1 + sc.factors.length, 0);
  const isCompact = totalBars > 10;

  return (
    <Container>
      {/* ===== Depth 1 탭 ===== */}
      <TabsRow>
        {domainData.map((d, i) => (
          <TabButton
            key={d.category}
            onClick={() => setSelectedDomain(i)}
            $isActive={selectedDomain === i}
            $bgColor={selectedDomain === i ? d.subCategories[0]?.color : undefined}
          >
            {d.icon} {d.category}
          </TabButton>
        ))}
      </TabsRow>

      {/* ===== 요인 유형 배지 ===== */}
      <TypeBadge $isPositive={domain.isPositive}>
        <span>{domain.isPositive ? '정적요인' : '부적요인'}</span>
        <TypeBadgeSeparator>·</TypeBadgeSeparator>
        <TypeBadgeDescription>
          {domain.isPositive
            ? '점수가 높을수록 학습에 긍정적인 영향을 의미합니다.'
            : '점수가 낮을수록 학습에 긍정적인 영향을 의미합니다.'}
        </TypeBadgeDescription>
      </TypeBadge>

      {/* ===== 범례 ===== */}
      <LegendRow>
        <span>점선: T=50 (전국 평균)</span>
        {isCompare && (
          <>
            <LegendSeparator>|</LegendSeparator>
            <LegendItem>
              <LegendColorBox $color={PREV_COLOR} /> 1차
            </LegendItem>
            <LegendItem>
              <LegendColorBox $color={domain.subCategories[0]?.color ?? '#6B7280'} /> 2차
            </LegendItem>
          </>
        )}
      </LegendRow>

      {/* ===== 차트 영역 ===== */}
      <ChartContainer>
        <ChartInner>
          {/* T=50 기준선 */}
          <ReferenceLine $top={`calc(1.5rem + ${CHART_H - REF_BOTTOM}px)`} />

          {/* 막대 그룹 — 비례 flex 가중치 */}
          <BarsContainer>
            {domain.subCategories.map((sc, i) => {
              const colCount = 1 + sc.factors.length;
              return (
                <div key={sc.name} style={{ display: 'contents' }}>
                  <SubCatWrapper $flex={colCount}>
                    <SubCatGroup
                      subCat={sc}
                      isCompare={isCompare}
                      isCompact={isCompact}
                      prevSubCatT={prevSubCatLookup[sc.name]}
                      prevFactorLookup={prevFactorLookup}
                    />
                  </SubCatWrapper>
                  {i < domain.subCategories.length - 1 && <Divider />}
                </div>
              );
            })}
          </BarsContainer>
        </ChartInner>
      </ChartContainer>
    </Container>
  );
};
