import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Check, Info } from 'lucide-react';
import {
  SELFREG_DOMAIN_STRUCTURE,
  SELFREG_FACTOR_DEFINITIONS,
  type SelfregCategory,
} from '@shared/data/selfregFactors';
import { SELFREG_FACTOR_DEFINITIONS_TEXT } from '@shared/data/selfregFactorDefinitions';

type ResultRound = 1 | 2;

interface SelfregResultOverviewProps {
  subjectName: string;
  scores: number[];
  round2Scores?: number[] | null;
  isClassView?: boolean;
  selectedRound?: ResultRound;
  onRoundChange?: (round: ResultRound) => void;
}

const Card = styled.section`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.background.paper};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 1.5rem 0;
`;

const Title = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Description = styled.p`
  margin: 0.25rem 0 0;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const RoundSwitch = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.gray[100]};
`;

const RoundButton = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.875rem;
  border: 0;
  border-radius: 0.375rem;
  background: ${({ $active }) => ($active ? '#0F9F8F' : 'transparent')};
  color: ${({ $active, theme }) => ($active ? '#FFFFFF' : theme.colors.gray[600])};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;

  &:disabled {
    color: ${({ theme }) => theme.colors.gray[400]};
    cursor: not-allowed;
  }
`;

const Tabs = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0 1.5rem;
  padding-top: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const Tab = styled.button<{ $active: boolean; $color: string }>`
  position: relative;
  padding: 0.75rem 1rem;
  border: 0;
  background: transparent;
  color: ${({ $active, theme }) => ($active ? theme.colors.gray[900] : theme.colors.gray[500])};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.fontWeight.bold : theme.typography.fontWeight.medium};
  cursor: pointer;

  svg {
    position: absolute;
    top: -0.125rem;
    left: 50%;
    transform: translateX(-50%);
  }

  &::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 3px;
    border-radius: 999px;
    background: ${({ $active, $color }) => ($active ? $color : 'transparent')};
    content: '';
  }
`;

const TabSeparator = styled.span`
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const Body = styled.div`
  padding: 1.25rem 1.5rem 1.5rem;
`;

const OverviewLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(21rem, 26.25rem) minmax(0, 1fr);
  align-items: start;
  gap: 2rem;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const RadarPane = styled.div`
  display: flex;
  justify-content: center;
`;

const DetailPane = styled.div`
  min-width: 0;
`;

const DomainIntro = styled.div<{ $color: string }>`
  margin-bottom: 1rem;

  h4 {
    margin: 0 0 0.375rem;
    color: ${({ $color }) => $color};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.gray[600]};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    line-height: 1.5;
  }
`;

const Insight = styled.p`
  margin-top: 0.625rem !important;
  color: ${({ theme }) => theme.colors.gray[800]} !important;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const InsightFactor = styled.strong<{ $color: string }>`
  color: ${({ $color }) => $color};
`;

const InfoHint = styled.button`
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[400]};
  cursor: help;
`;

const ScaleHead = styled.div`
  display: grid;
  grid-template-columns: minmax(9rem, 1.2fr) minmax(24rem, 4fr);
  align-items: stretch;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 0.75rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};

  > span {
    display: flex;
    align-items: center;
    padding: 0.625rem 0.75rem;
    border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
  }
`;

const ScoreScaleHead = styled.div`
  > span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  }
`;

const GradeLabels = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  min-height: 1.75rem;
  align-items: center;
  text-align: center;

  span + span {
    border-left: 1px solid ${({ theme }) => theme.colors.gray[100]};
  }
`;

const ScoreRow = styled.div`
  display: grid;
  grid-template-columns: minmax(9rem, 1.2fr) minmax(24rem, 4fr);
  align-items: center;
  min-height: 2.75rem;
  border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-left: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const FactorLabel = styled.div<{ $sub?: boolean }>`
  align-self: stretch;
  display: flex;
  align-items: center;
  padding: 0 0.75rem 0 ${({ $sub }) => ($sub ? '1.25rem' : '0.75rem')};
  border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
  color: ${({ $sub, theme }) => ($sub ? theme.colors.gray[600] : theme.colors.gray[800])};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  gap: 0.25rem;
  font-weight: ${({ $sub, theme }) =>
    $sub ? theme.typography.fontWeight.normal : theme.typography.fontWeight.semibold};
