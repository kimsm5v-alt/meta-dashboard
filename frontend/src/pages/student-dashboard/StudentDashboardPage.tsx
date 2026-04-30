import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  Eye,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Loader2,
  Lightbulb,
  Download,
} from 'lucide-react';
import { useStudentAnalysis, useApiConfig } from '@features/api';
import { downloadStudentPdf } from '@shared/services/pdfDownloadService';
import { formatAttentionTooltip } from '@shared/utils/attentionChecker';
import { buildStudentDomainData } from '@shared/utils/buildStudentDomainData';
import { FactorHeatmapSection } from '@shared/components/FactorHeatmapSection';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_STUDENT_DETAIL } from '@shared/data/apiDefinitions';
import {
  DiagnosisSummary,
  TypeClassification,
  TypeDeviations,
  CoachingStrategy,
  RightPanel,
  DataHelperChatbot,
  type PanelTab,
} from '@features/student-dashboard/ui';
import { useCoachingStrategy } from '@features/student-dashboard/api/useCoachingStrategy';
import type { Student, SchoolLevel } from '@shared/types';

// 헤더 버튼 설정
const PANEL_BUTTONS = [
  { key: 'schoolRecord' as const, label: '생기부', icon: FileText },
  { key: 'counseling' as const, label: '상담', icon: MessageSquare },
  { key: 'observation' as const, label: '관찰', icon: Eye },
];

type ViewMode = 'round1' | 'round2' | 'compare';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const CenterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
`;

const CenterContent = styled.div`
  text-align: center;
`;

const EmptyMessage = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const MainLayout = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const MainContent = styled.div<{ $panelOpen: boolean }>`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  transition: all 0.3s ease;
  padding-right: ${({ $panelOpen }) => ($panelOpen ? '0' : undefined)};
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderLeft = styled.div`
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

const HeaderTitle = styled.div``;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
`;

const WarningBadge = styled.span<{ $variant: 'reliability' | 'attention' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid;
  font-size: 0.75rem;
  font-weight: 600;

  ${({ $variant }) =>
    $variant === 'reliability'
      ? `
    background: #fef2f2;
    color: #dc2626;
    border-color: #fecaca;
  `
      : `
    background: #fffbeb;
    color: #d97706;
    border-color: #fde68a;
  `}
`;

const WarningIcon = styled.div`
  width: 0.875rem;
  height: 0.875rem;
`;

const ClassInfo = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const NavigationSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavButton = styled.button`
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.15s ease;
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NavIcon = styled.div`
  width: 1.25rem;
  height: 1.25rem;
`;

const NavCounter = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ControlsSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RoundButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const RoundButton = styled.button<{ $isActive: boolean }>`
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

const PanelButtons = styled.div`
  display: flex;
  gap: 0.375rem;
`;

const PanelButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.15s ease;
  background: white;
  color: ${({ theme }) => theme.colors.gray[600]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PanelButtonIcon = styled.div`
  width: 1rem;
  height: 1rem;
`;

const InfoAlert = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const InfoIcon = styled(Clock)`
  width: 1rem;
  height: 1rem;
  color: #3b82f6;
  flex-shrink: 0;
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: #1e40af;
`;

const SectionContainer = styled.section``;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
`;


const SectionCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const CardSection = styled.div<{ $hasBorder?: boolean }>`
  padding: 1.5rem;
  ${({ $hasBorder, theme }) =>
    $hasBorder ? `border-bottom: 1px solid ${theme.colors.gray[200]};` : ''}
`;

const LoadingSpinner = styled(Loader2)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme }) => theme.colors.primary[500]};
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 0.5rem;
`;

const ErrorIcon = styled(AlertTriangle)`
  width: 2rem;
  height: 2rem;
  color: #f59e0b;
  margin: 0 auto 0.5rem;
