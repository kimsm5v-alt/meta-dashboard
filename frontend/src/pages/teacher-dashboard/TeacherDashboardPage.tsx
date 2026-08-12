import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { ChevronRight } from 'lucide-react';
import { useTeacherClasses, useApiConfig } from '@features/api';
import { useAuth } from '@features/auth';
import { useGroupMembersQuery } from '@features/groups';
import { SelfregComparisonSection } from '@features/teacher-dashboard/ui';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_TEACHER_DASHBOARD, API_UPLOAD_LATEST } from '@shared/data/apiDefinitions';
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

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
`;

const BreadcrumbBadge = styled.span<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  background: ${({ $color }) => $color ?? '#009f88'};
`;

const BreadcrumbText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

export const TeacherDashboardPage = () => {
  const { hasJwtToken } = useApiConfig();
  const { classes, isLoading, error, examStatus, user } = useTeacherClasses();
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
  const handleGoToClass = (classId: string) => navigate(`/dashboard/${testId}/class/${classId}`);

  return (
    <PageContainer>
      {/* Header */}
      <HeaderSection>
        {testId === 'selfreg' ? (
          <>
            <Breadcrumb>
              <BreadcrumbBadge>자기조절검사</BreadcrumbBadge>
              <BreadcrumbText>결과보기</BreadcrumbText>
              <ChevronRight size={14} color='#9CA3AF' />
              <BreadcrumbText style={{ color: '#111827' }}>자기조절학습검사</BreadcrumbText>
            </Breadcrumb>
            <HeaderRow>
              <ApiTooltip {...API_TEACHER_DASHBOARD} position='bottom-left'>
                <PageTitle>{user?.name}님의 학급 분석</PageTitle>
              </ApiTooltip>
              <ApiTooltip {...API_UPLOAD_LATEST} position='bottom-left'>
                <span />
              </ApiTooltip>
            </HeaderRow>
          </>
        ) : (
          <>
            <Breadcrumb>
              <BreadcrumbBadge $color='#4F46E5'>학습종합검사</BreadcrumbBadge>
              <BreadcrumbText>결과보기</BreadcrumbText>
              <ChevronRight size={14} color='#9CA3AF' />
              <BreadcrumbText style={{ color: '#111827' }}>학습종합검사</BreadcrumbText>
            </Breadcrumb>
            <HeaderRow>
              <ApiTooltip {...API_TEACHER_DASHBOARD} position='bottom-left'>
                <PageTitle>{user?.name}님의 학급 분석</PageTitle>
              </ApiTooltip>
              <ApiTooltip {...API_UPLOAD_LATEST} position='bottom-left'>
                <span />
              </ApiTooltip>
            </HeaderRow>
          </>
        )}
        <PageSubtitle>
          담당 학급 {classes.length}개 반 · 총 학생 {totalStats.totalStudents}명 · 검사 완료:{' '}
          {totalStats.assessedStudents}명 ({completionRate}%)
        </PageSubtitle>
      </HeaderSection>

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