`;

const Track = styled.div<{ $color: string }>`
  position: relative;
  height: 1.25rem;
  margin: 0 0.75rem;
  border-radius: 999px;
  overflow: hidden;
  background: #f3f4f6;

  span {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: inherit;
    background: ${({ $color }) => $color};
    opacity: 0.82;

    em {
      position: absolute;
      right: 0.375rem;
      top: 50%;
      color: #fff;
      font-size: 0.6875rem;
      font-style: normal;
      font-weight: 600;
      transform: translateY(-50%);
      white-space: nowrap;
    }
  }
`;

const formatSubCategoryName = (name: string) =>
  ({
    학습원동력: '학습 원동력',
    메타인지: '메타 인지',
    인지적학습기술: '인지적 학습기술',
    행동조절: '행동 조절',
    행동적학습기술: '행동적 학습기술',
  })[name] ?? name;

const clampScore = (score: number) => Math.max(20, Math.min(80, score));
const scorePosition = (score: number) => ((clampScore(score) - 20) / 60) * 100;
const percentile = (score: number) => {
  const z = (score - 50) / 10;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    sign *
    (1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
        t *
        Math.exp(-x * x));
  return Math.max(1, Math.min(99, Math.round(((1 + erf) / 2) * 100)));
};
const profilePosition = (score: number) => Math.max(0, Math.min(100, score));

const RADAR_AXES: Array<{
  label: string;
  category: SelfregCategory;
  indices: number[];
  angle: number;
}> = [
  { label: '행동 조절', category: '행동전략', indices: [12, 13, 14], angle: 0 },
  { label: '행동적\n학습기술', category: '행동전략', indices: [15, 16, 17, 18, 19], angle: 60 },
  { label: '학습 원동력', category: '동기전략', indices: [0, 1, 2], angle: 120 },
  { label: '정서조절', category: '동기전략', indices: [3, 4, 5], angle: 180 },
  { label: '메타 인지', category: '인지전략', indices: [6, 7, 8], angle: 240 },
  { label: '인지적\n학습기술', category: '인지전략', indices: [9, 10, 11], angle: 300 },
];

const polarPoint = (center: number, radius: number, angle: number) => {
  const radians = (angle * Math.PI) / 180;
  return { x: center + radius * Math.cos(radians), y: center - radius * Math.sin(radians) };
};

const SelfregRadar = ({
  scores,
  activeDomain,
}: {
  scores: number[];
  activeDomain: SelfregCategory;
}) => {
  const size = 420;
  const center = size / 2;
  const outerRadius = size * 0.48;
  const innerRadius = size * 0.43;
  const labelRadius = size * 0.3;
  const dataRadius = size * 0.24;
  const axisScores = RADAR_AXES.map((axis) =>
    Math.round(
      axis.indices.reduce((sum, index) => sum + (scores[index] ?? 50), 0) / axis.indices.length,
    ),
  );
  const polygon = RADAR_AXES.map((axis, index) => {
    const point = polarPoint(
      center,
      (Math.max(0, Math.min(80, axisScores[index])) / 80) * dataRadius,
      axis.angle,
    );
    return `${point.x},${point.y}`;
  }).join(' ');
  const segments: Array<{ category: SelfregCategory; start: number; end: number }> = [
    { category: '행동전략', start: 330, end: 90 },
    { category: '동기전략', start: 90, end: 210 },
    { category: '인지전략', start: 210, end: 330 },
  ];

  return (
    <svg
      width='100%'
      height='auto'
      viewBox={`0 0 ${size} ${size}`}
      style={{ maxWidth: size }}
      aria-label='자기조절학습 영역별 레이더 차트'
    >
      <circle cx={center} cy={center} r={innerRadius} fill='#FFFFFF' />
      {[20, 40, 60, 80].map((tick) => (
        <circle
          key={tick}
          cx={center}
          cy={center}
          r={(tick / 80) * dataRadius}
          fill='none'
          stroke='#E8E8E8'
        />
      ))}
      {RADAR_AXES.map((axis) => {
        const end = polarPoint(center, dataRadius, axis.angle);
        return (
          <line
            key={axis.label}
            x1={center}
            y1={center}
            x2={end.x}
            y2={end.y}
            stroke='#E0E0E0'
            strokeDasharray='3 3'
          />
        );
      })}
      {[90, 210, 330].map((angle) => {
        const end = polarPoint(center, innerRadius, angle);
        return (
          <line
            key={angle}
            x1={center}
            y1={center}
            x2={end.x}
            y2={end.y}
            stroke='#D0D0D0'
            strokeDasharray='4 3'
          />
        );
      })}
      <polygon points={polygon} fill='none' stroke='#F5A623' strokeWidth='2' />
      {RADAR_AXES.map((axis, index) => {
        const point = polarPoint(
          center,
          (Math.max(0, Math.min(80, axisScores[index])) / 80) * dataRadius,
          axis.angle,
        );
        return (
          <circle
            key={`score-${axis.label}`}
            cx={point.x}
            cy={point.y}
            r='4.5'
            fill='#F5A623'
            stroke='#FFF'
            strokeWidth='2'
          />
        );
      })}
      {segments.map((segment) => {
        const outerStart = polarPoint(center, outerRadius, segment.start);
        const outerEnd = polarPoint(center, outerRadius, segment.end);
        const innerStart = polarPoint(center, innerRadius, segment.start);
        const innerEnd = polarPoint(center, innerRadius, segment.end);
        const color = SELFREG_DOMAIN_STRUCTURE.find((item) => item.id === segment.category)!.color;
        const opacity = activeDomain === segment.category ? 1 : 0.35;
        const path = `M ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 0 0 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 0 1 ${innerStart.x} ${innerStart.y} Z`;
        return <path key={segment.category} d={path} fill={color} opacity={opacity} />;
      })}
      {RADAR_AXES.map((axis) => {
        const point = polarPoint(center, labelRadius, axis.angle);
        const color = SELFREG_DOMAIN_STRUCTURE.find((item) => item.id === axis.category)!.color;
        const lines = axis.label.split('\n');
        return (
          <text
            key={`label-${axis.label}`}
            x={point.x}
            y={point.y}
            textAnchor='middle'
            dominantBaseline='middle'
            fontSize='13'
            fontWeight={activeDomain === axis.category ? 700 : 500}
            fill={color}
            opacity={activeDomain === axis.category ? 1 : 0.42}
          >
            {lines.map((line, index) => (
              <tspan
                key={line}
                x={point.x}
                dy={index === 0 ? (lines.length > 1 ? '-0.45em' : 0) : '1.1em'}
              >
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
};

export const SelfregResultOverview = ({
  subjectName,
  scores,
  round2Scores,
  isClassView = false,
  selectedRound: controlledRound,
  onRoundChange,
}: SelfregResultOverviewProps) => {
  const [internalRound, setInternalRound] = useState<ResultRound>(1);
  const [activeDomain, setActiveDomain] = useState<SelfregCategory>('동기전략');
  const selectedRound = controlledRound ?? internalRound;
  const currentScores = selectedRound === 2 && round2Scores ? round2Scores : scores;
  const domain = SELFREG_DOMAIN_STRUCTURE.find((item) => item.id === activeDomain)!;
  const domainFactors = SELFREG_FACTOR_DEFINITIONS.filter(
    (factor) => factor.category === activeDomain,
  );
  const strengths = [...domainFactors]
    .sort((a, b) => (currentScores[b.index] ?? 50) - (currentScores[a.index] ?? 50))
    .slice(0, 3);

  const changeRound = (round: ResultRound) => {
    if (round === 2 && !round2Scores) return;
    if (onRoundChange) onRoundChange(round);
    else setInternalRound(round);
  };

  return (
    <Card>
      <Header>
        <div>
          <Title>종합 결과</Title>
          <Description>
            {subjectName}의 자기조절학습 관련 동기·인지·행동전략의{' '}
            {isClassView ? '평균 수준' : '수준'}을 확인합니다.
          </Description>
        </div>
        {isClassView && (
          <RoundSwitch aria-label='검사 회차 선택'>
            <RoundButton $active={selectedRound === 1} onClick={() => changeRound(1)}>
              1차 검사
            </RoundButton>
            <RoundButton
              $active={selectedRound === 2}
              disabled={!round2Scores}
              onClick={() => changeRound(2)}
            >
              2차 검사{!round2Scores && ' 예정'}
            </RoundButton>
          </RoundSwitch>
        )}
      </Header>
      <Tabs>
        {SELFREG_DOMAIN_STRUCTURE.map((item) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center' }}>
            {item.id !== SELFREG_DOMAIN_STRUCTURE[0].id && <TabSeparator>|</TabSeparator>}
            <Tab
              $active={activeDomain === item.id}
              $color={item.color}
              onClick={() => setActiveDomain(item.id)}
            >
              {activeDomain === item.id && <Check size={13} color={item.color} />}
              {item.name}
            </Tab>
          </div>
        ))}
      </Tabs>
      <Body>
        <OverviewLayout>
          <RadarPane>
            <SelfregRadar scores={currentScores} activeDomain={activeDomain} />
          </RadarPane>
          <DetailPane>
            <DomainIntro $color={domain.color}>
              <h4>{domain.name}이란</h4>
              <p>{domain.description}입니다.</p>
              {isClassView && (
                <Insight>
                  {subjectName}의 강점 요인은{' '}
                  {strengths.map((factor, index) => (
                    <span key={factor.name}>
                      {index > 0 && ', '}
                      <InsightFactor $color={domain.color}>{factor.name}</InsightFactor>
                    </span>
                  ))}
                  입니다.
                </Insight>
              )}
            </DomainIntro>
            <ScaleHead>
              <span>척도</span>
              <ScoreScaleHead>
                <span>
                  T점수(백분위)
                  <InfoHint aria-label='정보 보기' title='T점수와 백분위 해석 기준'>
                    <Info size={12} />
                  </InfoHint>
                </span>
                <GradeLabels>
                  <span>매우 낮음</span>
                  <span>낮음</span>
                  <span>보통</span>
                  <span>높음</span>
                  <span>매우 높음</span>
                </GradeLabels>
              </ScoreScaleHead>
            </ScaleHead>
            {domain.subCategories.flatMap((subCategory) => {
              const values = subCategory.factors.map((factor) => currentScores[factor.index] ?? 50);
              const average = Math.round(
                values.reduce((sum, value) => sum + value, 0) / values.length,
              );
              return [
                <ScoreRow key={subCategory.name}>
                  <FactorLabel>
                    {formatSubCategoryName(subCategory.name)}
                    <InfoHint aria-label='정보 보기' title='하위 요인의 평균 T점수입니다.'>
                      <Info size={12} />
                    </InfoHint>
                  </FactorLabel>
                  <Track $color={domain.color}>
                    <span style={{ width: `${scorePosition(average)}%` }}>
                      <em>
                        {average}({percentile(average)})
                      </em>
                    </span>
                  </Track>
                </ScoreRow>,
                ...subCategory.factors.map((factor) => {
                  const score = currentScores[factor.index] ?? 50;
                  return (
                    <ScoreRow key={factor.name}>
                      <FactorLabel $sub>
                        · {factor.name}
                        <InfoHint
                          aria-label='정보 보기'
                          title={SELFREG_FACTOR_DEFINITIONS_TEXT[factor.name]}
                        >
                          <Info size={12} />
                        </InfoHint>
                      </FactorLabel>
                      <Track $color={domain.color}>
                        <span style={{ width: `${scorePosition(score)}%`, opacity: 0.45 }}>
                          <em>
                            {score}({percentile(score)})
                          </em>
                        </span>
                      </Track>
                    </ScoreRow>
                  );
                }),
              ];
            })}
          </DetailPane>
        </OverviewLayout>
      </Body>
    </Card>
  );
};

interface SelfregProfileTableProps {
  scores: number[];
  round2Scores?: number[] | null;
  selectedRound?: ResultRound;
  showHeader?: boolean;
}

const ProfileBody = styled.div`
  padding: 0 1.5rem 1.5rem;
  overflow-x: auto;
