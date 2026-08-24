import { useState } from 'react';
import styled from '@emotion/styled';
import { Info } from 'lucide-react';
import {
  SELFREG_DOMAIN_STRUCTURE,
  SELFREG_FACTOR_DEFINITIONS,
  type SelfregCategory,
} from '@shared/data/selfregFactors';

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
  padding: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
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
  gap: 1rem;
  padding: 1rem 1.5rem 0;
`;

const Tab = styled.button<{ $active: boolean; $color: string }>`
  position: relative;
  padding: 0 0 0.75rem;
  border: 0;
  background: transparent;
  color: ${({ $active, theme }) => ($active ? theme.colors.gray[900] : theme.colors.gray[500])};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.fontWeight.bold : theme.typography.fontWeight.medium};
  cursor: pointer;

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

const Body = styled.div`
  padding: 1.25rem 1.5rem 1.5rem;
`;

const DomainIntro = styled.div<{ $color: string }>`
  margin-bottom: 1rem;
  padding: 1rem;
  border-left: 4px solid ${({ $color }) => $color};
  border-radius: 0.5rem;
  background: ${({ $color }) => `${$color}12`};

  h4 {
    margin: 0 0 0.375rem;
    color: ${({ theme }) => theme.colors.gray[900]};
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

const ScaleHead = styled.div`
  display: grid;
  grid-template-columns: minmax(9rem, 1.2fr) minmax(24rem, 4fr) 5.5rem;
  align-items: end;
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 0.75rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const GradeLabels = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  text-align: center;
`;

const ScoreRow = styled.div`
  display: grid;
  grid-template-columns: minmax(9rem, 1.2fr) minmax(24rem, 4fr) 5.5rem;
  align-items: center;
  min-height: 2.75rem;
  padding: 0 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const FactorLabel = styled.div<{ $sub?: boolean }>`
  padding-left: ${({ $sub }) => ($sub ? '1rem' : 0)};
  color: ${({ $sub, theme }) => ($sub ? theme.colors.gray[600] : theme.colors.gray[800])};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ $sub, theme }) =>
    $sub ? theme.typography.fontWeight.normal : theme.typography.fontWeight.semibold};
`;

const Track = styled.div<{ $color: string }>`
  position: relative;
  height: 0.625rem;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    #f3f4f6 0 20%,
    #e5e7eb 20% 40%,
    #d1fae5 40% 60%,
    #e5e7eb 60% 80%,
    #f3f4f6 80% 100%
  );

  span {
    position: absolute;
    top: 50%;
    width: 0.875rem;
    height: 0.875rem;
    border: 2px solid #fff;
    border-radius: 50%;
    background: ${({ $color }) => $color};
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.24);
    transform: translate(-50%, -50%);
  }
`;

const Score = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

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
const profilePosition = (score: number) => ((Math.max(10, Math.min(90, score)) - 10) / 80) * 100;

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
      </Header>
      <Tabs>
        {SELFREG_DOMAIN_STRUCTURE.map((item) => (
          <Tab
            key={item.id}
            $active={activeDomain === item.id}
            $color={item.color}
            onClick={() => setActiveDomain(item.id)}
          >
            {item.name}
          </Tab>
        ))}
      </Tabs>
      <Body>
        <DomainIntro $color={domain.color}>
          <h4>{domain.name}이란</h4>
          <p>{domain.description}입니다.</p>
          {isClassView && (
            <Insight>
              {subjectName}의 강점 요인은 {strengths.map((factor) => factor.name).join(', ')}{' '}
              입니다.
            </Insight>
          )}
        </DomainIntro>
        <ScaleHead>
          <span>척도</span>
          <GradeLabels>
            <span>매우 낮음</span>
            <span>낮음</span>
            <span>보통</span>
            <span>높음</span>
            <span>매우 높음</span>
          </GradeLabels>
          <span style={{ textAlign: 'right' }}>T점수(백분위)</span>
        </ScaleHead>
        {domain.subCategories.flatMap((subCategory) => {
          const values = subCategory.factors.map((factor) => currentScores[factor.index] ?? 50);
          const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
          return [
            <ScoreRow key={subCategory.name}>
              <FactorLabel>{subCategory.name}</FactorLabel>
              <Track $color={domain.color}>
                <span style={{ left: `${scorePosition(average)}%` }} />
              </Track>
              <Score>
                {average}({percentile(average)}) <Info size={13} color='#9CA3AF' />
              </Score>
            </ScoreRow>,
            ...subCategory.factors.map((factor) => {
              const score = currentScores[factor.index] ?? 50;
              return (
                <ScoreRow key={factor.name}>
                  <FactorLabel $sub>· {factor.name}</FactorLabel>
                  <Track $color={domain.color}>
                    <span style={{ left: `${scorePosition(score)}%` }} />
                  </Track>
                  <Score>
                    {score}({percentile(score)}) <Info size={13} color='#9CA3AF' />
                  </Score>
                </ScoreRow>
              );
            }),
          ];
        })}
      </Body>
    </Card>
  );
};

