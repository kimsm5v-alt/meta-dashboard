import { useState } from 'react';
import styled from '@emotion/styled';
import { Calendar, Users, AlertCircle, TrendingUp, Filter } from 'lucide-react';
import { Card } from '@shared/components';
import { CounselingFrequencyChart, CounselingTypeChart } from '@features/counseling-dashboard/ui';

// 임시 Mock 데이터
const mockStats = {
  totalCounseling: 156,
  thisMonth: 23,
  notCounseledStudents: 5,
};

const mockStudentCounseling = [
  { id: '1', name: '김민준', count: 8, lastDate: '2024-03-15', tags: ['학업', '진로'] },
  { id: '2', name: '이서연', count: 5, lastDate: '2024-03-12', tags: ['교우관계'] },
  { id: '3', name: '박지호', count: 3, lastDate: '2024-03-08', tags: ['정서심리'] },
  { id: '4', name: '최수아', count: 0, lastDate: null, tags: [] },
  { id: '5', name: '정우진', count: 0, lastDate: null, tags: [] },
];

type PeriodFilter = 'all' | 'semester' | 'month' | 'custom';

type ChartView = 'type' | 'area';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderLeft = styled.div``;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PeriodSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  background: white;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StatCardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StatIconCircle = styled.div<{ $variant: 'blue' | 'green' | 'amber' }>`
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $variant }) => {
    switch ($variant) {
      case 'blue':
        return `background: #dbeafe;`;
      case 'green':
        return `background: #d1fae5;`;
      case 'amber':
        return `background: #fef3c7;`;
    }
  }}
`;

const StatIcon = styled.div<{ $variant: 'blue' | 'green' | 'amber' }>`
  width: 1.5rem;
  height: 1.5rem;

  ${({ $variant }) => {
    switch ($variant) {
      case 'blue':
        return `color: #2563eb;`;
      case 'green':
        return `color: #059669;`;
      case 'amber':
        return `color: #d97706;`;
    }
  }}
`;

const StatTextGroup = styled.div``;

const StatLabel = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const StatValue = styled.p`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ChartCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ChartTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ChartViewButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ChartViewButton = styled.button<{ $isActive: boolean }>`
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.15s ease;
  border: none;
  cursor: pointer;

  ${({ $isActive, theme }) =>
    $isActive
      ? `
    background: ${theme.colors.primary[500]};
    color: white;
  `
      : `
    background: ${theme.colors.gray[100]};
    color: ${theme.colors.gray[600]};

    &:hover {
      background: ${theme.colors.gray[200]};
    }
  `}
`;

const TableCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const TableTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const TableHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TableCount = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
`;

const TableHead = styled.thead``;

const TableHeaderRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const TableHeader = styled.th`
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[500]};
  text-transform: uppercase;
`;

const TableBody = styled.tbody`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};

  > tr {
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};

    &:last-of-type {
      border-bottom: none;
    }
  }
`;

const TableRow = styled.tr`
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem;
`;

const StudentCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StudentAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StudentAvatarIcon = styled.div`
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const StudentName = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const CellTextSmall = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const CellTextGray = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const TagsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

const Tag = styled.span`
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  border-radius: 0.25rem;
`;

const EmptyText = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const StatusBadge = styled.span<{ $variant: 'pending' | 'active' }>`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.25rem;

  ${({ $variant }) =>
    $variant === 'pending'
      ? `
    background: #fef3c7;
    color: #b45309;
  `
      : `
    background: #d1fae5;
    color: #047857;
  `}
`;

