import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { useTeacherClasses, useApiConfig } from '@features/api';
import { useAuth } from '@features/auth';
import { useGroupMembersQuery } from '@features/groups';
import { SelfregComparisonSection } from '@features/teacher-dashboard/ui';
import { Card } from '@shared/components';
import {
  LoadingState,
  ErrorState,
  InProgressState,
  NoExamsState,
  NoClassesState,
  ComparisonSection,
  LPAComparisonSection,
} from '@widgets/teacher-dashboard';
import { ClassDashboardV2Widget } from '@widgets/class-dashboard';
import { useOptionalLayoutContext } from '@widgets/layout/v2/LayoutContext';
import { StudentDashboardPage } from '../student-dashboard/StudentDashboardPage';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HeaderSection = styled.div``;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled(Card)`
  padding: 1.25rem;
`;

const SummaryLabel = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: 0.5rem;
`;

const SummaryValue = styled.p<{ $color?: string }>`
  color: ${({ $color, theme }) => $color ?? theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const SummarySub = styled.p`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  margin-top: 0.5rem;
`;

export const TeacherDashboardPage = () => {
  const { hasJwtToken } = useApiConfig();
  const { classes, isLoading, error, examStatus } = useTeacherClasses();
  const { user: authUser } = useAuth();
  const layoutContext = useOptionalLayoutContext();
  const scope = layoutContext?.scope;
  const selectClass = layoutContext?.selectClass;
  const selectStudent = layoutContext?.selectStudent;
  const { data: members = [] } = useGroupMembersQuery(
    scope?.level === 'class' || scope?.level === 'student' ? scope.classId : null,
    authUser?.id,
  );
  const location = useLocation();
  const navigate = useNavigate();
  const testId: 'comprehensive' | 'selfreg' = location.pathname.includes('/selfreg')
    ? 'selfreg'
    : 'comprehensive';
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const totalStats = useMemo(
    () => ({
      totalStudents: classes.reduce((sum, c) => sum + (c.stats?.totalStudents || 0), 0),
      assessedStudents: classes.reduce((sum, c) => sum + (c.stats?.assessedStudents || 0), 0),
      needsAttention: classes.reduce((sum, c) => sum + (c.stats?.needAttentionCount || 0), 0),
    }),
    [classes],
  );

  // Loading states (API mode)
  if (hasJwtToken && isLoading) return <LoadingState />;
  if (hasJwtToken && error) return <ErrorState error={error} />;
  if (hasJwtToken && examStatus === 'in-progress') return <InProgressState />;
  if (hasJwtToken && examStatus === 'no-exams') return <NoExamsState />;
  if (classes.length === 0) return <NoClassesState />;

  if (scope?.level === 'class' && scope.classId) {
    const classId = scope.classId;
    const memberIdByStudentId = new Map(members.map((member) => [member.stdtId, member.id]));
    return (
      <ClassDashboardV2Widget
        classIdOverride={classId}
        onStudentSelect={(studentId) => {
          const memberId = memberIdByStudentId.get(studentId);
          if (memberId) selectStudent?.(classId, memberId);
        }}
      />
    );
  }

  if (scope?.level === 'student' && scope.classId && scope.studentId) {
    const classId = scope.classId;
    const studentId = members.find((member) => member.id === scope.studentId)?.stdtId;

    if (studentId) {
      return (
        <StudentDashboardPage
          classIdOverride={classId}
          studentIdOverride={studentId}
          onBackToClass={() => selectClass?.(classId)}
          onStudentSelect={(nextStudentId) => {
            const memberId = members.find((member) => member.stdtId === nextStudentId)?.id;
            if (memberId) selectStudent?.(classId, memberId);
          }}
        />
      );
    }
  }

  const completionRate = Math.round((totalStats.assessedStudents / totalStats.totalStudents) * 100);
  const handleGoToClass = (classId: string) => {
    if (selectClass) {
      selectClass(classId);
      return;
    }
    navigate(`/dashboard/${testId}/class/${classId}`);
  };

  return (
    <PageContainer>
      {/* Header */}
      <HeaderSection>
        <PageTitle>결과보기</PageTitle>
        <PageSubtitle>
          담당 학급 {classes.length}개 반 · 총 학생 {totalStats.totalStudents}명의 검사 결과를
          확인할 수 있습니다.
        </PageSubtitle>
      </HeaderSection>

      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>담당 반</SummaryLabel>
          <SummaryValue>{classes.length}개</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>검사 완료율</SummaryLabel>
          <SummaryValue>{completionRate}%</SummaryValue>
          <SummarySub>
            {totalStats.assessedStudents}/{totalStats.totalStudents}명
          </SummarySub>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>상담 및 지도 필요</SummaryLabel>
          <SummaryValue $color='#EF4444'>{totalStats.needsAttention}명</SummaryValue>
        </SummaryCard>
      </SummaryGrid>

      {/* Comparison Section */}
      {testId === 'selfreg' ? (
        <SelfregComparisonSection
          classes={classes}
          selectedClassId={selectedClassId}
          onClassSelect={setSelectedClassId}
          onGoToClass={handleGoToClass}
        />
      ) : (
        <ComparisonSection
          classes={classes}
          selectedClassId={selectedClassId}
          onClassSelect={setSelectedClassId}
          onGoToClass={handleGoToClass}
          showDrillToggle={false}
          showSidePanel={false}
        />
      )}

      {/* LPA 유형 분포 비교 — 종합검사만 */}
      {testId === 'comprehensive' && (
        <LPAComparisonSection classes={classes} onGoToClass={handleGoToClass} />
      )}
    </PageContainer>
  );
};

export default TeacherDashboardPage;