interface SelfregProfileTableProps {
  scores: number[];
  round2Scores?: number[] | null;
  selectedRound?: ResultRound;
}

const ProfileBody = styled.div`
  padding: 0 1.5rem 1.5rem;
  overflow-x: auto;
`;

const ProfileTable = styled.table`
  width: 100%;
  min-width: 780px;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  th,
  td {
    height: 2.5rem;
    padding: 0.375rem 0.625rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
    text-align: center;
  }

  th {
    color: ${({ theme }) => theme.colors.gray[500]};
    font-size: 0.75rem;
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  }
`;

const LinearCell = styled.div`
  position: relative;
  height: 1.125rem;
  border-radius: 0.25rem;
  background: linear-gradient(to right, transparent 0 37%, #ecfdf5 37% 63%, transparent 63% 100%);

  &::before {
    position: absolute;
    top: 50%;
    right: 0;
    left: 0;
    height: 1px;
    background: ${({ theme }) => theme.colors.gray[200]};
    content: '';
  }
`;

const LinearPoint = styled.span<{ $color: string; $muted?: boolean }>`
  position: absolute;
  top: 50%;
  width: ${({ $muted }) => ($muted ? '0.5rem' : '0.75rem')};
  height: ${({ $muted }) => ($muted ? '0.5rem' : '0.75rem')};
  border: 2px solid #fff;
  border-radius: 50%;
  background: ${({ $color, $muted }) => ($muted ? '#9CA3AF' : $color)};
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
  transform: translate(-50%, -50%);
`;

export const SelfregProfileTable = ({
  scores,
  round2Scores,
  selectedRound = 1,
}: SelfregProfileTableProps) => (
  <Card>
    <Header>
      <div>
        <Title>종합 해석</Title>
        <Description>전체 요인의 T점수를 선형 눈금으로 비교합니다</Description>
      </div>
    </Header>
    <ProfileBody>
      <ProfileTable>
        <thead>
          <tr>
            <th style={{ width: '8rem' }}>영역</th>
            <th style={{ width: '10rem' }}>요인</th>
            <th>매우 낮음 · 낮음 · 보통 · 높음 · 매우 높음</th>
            <th style={{ width: '3.5rem' }}>1차</th>
            <th style={{ width: '3.5rem' }}>2차</th>
            <th style={{ width: '3.5rem' }}>변화</th>
          </tr>
          <tr>
            <th colSpan={2} />
            <th>10 · 20 · 30 · 40 · 50 · 60 · 70 · 80 · 90</th>
            <th colSpan={3} />
          </tr>
        </thead>
        <tbody>
          {SELFREG_DOMAIN_STRUCTURE.flatMap((domain) => {
            const factors = SELFREG_FACTOR_DEFINITIONS.filter(
              (factor) => factor.category === domain.id,
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
              <tr key={`${domain.id}-summary`}>
                <td style={{ color: domain.color, fontWeight: 700 }}>{domain.name}</td>
                <td style={{ fontWeight: 600 }}>종합</td>
                <td>
                  <LinearCell>
                    <LinearPoint
                      $color={domain.color}
                      style={{
                        left: `${profilePosition(selectedRound === 2 && round2Average != null ? round2Average : average)}%`,
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
                const current = selectedRound === 2 && second != null ? second : first;
                return (
                  <tr key={factor.name}>
                    <td>
                      {index === 0 || factors[index - 1]?.subCategory !== factor.subCategory
                        ? factor.subCategory
                        : ''}
                    </td>
                    <td style={{ textAlign: 'left' }}>{factor.name}</td>
                    <td>
                      <LinearCell>
                        {selectedRound === 2 && second != null && (
                          <LinearPoint
                            $color={domain.color}
                            $muted
                            style={{ left: `${profilePosition(first)}%` }}
                          />
                        )}
                        <LinearPoint
                          $color={domain.color}
                          style={{ left: `${profilePosition(current)}%` }}
                        />
                      </LinearCell>
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
    </ProfileBody>
  </Card>
);
