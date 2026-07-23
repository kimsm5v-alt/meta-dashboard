import { useState, useMemo, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { SELFREG_DOMAIN_STRUCTURE, type SelfregCategory } from '@shared/data/selfregFactors';

interface SelfregFactorAnalysisProps {
  /** 자기조절 20개 요인 T-score (index 0~19, selfregFactors.ts 순서와 일치) */
  tScores: number[];
  prevTScores?: number[];
  showCompare?: boolean;
}

// ============================================================
// Styled Components
// ============================================================

const Card = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TabRow = styled.div`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const TabButton = styled.button<{ $active: boolean; $color: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  background: ${({ $active, $color }) => ($active ? $color : '#F3F4F6')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#71717A')};

  &:hover {
    background: ${({ $active, $color }) => ($active ? $color : '#E5E7EB')};
  }
`;

const TabCount = styled.span<{ $active: boolean }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  background: ${({ $active }) => ($active ? 'rgba(255,255,255,0.2)' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#71717A')};
`;

const DescriptionBox = styled.div`
  margin: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg} 0;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #15803d;
`;

const ChartArea = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing.md};
`;

// ============================================================
// Component
// ============================================================

export const SelfregFactorAnalysis: React.FC<SelfregFactorAnalysisProps> = ({
  tScores,
  prevTScores,
  showCompare = false,
}) => {
  const [activeTab, setActiveTab] = useState<SelfregCategory>('동기전략');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 40);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
      ro.disconnect();
    };
  }, []);

  const activeDomain = useMemo(
    () => SELFREG_DOMAIN_STRUCTURE.find((d) => d.id === activeTab)!,
    [activeTab],
  );

  const getGrade = (t: number): { label: string; isTwoLine: boolean } => {
    if (t >= 70) return { label: '매우높음', isTwoLine: true };
    if (t >= 60) return { label: '높음', isTwoLine: false };
    if (t >= 40) return { label: '보통', isTwoLine: false };
    if (t >= 30) return { label: '낮음', isTwoLine: false };
    return { label: '매우낮음', isTwoLine: true };
  };

  const getBarTone = (t: number) => {
    if (t >= 40 && t < 60) return { fill: '#EDEDF0', stroke: '#D4D4D8', labelColor: '#71717A' };
    if (t >= 60) return { fill: '#E3F4E9', stroke: '#A9DCBC', labelColor: '#16A34A' };
    return { fill: '#FDE7E4', stroke: '#F0B5AC', labelColor: '#DC2626' };
  };

  const chartHeight = 260;
  const baseY = 320;
  const yOf = (t: number) => 40 + (1 - t / 100) * chartHeight;

  const subCatCount = activeDomain.subCategories.length;
  const groupGap = 24;
  const usableWidth = containerWidth - 20;
  const barsAreaWidth = usableWidth - (subCatCount - 1) * groupGap;
  const barSlotWidth = barsAreaWidth / activeDomain.factorCount;
  const barWidth = showCompare
    ? Math.max(Math.min(barSlotWidth * 0.95, 80), 32)
    : Math.max(Math.min(barSlotWidth * 0.7, 48), 20);

  const renderBars = () => {
    let xOffset = 10;
    const elements: React.ReactElement[] = [];

    activeDomain.subCategories.forEach((subCat, subIdx) => {
      const subStart = xOffset;

      subCat.factors.forEach((factor) => {
        const t = Math.round(tScores[factor.index] ?? 50);
        const prevT = prevTScores ? Math.round(prevTScores[factor.index] ?? 50) : null;
        const tone = getBarTone(t);
        const barH = (t / 100) * chartHeight;
        const y = yOf(t);
        const centerX = xOffset + barSlotWidth / 2;

        if (showCompare && prevT !== null) {
          const pairWidth = Math.max(barWidth * 0.48, 28);
          const pairGap = Math.max(barSlotWidth * 0.05, 4);
          const pairStartX = centerX - pairWidth - pairGap / 2;
          const prevTone = getBarTone(prevT);
          const prevBarH = (prevT / 100) * chartHeight;
          const prevY = yOf(prevT);
          const prevGrade = getGrade(prevT);
          const currGrade = getGrade(t);

          elements.push(
            <g key={`${factor.index}-prev`}>
              <text
                x={pairStartX + pairWidth / 2}
                y={prevY - 5}
                textAnchor='middle'
                fontSize={10}
                fontWeight={700}
                fill={prevTone.labelColor}
              >
                {prevT}
              </text>
              <rect
                x={pairStartX}
                y={prevY}
                width={pairWidth}
                height={prevBarH}
                rx={3}
                fill={prevTone.fill}
                stroke={prevTone.stroke}
                strokeWidth={1}
              />
              {prevBarH > 32 &&
                (prevGrade.isTwoLine ? (
                  <>
                    <text
                      x={pairStartX + pairWidth / 2}
                      y={prevY + Math.min(prevBarH / 2 - 2, prevBarH - 18)}
                      textAnchor='middle'
                      fontSize={9}
                      fontWeight={600}
                      fill={prevTone.labelColor}
                    >
                      {prevGrade.label.slice(0, 2)}
                    </text>
                    <text
                      x={pairStartX + pairWidth / 2}
                      y={prevY + Math.min(prevBarH / 2 + 10, prevBarH - 6)}
                      textAnchor='middle'
                      fontSize={9}
                      fontWeight={600}
                      fill={prevTone.labelColor}
                    >
                      {prevGrade.label.slice(2)}
                    </text>
                  </>
                ) : (
                  <text
                    x={pairStartX + pairWidth / 2}
                    y={prevY + Math.min(prevBarH / 2 + 4, prevBarH - 8)}
                    textAnchor='middle'
                    fontSize={9}
                    fontWeight={600}
                    fill={prevTone.labelColor}
                  >
                    {prevGrade.label}
                  </text>
                ))}
            </g>,
          );

          const currBarX = centerX + pairGap / 2;
          elements.push(
            <g key={`${factor.index}-curr`}>
              <text
                x={currBarX + pairWidth / 2}
                y={y - 5}
                textAnchor='middle'
                fontSize={10}
                fontWeight={700}
                fill={tone.labelColor}
              >
                {t}
              </text>
              <rect
                x={currBarX}
                y={y}
                width={pairWidth}
                height={barH}
                rx={3}
                fill={tone.fill}
                stroke={tone.stroke}
                strokeWidth={1}
              />
              {barH > 32 &&
                (currGrade.isTwoLine ? (
                  <>
                    <text
                      x={currBarX + pairWidth / 2}
                      y={y + Math.min(barH / 2 - 2, barH - 18)}
                      textAnchor='middle'
                      fontSize={9}
                      fontWeight={600}
                      fill={tone.labelColor}
                    >
                      {currGrade.label.slice(0, 2)}
                    </text>
                    <text
                      x={currBarX + pairWidth / 2}
                      y={y + Math.min(barH / 2 + 10, barH - 6)}
                      textAnchor='middle'
                      fontSize={9}
                      fontWeight={600}
                      fill={tone.labelColor}
                    >
                      {currGrade.label.slice(2)}
                    </text>
                  </>
                ) : (
                  <text
                    x={currBarX + pairWidth / 2}
                    y={y + Math.min(barH / 2 + 4, barH - 8)}
                    textAnchor='middle'
                    fontSize={9}
                    fontWeight={600}
                    fill={tone.labelColor}
                  >
                    {currGrade.label}
                  </text>
                ))}
            </g>,
          );

          elements.push(
            <text
              key={`${factor.index}-label`}
              x={centerX}
              y={baseY + 14}
              textAnchor='middle'
              fontSize={10}
              fill='#52525B'
            >
              {factor.name}
            </text>,
          );
        } else {
          const bx = centerX - barWidth / 2;
          const grade = getGrade(t);

          elements.push(
            <g key={factor.index}>
              <text
                x={centerX}
                y={y - 6}
                textAnchor='middle'
                fontSize={12}
                fontWeight={700}
                fill={tone.labelColor}
              >
                {t}
              </text>
              <rect
                x={bx}
                y={y}
                width={barWidth}
                height={barH}
                rx={5}
                fill={tone.fill}
                stroke={tone.stroke}
                strokeWidth={1}
              />
              {barH > 28 &&
                (grade.isTwoLine ? (
                  <>
                    <text
                      x={centerX}
                      y={y + Math.min(barH / 2 - 2, barH - 18)}
                      textAnchor='middle'
                      fontSize={10}
                      fontWeight={600}
                      fill={tone.labelColor}
                    >
                      {grade.label.slice(0, 2)}
                    </text>
                    <text
                      x={centerX}
                      y={y + Math.min(barH / 2 + 10, barH - 6)}
                      textAnchor='middle'
                      fontSize={10}
                      fontWeight={600}
                      fill={tone.labelColor}
                    >
                      {grade.label.slice(2)}
                    </text>
                  </>
                ) : (
                  <text
                    x={centerX}
                    y={y + Math.min(barH / 2 + 4, barH - 8)}
                    textAnchor='middle'
                    fontSize={10}
                    fontWeight={600}
                    fill={tone.labelColor}
                  >
                    {grade.label}
                  </text>
                ))}
              <text x={centerX} y={baseY + 14} textAnchor='middle' fontSize={11} fill='#52525B'>
                {factor.name}
              </text>
            </g>,
          );
        }

        xOffset += barSlotWidth;
      });

      const subEnd = xOffset - barSlotWidth * 0.1;
      elements.push(
        <g key={`sub-${subIdx}`}>
          <line
            x1={subStart}
            y1={baseY + 24}
            x2={subEnd}
            y2={baseY + 24}
            stroke={activeDomain.color}
            strokeWidth={2}
          />
          <text
            x={(subStart + subEnd) / 2}
            y={baseY + 44}
            textAnchor='middle'
            fontSize={13}
            fontWeight={800}
            fill={activeDomain.color}
          >
            {subCat.name}
          </text>
        </g>,
      );

      if (subIdx < activeDomain.subCategories.length - 1) {
        const sepX = xOffset + groupGap / 2;
        elements.push(
          <line
            key={`sep-${subIdx}`}
            x1={sepX}
            y1={40}
            x2={sepX}
            y2={baseY + 18}
            stroke='#E5E5E7'
            strokeWidth={1}
            strokeDasharray='3 3'
          />,
        );
        xOffset += groupGap;
      }
    });

    return elements;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>20개 요인 분석</CardTitle>
      </CardHeader>

      <TabRow>
        {SELFREG_DOMAIN_STRUCTURE.map((domain) => (
          <TabButton
            key={domain.id}
            $active={activeTab === domain.id}
            $color={domain.color}
            onClick={() => setActiveTab(domain.id as SelfregCategory)}
          >
            {domain.name}
            <TabCount $active={activeTab === domain.id}>{domain.factorCount}</TabCount>
          </TabButton>
        ))}
      </TabRow>

      <DescriptionBox>{activeDomain.description}</DescriptionBox>

      <ChartArea ref={containerRef}>
        <svg width={containerWidth} height={380} style={{ display: 'block' }}>
          <line
            x1={10}
            y1={yOf(50)}
            x2={containerWidth - 10}
            y2={yOf(50)}
            stroke='#C9A4ED'
            strokeWidth={1.3}
            strokeDasharray='5 5'
          />
          <text x={containerWidth - 10} y={20} textAnchor='end' fontSize={11} fill='#9CA3AF'>
            점선: T=50 (전국 평균)
          </text>

          {showCompare && prevTScores && (
            <g>
              <rect x={10} y={8} width={12} height={12} rx={2} fill='#F0F0F2' stroke='#DADADE' />
              <text x={28} y={18} fontSize={11} fill='#52525B'>
                1차
              </text>
              <rect x={60} y={8} width={12} height={12} rx={2} fill='#D6D6DC' stroke='#B6B6BE' />
              <text x={78} y={18} fontSize={11} fill='#52525B'>
                2차
              </text>
            </g>
          )}

          {renderBars()}
        </svg>
      </ChartArea>
    </Card>
  );
};
