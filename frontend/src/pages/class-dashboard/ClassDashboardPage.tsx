import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShieldAlert, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Card, Badge } from '@shared/components';
import { useData } from '@shared/contexts/DataContext';
import { useClassStudents, useApiConfig } from '@features/api';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_CLASS_STUDENTS } from '@shared/data/apiDefinitions';
import type { Student, Assessment, Class } from '@shared/types';
import {
  TypeChangeChart,
  ClassInsights,
  SortableHeader,
  ChangeFilterButtons,
} from '@features/class-dashboard/ui';
import type { SortField, ChangeFilter } from '@features/class-dashboard/ui';
import { getTypeChangeScore } from '@features/class-dashboard/lib/typeUtils';
import { formatAttentionTooltip } from '@shared/utils/attentionChecker';

// Animations
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Layout Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const CenteredContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
`;

const CenteredText = styled.div`
  text-align: center;
`;

const SpinnerIcon = styled(Loader2)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme }) => theme.colors.primary[500]};
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 0.5rem;
`;

const WarningIcon = styled(AlertTriangle)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme }) => theme.colors.status.warning};
  margin: 0 auto 0.5rem;
`;

const GrayText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

// Header Components
const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const BackIcon = styled(ArrowLeft)`
  width: 1.25rem;
  height: 1.25rem;
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

// Banner Components
const BannerContainer = styled.div<{ $variant: 'warning' | 'info' }>`
  background: ${({ theme }) => theme.colors.status.warningBg};
  border: 1px solid ${({ theme }) => theme.colors.status.warningBorder};
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: ${({ $variant }) => ($variant === 'info' ? 'flex-start' : 'center')};
  gap: 0.75rem;
`;

const BannerIconWrapper = styled.div<{ $marginTop?: boolean }>`
  flex-shrink: 0;
  margin-top: ${({ $marginTop }) => ($marginTop ? '0.125rem' : '0')};
`;

const BannerIcon = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.status.warning};
`;

const BannerTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: #92400e;
`;

const BannerDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: #d97706;
`;

const BannerDescriptionLarge = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #b45309;
  margin-top: 0.25rem;
`;

// Chart Grid
const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

// Student List Grid
const StudentListGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: start;
`;

// Card Header
const CardHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

// Search Components
const SearchWrapper = styled.div`
  position: relative;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem 0.5rem 2.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

// Filter Section
const FilterSection = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FilterLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const FilterInfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  padding-top: 0.75rem;
`;

const FilterCount = styled.span`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const FilterTotalCount = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-left: 0.25rem;
`;

const FilterResetButton = styled.button`
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
  }
`;

// Table Components
const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
`;

const TableHead = styled.thead``;

const TableHeaderRow = styled.tr`
  background: ${({ theme }) => theme.colors.gray[50]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const TableHeaderCell = styled.th<{ $width?: string; $align?: 'left' | 'center' }>`
  text-align: ${({ $align }) => $align || 'left'};
  padding: 0.75rem;
  width: ${({ $width }) => $width || 'auto'};
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const TableCell = styled.td<{ $align?: 'left' | 'center' }>`
  padding: 0.875rem 0.75rem;
  text-align: ${({ $align }) => $align || 'left'};
`;

const StudentNumber = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const StudentName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

// Status Badge Components
const DashPlaceholder = styled.span<{ $variant?: 'light' | 'default' }>`
  color: ${({ theme, $variant }) =>
    $variant === 'light' ? theme.colors.gray[300] : theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const StatusBadgeWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

const StatusBadge = styled.span<{ $variant: 'attention' | 'reliability' | 'submitted' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};

  ${({ $variant }) => {
    switch ($variant) {
      case 'attention':
        return `
          background: #fffbeb;
          color: #d97706;
          border-color: #fde68a;
        `;
      case 'reliability':
        return `
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        `;
      case 'submitted':
        return `
          background: #eff6ff;
          color: #2563eb;
          border-color: #bfdbfe;
        `;
    }
  }}
`;

const BadgeIcon = styled.span`
  width: 0.875rem;
  height: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Change Indicator Components
const ChangeIndicator = styled.span<{ $variant: 'positive' | 'negative' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  ${({ $variant }) => {
    switch ($variant) {
      case 'positive':
        return `
          background: #d1fae5;
          color: #059669;
        `;
      case 'negative':
        return `
          background: #fee2e2;
          color: #dc2626;
        `;
      case 'neutral':
        return `
          background: #f3f4f6;
          color: #9ca3af;
        `;
    }
  }}
`;

