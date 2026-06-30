import { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import type { DomainData, SubCategoryData } from '@shared/types';

// ============================================================
// 상수
// ============================================================

const CHART_H = 260; // 차트 영역 높이 (px) — 프로토타입 chartHeight=260 동일

// ============================================================
// 바 색상 헬퍼 (T점수 기반 — 프로토타입 getBarTone 동일)
// ============================================================

const getBarTone = (t: number, isPositive: boolean) => {
  if (t >= 40 && t < 60) return { fill: '#EDEDF0', border: '#D4D4D8', labelColor: '#71717A' };
  const isHigh = t >= 60;
  const isGood = isPositive ? isHigh : !isHigh;
  if (isGood) return { fill: '#E3F4E9', border: '#A9DCBC', labelColor: '#16A34A' };
  return { fill: '#FDE7E4', border: '#F0B5AC', labelColor: '#DC2626' };
};

const getGradeLabel = (t: number): string => {
  if (t >= 70) return '매우높음';
  if (t >= 60) return '높음';
  if (t >= 40) return '보통';
  if (t >= 30) return '낮음';
  return '매우낮음';
};
const T_MIN = 0;
const T_MAX = 100;
const T_RANGE = T_MAX - T_MIN; // 100

/** T점수 → 막대 높이(px) */
const toH = (t: number) => Math.max(0, Math.min(CHART_H, ((t - T_MIN) / T_RANGE) * CHART_H));

/** T점수 → 차트 top 오프셋 문자열 (CSS calc) */
const toTop = (t: number) => `calc(1.5rem + ${CHART_H - toH(t)}px)`;

/** 구간 경계선 T값 */
const GRID_T_VALUES = [30, 40, 50, 60, 70] as const;

/** 구간 라벨 — 각 밴드 중심 T값 기준 배치 */
const GRADE_BAND_LABELS = [
  { label: '매우높음', midT: 85 },
  { label: '높음', midT: 65 },
  { label: '보통', midT: 50 },
  { label: '낮음', midT: 35 },
  { label: '매우낮음', midT: 15 },
] as const;

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
  if (name.length < 4 || name === '지지적 관계') return name;

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

const BarElement = styled.div<{ $height: number; $fill: string; $border: string }>`
  width: 75%;
  max-width: 48px;
  min-width: 14px;
  height: ${({ $height }) => $height}px;
  background-color: ${({ $fill }) => $fill};
  border: 1px solid ${({ $border }) => $border};
  border-top-left-radius: ${({ theme }) => theme.radius.md};
  border-top-right-radius: ${({ theme }) => theme.radius.md};
  transition: all 0.3s ease-out;
  flex-shrink: 0;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
`;

const BarGradeLabel = styled.span<{ $labelColor: string }>`
  position: absolute;
  bottom: 3px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 8px;
  font-weight: 700;
  color: ${({ $labelColor }) => $labelColor};
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
`;

// ============================================================
// 단일 막대 (flex-1 컬럼 기반)
// ============================================================

const SingleBar: React.FC<{
  score: number;
  isPositive: boolean;
}> = ({ score, isPositive }) => {
  const t = Math.round(score);
  const tone = getBarTone(t, isPositive);
  const barH = toH(score);
  return (
    <SingleBarContainer $height={CHART_H}>
      <ScoreLabel style={{ color: tone.labelColor }}>{t}</ScoreLabel>
      <BarElement $height={barH} $fill={tone.fill} $border={tone.border}>
        {barH > 26 && (
          <BarGradeLabel $labelColor={tone.labelColor}>{getGradeLabel(t)}</BarGradeLabel>
        )}
      </BarElement>
    </SingleBarContainer>
  );
};

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
  max-width: 80px;
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

const CompareBarElement = styled.div<{ $height: number; $fill: string; $border: string }>`
  width: 100%;
  height: ${({ $height }) => $height}px;
  background-color: ${({ $fill }) => $fill};
  border: 1px solid ${({ $border }) => $border};
  border-top-left-radius: ${({ theme }) => theme.radius.md};
  border-top-right-radius: ${({ theme }) => theme.radius.md};
  transition: all 0.3s ease-out;
  position: relative;
  overflow: hidden;
`;

// ============================================================
// 비교 쌍 막대 (1차 + 2차, flex-1 컬럼 기반)
// ============================================================

const CompareBar: React.FC<{
  score: number;
  prevScore: number;
  isPositive: boolean;
}> = ({ score, prevScore, isPositive }) => {
  const t = Math.round(score);
  const prevT = Math.round(prevScore);
  const tone = getBarTone(t, isPositive);
  const prevTone = getBarTone(prevT, isPositive);
  const barH = toH(score);
  const prevBarH = toH(prevScore);
  const delta = t - prevT;
  return (
    <CompareBarContainer $height={CHART_H}>
      <DeltaBadgeWrapper>
        <DeltaBadge delta={delta} isPositive={isPositive} />
      </DeltaBadgeWrapper>
      <CompareBarsGroup>
        <CompareBarColumn>
          <PrevScoreLabel style={{ color: prevTone.labelColor }}>{prevT}</PrevScoreLabel>
          <CompareBarElement $height={prevBarH} $fill={prevTone.fill} $border={prevTone.border}>
            {prevBarH > 26 && (
              <BarGradeLabel $labelColor={prevTone.labelColor}>
                {getGradeLabel(prevT)}
              </BarGradeLabel>
            )}
          </CompareBarElement>
        </CompareBarColumn>
        <CompareBarColumn>
          <ScoreLabel style={{ color: tone.labelColor }}>{t}</ScoreLabel>
          <CompareBarElement $height={barH} $fill={tone.fill} $border={tone.border}>
            {barH > 26 && (
              <BarGradeLabel $labelColor={tone.labelColor}>{getGradeLabel(t)}</BarGradeLabel>
            )}
          </CompareBarElement>
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
  height: 100%;
`;

const BarsRow = styled.div`
  display: flex;
  align-items: flex-end;
`;

const LabelsRow = styled.div`
  display: flex;
  margin-top: 0.5rem;
  flex: 1;
  align-items: flex-start;
`;

const SubCatFooter = styled.div`
  margin-top: 0.375rem;
`;

const SubCatLine = styled.div<{ $color: string }>`
  height: 2px;
  background: ${({ $color }) => $color};
  margin-bottom: 0.25rem;
`;

const SubCatNameLabel = styled.div<{ $color: string }>`
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 700;
  color: ${({ $color }) => $color};
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
// 중분류 그룹 (D3 요인 막대만) — 프로토타입 레이아웃
// ============================================================

const SubCatGroup: React.FC<{
  subCat: SubCategoryData;
  isCompare: boolean;
  isCompact: boolean;
  prevFactorLookup: Record<number, number>;
}> = ({ subCat, isCompare, isCompact, prevFactorLookup }) => {
  const color = subCat.color;

  return (
    <SubCatGroupContainer>
      {/* 막대 영역 — D3 요인만 */}
      <BarsRow>
        {subCat.factors.map((f) => {
          const prevT = prevFactorLookup[f.index];
          return isCompare && prevT != null ? (
            <CompareBar
              key={f.index}
              score={f.avgTScore}
              prevScore={prevT}
              isPositive={f.isPositive}
            />
          ) : (
            <SingleBar key={f.index} score={f.avgTScore} isPositive={f.isPositive} />
          );
        })}
      </BarsRow>

      {/* 요인명 행 */}
      <LabelsRow>
        {subCat.factors.map((f) => (
          <D3LabelContainer key={f.index}>
            <D3Label $isCompact={isCompact}>{formatFactorLabel(f.name)}</D3Label>
          </D3LabelContainer>
        ))}
      </LabelsRow>

      {/* 중분류 구분선 + 이름 */}
      <SubCatFooter>
        <SubCatLine $color={color} />
        <SubCatNameLabel $color={color}>{formatFactorLabel(subCat.displayName)}</SubCatNameLabel>
      </SubCatFooter>
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
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  transition: all 0.15s ease;
  border: none;
  cursor: pointer;
  text-align: center;

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

const TabCountBadge = styled.span<{ $isActive: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.0625rem 0.375rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 0.625rem;
  font-weight: 700;
  ${({ $isActive }) =>
    $isActive
      ? 'background: rgba(255,255,255,0.25); color: white;'
      : 'background: white; color: #6B7280;'}
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
  padding: 1.5rem 1rem 1rem 2.75rem;
`;

const GridLine = styled.div<{ $top: string; $isPrimary: boolean }>`
  position: absolute;
  left: 2.25rem;
  right: 0.5rem;
  top: ${({ $top }) => $top};
  border-top: ${({ $isPrimary }) => ($isPrimary ? '1.5px dashed #C9A4ED' : '1px dashed #E5E7EB')};
  pointer-events: none;
`;

const GradeLabel = styled.span<{ $top: string }>`
  position: absolute;
  left: 0;
  width: 2.25rem;
  top: ${({ $top }) => $top};
  transform: translateY(-50%);
  font-size: 0.5625rem;
  font-weight: 600;
  color: #a1a1a8;
  text-align: right;
  padding-right: 0.25rem;
  pointer-events: none;
  white-space: nowrap;
  line-height: 1;
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

  const domain = domainData[selectedDomain];

  // 총 막대 수 기반 밀집 모드 판단 (D3 요인만)
  const totalBars = domain.subCategories.reduce((sum, sc) => sum + sc.factors.length, 0);
  const isCompact = totalBars > 10;

  return (
    <Container>
      {/* ===== Depth 1 탭 ===== */}
      <TabsRow>
        {domainData.map((d, i) => {
          const factorCount = d.subCategories.reduce((sum, sc) => sum + sc.factors.length, 0);
          const isActive = selectedDomain === i;
          const label =
            d.category === '긍정적공부마음' ? (
              <>
                긍정적
                <br />
                공부마음
              </>
            ) : d.category === '부정적공부마음' ? (
              <>
                부정적
                <br />
                공부마음
              </>
            ) : (
              d.category
            );
          return (
            <TabButton
              key={d.category}
              onClick={() => setSelectedDomain(i)}
              $isActive={isActive}
              $bgColor={isActive ? (d.subCategories[0]?.color ?? undefined) : undefined}
            >
              {label}
              <TabCountBadge $isActive={isActive}>{factorCount}</TabCountBadge>
            </TabButton>
          );
        })}
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
        <span>보라색 점선: T=50 (전국 평균)</span>
        {isCompare && (
          <>
            <LegendSeparator>|</LegendSeparator>
            <LegendItem>
              <LegendColorBox $color='#9CA3AF' /> 1차
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
          {/* 구간 경계선 (T=30,40,50,60,70) */}
          {GRID_T_VALUES.map((t) => (
            <GridLine key={t} $top={toTop(t)} $isPrimary={t === 50} />
          ))}

          {/* 구간 라벨 (매우낮음~매우높음) */}
          {GRADE_BAND_LABELS.map(({ label, midT }) => (
            <GradeLabel key={label} $top={toTop(midT)}>
              {label}
            </GradeLabel>
          ))}

          {/* 막대 그룹 — 비례 flex 가중치 */}
          <BarsContainer>
            {domain.subCategories.map((sc, i) => {
              const colCount = sc.factors.length;
              return (
                <div key={sc.name} style={{ display: 'contents' }}>
                  <SubCatWrapper $flex={colCount}>
                    <SubCatGroup
                      subCat={sc}
                      isCompare={isCompare}
                      isCompact={isCompact}
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
