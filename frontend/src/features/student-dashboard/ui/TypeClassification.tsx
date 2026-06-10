import styled from '@emotion/styled';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TYPE_COLORS } from '../../../shared/data/lpaProfiles';
import { getTypeInfo } from '../../../shared/utils/lpaClassifier';
import type { StudentType, SchoolLevel } from '../../../shared/types';

const Container = styled.div``;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
`;

const ChartSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  @media (min-width: 768px) {
    grid-column: span 2;
  }
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 18rem;
`;

const InfoSection = styled.div`
  @media (min-width: 768px) {
    grid-column: span 3;
  }
`;

const InfoCard = styled.div`
  background: linear-gradient(to bottom right, #eff6ff, #eef2ff);
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid #bfdbfe;
`;

const TypeBadgeWrapper = styled.div`
  text-align: center;
  margin-bottom: 0.75rem;
`;

const TypeBadge = styled.div<{ $bgColor: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ $bgColor }) => $bgColor};
  color: #ffffff;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: 1.25rem;
  line-height: 1.75rem;
  margin-bottom: 0.5rem;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const TypeName = styled.h4`
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DetailBox = styled.div`
  background: rgba(255, 255, 255, 0.6);
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.75rem;
`;

const DetailTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: #4338ca;
  margin-bottom: 0.25rem;
`;

