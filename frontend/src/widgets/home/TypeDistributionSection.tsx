// frontend/src/widgets/home/TypeDistributionSection.tsx
import styled from '@emotion/styled';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card } from '@shared/components';
import { useHomeClassStats } from '@features/home/model/useHomeClassStats';
import {
  aggregateTypeDistributionByRound,
  type RoundTypeCounts,
} from '@features/home/utils/aggregateTypeDistributionByRound';
import type { StudentType } from '@shared/types';

const ELEMENTARY_ORDER: StudentType[] = ['자원소진형', '안전 균형형', '몰입자원 풍부형'];
const MIDDLE_ORDER: StudentType[] = ['냉소적 무기력형', '정서조절 취약형', '자기주도 몰입형'];

type TypeColorKey = 'warning' | 'balance' | 'caution' | 'excellent';

const TYPE_COLOR_KEY: Record<string, TypeColorKey> = {
  자원소진형: 'warning',
  '안전 균형형': 'balance',
  '몰입자원 풍부형': 'excellent',
  '냉소적 무기력형': 'warning',
  '정서조절 취약형': 'caution',
  '자기주도 몰입형': 'excellent',
};

const typeOrderFor = (types: { name: StudentType; count: number }[]): StudentType[] =>
  types.some((t) => MIDDLE_ORDER.includes(t.name)) ? MIDDLE_ORDER : ELEMENTARY_ORDER;

const SectionWrapper = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: ${({ theme }) => theme.colors.gray[500]};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  }
`;

const ClassName = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  white-space: nowrap;
`;

const BarTrack = styled.div`
  display: flex;
  height: 28px;
  min-width: 200px;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const BarSegment = styled.div<{ $percentage: number; $colorKey: TypeColorKey }>`
  width: ${({ $percentage }) => `${$percentage}%`};
  background: ${({ theme, $colorKey }) => theme.colors.type[$colorKey]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const NotTakenBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  min-width: 200px;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const Legend = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Dot = styled.span<{ $colorKey: TypeColorKey }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $colorKey }) => theme.colors.type[$colorKey]};
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: 6px 12px;
  color: ${({ theme }) => theme.colors.primary[700]};
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
`;

const DistributionBar = ({ round }: { round: RoundTypeCounts }) => {
  if (!round.types) {
    return <NotTakenBadge>검사 미실시</NotTakenBadge>;
  }
  const order = typeOrderFor(round.types);
  const total = round.types.reduce((sum, t) => sum + t.count, 0);
  if (total === 0) {
    return <NotTakenBadge>검사 미실시</NotTakenBadge>;
  }

  return (
    <BarTrack>
      {order.map((typeName) => {
        const found = round.types!.find((t) => t.name === typeName);
        if (!found || found.count === 0) return null;
        const percentage = Math.round((found.count / total) * 100);
        return (
          <BarSegment
            key={typeName}
            $percentage={percentage}
            $colorKey={TYPE_COLOR_KEY[typeName]}
            title={`${typeName}: ${found.count}명 (${percentage}%)`}
          >
            {percentage > 12 && `${found.count}명`}
          </BarSegment>
        );
      })}
    </BarTrack>
  );
};

export const TypeDistributionSection = () => {
  const { classes, isLoading, error, refetch } = useHomeClassStats();

  if (isLoading) {
    return (
      <SectionWrapper>
        <Card>
          <CenterBox>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </CenterBox>
        </Card>
      </SectionWrapper>
    );
  }

  if (error) {
    return (
      <SectionWrapper>
        <Card>
          <CenterBox style={{ flexDirection: 'column' }}>
            <p style={{ margin: 0 }}>학생 유형 분포를 불러오지 못했습니다.</p>
            <RetryButton onClick={refetch}>
              <RefreshCw size={14} /> 다시 시도
            </RetryButton>
          </CenterBox>
        </Card>
      </SectionWrapper>
    );
  }

  if (classes.length === 0) {
    return null;
  }

  const rows = aggregateTypeDistributionByRound(classes);
  const allTypes = new Set<StudentType>();
  rows.forEach((row) => {
    [row.round1, row.round2].forEach((r) => r.types?.forEach((t) => allTypes.add(t.name)));
  });

  return (
    <SectionWrapper>
      <Card>
        <Title>학생 유형 분포</Title>
        <Subtitle>반별 LPA 유형 비교</Subtitle>
        <Table>
          <thead>
            <tr>
              <th>반</th>
              <th>1차 검사</th>
              <th>2차 검사</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.classId}>
                <td>
                  <ClassName>{row.className}</ClassName>
                </td>
                <td>
                  <DistributionBar round={row.round1} />
                </td>
                <td>
                  <DistributionBar round={row.round2} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Legend>
          {Array.from(allTypes).map((typeName) => (
            <LegendItem key={typeName}>
              <Dot $colorKey={TYPE_COLOR_KEY[typeName]} />
              {typeName}
            </LegendItem>
          ))}
        </Legend>
      </Card>
    </SectionWrapper>
  );
};
