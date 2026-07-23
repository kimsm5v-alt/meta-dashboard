import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { ArrowLeft, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useData } from '@shared/contexts/DataContext';
import { useClassProfile } from '@features/class-dashboard/model/useClassProfile';
import { useClassDetailData } from '@features/class-dashboard/model/useClassDetailData';
import { useClassStudents, useApiConfig, useSelfregClassAnalysis } from '@features/api';
import { ClassSummarySection } from '@features/class-dashboard/ui/detail/ClassSummarySection';
import { FactorHeatmapSection } from '@shared/components/FactorHeatmapSection';
import { RiskStudentsSection } from '@features/class-dashboard/ui/detail/RiskStudentsSection';
import { StrategySection } from '@features/class-dashboard/ui/detail/StrategySection';
import { SelfregFactorAnalysis } from '@features/student-dashboard';
import type { Class } from '@shared/types';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.15s ease;
  background: transparent;
  border: none;
  cursor: pointer;

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
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ViewModeSelector = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ViewModeButton = styled.button<{ $isActive: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
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

const WarningBanner = styled.div`
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const WarningIcon = styled(ShieldAlert)`
  width: 1.25rem;
  height: 1.25rem;
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const WarningContent = styled.div``;

const WarningTitle = styled.p`
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
`;

const WarningText = styled.p`
  font-size: 0.875rem;
  color: #b45309;
  margin-top: 0.25rem;
`;

const Section = styled.section``;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
`;

const SectionCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: 1.5rem;
`;

const CenterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
`;

const LoadingContainer = styled.div`
  text-align: center;
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingSpinner = styled(Loader2)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme }) => theme.colors.primary[500]};
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 0.5rem;
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ErrorIcon = styled(AlertTriangle)`
  width: 2rem;
  height: 2rem;
  color: #f59e0b;
  margin: 0 auto 0.5rem;
`;

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

// ============================================================
// 내부 컴포넌트: classData가 확정된 후에만 렌더링
// ============================================================
interface ClassDetailContentProps {
  classData: Class;
  classId: string;
  testId: string;
}

const ClassDetailContent: React.FC<ClassDetailContentProps> = ({ classData, classId, testId }) => {
  const navigate = useNavigate();

  const hasRound2 = classData.students.some((s) => s.assessments.some((a) => a.round === 2));

  type ViewMode = 'round1' | 'round2' | 'compare';
  const [viewMode, setViewMode] = useState<ViewMode>('round1');

  const selectedRound: 1 | 2 = viewMode === 'round1' ? 1 : 2;
  const isCompare = viewMode === 'compare';

  // classData가 확정된 상태에서만 훅 호출
  const profile = useClassProfile(classData, selectedRound);
  const detailData = useClassDetailData(classData, selectedRound);

  const prevProfile = useClassProfile(classData, 1);
  const prevDetailData = useClassDetailData(classData, 1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageContainer>
      {/* Header — L2와 동일한 패턴 */}
      <HeaderSection>
        <BackButton onClick={() => navigate(`/dashboard/${testId}/class/${classId}`)}>
          <BackIcon />
        </BackButton>
        <HeaderContent>
          <PageTitle>
            {classData.grade}학년 {classData.classNumber}반 학급 특성 상세 분석
          </PageTitle>
          <PageSubtitle>
            유효 학생 {detailData.validStudentCount}명 / 전체 {detailData.totalStudentCount}명
          </PageSubtitle>
        </HeaderContent>
      </HeaderSection>

      {/* View Mode Selector */}
      <ViewModeSelector>
        {[
          { mode: 'round1' as ViewMode, label: '1차 검사' },
          ...(hasRound2
            ? [
                { mode: 'round2' as ViewMode, label: '2차 검사' },
                { mode: 'compare' as ViewMode, label: '차수 변화' },
              ]
            : []),
        ].map(({ mode, label }) => (
          <ViewModeButton
            key={mode}
            onClick={() => setViewMode(mode)}
            $isActive={viewMode === mode}
          >
            {label}
          </ViewModeButton>
        ))}
      </ViewModeSelector>

      {/* 신뢰도 경고 배너 */}
      {detailData.reliabilityWarningOnly && (
        <WarningBanner>
          <WarningIcon />
          <WarningContent>
            <WarningTitle>모든 학생이 신뢰도 주의 상태입니다</WarningTitle>
            <WarningText>
              신뢰도 양호 학생이 없어 전체 학생 데이터를 기반으로 분석 결과를 표시합니다. 결과
              해석에 주의가 필요합니다.
            </WarningText>
          </WarningContent>
        </WarningBanner>
      )}

      {/* 1. 학급 종합 분석 */}
      <Section>
        <SectionTitle>학급 종합 분석</SectionTitle>
        <SectionCard>
          <ClassSummarySection
            detailData={detailData}
            profile={profile}
            classData={classData}
            round={selectedRound}
            isCompare={isCompare}
            prevProfile={isCompare ? prevProfile : undefined}
            prevDetailData={isCompare ? prevDetailData : undefined}
          />
        </SectionCard>
      </Section>

      {/* 2. 38개 세부 요인 분석 */}
      <Section>
        <SectionTitle>38개 세부 요인 분석</SectionTitle>
        <SectionCard>
          <FactorHeatmapSection
            domainData={detailData.domainData}
            prevDomainData={isCompare ? prevDetailData.domainData : undefined}
          />
        </SectionCard>
      </Section>

      {/* 3. 관심 필요 학생 */}
      <Section>
        <SectionTitle>관심 필요 학생</SectionTitle>
        <SectionCard>
          <RiskStudentsSection
            criticalStudents={detailData.criticalStudents}
            watchListStudents={detailData.watchListStudents}
            classId={classData.id}
            isCompare={isCompare}
            prevCriticalStudents={isCompare ? prevDetailData.criticalStudents : undefined}
            prevWatchListStudents={isCompare ? prevDetailData.watchListStudents : undefined}
          />
        </SectionCard>
      </Section>

      {/* 4. 학급 맞춤 운영 전략 */}
      <Section>
        <SectionTitle>학급 맞춤 운영 전략</SectionTitle>
        <SectionCard>
          <StrategySection profile={profile} prevProfile={isCompare ? prevProfile : undefined} />
        </SectionCard>
      </Section>
    </PageContainer>
  );
};