`;

const ProfileTableWrap = styled.div`
  position: relative;
  min-width: 900px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const ProfileTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  th,
  td {
    box-sizing: border-box;
    padding: 0.25rem 0.5rem;
    border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
    text-align: center;
  }

  th:last-child,
  td:last-child {
    border-right: 0;
  }

  th {
    color: ${({ theme }) => theme.colors.gray[500]};
    font-size: 0.75rem;
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  }

  thead tr:first-of-type {
    height: 28px;
  }

  thead tr:last-of-type {
    height: 20px;
  }

  tbody tr {
    height: 32px;
  }
`;

const ProfileScaleLabels = styled.div`
  display: grid;
  grid-template-columns: 30% 10% 20% 10% 30%;
  align-items: center;
  height: 1.75rem;

  span {
    color: ${({ theme }) => theme.colors.gray[500]};
    font-size: 0.625rem;
    font-weight: 400;
  }

  span + span {
    border-left: 1px solid ${({ theme }) => theme.colors.gray[100]};
  }
`;

const ProfileTicks = styled.div`
  position: relative;
  height: 1.25rem;

  span {
    position: absolute;
    top: 50%;
    color: ${({ theme }) => theme.colors.gray[400]};
    font-size: 0.625rem;
    transform: translate(-50%, -50%);
  }
