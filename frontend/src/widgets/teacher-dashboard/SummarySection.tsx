import styled from '@emotion/styled';
import { Users, TrendingUp } from 'lucide-react';
import { Card } from '@shared/components';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const CardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IconWrapper = styled.div<{ $color: 'blue' | 'green' }>`
  width: 2.5rem;
  height: 2.5rem;
  background-color: ${({ $color }) => ($color === 'blue' ? '#dbeafe' : '#d1fae5')};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UsersIcon = styled(Users)`
  width: 1.25rem;
  height: 1.25rem;
  color: #2563eb;
`;

const TrendingUpIcon = styled(TrendingUp)`
  width: 1.25rem;
  height: 1.25rem;
  color: #16a34a;
`;

const Label = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const Value = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

interface SummarySectionProps {
  totalStudents: number;
  assessedStudents: number;
}

export const SummarySection = ({ totalStudents, assessedStudents }: SummarySectionProps) => (
  <Grid>
    <Card>
      <CardContent>
        <IconWrapper $color='blue'>
          <UsersIcon />
        </IconWrapper>
        <div>
          <Label>전체 학생</Label>
          <Value>{totalStudents}명</Value>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent>
        <IconWrapper $color='green'>
          <TrendingUpIcon />
        </IconWrapper>
        <div>
          <Label>검사 완료</Label>
          <Value>{assessedStudents}명</Value>
        </div>
      </CardContent>
    </Card>
  </Grid>
);
