import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Card } from '@shared/components';
import { SUB_CATEGORY_ORDER } from '@shared/utils/classComparisonUtils';
import { calculateSubCategoryAveragesByRound } from '@features/exam-tracking/utils/calculateSubCategoryAveragesByRound';
import type { Class } from '@shared/types';

const Title = styled.h3`
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Subtitle = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ChartWrap = styled.div`
  overflow-x: auto;
`;

const EmptyText = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg} 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

const CATEGORY_META: Record<string, { area: string; polarity: 'positive' | 'negative' }> = {
  긍정적자아: { area: '자아강점', polarity: 'positive' },
  대인관계능력: { area: '자아강점', polarity: 'positive' },
  메타인지: { area: '학습디딤돌', polarity: 'positive' },
  학습기술: { area: '학습디딤돌', polarity: 'positive' },
  지지적관계: { area: '학습디딤돌', polarity: 'positive' },
  학업열의: { area: '긍정적공부마음', polarity: 'positive' },
  성장력: { area: '긍정적공부마음', polarity: 'positive' },
  학업스트레스: { area: '학습걸림돌', polarity: 'negative' },
  학습방해물: { area: '학습걸림돌', polarity: 'negative' },
  학업관계스트레스: { area: '학습걸림돌', polarity: 'negative' },
  학업소진: { area: '부정적공부마음', polarity: 'negative' },
};

const AREA_COLORS: Record<string, string> = {
  자아강점: '#00D282',
  학습디딤돌: '#4BC1FF',
  긍정적공부마음: '#67A7FF',
  학습걸림돌: '#FF849F',
  부정적공부마음: '#FF87D4',
};

interface CategoryChangeListProps {
  classData: Class;
}

export const CategoryChangeList = ({ classData }: CategoryChangeListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);
  const round1 = calculateSubCategoryAveragesByRound(classData, 1);
  const round2 = calculateSubCategoryAveragesByRound(classData, 2);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = (width: number) => {
      const nextWidth = Math.round(width);
      setContainerWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    };
    const measureWidth = () => updateWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) updateWidth(entry.contentRect.width);
    });

    measureWidth();
    observer.observe(element);
    window.addEventListener('resize', measureWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measureWidth);
    };
  }, []);

  const areaGroups = useMemo(() => {
    const groups: Array<{ area: string; start: number; count: number }> = [];
    SUB_CATEGORY_ORDER.forEach((category, index) => {
      const area = CATEGORY_META[category].area;
      const previous = groups.at(-1);
      if (previous?.area === area) {
        previous.count += 1;
      } else {
        groups.push({ area, start: index, count: 1 });
      }
    });
    return groups;
  }, []);

  if (!round1 || !round2) {
    return (
      <Card>
        <Title>요인별 변화 비교</Title>
        <EmptyText>1차·2차 검사를 모두 응시한 학생이 있어야 비교할 수 있습니다.</EmptyText>
      </Card>
    );
  }

  const padding = { left: 70, right: 16, top: 16, bottom: 90 };
  const height = 360;
  const innerWidth = Math.max(680, containerWidth - padding.left - padding.right);
  const totalWidth = padding.left + innerWidth + padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const columnGap = 10;
  const columnWidth = Math.max(
    22,
    (innerWidth - columnGap * (SUB_CATEGORY_ORDER.length - 1)) / SUB_CATEGORY_ORDER.length,
  );
  const barWidth = Math.min(24, (columnWidth - 4) / 2);
  const yOf = (score: number) => padding.top + (1 - score / 100) * plotHeight;
  const getTone = (score: number, polarity: 'positive' | 'negative') => {
    if (score >= 40 && score < 60) return { fill: '#EDEDF0', stroke: '#D4D4D8', text: '#71717A' };
    const isGood = polarity === 'positive' ? score >= 60 : score < 40;
    return isGood
      ? { fill: '#E3F4E9', stroke: '#A9DCBC', text: '#16A34A' }
      : { fill: '#FDE7E4', stroke: '#F0B5AC', text: '#DC2626' };
  };

  return (
    <Card>
      <Title>요인별 변화 비교</Title>
      <Subtitle>11개 중분류 하위요인의 1차/2차 평균 T점수 변화입니다.</Subtitle>
      <ChartWrap ref={containerRef}>
        <svg width={totalWidth} height={height} style={{ display: 'block' }}>
          {[
            { from: 70, to: 100, label: '매우높음', fill: '#FFFFFF' },
            { from: 60, to: 70, label: '높음', fill: '#FFFFFF' },
            { from: 40, to: 60, label: '보통', fill: '#F7F7F8' },
            { from: 30, to: 40, label: '낮음', fill: '#FFFFFF' },
            { from: 0, to: 30, label: '매우낮음', fill: '#FFFFFF' },
          ].map((band) => {
            const y = yOf(band.to);
            return (
              <g key={band.label}>
                <rect
                  x={padding.left}
                  y={y}
                  width={innerWidth}
                  height={yOf(band.from) - y}
                  fill={band.fill}
                />
                <text
                  x={padding.left - 32}
                  y={(y + yOf(band.from)) / 2 + 4}
                  textAnchor='end'
                  fontSize='10'
                  fill='#A1A1A8'
                  fontWeight='600'
                >
                  {band.label}
                </text>
              </g>
            );
          })}
          {[0, 20, 40, 50, 60, 80, 100].map((score) => (
            <g key={score}>
              <line
                x1={padding.left}
                y1={yOf(score)}
                x2={padding.left + innerWidth}
                y2={yOf(score)}
                stroke={score === 50 ? '#C9A4ED' : '#E5E5E7'}
                strokeWidth={score === 50 ? 1.3 : 0.7}
                strokeDasharray={score === 50 ? '4 4' : '0'}
              />
              <text
                x={padding.left - 8}
                y={yOf(score) + 4}
                textAnchor='end'
                fontSize='10.5'
                fill='#71717A'
              >
                {score}
              </text>
            </g>
          ))}
          <g>
            <rect
              x={totalWidth - 160}
              y={6}
              width={12}
              height={12}
              rx={2}
              fill='#EDEDF0'
              stroke='#D4D4D8'
            />
            <text x={totalWidth - 144} y={16} fontSize='11' fill='#52525B'>
              1차
            </text>
            <rect
              x={totalWidth - 110}
              y={6}
              width={12}
              height={12}
              rx={2}
              fill='#D6D6DC'
              stroke='#B6B6BE'
            />
            <text x={totalWidth - 94} y={16} fontSize='11' fill='#52525B'>
              2차
            </text>
          </g>
          {SUB_CATEGORY_ORDER.map((category, index) => {
            const firstScore = round1[category];
            const secondScore = round2[category];
            const metadata = CATEGORY_META[category];
            const firstTone = getTone(firstScore, metadata.polarity);
            const change = secondScore - firstScore;
            const improved = metadata.polarity === 'negative' ? change < 0 : change > 0;
            const secondTone =
              change === 0
                ? { fill: '#EDEDF0', stroke: '#D4D4D8', text: '#71717A' }
                : improved
                  ? { fill: '#E3F4E9', stroke: '#16A34A', text: '#16A34A' }
                  : { fill: '#FDE7E4', stroke: '#DC2626', text: '#DC2626' };
            const x = padding.left + index * (columnWidth + columnGap);
            const labelMiddle = Math.ceil(category.length / 2);
            return (
              <g key={category}>
                <rect
                  x={x + columnWidth / 2 - barWidth - 1}
                  y={yOf(firstScore)}
                  width={barWidth}
                  height={(firstScore / 100) * plotHeight}
                  rx={3}
                  fill={firstTone.fill}
                  stroke={firstTone.stroke}
                />
                <text
                  x={x + columnWidth / 2 - barWidth / 2 - 1}
                  y={yOf(firstScore) - 4}
                  textAnchor='middle'
                  fontSize='9'
                  fontWeight='600'
                  fill={firstTone.text}
                >
                  {firstScore}
                </text>
                <rect
                  x={x + columnWidth / 2 + 1}
                  y={yOf(secondScore)}
                  width={barWidth}
                  height={(secondScore / 100) * plotHeight}
                  rx={3}
                  fill={secondTone.fill}
                  stroke={secondTone.stroke}
                  strokeWidth={2}
                />
                <text
                  x={x + columnWidth / 2 + barWidth / 2 + 1}
                  y={yOf(secondScore) - 4}
                  textAnchor='middle'
                  fontSize='9'
                  fontWeight='700'
                  fill={secondTone.text}
                >
                  {secondScore}
                </text>
                <text
                  x={x + columnWidth / 2}
                  y={height - padding.bottom + 16}
                  textAnchor='middle'
                  fontSize='10'
                  fill='#52525B'
                >
                  {category.length > 5 ? (
                    <>
                      <tspan x={x + columnWidth / 2} dy='0'>
                        {category.slice(0, labelMiddle)}
                      </tspan>
                      <tspan x={x + columnWidth / 2} dy='12'>
                        {category.slice(labelMiddle)}
                      </tspan>
                    </>
                  ) : (
                    category
                  )}
                </text>
              </g>
            );
          })}
          {areaGroups.map((group) => {
            const startX = padding.left + group.start * (columnWidth + columnGap);
            const endX =
              padding.left +
              (group.start + group.count - 1) * (columnWidth + columnGap) +
              columnWidth;
            return (
              <g key={group.area}>
                <line
                  x1={startX}
                  y1={height - padding.bottom + 56}
                  x2={endX}
                  y2={height - padding.bottom + 56}
                  stroke={AREA_COLORS[group.area]}
                  strokeWidth='2'
                />
                <text
                  x={(startX + endX) / 2}
                  y={height - padding.bottom + 72}
                  textAnchor='middle'
                  fontSize='11'
                  fontWeight='800'
                  fill={AREA_COLORS[group.area]}
                >
                  {group.area}
                </text>
              </g>
            );
          })}
        </svg>
      </ChartWrap>
    </Card>
  );
};