`;

const LinearCell = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, transparent 0 40%, #e5e7eb 40% 60%, transparent 60% 100%);
`;

const SummaryBar = styled.span<{ $color: string }>`
  position: absolute;
  inset: 4px auto 4px 0;
  border-radius: 0 0.25rem 0.25rem 0;
  background: ${({ $color }) => $color};
`;

const PROFILE_ROW_HEIGHT = 32;
const PROFILE_HEADER_HEIGHT = 56;
const PROFILE_LABEL_WIDTH = 320;
const PROFILE_ROWS = SELFREG_DOMAIN_STRUCTURE.flatMap((domain) => [
  { type: 'summary' as const, domain: domain.id },
  ...domain.subCategories.flatMap((subCategory) =>
    subCategory.factors.map((factor) => ({
      type: 'factor' as const,
      domain: domain.id,
      factorIndex: factor.index,
    })),
  ),
]);

export const SelfregProfileTable = ({
  scores,
  round2Scores,
  selectedRound = 1,
  showHeader = true,
}: SelfregProfileTableProps) => {
  const chartAreaRef = useRef<HTMLTableCellElement>(null);
  const [chartAreaWidth, setChartAreaWidth] = useState(0);

  useEffect(() => {
    const chartArea = chartAreaRef.current;
    if (!chartArea) return;

    const updateWidth = () => setChartAreaWidth(chartArea.offsetWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(chartArea);
    return () => observer.disconnect();
  }, []);

  const makeProfileLines = (profileScores: number[]) =>
    SELFREG_DOMAIN_STRUCTURE.map((domain) => ({
      domain,
      points: PROFILE_ROWS.flatMap((row, rowIndex) => {
        if (row.type !== 'factor' || row.domain !== domain.id) return [];
        return [
          {
            x: profilePosition(profileScores[row.factorIndex] ?? 50),
            y: rowIndex * PROFILE_ROW_HEIGHT + PROFILE_ROW_HEIGHT / 2,
          },
        ];
      }),
    }));

  const firstProfileLines = useMemo(() => makeProfileLines(scores), [scores]);
  const secondProfileLines = useMemo(
    () => (round2Scores ? makeProfileLines(round2Scores) : []),
    [round2Scores],
  );
  const currentProfileLines =
    selectedRound === 2 && round2Scores ? secondProfileLines : firstProfileLines;

  return (
    <Card>
      {showHeader && (
        <Header style={{ paddingBottom: '1rem' }}>
          <div>
            <Title>종합 해석</Title>
            <Description>전체 요인의 T점수를 선형 눈금으로 비교합니다</Description>
          </div>
        </Header>
      )}
      <ProfileBody>
        <ProfileTableWrap>
          <ProfileTable>
            <colgroup>
              <col style={{ width: '96px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '104px' }} />
              <col />
              <col style={{ width: '56px' }} />
              <col style={{ width: '56px' }} />
              <col style={{ width: '56px' }} />
            </colgroup>
            <thead>
              <tr>
                <th colSpan={3} rowSpan={2} style={{ background: '#F9FAFB' }}>
                  영역
                </th>
                <th style={{ padding: 0, background: '#F9FAFB' }}>
                  <ProfileScaleLabels>
                    <span>매우 낮음</span>
                    <span>낮음</span>
                    <span>보통</span>
                    <span>높음</span>
                    <span>매우 높음</span>
                  </ProfileScaleLabels>
                </th>
                <th rowSpan={2} style={{ background: '#F9FAFB' }}>
                  1차
                </th>
                <th rowSpan={2} style={{ background: '#F9FAFB' }}>
                  2차
                </th>
                <th rowSpan={2} style={{ background: '#F9FAFB' }}>
                  변화
                </th>
              </tr>
              <tr>
                <th style={{ padding: 0, background: '#F9FAFB' }}>
                  <ProfileTicks>
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((tick) => (
                      <span key={tick} style={{ left: `${tick}%` }}>
                        {tick}
                      </span>
                    ))}
                  </ProfileTicks>
                </th>
              </tr>
            </thead>
            <tbody>
              {SELFREG_DOMAIN_STRUCTURE.flatMap((domain) => {
                const factors = SELFREG_FACTOR_DEFINITIONS.filter(
                  (factor) => factor.category === domain.id,
                );
                const subCategoryCounts = new Map<string, number>();
                factors.forEach((factor) =>
                  subCategoryCounts.set(
                    factor.subCategory,
                    (subCategoryCounts.get(factor.subCategory) ?? 0) + 1,
                  ),
                );
                const average = Math.round(
                  factors.reduce((sum, factor) => sum + (scores[factor.index] ?? 50), 0) /
                    factors.length,
                );
                const round2Average = round2Scores
                  ? Math.round(
                      factors.reduce((sum, factor) => sum + (round2Scores[factor.index] ?? 50), 0) /
                        factors.length,
                    )
                  : null;
                return [
                  <tr key={`${domain.id}-summary`} style={{ background: '#F9FAFB' }}>
                    <td
                      rowSpan={factors.length + 1}
                      style={{
                        background: domain.color,
                        color: '#FFFFFF',
                        fontWeight: 700,
                      }}
                    >
                      {domain.name}
                    </td>
                    <td colSpan={2} style={{ fontWeight: 600 }}>
                      종합
                    </td>
                    <td
                      ref={domain.id === SELFREG_DOMAIN_STRUCTURE[0].id ? chartAreaRef : undefined}
                      style={{ position: 'relative', padding: 0 }}
                    >
                      <LinearCell>
                        <SummaryBar
                          $color={domain.color}
                          style={{
                            width: `${profilePosition(selectedRound === 2 && round2Average != null ? round2Average : average)}%`,
                          }}
                        />
                      </LinearCell>
                    </td>
                    <td>{average}</td>
                    <td>{round2Average ?? '-'}</td>
                    <td>
                      {round2Average == null
                        ? '-'
                        : round2Average - average > 0
                          ? `+${round2Average - average}`
                          : round2Average - average}
                    </td>
                  </tr>,
                  ...factors.map((factor, index) => {
                    const first = scores[factor.index] ?? 50;
                    const second = round2Scores?.[factor.index];
                    const isFirstSubCategory =
                      index === 0 || factors[index - 1]?.subCategory !== factor.subCategory;
                    return (
                      <tr key={factor.name}>
                        {isFirstSubCategory && (
                          <td
                            rowSpan={subCategoryCounts.get(factor.subCategory)}
                            style={{ color: '#4B5563' }}
                          >
                            {formatSubCategoryName(factor.subCategory)}
                          </td>
                        )}
                        <td>{factor.name}</td>
                        <td style={{ position: 'relative', padding: 0 }}>
                          <LinearCell />
                        </td>
                        <td>{first}</td>
                        <td>{second ?? '-'}</td>
                        <td>
                          {second == null
                            ? '-'
                            : second - first > 0
                              ? `+${second - first}`
                              : second - first}
                        </td>
                      </tr>
                    );
                  }),
                ];
              })}
            </tbody>
          </ProfileTable>
          {chartAreaWidth > 0 && (
            <svg
              aria-hidden='true'
              style={{
                position: 'absolute',
                top: PROFILE_HEADER_HEIGHT,
                left: PROFILE_LABEL_WIDTH,
                width: chartAreaWidth,
                height: PROFILE_ROWS.length * PROFILE_ROW_HEIGHT,
                overflow: 'visible',
                pointerEvents: 'none',
              }}
            >
              {selectedRound === 2 &&
                round2Scores &&
                firstProfileLines.map(({ domain, points }) => (
                  <g key={`first-${domain.id}`}>
                    <polyline
                      points={points
                        .map(({ x, y }) => `${(x / 100) * chartAreaWidth},${y}`)
                        .join(' ')}
                      fill='none'
                      stroke='#D1D5DB'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    {points.map(({ x, y }, index) => (
                      <circle
                        key={index}
                        cx={(x / 100) * chartAreaWidth}
                        cy={y}
                        r='3.5'
                        fill='#D1D5DB'
                        stroke='#FFFFFF'
                        strokeWidth='1.5'
                      />
                    ))}
                  </g>
                ))}
              {currentProfileLines.map(({ domain, points }) => (
                <g key={domain.id}>
                  <polyline
                    points={points
                      .map(({ x, y }) => `${(x / 100) * chartAreaWidth},${y}`)
                      .join(' ')}
                    fill='none'
                    stroke={domain.color}
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  {points.map(({ x, y }, index) => (
                    <circle
                      key={index}
                      cx={(x / 100) * chartAreaWidth}
                      cy={y}
                      r='5'
                      fill={domain.color}
                      stroke='#FFFFFF'
                      strokeWidth='2'
                    />
                  ))}
                </g>
              ))}
            </svg>
          )}
        </ProfileTableWrap>
      </ProfileBody>
    </Card>
  );
};