export const CounselingDashboardPage: React.FC = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [chartView, setChartView] = useState<ChartView>('type');

  return (
    <PageContainer>
      {/* 헤더 */}
      <HeaderSection>
        <HeaderLeft>
          <PageTitle>상담 대시보드</PageTitle>
          <PageSubtitle>상담 현황을 한눈에 확인하세요</PageSubtitle>
        </HeaderLeft>
        <HeaderRight>
          <PeriodSelect
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
          >
            <option value='all'>전체 기간</option>
            <option value='semester'>이번 학기</option>
            <option value='month'>이번 달</option>
            <option value='custom'>기간 설정</option>
          </PeriodSelect>
          <FilterButton>
            <Filter className='w-4 h-4' />
            필터
          </FilterButton>
        </HeaderRight>
      </HeaderSection>

      {/* 요약 카드 */}
      <StatsGrid>
        <Card>
          <StatCardContent>
            <StatIconCircle $variant='blue'>
              <StatIcon $variant='blue' as={Calendar} />
            </StatIconCircle>
            <StatTextGroup>
              <StatLabel>전체 상담</StatLabel>
              <StatValue>{mockStats.totalCounseling}건</StatValue>
            </StatTextGroup>
          </StatCardContent>
        </Card>

        <Card>
          <StatCardContent>
            <StatIconCircle $variant='green'>
              <StatIcon $variant='green' as={TrendingUp} />
            </StatIconCircle>
            <StatTextGroup>
              <StatLabel>이번 달</StatLabel>
              <StatValue>{mockStats.thisMonth}건</StatValue>
            </StatTextGroup>
          </StatCardContent>
        </Card>

        <Card>
          <StatCardContent>
            <StatIconCircle $variant='amber'>
              <StatIcon $variant='amber' as={AlertCircle} />
            </StatIconCircle>
            <StatTextGroup>
              <StatLabel>미진행 학생</StatLabel>
              <StatValue>{mockStats.notCounseledStudents}명</StatValue>
            </StatTextGroup>
          </StatCardContent>
        </Card>
      </StatsGrid>

      {/* 차트 영역 */}
      <ChartsGrid>
        <Card>
          <ChartTitle>상담 빈도 추이</ChartTitle>
          <CounselingFrequencyChart />
        </Card>

        <Card>
          <ChartCardHeader>
            <ChartTitle>상담 분포</ChartTitle>
            <ChartViewButtons>
              <ChartViewButton $isActive={chartView === 'type'} onClick={() => setChartView('type')}>
                유형별
              </ChartViewButton>
              <ChartViewButton $isActive={chartView === 'area'} onClick={() => setChartView('area')}>
                영역별
              </ChartViewButton>
            </ChartViewButtons>
          </ChartCardHeader>
          <CounselingTypeChart type={chartView} />
        </Card>
      </ChartsGrid>

      {/* 학생별 상담 현황 테이블 */}
      <Card>
        <TableCardHeader>
          <TableTitle>학생별 상담 현황</TableTitle>
          <TableHeaderRight>
            <TableCount>총 {mockStudentCounseling.length}명</TableCount>
          </TableHeaderRight>
        </TableCardHeader>

        <TableWrapper>
          <Table>
            <TableHead>
              <TableHeaderRow>
                <TableHeader>이름</TableHeader>
                <TableHeader>상담 횟수</TableHeader>
                <TableHeader>최근 상담일</TableHeader>
                <TableHeader>상담 영역</TableHeader>
                <TableHeader>상태</TableHeader>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {mockStudentCounseling.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <StudentCell>
                      <StudentAvatar>
                        <StudentAvatarIcon as={Users} />
                      </StudentAvatar>
                      <StudentName>{student.name}</StudentName>
                    </StudentCell>
                  </TableCell>
                  <TableCell>
                    <CellTextSmall>{student.count}회</CellTextSmall>
                  </TableCell>
                  <TableCell>
                    <CellTextGray>{student.lastDate || '-'}</CellTextGray>
                  </TableCell>
                  <TableCell>
                    <TagsWrapper>
                      {student.tags.length > 0 ? (
                        student.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                      ) : (
                        <EmptyText>-</EmptyText>
                      )}
                    </TagsWrapper>
                  </TableCell>
                  <TableCell>
                    {student.count === 0 ? (
                      <StatusBadge $variant='pending'>미진행</StatusBadge>
                    ) : (
                      <StatusBadge $variant='active'>진행중</StatusBadge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </Card>
    </PageContainer>
  );
};
