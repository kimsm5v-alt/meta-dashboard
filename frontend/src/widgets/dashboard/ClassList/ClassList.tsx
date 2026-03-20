import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Skeleton } from '@shared/ui';
import { useTeacherClasses } from '@features/dashboard';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ClassCard = styled(Card)`
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: translateY(-4px);
    border-color: ${({ theme }) => theme.colors.primary[500]}50;
  }
`;

const ClassHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ClassName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StudentCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Badges = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

export const ClassList = () => {
  const navigate = useNavigate();
  const { data: classes, isLoading } = useTeacherClasses();

  if (isLoading) {
    return (
      <Grid>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height='160px' borderRadius='16px' />
        ))}
      </Grid>
    );
  }

  return (
    <Grid>
      {classes?.map((cls) => (
        <ClassCard key={cls.id} variant='glass'>
          <Card.Content>
            <ClassHeader>
              <ClassName>{cls.name}</ClassName>
              <StudentCount>{cls.studentCount}명</StudentCount>
            </ClassHeader>
            <Badges>
              <Badge variant='warning'>주의 {cls.types.warning}</Badge>
              <Badge variant='balance'>균형 {cls.types.balance}</Badge>
              <Badge variant='excellent'>우수 {cls.types.excellent}</Badge>
            </Badges>
          </Card.Content>
          <Card.Footer>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate(`/dashboard/class/${cls.id}`)}
            >
              상세보기
            </Button>
          </Card.Footer>
        </ClassCard>
      ))}
    </Grid>
  );
};
