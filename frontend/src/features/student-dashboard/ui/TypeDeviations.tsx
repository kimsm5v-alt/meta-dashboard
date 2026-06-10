import type React from 'react';
import { useMemo } from 'react';
import styled from '@emotion/styled';
import { getTypeDeviations } from '../../../shared/utils/lpaClassifier';
import { FACTOR_DEFINITIONS } from '../../../shared/data/factors';
import type { StudentType, SchoolLevel } from '../../../shared/types';

const Container = styled.div``;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SummaryBox = styled.div`
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SummaryText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.625;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  transition: box-shadow 0.15s ease;
  text-align: center;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const IconWrapper = styled.div`
  margin-bottom: 0.5rem;
`;

const RedTriangle = styled.svg`
  width: 32px;
  height: 32px;
  color: #ef4444;
`;

const BlueTriangle = styled.svg`
  width: 32px;
  height: 32px;
  color: #3b82f6;
`;

const FactorName = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: 0.25rem;
`;

const DiffValue = styled.span<{ $isPositive: boolean }>`
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: 0.5rem;
  color: ${({ $isPositive }) => ($isPositive ? '#dc2626' : '#2563eb')};
`;

const ScoreDetails = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const CompareGrid = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

const CompareCard = styled.div<{ $improved: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid;
  transition: box-shadow 0.15s ease;
  text-align: center;
  ${({ $improved }) =>
    $improved
      ? 'background: #f0fdf4; border-color: #bbf7d0;'
      : 'background: #fef2f2; border-color: #fecaca;'}

  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
`;

const CompareArrow = styled.div<{ $improved: boolean }>`
  font-size: 1.875rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: ${({ $improved }) => ($improved ? '#16A34A' : '#DC2626')};
`;

const CompareFactor = styled.div`
  font-size: 1rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.25rem;
`;

const CompareDiff = styled.div<{ $improved: boolean }>`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: ${({ $improved }) => ($improved ? '#16A34A' : '#DC2626')};
`;

const CompareDetail = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const CompareBadge = styled.div<{ $improved: boolean }>`
  margin-top: 0.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  ${({ $improved }) =>
    $improved
      ? 'background: #dcfce7; color: #166534;'
      : 'background: #fee2e2; color: #991b1b;'}
`;

interface RoundChangeItem {
  factor: string;
  round1Score: number;
  round2Score: number;
  diff: number;
  absDiff: number;
  isImproved: boolean;
}

interface TypeDeviationsProps {
  tScores: number[];
  predictedType: StudentType;
  schoolLevel: SchoolLevel;
  isCompare?: boolean;
  prevTScores?: number[];
}

export const TypeDeviations: React.FC<TypeDeviationsProps> = ({
  tScores,
  predictedType,
  schoolLevel,
  isCompare = false,
  prevTScores,
}) => {
  const roundChanges = useMemo<RoundChangeItem[]>(() => {
    if (!isCompare || !prevTScores || prevTScores.length !== tScores.length) return [];
    return FACTOR_DEFINITIONS.map((factor, idx) => {
      const round1Score = Math.round(prevTScores[idx]);
      const round2Score = Math.round(tScores[idx]);
      const diff = round2Score - round1Score;
      return {
        factor: factor.name,
        round1Score,
        round2Score,
        diff,
        absDiff: Math.abs(diff),
        isImproved: factor.isPositive ? diff > 0 : diff < 0,
      };
    })
      .filter((c) => c.absDiff >= 3)
      .sort((a, b) => b.absDiff - a.absDiff)
      .slice(0, 3);
  }, [isCompare, prevTScores, tScores]);

  if (isCompare) {
    if (roundChanges.length === 0) {
      return <SummaryBox><SummaryText>1차와 2차 사이에 큰 변화가 없습니다.</SummaryText></SummaryBox>;
    }
    return (
      <CompareGrid>
        {roundChanges.map((item, i) => (
          <CompareCard key={i} $improved={item.isImproved}>
            <CompareArrow $improved={item.isImproved}>{item.diff > 0 ? '↑' : '↓'}</CompareArrow>
            <CompareFactor>{item.factor}</CompareFactor>
            <CompareDiff $improved={item.isImproved}>
              {item.diff > 0 ? '+' : ''}{item.diff}
            </CompareDiff>
            <CompareDetail>1차 T={item.round1Score} → 2차 T={item.round2Score}</CompareDetail>
            <CompareBadge $improved={item.isImproved}>{item.isImproved ? '개선' : '주의'}</CompareBadge>
          </CompareCard>
        ))}
      </CompareGrid>
    );
  }

  let deviations: ReturnType<typeof getTypeDeviations> = [];

  try {
    deviations = getTypeDeviations(tScores, predictedType, schoolLevel, 3);
  } catch {
    // 유형 특이점 추출 실패 시 빈 배열 유지
  }

  if (deviations.length === 0) {
    return null;
  }

  const generateDeviationText = () => {
    // 받침 유무에 따른 조사 선택 ('이/가')
    const getSubjectParticle = (word: string) => {
      const lastChar = word.charAt(word.length - 1);
      const lastCharCode = lastChar.charCodeAt(0);
      // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
      if (lastCharCode >= 0xac00 && lastCharCode <= 0xd7a3) {
        // 받침 유무: (코드 - 0xAC00) % 28 === 0 이면 받침 없음
        const hasFinalConsonant = (lastCharCode - 0xac00) % 28 !== 0;
        return hasFinalConsonant ? '이' : '가';
      }
      return '이'; // 한글이 아닌 경우 기본값
    };

    const parts: string[] = [];
    const lastIndex = deviations.length - 1;

    deviations.forEach((dev, index) => {
      const particle = getSubjectParticle(dev.factor);
      const sign = dev.diff > 0 ? '+' : '';

      if (index === lastIndex) {
        // 마지막 항목: "~입니다"로 종결
        const direction = dev.diff > 0 ? '높습니다' : '낮습니다';
        parts.push(`${dev.factor}${particle} 특히 ${direction} (${sign}${dev.diff})`);
      } else {
        // 중간 항목: "~고"로 연결
        const direction = dev.diff > 0 ? '높고' : '낮고';
        parts.push(`${dev.factor}${particle} 특히 ${direction} (${sign}${dev.diff})`);
      }
    });

    return `같은 ${predictedType} 학생들에 비해 ${parts.join(', ')}.`;
  };

  return (
    <Container>
      <Title>유형별 특이점</Title>

      <SummaryBox>
        <SummaryText>{generateDeviationText()}</SummaryText>
      </SummaryBox>

      <Grid>
        {deviations.map((dev, i) => (
          <Card key={i}>
            <IconWrapper>
              {dev.diff > 0 ? (
                <RedTriangle width='32' height='32' viewBox='0 0 32 32'>
                  <path
                    d='M16 6 C16 6, 16 6, 16 6 L28 24 C28 24, 28 25, 27 25 L5 25 C4 25, 4 24, 4 24 L16 6 Z'
                    fill='currentColor'
                    strokeLinejoin='round'
                  />
                </RedTriangle>
              ) : (
                <BlueTriangle width='32' height='32' viewBox='0 0 32 32'>
                  <path
                    d='M16 26 C16 26, 16 26, 16 26 L4 8 C4 8, 4 7, 5 7 L27 7 C28 7, 28 8, 28 8 L16 26 Z'
                    fill='currentColor'
                    strokeLinejoin='round'
                  />
                </BlueTriangle>
              )}
            </IconWrapper>
            <FactorName>{dev.factor}</FactorName>
            <DiffValue $isPositive={dev.diff > 0}>
              {dev.diff > 0 ? '+' : ''}
              {dev.diff}
            </DiffValue>
            <ScoreDetails>
              학생 T={dev.studentScore} / 유형평균 T={dev.typeMean}
            </ScoreDetails>
          </Card>
        ))}
      </Grid>

    </Container>
  );
};

export default TypeDeviations;
