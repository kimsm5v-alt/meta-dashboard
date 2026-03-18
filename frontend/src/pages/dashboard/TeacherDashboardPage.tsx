import styled from '@emotion/styled'
import { Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, Button } from '@shared/ui'

const PageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(4, 1fr);
  }
`

const StatCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.lg};
`

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const StatIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ $color }) => `${$color}20`};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
`

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const ClassGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(3, 1fr);
  }
`

const ClassCard = styled(Card)`
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: translateY(-4px);
    border-color: ${({ theme }) => theme.colors.primary[500]}50;
  }
`

const ClassHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const ClassName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`

const StudentCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`

const TypeBadges = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const TypeBadge = styled.span<{ $type: 'warning' | 'balance' | 'excellent' }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: ${({ theme, $type }) => `${theme.colors.type[$type]}20`};
  color: ${({ theme, $type }) => theme.colors.type[$type]};
`

// Mock data
const stats = [
  { icon: Users, label: '전체 학생', value: '128', color: '#3B82F6' },
  { icon: CheckCircle, label: '검사 완료', value: '96', color: '#22C55E' },
  { icon: AlertTriangle, label: '관심 필요', value: '12', color: '#F59E0B' },
  { icon: TrendingUp, label: '평균 향상', value: '+5.2', color: '#8B5CF6' },
]

const classes = [
  {
    id: '1',
    name: '1학년 1반',
    studentCount: 32,
    types: { warning: 3, balance: 20, excellent: 9 },
  },
  {
    id: '2',
    name: '1학년 2반',
    studentCount: 30,
    types: { warning: 2, balance: 18, excellent: 10 },
  },
  {
    id: '3',
    name: '2학년 1반',
    studentCount: 33,
    types: { warning: 4, balance: 22, excellent: 7 },
  },
  {
    id: '4',
    name: '2학년 2반',
    studentCount: 33,
    types: { warning: 3, balance: 21, excellent: 9 },
  },
]

export const TeacherDashboardPage = () => {
  return (
    <div>
      <PageHeader>
        <Title>대시보드</Title>
        <Subtitle>전체 학급 현황을 한눈에 확인하세요</Subtitle>
      </PageHeader>

      <StatsGrid>
        {stats.map((stat) => (
          <StatCard key={stat.label} variant="glass">
            <StatHeader>
              <StatIcon $color={stat.color}>
                <stat.icon size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </StatCard>
        ))}
      </StatsGrid>

      <SectionTitle>학급 목록</SectionTitle>
      <ClassGrid>
        {classes.map((cls) => (
          <ClassCard key={cls.id} variant="glass">
            <Card.Content>
              <ClassHeader>
                <ClassName>{cls.name}</ClassName>
                <StudentCount>{cls.studentCount}명</StudentCount>
              </ClassHeader>
              <TypeBadges>
                <TypeBadge $type="warning">
                  주의 {cls.types.warning}
                </TypeBadge>
                <TypeBadge $type="balance">
                  균형 {cls.types.balance}
                </TypeBadge>
                <TypeBadge $type="excellent">
                  우수 {cls.types.excellent}
                </TypeBadge>
              </TypeBadges>
            </Card.Content>
            <Card.Footer>
              <Button variant="ghost" size="sm">
                상세보기
              </Button>
            </Card.Footer>
          </ClassCard>
        ))}
      </ClassGrid>
    </div>
  )
}
