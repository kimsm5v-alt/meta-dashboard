import type React from 'react';
import styled from '@emotion/styled';
import { getTypeDeviations } from '../../../shared/utils/lpaClassifier';
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

const CoachingButton = styled.button`
  width: 100%;
  padding: 0.75rem ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.lg};
  transition: background-color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

interface TypeDeviationsProps {
  tScores: number[];
  predictedType: StudentType;
  schoolLevel: SchoolLevel;
  onCoachingClick?: () => void;
}

export const TypeDeviations: React.FC<TypeDeviationsProps> = ({
  tScores,
  predictedType,
  schoolLevel,
  onCoachingClick,
}) => {
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

      {onCoachingClick && (
        <CoachingButton onClick={onCoachingClick}>
          <span>코칭 전략 보기</span>
          <span>→</span>
        </CoachingButton>
      )}
    </Container>
  );
};

export default TypeDeviations;