// ============================================================
// 종합검사 메인 컴포넌트: 로딩/에러/null 체크 후 ClassDetailContent 렌더링
// ============================================================
const ComprehensiveClassDetailPage: React.FC<{ classId?: string; testId: string }> = ({
  classId,
  testId,
}) => {
  const { getClassById } = useData();
  const { hasJwtToken } = useApiConfig();

  // L2와 동일하게 API에서 학생 데이터 가져오기
  const { students: apiStudents, isLoading, error } = useClassStudents(classId);

  const baseClassData = classId ? getClassById(classId) : undefined;

  // API 모드에서 학생 데이터가 있으면 classData 구성 (L2와 동일한 로직)
  const classData: Class | undefined = useMemo(() => {
    if (hasJwtToken && apiStudents.length > 0 && classId) {
      const firstStudent = apiStudents[0];
      const schoolLevel = firstStudent?.schoolLevel ?? '초등';
      const grade = firstStudent?.grade ?? 1;

      const parts = classId.split('-');
      const classNumber = parseInt(parts[1], 10) || 1;

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

    return baseClassData;
  }, [baseClassData, hasJwtToken, apiStudents, classId]);

  // API 모드 로딩 상태
  if (hasJwtToken && isLoading) {
    return (
      <CenterContainer>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>학급 분석 데이터를 불러오는 중...</LoadingText>
        </LoadingContainer>
      </CenterContainer>
    );
  }

  // API 에러 상태
  if (hasJwtToken && error) {
    return (
      <CenterContainer>
        <LoadingContainer>
          <ErrorIcon />
          <ErrorText>데이터 로드 실패: {error}</ErrorText>
        </LoadingContainer>
      </CenterContainer>
    );
  }

  if (!classData || !classId) {
    return (
      <CenterContainer>
        <ErrorText>학급 데이터를 찾을 수 없습니다.</ErrorText>
      </CenterContainer>
    );
  }

  // classData가 확정된 후에만 ClassDetailContent 렌더링
  return <ClassDetailContent classData={classData} classId={classId} testId={testId} />;
};

// ============================================================
// 자기조절학습검사 반 상세 분석 (20요인 반 평균)
// ============================================================
const SelfregClassDetailPage: React.FC<{ classId?: string }> = ({ classId }) => {
  const navigate = useNavigate();
  const { round1, round2, isLoading, error } = useSelfregClassAnalysis(classId);

  type ViewMode = 'round1' | 'round2' | 'compare';
  const [viewMode, setViewMode] = useState<ViewMode>('round1');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return (
      <CenterContainer>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>자기조절학습검사 분석 데이터를 불러오는 중...</LoadingText>
        </LoadingContainer>
      </CenterContainer>
    );
  }

  if (error) {
    return (
      <CenterContainer>
        <LoadingContainer>
          <ErrorIcon />
          <ErrorText>데이터 로드 실패: {error}</ErrorText>
        </LoadingContainer>
      </CenterContainer>
    );
  }

  if (!round1 && !round2) {
    return (
      <CenterContainer>
        <ErrorText>아직 시행한 자기조절학습검사 결과가 없습니다.</ErrorText>
      </CenterContainer>
    );
  }

  const hasRound2 = round2 !== null;
  const isCompare = viewMode === 'compare';
  const current = viewMode === 'round2' && round2 ? round2 : (round1 ?? round2)!;
  const prev = isCompare ? (round1 ?? undefined) : undefined;

  return (
    <PageContainer>
      <HeaderSection>
        <BackButton onClick={() => navigate(`/dashboard/selfreg/class/${classId}`)}>
          <BackIcon />
        </BackButton>
        <HeaderContent>
          <PageTitle>자기조절학습검사 학급 상세 분석</PageTitle>
          <PageSubtitle>학급 평균 20개 요인 분석</PageSubtitle>
        </HeaderContent>
      </HeaderSection>

      <ViewModeSelector>
        {[
          { mode: 'round1' as ViewMode, label: '1차 검사' },
          ...(hasRound2
            ? [
                { mode: 'round2' as ViewMode, label: '2차 검사' },
                { mode: 'compare' as ViewMode, label: '차수 변화' },
              ]
            : []),
        ].map(({ mode, label }) => (
          <ViewModeButton
            key={mode}
            onClick={() => setViewMode(mode)}
            $isActive={viewMode === mode}
          >
            {label}
          </ViewModeButton>
        ))}
      </ViewModeSelector>

      <Section>
        <SectionTitle>20개 세부 요인 분석</SectionTitle>
        <SelfregFactorAnalysis tScores={current} prevTScores={prev} showCompare={isCompare} />
      </Section>
    </PageContainer>
  );
};

// ============================================================
// 라우트 진입점: testId에 따라 종합/자기조절 분기
// ============================================================
export const ClassDetailAnalysisPage: React.FC = () => {
  const { classId, testId = 'comprehensive' } = useParams<{ classId: string; testId: string }>();

  if (testId === 'selfreg') {
    return <SelfregClassDetailPage classId={classId} />;
  }
  return <ComprehensiveClassDetailPage classId={classId} testId={testId} />;
};

export default ClassDetailAnalysisPage;
