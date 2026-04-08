import { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { useData } from '@shared/contexts/DataContext';
import { useTeacherClasses, useApiConfig } from '@features/api';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_TEACHER_DASHBOARD, API_UPLOAD_LATEST } from '@shared/data/apiDefinitions';
import {
  LoadingState,
  ErrorState,
  InProgressState,
  NoExamsState,
  NoClassesState,
  SummarySection,
  ComparisonSection,
  ClassCardsSection,
} from '@widgets/teacher-dashboard';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HeaderSection = styled.div``;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

export const TeacherDashboardPage = () => {
  const { hasJwtToken } = useApiConfig();
  const { classes, isLoading, error, examStatus, user } = useTeacherClasses();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const totalStats = useMemo(
    () => ({
      totalStudents: classes.reduce((sum, c) => sum + (c.stats?.totalStudents || 0), 0),
      assessedStudents: classes.reduce((sum, c) => sum + (c.stats?.assessedStudents || 0), 0),
    }),
    [classes],
  );

  // Loading states (API mode)
  if (hasJwtToken && isLoading) return <LoadingState />;
  if (hasJwtToken && error) return <ErrorState error={error} />;
  if (hasJwtToken && examStatus === 'in-progress') return <InProgressState />;
  if (hasJwtToken && examStatus === 'no-exams') return <NoExamsState />;
  if (classes.length === 0) return <NoClassesState />;

  const completionRate = Math.round((totalStats.assessedStudents / totalStats.totalStudents) * 100);

  return (
    <PageContainer>
      {/* Header */}
      <HeaderSection>
        <HeaderRow>
          <ApiTooltip {...API_TEACHER_DASHBOARD} position='bottom-left'>
            <PageTitle>{user?.name}님의 학급 현황</PageTitle>
          </ApiTooltip>
          <ApiTooltip {...API_UPLOAD_LATEST} position='bottom-left'>
            <span />
          </ApiTooltip>
        </HeaderRow>
        <PageSubtitle>
          담당 학급: {classes.length}개 반 | 총 학생: {totalStats.totalStudents}명 | 검사 완료:{' '}
          {totalStats.assessedStudents}명 ({completionRate}%)
        </PageSubtitle>
      </HeaderSection>

      {/* Summary Cards */}
      <SummarySection
        totalStudents={totalStats.totalStudents}
        assessedStudents={totalStats.assessedStudents}
      />

      {/* Comparison Section */}
      <ComparisonSection
        classes={classes}
        selectedClassId={selectedClassId}
        onClassSelect={setSelectedClassId}
      />

      {/* Class Cards */}
      <ClassCardsSection classes={classes} />
    </PageContainer>
  );
};

export default TeacherDashboardPage;