const DetailText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[800]};
  line-height: 1.625;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const CharacteristicsList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CharacteristicItem = styled.li`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[800]};
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Bullet = styled.span`
  color: ${({ theme }) => theme.colors.primary[500]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  flex-shrink: 0;
`;

interface TypeClassificationProps {
  predictedType: StudentType;
  typeProbabilities: Record<string, number>;
  schoolLevel: SchoolLevel;
  showCompare?: boolean;
  prevType?: StudentType;
  prevTypeProbabilities?: Record<string, number>;
}

// ============================================================
// 차수 비교 서브 컴포넌트
// ============================================================

const TYPE_ORDER = ['자원소진형', '안전 균형형', '몰입자원 풍부형'];

const CompareWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding-bottom: 1.5rem;
`;

const ArrowWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ArrowText = styled.div`
  font-size: 1.875rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const ChangeBadge = styled.span<{ $changed: boolean }>`
  margin-top: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  ${({ $changed }) =>
    $changed
      ? 'background: #fef3c7; color: #b45309;'
      : 'background: #dcfce7; color: #166534;'}
`;

const DonutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const DonutLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 0.5rem;
`;

const DonutLegend = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.625rem;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const LegendDot = styled.span<{ $color: string }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  display: inline-block;
`;

interface LpaDonutMiniProps {
  type: StudentType;
  probs: Record<string, number>;
  label: string;
}

function LpaDonutMini({ type, probs, label }: LpaDonutMiniProps) {
  const size = 160;
  const sw = 24;
  const r = (size - sw) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  const sortedData = TYPE_ORDER.map((t) => ({
    type: t,
    prob: probs[t] || 0,
    color: TYPE_COLORS[t] || '#9CA3AF',
  }));

  let acc = 0;
  const segments = sortedData.map((d) => {
    const seg = { ...d, offset: acc };
    acc += d.prob;
    return seg;
  });

  const topColor = TYPE_COLORS[type] || '#6B7280';

  return (
    <DonutWrapper>
      <DonutLabel>{label}</DonutLabel>
      <svg width={size} height={size}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {segments.map((seg) => (
            <circle
              key={seg.type}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={sw}
              strokeDasharray={`${(circ * seg.prob) / 100} ${circ}`}
              strokeDashoffset={(-circ * seg.offset) / 100}
            />
          ))}
        </g>
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#6B7280">
          {Math.round(probs[type] || 0)}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={12} fontWeight={800} fill={topColor}>
          {type}
        </text>
      </svg>
      <DonutLegend>
        {sortedData.map((d) => (
          <LegendItem key={d.type}>
            <LegendDot $color={d.color} />
            {d.type}
            <span style={{ color: '#9CA3AF' }}>{Math.round(d.prob)}%</span>
          </LegendItem>
        ))}
      </DonutLegend>
    </DonutWrapper>
  );
}

interface LpaCompareViewProps {
  prevType: StudentType;
  prevProbs: Record<string, number>;
  currType: StudentType;
  currProbs: Record<string, number>;
}

function LpaCompareView({ prevType, prevProbs, currType, currProbs }: LpaCompareViewProps) {
  return (
    <CompareWrapper>
      <LpaDonutMini type={prevType} probs={prevProbs} label="1차 검사" />
      <ArrowWrapper>
        <ArrowText>→</ArrowText>
        <ChangeBadge $changed={prevType !== currType}>
          {prevType !== currType ? '유형 변화' : '유형 유지'}
        </ChangeBadge>
      </ArrowWrapper>
      <LpaDonutMini type={currType} probs={currProbs} label="2차 검사" />
    </CompareWrapper>
  );
}

// ============================================================

export const TypeClassification: React.FC<TypeClassificationProps> = ({
  predictedType,
  typeProbabilities,
  schoolLevel,
  showCompare = false,
  prevType,
  prevTypeProbabilities,
}) => {
  const typeInfo = getTypeInfo(predictedType, schoolLevel);

  if (showCompare && prevType && prevTypeProbabilities) {
    return (
      <LpaCompareView
        prevType={prevType}
        prevProbs={prevTypeProbabilities}
        currType={predictedType}
        currProbs={typeProbabilities}
      />
    );
  }

  const chartData = Object.entries(typeProbabilities)
    .map(([type, prob]) => ({
      name: type,
      value: Math.round(prob * 10) / 10,
      color: TYPE_COLORS[type] || '#9CA3AF',
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <Container>
      <Title>학습 유형 분류</Title>

      <Grid>
        {/* 좌측: 도넛 그래프 (40%) */}
        <ChartSection>
          <ChartWrapper>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient
                      key={`gradient-${index}`}
                      id={`gradient-${index}`}
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='0%' stopColor={entry.color} stopOpacity={0.9} />
                      <stop offset='100%' stopColor={entry.color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={chartData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={false}
                  innerRadius='45%'
                  outerRadius='75%'
                  fill='#8884d8'
                  dataKey='value'
                  paddingAngle={2}
                  cornerRadius={4}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#gradient-${index})`}
                      stroke='white'
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${value ?? 0}%`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend
                  layout='horizontal'
                  verticalAlign='bottom'
                  align='center'
                  formatter={(value: string, entry) =>
                    `${value} ${(entry as { payload?: { value: number } }).payload?.value ?? 0}%`
                  }
                  iconType='circle'
                  iconSize={10}
                  wrapperStyle={{ fontSize: '12px', lineHeight: '1.8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </ChartSection>

        {/* 우측: 유형 정보 (60%) */}
        <InfoSection>
          <InfoCard>
            <TypeBadgeWrapper>
              <TypeBadge $bgColor={TYPE_COLORS[predictedType]}>
                {Math.round(typeProbabilities[predictedType] || 0)}%
              </TypeBadge>
              <TypeName>{predictedType}</TypeName>
            </TypeBadgeWrapper>
            {typeInfo && (
              <DetailsList>
                <DetailBox>
                  <DetailTitle>📋 유형 설명</DetailTitle>
                  <DetailText>{typeInfo.description}</DetailText>
                </DetailBox>
                {typeInfo.characteristics && typeInfo.characteristics.length > 0 && (
                  <DetailBox>
                    <DetailTitle>✨ 주요 특성</DetailTitle>
                    <CharacteristicsList>
                      {typeInfo.characteristics.map((char, i) => (
                        <CharacteristicItem key={i}>
                          <Bullet>•</Bullet>
                          <span>{char}</span>
                        </CharacteristicItem>
                      ))}
                    </CharacteristicsList>
                  </DetailBox>
                )}
              </DetailsList>
            )}
          </InfoCard>
        </InfoSection>
      </Grid>
    </Container>
  );
};

export default TypeClassification;
