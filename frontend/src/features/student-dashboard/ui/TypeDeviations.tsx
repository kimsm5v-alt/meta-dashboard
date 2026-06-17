import type React from 'react';
import styled from '@emotion/styled';
import { FACTOR_DEFINITIONS } from '../../../shared/data/factors';
import type { Weakness } from '../../../shared/services/dashboardService';

interface Strength {
  factorName: string;
  factorType: 'positive' | 'negative';
  individualT: number;
  groupT: number;
  deviation: number;
  direction: 'positive' | 'negative';
}

const Container = styled.div``;

const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TitleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const SectionTitle = styled.div<{ $type: 'strength' | 'weakness' }>`
  font-size: 0.875rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ $type }) => ($type === 'strength' ? '#dcfce7' : '#fee2e2')};
  color: ${({ $type }) => ($type === 'strength' ? '#166534' : '#991b1b')};
  width: fit-content;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const Card = styled.div<{ $type: 'strength' | 'weakness' }>`
  padding: 1rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ $type }) => ($type === 'strength' ? '#f0fdf4' : '#fef2f2')};
  border: 1px solid ${({ $type }) => ($type === 'strength' ? '#bbf7d0' : '#fecaca')};
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const CategoryTag = styled.div<{ $type: 'strength' | 'weakness' }>`
  display: inline-block;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $type }) => ($type === 'strength' ? '#dcfce7' : '#fee2e2')};
  color: ${({ $type }) => ($type === 'strength' ? '#166534' : '#991b1b')};
  margin-bottom: 0.5rem;
`;

const FactorName = styled.h4`
  font-size: 1rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: 1.5;
`;


interface TypeDeviationsProps {
  strengths?: Strength[];
  weaknesses?: Weakness[];
}

export const TypeDeviations: React.FC<TypeDeviationsProps> = ({ strengths, weaknesses }) => {
  // FACTOR_DEFINITIONS에서 카테고리 정보 찾기 (띄어쓰기 무시)
  const getFactorInfo = (factorName: string) => {
    const normalized = factorName.replace(/\s+/g, ''); // 공백 제거
    const factor = FACTOR_DEFINITIONS.find((f) => f.name.replace(/\s+/g, '') === normalized);
    return factor;
  };

  // 강점/약점이 모두 없으면 null 반환
  if ((!strengths || strengths.length === 0) && (!weaknesses || weaknesses.length === 0)) {
    return null;
  }

  return (
    <Container>
      <SectionWrapper>
        {/* 타이틀 그리드 */}
        <TitleGrid>
          <SectionTitle $type="strength" style={{ gridColumn: '1 / 4' }}>강점 TOP 3</SectionTitle>
          <SectionTitle $type="weakness" style={{ gridColumn: '4 / 7' }}>약점 TOP 3</SectionTitle>
        </TitleGrid>

        {/* 강점/약점 카드 한 줄에 표시 */}
        <Grid>
          {/* 강점 TOP 3 */}
          {strengths && strengths.length > 0 && strengths.map((item, idx) => {
            const factorInfo = getFactorInfo(item.factorName);
            return (
              <Card key={`strength-${idx}`} $type="strength">
                {factorInfo && (
                  <CategoryTag $type="strength">#{factorInfo.category}</CategoryTag>
                )}
                <FactorName>{item.factorName}</FactorName>
                <Description>
                  학년 평균보다 상위하는 강점입니다
                </Description>
              </Card>
            );
          })}

          {/* 약점 TOP 3 */}
          {weaknesses && weaknesses.length > 0 && weaknesses.map((item, idx) => {
            const factorInfo = getFactorInfo(item.factorName);
            return (
              <Card key={`weakness-${idx}`} $type="weakness">
                {factorInfo && (
                  <CategoryTag $type="weakness">#{factorInfo.category}</CategoryTag>
                )}
                <FactorName>{item.factorName}</FactorName>
                <Description>
                  학년 평균보다 보완이 필요한 영역입니다
                </Description>
              </Card>
            );
          })}
        </Grid>
      </SectionWrapper>
    </Container>
  );
};

export default TypeDeviations;