`;

// ============================================================
// 내부 컴포넌트: student, classInfo, current가 확정된 후에만 렌더링
// ============================================================
interface StudentDashboardContentProps {
  student: Student;
  classStudents: Student[];
  classInfo: { grade: number; classNumber: number; schoolLevel: SchoolLevel };
  classId: string;
  studentId: string;
  hasJwtToken: boolean;
  dgnssIds: { round1?: number; round2?: number };
}

const StudentDashboardContent: React.FC<StudentDashboardContentProps> = ({
  student,
  classStudents,
  classInfo,
  classId,
  studentId,
  hasJwtToken,
  dgnssIds,
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('round1');
  const [isCoachingOpen, setIsCoachingOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [studentId]);

  const selectedRound: 1 | 2 = viewMode === 'round1' ? 1 : 2;

  // 코칭 전략 API 호출
  const {
    moderationPaths,
    isLoading: isCoachingLoading,
    fetchCoachingStrategy,
  } = useCoachingStrategy(classId, studentId, selectedRound);

  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  const handleDownloadPdf = async (ordNo: 1 | 2) => {
    const dgnssId = ordNo === 1 ? dgnssIds.round1 : dgnssIds.round2;
    const assessment = student.assessments.find((a) => a.round === ordNo);
    if (!dgnssId || assessment?.answerIdx == null) return;
    setIsPdfDownloading(true);
    try {
      await downloadStudentPdf({
        userId: studentId,
        userType: 'S',
        dgnssId,
        answerIdx: assessment.answerIdx,
        ordNo,
      });
    } finally {
      setIsPdfDownloading(false);
    }
  };
  const isCompare = viewMode === 'compare';

  const r1 = student.assessments.find((a) => a.round === 1);
  const r2 = student.assessments.find((a) => a.round === 2);
  const current = selectedRound === 2 && r2 ? r2 : r1;

  // useMemo는 항상 호출 (current가 없으면 빈 배열 사용)
  const domainData = useMemo(
    () => (current ? buildStudentDomainData(current.tScores, current.midCategoryScores) : []),
    [current],
  );
  const prevDomainData = useMemo(
    () => (isCompare && r1 ? buildStudentDomainData(r1.tScores, r1.midCategoryScores) : undefined),
    [isCompare, r1],
  );

  const currentIdx = classStudents.findIndex((s) => s.id === studentId);
  const prev = currentIdx > 0 ? classStudents[currentIdx - 1] : null;
  const next = currentIdx < classStudents.length - 1 ? classStudents[currentIdx + 1] : null;

  // current가 없으면 검사 결과 없음 표시
  if (!current) {
    return (
      <CenterContainer>
        <EmptyMessage>검사 결과가 없습니다.</EmptyMessage>
      </CenterContainer>
    );
  }

  return (
    <MainLayout>
      {/* 메인 콘텐츠 */}
      <MainContent $panelOpen={panelTab !== null}>
        {/* Header */}
        <HeaderSection>
          <HeaderLeft>
            <BackButton onClick={() => navigate(`/dashboard/class/${classId}`)}>
              <BackIcon />
            </BackButton>
            <HeaderTitle>
              <TitleRow>
                <ApiTooltip {...API_STUDENT_DETAIL} position='top-right'>
                  <PageTitle>
                    {student.number}번 {student.name}
                  </PageTitle>
                </ApiTooltip>
                {current.reliabilityWarnings.length > 0 && (
                  <WarningBadge
                    $variant='reliability'
                    title={`신뢰도 주의: ${current.reliabilityWarnings.join(', ')}`}
                  >
                    <WarningIcon as={ShieldAlert} />
                    신뢰도 주의
                  </WarningBadge>
                )}
                {current.attentionResult.needsAttention && (
                  <WarningBadge
                    $variant='attention'
                    title={formatAttentionTooltip(current.attentionResult)}
                  >
                    <WarningIcon as={AlertTriangle} />
                    관심 필요
                  </WarningBadge>
                )}
              </TitleRow>
              <ClassInfo>
                {classInfo.grade}학년 {classInfo.classNumber}반
              </ClassInfo>
            </HeaderTitle>
          </HeaderLeft>

          {/* 학생 네비게이션 */}
          <NavigationSection>
            <NavButton
              onClick={() => prev && navigate(`/dashboard/class/${classId}/student/${prev.id}`)}
              disabled={!prev}
            >
              <NavIcon as={ChevronLeft} />
            </NavButton>
            <NavCounter>
              {currentIdx + 1} / {classStudents.length}
            </NavCounter>
            <NavButton
              onClick={() => next && navigate(`/dashboard/class/${classId}/student/${next.id}`)}
              disabled={!next}
            >
              <NavIcon as={ChevronRight} />
            </NavButton>
          </NavigationSection>
        </HeaderSection>

        {/* Round Selector + Panel Buttons */}
        <ControlsSection>
          <RoundButtons>
            {[
              { mode: 'round1' as ViewMode, label: '1차 검사' },
              ...(r2
                ? [
                    { mode: 'round2' as ViewMode, label: '2차 검사' },
                    { mode: 'compare' as ViewMode, label: '차수 변화' },
                  ]
                : []),
            ].map(({ mode, label }) => (
              <RoundButton
                key={mode}
                $isActive={viewMode === mode}
                onClick={() => setViewMode(mode)}
              >
                {label}
              </RoundButton>
            ))}
          </RoundButtons>
          {!panelTab && (
            <PanelButtons>
              {PANEL_BUTTONS.map((btn) => {
                const Icon = btn.icon;
                return (
                  <PanelButton key={btn.key} onClick={() => setPanelTab(btn.key)}>
                    <PanelButtonIcon as={Icon} />
                    {btn.label}
                  </PanelButton>
                );
              })}
              {/* 코칭 전략 버튼 */}
              <PanelButton
                onClick={async () => {
                  await fetchCoachingStrategy();
                  setIsCoachingOpen(true);
                }}
                disabled={isCoachingLoading}
              >
                <PanelButtonIcon as={Lightbulb} />
                {isCoachingLoading ? '로딩중...' : '코칭 전략'}
              </PanelButton>
              {/* PDF 다운로드 버튼 */}
              {hasJwtToken && (
                <>
                  <PanelButton
                    onClick={() => void handleDownloadPdf(1)}
                    disabled={isPdfDownloading || !dgnssIds.round1 || !r1?.answerIdx}
                    title={
                      dgnssIds.round1 && r1?.answerIdx != null
                        ? '1차 결과 PDF 다운로드'
                        : '1차 검사 결과 없음'
                    }
                  >
                    <PanelButtonIcon as={Download} />
                    1차 PDF
                  </PanelButton>
                  {r2 && (
                    <PanelButton
                      onClick={() => void handleDownloadPdf(2)}
                      disabled={isPdfDownloading || !dgnssIds.round2 || !r2?.answerIdx}
                      title={
                        dgnssIds.round2 && r2?.answerIdx != null
                          ? '2차 결과 PDF 다운로드'
                          : '2차 검사 결과 없음'
                      }
                    >
                      <PanelButtonIcon as={Download} />
                      2차 PDF
                    </PanelButton>
                  )}
                </>
              )}
            </PanelButtons>
          )}
        </ControlsSection>

        {/* 2차 검사 진행중 안내 (Mock 모드에서만 표시) */}
        {!hasJwtToken && student.round2Submitted && (
          <InfoAlert>
            <InfoIcon />
            <InfoText>이 학생은 2차 검사를 제출했습니다. 검사 종료 후 결과가 공개됩니다.</InfoText>
          </InfoAlert>
        )}

        {/* 1. 진단결과 한눈에 보기 */}
        <SectionContainer>
          <SectionHeader>
            <SectionTitle>학생 진단 결과 해석</SectionTitle>
          </SectionHeader>
          <SectionCard>
            {/* 총평 */}
            <CardSection $hasBorder>
              <DiagnosisSummary tScores={current.tScores} studentType={current.predictedType} />
            </CardSection>

            <CardSection>
              <FactorHeatmapSection domainData={domainData} prevDomainData={prevDomainData} />
            </CardSection>
          </SectionCard>
        </SectionContainer>

        {/* 2. 학습 유형 알아보기 */}
        <SectionContainer>
          <SectionTitle>학습 유형 알아보기</SectionTitle>
          <SectionCard>
            {/* 유형 분류 */}
            <CardSection $hasBorder>
              <TypeClassification
                predictedType={current.predictedType}
                typeProbabilities={current.typeProbabilities}
                schoolLevel={student.schoolLevel}
              />
            </CardSection>

            {/* 유형별 특이점 + 코칭 전략 버튼 */}
            <CardSection>
              <TypeDeviations
                tScores={current.tScores}
                predictedType={current.predictedType}
                schoolLevel={student.schoolLevel}
                onCoachingClick={() => setIsCoachingOpen(true)}
              />
            </CardSection>
          </SectionCard>
        </SectionContainer>

        {/* 코칭 전략 모달 */}
        <CoachingStrategy
          moderationPaths={moderationPaths}
          typeName={current.predictedType}
          typeDescription={`${student.schoolLevel} ${classInfo.grade}학년 ${current.predictedType}`}
          isOpen={isCoachingOpen}
          onClose={() => setIsCoachingOpen(false)}
        />

        {/* 데이터 해석 도우미 (플로팅 챗봇) */}
        <DataHelperChatbot
          tScores={current.tScores}
          predictedType={current.predictedType}
          typeProbabilities={current.typeProbabilities}
          schoolLevel={student.schoolLevel}
          deviations={current.deviations}
        />
      </MainContent>

      {/* 우측 푸시 패널 */}
      <RightPanel
        isOpen={panelTab !== null}
        activeTab={panelTab}
        onTabChange={setPanelTab}
        onClose={() => setPanelTab(null)}
        studentId={studentId}
        classId={classId}
        student={student}
        assessment={current}
      />
    </MainLayout>
  );
};

// ============================================================
// 메인 컴포넌트: 로딩/에러/null 체크 후 StudentDashboardContent 렌더링
// ============================================================
export const StudentDashboardPage = () => {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const { hasJwtToken } = useApiConfig();

  // API 모드: API에서 학생 데이터 + 학급 학생 목록 로드
  // Mock 모드: DataContext에서 데이터 사용
  const { student, classStudents, classInfo, dgnssIds, isLoading, error } = useStudentAnalysis(
    classId,
    studentId,
  );

  // 로딩 상태
  if (hasJwtToken && isLoading) {
    return (
      <CenterContainer>
        <CenterContent>
          <LoadingSpinner />
          <EmptyMessage>학생 데이터를 불러오는 중...</EmptyMessage>
        </CenterContent>
      </CenterContainer>
    );
  }

  // 에러 상태
  if (hasJwtToken && error) {
    return (
      <CenterContainer>
        <CenterContent>
          <ErrorIcon />
          <EmptyMessage>데이터 로드 실패: {error}</EmptyMessage>
        </CenterContent>
      </CenterContainer>
    );
  }

  if (!student || !classInfo || !classId || !studentId) {
    return (
      <CenterContainer>
        <EmptyMessage>학생을 찾을 수 없습니다.</EmptyMessage>
      </CenterContainer>
    );
  }

  // student, classInfo가 확정된 후에만 StudentDashboardContent 렌더링
  return (
    <StudentDashboardContent
      student={student}
      classStudents={classStudents}
      classInfo={classInfo}
      classId={classId}
      studentId={studentId}
      hasJwtToken={hasJwtToken}
      dgnssIds={dgnssIds}
    />
  );
};

export default StudentDashboardPage;