const NoChangeText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[300]};
`;

export const ClassDashboardPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { getClassById } = useData();
  const { hasJwtToken } = useApiConfig();
  // l2Data: 검사 상세 정보, 학급 평균 T점수 등 (향후 활용 가능)
  const { students: apiStudents, l2Data: _l2Data, isLoading, error } = useClassStudents(classId);

  const [searchTerm, setSearchTerm] = useState('');
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // API 모드: useClassStudents에서 가져온 학생 데이터 사용
  // Mock 모드: DataContext에서 가져온 데이터 사용
  const baseClassData = classId ? getClassById(classId) : undefined;

  // API 모드에서 학생 데이터가 있으면 classData 구성
  const classData: Class | undefined = useMemo(() => {
    // API 모드이고 학생 데이터가 있으면 API 데이터로 학급 구성
    if (hasJwtToken && apiStudents.length > 0 && classId) {
      // 첫 번째 학생에서 schoolLevel, grade 추출
      const firstStudent = apiStudents[0];
      const schoolLevel = firstStudent?.schoolLevel ?? '초등';
      const grade = firstStudent?.grade ?? 1;

      // classId에서 classNumber 추출 시도 (예: "6-2" → 2)
      const parts = classId.split('-');
      const classNumber = parseInt(parts[1], 10) || 1;

      // 통계 계산
      const assessedStudents = apiStudents.filter((s) => s.assessments.length > 0).length;
      const typeDistribution: Record<string, { count: number; percentage: number }> = {};

      for (const student of apiStudents) {
        const latestAssessment = student.assessments[student.assessments.length - 1];
        if (latestAssessment) {
          const type = latestAssessment.predictedType;
          if (!typeDistribution[type]) {
            typeDistribution[type] = { count: 0, percentage: 0 };
          }
          typeDistribution[type].count++;
        }
      }

      for (const type of Object.keys(typeDistribution)) {
        typeDistribution[type].percentage =
          assessedStudents > 0
            ? Math.round((typeDistribution[type].count / assessedStudents) * 100)
            : 0;
      }

      const needAttentionCount = apiStudents.filter((s) =>
        s.assessments.some((a) => a.attentionResult.needsAttention),
      ).length;

      return {
        id: classId,
        schoolLevel,
        grade,
        classNumber,
        teacherId: '',
        students: apiStudents,
        stats: {
          totalStudents: apiStudents.length,
          assessedStudents,
          typeDistribution,
          needAttentionCount,
          round1Completed: assessedStudents > 0,
          round2Completed: apiStudents.some((s) => s.assessments.some((a) => a.round === 2)),
          examStatus: {
            round1: assessedStudents > 0 ? '종료' : '시작전',
            round2: apiStudents.some((s) => s.assessments.some((a) => a.round === 2))
              ? '종료'
              : '시작전',
          },
          round2SubmittedCount: apiStudents.filter((s) => s.assessments.some((a) => a.round === 2))
            .length,
        },
      };
    }

    // Mock 모드 또는 API 데이터 없음: DataContext 사용
    return baseClassData;
  }, [baseClassData, hasJwtToken, apiStudents, classId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // API 모드 로딩 상태
  if (hasJwtToken && isLoading) {
    return (
      <CenteredContainer>
        <CenteredText>
          <SpinnerIcon />
          <GrayText>학급 데이터를 불러오는 중...</GrayText>
        </CenteredText>
      </CenteredContainer>
    );
  }

  // API 에러 상태
  if (hasJwtToken && error) {
    return (
      <CenteredContainer>
        <CenteredText>
          <WarningIcon />
          <GrayText>데이터 로드 실패: {error}</GrayText>
        </CenteredText>
      </CenteredContainer>
    );
  }

  if (!classData) {
    return (
      <CenteredContainer>
        <GrayText>학급을 찾을 수 없습니다.</GrayText>
      </CenteredContainer>
    );
  }

  // 신뢰도 경고 상태 계산
  const reliabilityWarningOnly = (() => {
    const studentsWithRound1 = classData.students.filter((s) =>
      s.assessments.some((a) => a.round === 1),
    );
    if (studentsWithRound1.length === 0) return false;

    const reliableStudents = studentsWithRound1.filter((s) => {
      const r1 = s.assessments.find((a) => a.round === 1);
      return r1 && r1.reliabilityWarnings.length === 0;
    });
    return reliableStudents.length === 0;
  })();

  // 필터링 및 정렬
  const filteredAndSortedStudents = (() => {
    let filtered = classData.students.filter((s) => {
      if (searchTerm && !s.name.includes(searchTerm) && !s.number.toString().includes(searchTerm)) {
        return false;
      }

      const r1 = s.assessments.find((a) => a.round === 1);
      const r2 = s.assessments.find((a) => a.round === 2);
      const typeChange = getTypeChangeScore(r1?.predictedType, r2?.predictedType);

      if (changeFilter === 'positive' && typeChange !== 1) return false;
      if (changeFilter === 'negative' && typeChange !== -1) return false;
      if (changeFilter === 'not-assessed' && r2) return false;

      if (changeFilter === 'reliability-warning') {
        const hasWarning = s.assessments.some((a) => a.reliabilityWarnings.length > 0);
        if (!hasWarning) return false;
      }

      if (changeFilter === 'need-attention') {
        const hasAttention = s.assessments.some((a) => a.attentionResult.needsAttention);
        if (!hasAttention) return false;
      }

      return true;
    });

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const getValue = (student: Student) => {
          const r1 = student.assessments.find((r) => r.round === 1);
          const r2 = student.assessments.find((r) => r.round === 2);

          switch (sortField) {
            case 'number':
              return student.number;
            case 'name':
              return student.name;
            case 'type1':
              return r1?.predictedType || '';
            case 'type2':
              return r2?.predictedType || '';
          }
        };

        const aValue = getValue(a);
        const bValue = getValue(b);

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return sortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return filtered;
  })();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 차수별 상태 배지 렌더링
  const renderStatusBadges = (assessment: Assessment | undefined) => {
    if (!assessment) return <DashPlaceholder $variant="light">-</DashPlaceholder>;

    const hasReliability = assessment.reliabilityWarnings.length > 0;
    const hasAttention = assessment.attentionResult.needsAttention;

    if (!hasReliability && !hasAttention) {
      return <DashPlaceholder>-</DashPlaceholder>;
    }

    return (
      <StatusBadgeWrapper>
        {hasAttention && (
          <StatusBadge $variant="attention" title={formatAttentionTooltip(assessment.attentionResult)}>
            <BadgeIcon>
              <AlertTriangle size={14} />
            </BadgeIcon>
            관심
          </StatusBadge>
        )}
        {hasReliability && (
          <StatusBadge
            $variant="reliability"
            title={`신뢰도 주의: ${assessment.reliabilityWarnings.join(', ')}`}
          >
            <BadgeIcon>
              <ShieldAlert size={14} />
            </BadgeIcon>
            신뢰도
          </StatusBadge>
        )}
      </StatusBadgeWrapper>
    );
  };

  // 변화 인디케이터 렌더링
  const renderChangeIndicator = (typeChange: number, hasRound2: boolean) => {
    if (!hasRound2) {
      return <NoChangeText>--</NoChangeText>;
    }
    if (typeChange === 1) {
      return <ChangeIndicator $variant="positive">+</ChangeIndicator>;
    }
    if (typeChange === -1) {
      return <ChangeIndicator $variant="negative">-</ChangeIndicator>;
    }
    return <ChangeIndicator $variant="neutral">=</ChangeIndicator>;
  };

  return (
    <PageContainer>
      {/* Header */}
      <HeaderRow>
        <BackButton onClick={() => navigate('/dashboard')}>
          <BackIcon />
        </BackButton>
        <HeaderContent>
          <PageTitle>
            {classData.grade}학년 {classData.classNumber}반
          </PageTitle>
          <PageSubtitle>
            학생 {classData.stats?.totalStudents}명 | 검사 완료 {classData.stats?.assessedStudents}
            명
          </PageSubtitle>
        </HeaderContent>
      </HeaderRow>

      {/* 2차 검사 진행중 배너 */}
      {classData.stats?.examStatus?.round2 === '진행중' && (
        <BannerContainer $variant="warning">
          <BannerIcon as={Clock} />
          <div>
            <BannerTitle>2차 검사 진행 중</BannerTitle>
            <BannerDescription>
              {classData.stats.round2SubmittedCount}/{classData.stats.totalStudents}명 제출 완료.
              검사 종료 후 결과를 확인할 수 있습니다.
            </BannerDescription>
          </div>
        </BannerContainer>
      )}

      {/* 신뢰도 경고 배너 */}
      {reliabilityWarningOnly && (
        <BannerContainer $variant="info">
          <BannerIconWrapper $marginTop>
            <BannerIcon as={ShieldAlert} />
          </BannerIconWrapper>
          <div>
            <BannerTitle>모든 학생이 신뢰도 주의 상태입니다</BannerTitle>
            <BannerDescriptionLarge>
              신뢰도 양호 학생이 없어 전체 학생 데이터를 기반으로 분석 결과를 표시합니다. 결과
              해석에 주의가 필요합니다.
            </BannerDescriptionLarge>
          </div>
        </BannerContainer>
      )}

      {/* Charts */}
      <ChartsGrid>
        <TypeChangeChart classData={classData} />
        <ClassInsights classData={classData} />
      </ChartsGrid>

      {/* 학생 목록 */}
      <StudentListGrid>
        {/* Student Table */}
        <Card>
          <CardHeaderRow>
            <ApiTooltip {...API_CLASS_STUDENTS} position="top-left">
              <CardTitle>학생 목록</CardTitle>
            </ApiTooltip>
            <SearchWrapper>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="이름/번호 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchWrapper>
          </CardHeaderRow>

          {/* Filters */}
          <FilterSection>
            <FilterRow>
              <FilterLabel>필터:</FilterLabel>
              <ChangeFilterButtons value={changeFilter} onChange={setChangeFilter} />
            </FilterRow>

            <FilterInfoRow>
              <FilterCount>
                {filteredAndSortedStudents.length}명 표시
                {changeFilter !== 'all' && (
                  <FilterTotalCount>(전체 {classData.students.length}명)</FilterTotalCount>
                )}
              </FilterCount>
              {changeFilter !== 'all' && (
                <FilterResetButton onClick={() => setChangeFilter('all')}>
                  필터 초기화
                </FilterResetButton>
              )}
            </FilterInfoRow>
          </FilterSection>

          {/* Table */}
          <TableWrapper>
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell $width="4rem">
                    <SortableHeader
                      field="number"
                      label="번호"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHeaderCell>
                  <TableHeaderCell $width="6rem">
                    <SortableHeader
                      field="name"
                      label="이름"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHeaderCell>
                  <TableHeaderCell $width="8rem">
                    <SortableHeader
                      field="type1"
                      label="1차 유형"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHeaderCell>
                  <TableHeaderCell $width="9rem">1차 상태</TableHeaderCell>
                  <TableHeaderCell $width="4rem" $align="center">
                    변화
                  </TableHeaderCell>
                  <TableHeaderCell $width="8rem">
                    <SortableHeader
                      field="type2"
                      label="2차 유형"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHeaderCell>
                  <TableHeaderCell $width="9rem">2차 상태</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedStudents.map((student) => {
                  const r1 = student.assessments.find((a) => a.round === 1);
                  const r2 = student.assessments.find((a) => a.round === 2);
                  const typeChange = getTypeChangeScore(r1?.predictedType, r2?.predictedType);

                  return (
                    <TableRow
                      key={student.id}
                      onClick={() => navigate(`/dashboard/class/${classId}/student/${student.id}`)}
                    >
                      <TableCell>
                        <StudentNumber>{student.number}</StudentNumber>
                      </TableCell>
                      <TableCell>
                        <StudentName>{student.name}</StudentName>
                      </TableCell>
                      <TableCell>
                        {r1 ? (
                          <Badge type={r1.predictedType}>{r1.predictedType}</Badge>
                        ) : (
                          <DashPlaceholder $variant="light">-</DashPlaceholder>
                        )}
                      </TableCell>
                      <TableCell>{renderStatusBadges(r1)}</TableCell>
                      <TableCell $align="center">
                        {renderChangeIndicator(typeChange, !!r2)}
                      </TableCell>
                      <TableCell>
                        {r2 ? (
                          <Badge type={r2.predictedType}>{r2.predictedType}</Badge>
                        ) : classData.stats?.examStatus?.round2 === '진행중' &&
                          student.round2Submitted ? (
                          <StatusBadge $variant="submitted">제출 완료</StatusBadge>
                        ) : (
                          <DashPlaceholder $variant="light">-</DashPlaceholder>
                        )}
                      </TableCell>
                      <TableCell>{renderStatusBadges(r2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrapper>
        </Card>
      </StudentListGrid>
    </PageContainer>
  );
};

export default ClassDashboardPage;
