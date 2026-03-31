import styled from '@emotion/styled';
import { Card } from '@shared/components';
import { CategoryComparisonChart, TypeDistributionChart } from '@features/teacher-dashboard/ui';
import type { Class } from '@shared/types';

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
`;

const ComparisonCard = styled.div`
  background: linear-gradient(to right, #eff6ff, #eef2ff);
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid #bfdbfe;
`;

const ComparisonHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ComparisonLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ComparisonIconWrapper = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(to bottom right, #3b82f6, #4f46e5);
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const ComparisonTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ComparisonSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-top: 0.125rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ClassButton = styled.button<{ $isSelected: boolean }>`
  padding: 0.625rem 1rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  transition: all 200ms ease;
  cursor: pointer;
  border: ${({ $isSelected }) => ($isSelected ? 'none' : '1px solid #e5e7eb')};
  background: ${({ $isSelected }) =>
    $isSelected ? 'linear-gradient(to right, #2563eb, #4f46e5)' : '#ffffff'};
  color: ${({ $isSelected }) => ($isSelected ? '#ffffff' : '#374155')};
  box-shadow: ${({ $isSelected }) =>
    $isSelected ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'};
  transform: ${({ $isSelected }) => ($isSelected ? 'scale(1.05)' : 'scale(1)')};

  &:hover {
    background: ${({ $isSelected }) =>
      $isSelected ? 'linear-gradient(to right, #2563eb, #4f46e5)' : '#f9fafb'};
    box-shadow: ${({ $isSelected }) =>
      $isSelected ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'};
  }
`;

const ClearButton = styled.button`
  margin-left: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background-color: #ffffff;
  color: ${({ theme }) => theme.colors.error.main};
  border: 1px solid #fecaca;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover {
    background-color: #fef2f2;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const ClearButtonContent = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ChartTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: 0.75rem;
`;

const ChartDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 1rem;
`;

interface ComparisonSectionProps {
  classes: Class[];
  selectedClassId: string | null;
  onClassSelect: (classId: string | null) => void;
}

export const ComparisonSection = ({
  classes,
  selectedClassId,
  onClassSelect,
}: ComparisonSectionProps) => (
  <div>
    <SectionTitle>반별 비교 분석</SectionTitle>

    {/* Class Selection Card */}
    <ComparisonCard>
      <ComparisonHeader>
        <ComparisonLeft>
          <ComparisonIconWrapper>
            <svg width='20' height='20' fill='none' viewBox='0 0 24 24' stroke='white'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
              />
            </svg>
          </ComparisonIconWrapper>
          <div>
            <ComparisonTitle>비교할 학급을 선택하세요</ComparisonTitle>
            <ComparisonSubtitle>선택한 학급이 그래프에서 강조 표시됩니다</ComparisonSubtitle>
          </div>
        </ComparisonLeft>
        <ButtonGroup>
          {classes.map((cls) => {
            const isSelected = selectedClassId === cls.id;
            return (
              <ClassButton
                key={cls.id}
                onClick={() => onClassSelect(isSelected ? null : cls.id)}
                $isSelected={isSelected}
              >
                {cls.grade}-{cls.classNumber}반
              </ClassButton>
            );
          })}
          {selectedClassId && (
            <ClearButton onClick={() => onClassSelect(null)}>
              <ClearButtonContent>
                <svg width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
                선택 해제
              </ClearButtonContent>
            </ClearButton>
          )}
        </ButtonGroup>
      </ComparisonHeader>
    </ComparisonCard>

    {/* Charts */}
    <ChartGrid>
      <Card>
        <ChartTitle>5대 영역 반별 평균 비교</ChartTitle>
        <ChartDescription>
          각 반의 5대 영역별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.
        </ChartDescription>
        <CategoryComparisonChart
          classes={classes}
          selectedClassId={selectedClassId}
          onClassSelect={onClassSelect}
        />
      </Card>

      <Card>
        <ChartTitle>학생 유형 분포 비교</ChartTitle>
        <ChartDescription>각 반의 학생 유형별 분포를 비교합니다.</ChartDescription>
        <TypeDistributionChart
          classes={classes}
          selectedClassId={selectedClassId}
          onClassSelect={onClassSelect}
        />
      </Card>
    </ChartGrid>
  </div>
);
