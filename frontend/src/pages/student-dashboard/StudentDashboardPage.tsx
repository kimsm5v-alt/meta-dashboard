import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldAlert,
  AlertTriangle,
  Check,
  Clock,
  Loader2,
} from 'lucide-react';
import { useStudentAnalysis, useApiConfig } from '@features/api';
import { useStudentLearningStatusQuery } from '@features/exam-tracking/api/queries';
import {
  COUNSELOR_LABELS,
  LEVEL_LABELS,
  MOTIVATION_LABELS,
  STUDY_TIME_LABELS,
} from '@features/exam-tracking/api/studentLearningStatusService';
import { downloadStudentPdf } from '@shared/services/pdfDownloadService';
import { fetchStudentInfoList } from '@shared/services/dashboardService';
import { formatAttentionTooltip } from '@shared/utils/attentionChecker';
import { buildStudentDomainData } from '@shared/utils/buildStudentDomainData';
import { FACTOR_DEFINITIONS } from '@shared/data/factors';
import scriptsData from '@shared/data/scripts_depth3.json';
import { FactorHeatmapSection } from '@shared/components/FactorHeatmapSection';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_STUDENT_DETAIL } from '@shared/data/apiDefinitions';
import { DiagnosisSummary, TypeClassification } from '@features/student-dashboard/ui';
import { ResultCounselingObservationSection } from '@features/student-dashboard/ui/ResultCounselingObservationSection';
import type { Student, SchoolLevel } from '@shared/types';

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

const MainContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
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

const StepSection = styled.section`
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: 1rem;
`;

const StepNumber = styled.div<{ $color: string }>`
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: ${({ $color }) => $color};
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 700;
`;

const StepRail = styled.div`
  position: relative;
  display: flex;
  justify-content: center;

  &::after {
    position: absolute;
    top: 2.5rem;
    bottom: 0.5rem;
    width: 1px;
    background: ${({ theme }) => theme.colors.gray[300]};
    content: '';
  }
`;

const StepBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LearningStatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const LearningStatusItem = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  text-align: center;
`;

const FactorTopGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
  gap: 1rem;
`;

const SectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SurveyBadge = styled.span`
  padding: 0.125rem 0.5rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 0.75rem;
`;

const CoachingLinkButton = styled.button`
  align-self: flex-end;
  padding: 0.625rem 1.25rem;
  color: white;
  background: linear-gradient(90deg, #7c3aed, #4f46e5);
  border: 0;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
`;

const FactorTopColumn = styled.div`
  min-width: 0;
`;

const FactorTopDivider = styled.div`
  width: 1px;
  background: ${({ theme }) => theme.colors.gray[200]};
`;

const FactorTopHeading = styled.div<{ $tone: 'strength' | 'weakness' }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
  color: ${({ $tone }) => ($tone === 'strength' ? '#065F46' : '#991B1B')};
  font-size: 0.875rem;
  font-weight: 700;

  > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 0.25rem;
    background: ${({ $tone }) => ($tone === 'strength' ? '#D1FAE5' : '#FEE2E2')};
  }
`;

const FactorTopCards = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
`;

const FactorTopCard = styled.div<{ $tone: 'strength' | 'weakness' }>`
  min-width: 0;
  padding: 0.75rem;
  background: ${({ $tone }) =>
    $tone === 'strength' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'};
  border: 1px solid ${({ $tone }) => ($tone === 'strength' ? '#A7F3D0' : '#FECACA')};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const getFactorSummary = (factorName: string, score: number) => {
  const scripts = (
    scriptsData as {
      scripts: {
        depth3: string;
        tScore_lower: number | null;
        tScore_upper: number | null;
        summary: string;
      }[];
    }
  ).scripts;
  return scripts.find((script) => {
    const lower = script.tScore_lower ?? -Infinity;
    const upper = script.tScore_upper ?? Infinity;
    return script.depth3 === factorName && score >= lower && score <= upper;
  })?.summary;
};

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
  testId: string;
  hasJwtToken: boolean;
  dgnssIds: { round1?: number; round2?: number };
  onBackToClass?: () => void;
  onStudentSelect?: (studentId: string) => void;
}

const StudentDashboardContent: React.FC<StudentDashboardContentProps> = ({
  student,
  classStudents,
  classInfo,
  classId,
  studentId,
  testId,
  hasJwtToken,
  dgnssIds,
  onBackToClass,
  onStudentSelect,
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('round1');
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [studentId]);

  const selectedRound: 1 | 2 = viewMode === 'round1' ? 1 : 2;

  const learningStatusQuery = useStudentLearningStatusQuery(classId, studentId);
  const learningStatusRound = learningStatusQuery.data?.rounds.find(
    (round) => round.ordNo === selectedRound,
  );
  const learningStatusItems = [
    {
      label: '학업 성취도',
      value: learningStatusRound?.academicAchievement
        ? LEVEL_LABELS[learningStatusRound.academicAchievement]
        : '응답 정보 없음',
    },
    {
      label: '성적 만족도',
      value: learningStatusRound?.gradeSatisfaction
        ? LEVEL_LABELS[learningStatusRound.gradeSatisfaction]
        : '응답 정보 없음',
    },
    {
      label: '학습 동기',
      value: learningStatusRound?.learningMotivation
        ? MOTIVATION_LABELS[learningStatusRound.learningMotivation]
        : '응답 정보 없음',
    },
    {
      label: '혼자 공부 시간',
      value: learningStatusRound?.selfStudyTime
        ? STUDY_TIME_LABELS[learningStatusRound.selfStudyTime]
        : '응답 정보 없음',
    },
    {
      label: '학습 고민 상담',
      value: learningStatusRound?.learningCounselor
        ? COUNSELOR_LABELS[learningStatusRound.learningCounselor]
        : '응답 정보 없음',
    },
  ];

  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [r2AnswerIdx, setR2AnswerIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!pdfError) return;
    const id = setTimeout(() => setPdfError(false), 4000);
    return () => clearTimeout(id);
  }, [pdfError]);

  const r1 = student.assessments.find((a) => a.round === 1);
  const r2 = student.assessments.find((a) => a.round === 2);

  useEffect(() => {
    if (!hasJwtToken || !dgnssIds.round2 || r2?.answerIdx != null) return;
    void fetchStudentInfoList(dgnssIds.round2).then((list) => {
      const entry = list.find((item) => item.stdtId === studentId);
      if (entry) setR2AnswerIdx(entry.answerIdx);
    });
  }, [dgnssIds.round2, hasJwtToken, r2?.answerIdx, studentId]);

  const handleDownloadPdf = async (round: 1 | 2, type: 1 | 2) => {
    const dgnssId = round === 1 ? dgnssIds.round1 : dgnssIds.round2;
    const answerIdx = round === 1 ? r1?.answerIdx : (r2?.answerIdx ?? r2AnswerIdx);
    if (!dgnssId || answerIdx == null) return;
    setIsPdfDownloading(true);
    setPdfError(false);
    try {
      await downloadStudentPdf({
        userId: studentId,
        userType: 'S',
        dgnssId,
        answerIdx,
        ordNo: round,
        type,
      });
    } catch {
      setPdfError(true);
    } finally {
      setIsPdfDownloading(false);
    }
  };
  const isCompare = viewMode === 'compare';

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
  const factorRanking = useMemo(
    () =>
      FACTOR_DEFINITIONS.map((factor) => ({
        ...factor,
        score: current?.tScores[factor.index] ?? 50,
        relativeScore: factor.isPositive
          ? (current?.tScores[factor.index] ?? 50)
          : 100 - (current?.tScores[factor.index] ?? 50),
      })),
    [current?.tScores],
  );
  const topStrengths = [...factorRanking]
    .sort((a, b) => b.relativeScore - a.relativeScore)
    .slice(0, 3);
  const topWeaknesses = [...factorRanking]
    .sort((a, b) => a.relativeScore - b.relativeScore)
    .slice(0, 3);

  const currentIdx = classStudents.findIndex((s) => s.id === studentId);
  const prev = currentIdx > 0 ? classStudents[currentIdx - 1] : null;
  const next = currentIdx < classStudents.length - 1 ? classStudents[currentIdx + 1] : null;
  const handleBackToClass = () => {
    if (onBackToClass) {
      onBackToClass();
      return;
    }
    navigate(`/dashboard/${testId}/class/${classId}`);
  };
  const handleStudentSelect = (nextStudentId: string) => {
    if (onStudentSelect) {
      onStudentSelect(nextStudentId);
      return;
    }
    navigate(`/dashboard/${testId}/class/${classId}/student/${nextStudentId}`);
  };

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
      <MainContent>
        {/* Header */}
        <HeaderSection>
          <HeaderLeft>
            <BackButton onClick={handleBackToClass}>
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
                {classInfo.schoolLevel} {classInfo.grade}학년 {classInfo.classNumber}반
              </ClassInfo>
            </HeaderTitle>
          </HeaderLeft>

          <HeaderRight>
            {/* 학생 네비게이션 — 프로토타입: ‹ 이전 / X/N / 다음 › 텍스트 버튼 */}
            <NavigationSection>
              <NavButton
                onClick={() => prev && handleStudentSelect(prev.id)}
                disabled={!prev}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.125rem',
                  padding: '0.375rem 0.625rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  background: 'white',
                  color: '#374151',
                }}
              >
                <ChevronLeft size={14} /> 이전
              </NavButton>
              <NavCounter>
                {currentIdx + 1} / {classStudents.length}
              </NavCounter>
              <NavButton
                onClick={() => next && handleStudentSelect(next.id)}
                disabled={!next}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.125rem',
                  padding: '0.375rem 0.625rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  background: 'white',
                  color: '#374151',
                }}
              >
                다음 <ChevronRight size={14} />
              </NavButton>
            </NavigationSection>
            {hasJwtToken && (
              <button
                onClick={() => setReportDropdownOpen((open) => !open)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.875rem',
                  background: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <FileText size={15} />
                보고서 다운로드
                <ChevronRight size={14} />
              </button>
            )}
          </HeaderRight>
        </HeaderSection>

        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            paddingLeft: '3.25rem',
            fontSize: '0.875rem',
            color: '#6B7280',
          }}
        >
          {r1 && <span>1차 검사: {r1.assessedAt.toLocaleDateString('ko-KR')}</span>}
          {r2 && <span>2차 검사: {r2.assessedAt.toLocaleDateString('ko-KR')}</span>}
        </div>

        {/* AI 분석 총평 */}
        <DiagnosisSummary tScores={current.tScores} studentType={current.predictedType} />

        {/* Round Selector + 보고서 다운로드 드롭다운 + Panel Buttons */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {/* 보고서 다운로드 드롭다운 — 프로토타입과 동일 위치 */}
            {hasJwtToken && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setReportDropdownOpen((v) => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 0.875rem',
                    background: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    visibility: 'hidden',
                  }}
                >
                  <FileText size={15} />
                  보고서 다운로드
                  <ChevronRight
                    size={14}
                    style={{
                      transform: reportDropdownOpen ? 'rotate(90deg)' : 'rotate(0)',
                      transition: 'transform 0.15s',
                    }}
                  />
                </button>
                {reportDropdownOpen && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                      onClick={() => setReportDropdownOpen(false)}
                    />
                    <div
                      style={{
                        position: 'fixed',
                        right: '2.5rem',
                        top: '11rem',
                        width: '14rem',
                        background: 'white',
                        borderRadius: '0.625rem',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        border: '1px solid #E5E7EB',
                        padding: '0.5rem 0',
                        zIndex: 20,
                      }}
                    >
                      <div style={{ padding: '0.375rem 0.75rem' }}>
                        <p
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#6B7280',
                            marginBottom: '0.25rem',
                          }}
                        >
                          1차 검사 {!r1 && <span style={{ color: '#D1D5DB' }}>(미실시)</span>}
                        </p>
                        <button
                          disabled={isPdfDownloading || r1?.answerIdx == null}
                          onClick={() =>
                            void handleDownloadPdf(1, 1).then(() => setReportDropdownOpen(false))
                          }
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.375rem 0.5rem',
                            fontSize: '0.875rem',
                            color: '#374151',
                            background: 'none',
                            border: 'none',
                            cursor: r1?.answerIdx != null ? 'pointer' : 'not-allowed',
                            opacity: r1?.answerIdx != null ? 1 : 0.4,
                            borderRadius: '0.375rem',
                          }}
                        >
                          <FileText size={14} color='#EF4444' /> 상세 보고서
                        </button>
                        <button
                          disabled={isPdfDownloading || r1?.answerIdx == null}
                          onClick={() =>
                            void handleDownloadPdf(1, 2).then(() => setReportDropdownOpen(false))
                          }
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.375rem 0.5rem',
                            fontSize: '0.875rem',
                            color: '#374151',
                            background: 'none',
                            border: 'none',
                            cursor: r1?.answerIdx != null ? 'pointer' : 'not-allowed',
                            opacity: r1?.answerIdx != null ? 1 : 0.4,
                            borderRadius: '0.375rem',
                          }}
                        >
                          <FileText size={14} color='#EF4444' /> 요약 보고서
                        </button>
                      </div>
                      {r2 && (
                        <>
                          <div style={{ borderTop: '1px solid #F3F4F6', margin: '0.25rem 0' }} />
                          <div style={{ padding: '0.375rem 0.75rem' }}>
                            <p
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#6B7280',
                                marginBottom: '0.25rem',
                              }}
                            >
                              2차 검사
                            </p>
                            <button
                              disabled={
                                isPdfDownloading || (r2?.answerIdx == null && r2AnswerIdx == null)
                              }
                              onClick={() =>
                                void handleDownloadPdf(2, 1).then(() =>
                                  setReportDropdownOpen(false),
                                )
                              }
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.375rem 0.5rem',
                                fontSize: '0.875rem',
                                color: '#374151',
                                background: 'none',
                                border: 'none',
                                cursor:
                                  r2?.answerIdx != null || r2AnswerIdx != null
                                    ? 'pointer'
                                    : 'not-allowed',
                                opacity: r2?.answerIdx != null || r2AnswerIdx != null ? 1 : 0.4,
                                borderRadius: '0.375rem',
                              }}
                            >
                              <FileText size={14} color='#EF4444' /> 상세 보고서
                            </button>
                            <button
                              disabled={
                                isPdfDownloading || (r2?.answerIdx == null && r2AnswerIdx == null)
                              }
                              onClick={() =>
                                void handleDownloadPdf(2, 2).then(() =>
                                  setReportDropdownOpen(false),
                                )
                              }
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.375rem 0.5rem',
                                fontSize: '0.875rem',
                                color: '#374151',
                                background: 'none',
                                border: 'none',
                                cursor:
                                  r2?.answerIdx != null || r2AnswerIdx != null
                                    ? 'pointer'
                                    : 'not-allowed',
                                opacity: r2?.answerIdx != null || r2AnswerIdx != null ? 1 : 0.4,
                                borderRadius: '0.375rem',
                              }}
                            >
                              <FileText size={14} color='#EF4444' /> 요약 보고서
                            </button>
                          </div>
                        </>
                      )}
                      {pdfError && (
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: '#EF4444',
                            padding: '0.25rem 0.75rem',
                          }}
                        >
                          다운로드 실패
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </ControlsSection>

        {/* 2차 검사 진행중 안내 (Mock 모드에서만 표시) */}
        {!hasJwtToken && student.round2Submitted && (
          <InfoAlert>
            <InfoIcon />
            <InfoText>이 학생은 2차 검사를 제출했습니다. 검사 종료 후 결과가 공개됩니다.</InfoText>
          </InfoAlert>
        )}

        <StepSection>
          <StepRail>
            <StepNumber $color='#7C3AED'>1</StepNumber>
          </StepRail>
          <StepBody>
            <SectionHeader>
              <div>
                <SectionTitle>학습 현황</SectionTitle>
                <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6B7280' }}>
                  학생이 직접 응답한 학습 상황입니다.
                </p>
              </div>
            </SectionHeader>
            <SectionCard>
              <CardSection>
                <SectionTitleRow style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>개인 학습 현황</h3>
                  <SurveyBadge>설문 응답</SurveyBadge>
                </SectionTitleRow>
                <LearningStatusGrid>
                  {learningStatusItems.map(({ label, value }) => (
                    <LearningStatusItem key={label}>
                      <p style={{ margin: '0 0 0.5rem', color: '#6B7280', fontSize: '0.75rem' }}>
                        {label}
                      </p>
                      <strong style={{ fontSize: '0.875rem', color: '#374151' }}>{value}</strong>
                    </LearningStatusItem>
                  ))}
                </LearningStatusGrid>
              </CardSection>
            </SectionCard>
          </StepBody>
        </StepSection>

        {/* 요인 분석 */}
        <StepSection>
          <StepRail>
            <StepNumber $color='#3B82F6'>2</StepNumber>
          </StepRail>
          <StepBody>
            <SectionContainer>
              <SectionHeader>
                <div>
                  <SectionTitle>요인 분석</SectionTitle>
                  <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6B7280' }}>
                    38개 학습 요인의 세부 점수를 분석합니다.
                  </p>
                </div>
              </SectionHeader>
              <SectionCard>
                <CardSection>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>38개 요인 분석</h3>
                  <FactorHeatmapSection domainData={domainData} prevDomainData={prevDomainData} />
                </CardSection>
              </SectionCard>
            </SectionContainer>
            <SectionCard>
              <CardSection>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>강점 / 보완점 Top 3</h3>
                <FactorTopGrid>
                  <FactorTopColumn>
                    <FactorTopHeading $tone='strength'>
                      <span>
                        <Check size={12} strokeWidth={2.5} />
                      </span>
                      주요 강점
                    </FactorTopHeading>
                    <FactorTopCards>
                      {topStrengths.map((factor, index) => (
                        <FactorTopCard key={factor.index} $tone='strength'>
                          <span
                            style={{ color: '#059669', fontSize: '0.6875rem', fontWeight: 600 }}
                          >
                            #{factor.category}
                          </span>
                          <p
                            style={{ margin: '0.375rem 0', fontSize: '0.875rem', fontWeight: 700 }}
                          >
                            {index + 1}. {factor.name}
                          </p>
                          {getFactorSummary(factor.name, factor.score) && (
                            <p
                              style={{
                                margin: '0.5rem 0 0',
                                color: '#6B7280',
                                fontSize: '0.6875rem',
                                lineHeight: 1.45,
                              }}
                            >
                              {getFactorSummary(factor.name, factor.score)}
                            </p>
                          )}
                        </FactorTopCard>
                      ))}
                    </FactorTopCards>
                  </FactorTopColumn>
                  <FactorTopDivider />
                  <FactorTopColumn>
                    <FactorTopHeading $tone='weakness'>
                      <span>
                        <AlertTriangle size={12} strokeWidth={2.5} />
                      </span>
                      주요 보완점
                    </FactorTopHeading>
                    <FactorTopCards>
                      {topWeaknesses.map((factor, index) => (
                        <FactorTopCard key={factor.index} $tone='weakness'>
                          <span
                            style={{ color: '#EF4444', fontSize: '0.6875rem', fontWeight: 600 }}
                          >
                            #{factor.category}
                          </span>
                          <p
                            style={{ margin: '0.375rem 0', fontSize: '0.875rem', fontWeight: 700 }}
                          >
                            {index + 1}. {factor.name}
                          </p>
                          {getFactorSummary(factor.name, factor.score) && (
                            <p
                              style={{
                                margin: '0.5rem 0 0',
                                color: '#6B7280',
                                fontSize: '0.6875rem',
                                lineHeight: 1.45,
                              }}
                            >
                              {getFactorSummary(factor.name, factor.score)}
                            </p>
                          )}
                        </FactorTopCard>
                      ))}
                    </FactorTopCards>
                  </FactorTopColumn>
                </FactorTopGrid>
              </CardSection>
            </SectionCard>
          </StepBody>
        </StepSection>

        {/* 2. 학습 유형 알아보기 - 고등학교(LPA 미제공) 제외 */}
        {student.schoolLevel !== '고등' && current.predictedType !== '미지원' && (
          <StepSection>
            <StepRail>
              <StepNumber $color='#22C55E'>3</StepNumber>
            </StepRail>
            <StepBody>
              <SectionContainer>
                <SectionHeader>
                  <div>
                    <SectionTitle>{isCompare ? 'LPA 유형 변화' : '학습 유형'}</SectionTitle>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6B7280' }}>
                      38개 요인 패턴을 종합하여 분류한 학습자 유형입니다.
                    </p>
                  </div>
                </SectionHeader>
                <SectionCard>
                  {/* 유형 분류 */}
                  <CardSection $hasBorder>
                    <TypeClassification
                      predictedType={current.predictedType}
                      typeProbabilities={current.typeProbabilities}
                      schoolLevel={student.schoolLevel}
                      showCompare={isCompare && !!r1 && !!r2}
                      prevType={r1?.predictedType}
                      prevTypeProbabilities={r1?.typeProbabilities}
                    />
                  </CardSection>
                </SectionCard>
              </SectionContainer>
            </StepBody>
          </StepSection>
        )}

        <StepSection>
          <StepRail>
            <StepNumber $color='#F59E0B'>4</StepNumber>
          </StepRail>
          <StepBody>
            <SectionHeader>
              <div>
                <SectionTitle>상담 & 관찰</SectionTitle>
                <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6B7280' }}>
                  상담 & 관찰 이력을 작성하고 확인합니다.
                </p>
              </div>
            </SectionHeader>
            <ResultCounselingObservationSection
              studentId={studentId}
              classId={classId}
              studentName={student.name}
              studentNumber={student.number}
            />
          </StepBody>
        </StepSection>
        <CoachingLinkButton
          onClick={() => navigate(`/coaching/individual?class=${classId}&student=${studentId}`)}
        >
          코칭 연결
        </CoachingLinkButton>
      </MainContent>
    </MainLayout>
  );
};

// ============================================================
// 메인 컴포넌트: 로딩/에러/null 체크 후 StudentDashboardContent 렌더링
// ============================================================
interface StudentDashboardPageProps {
  classIdOverride?: string;
  studentIdOverride?: string;
  testIdOverride?: string;
  onBackToClass?: () => void;
  onStudentSelect?: (studentId: string) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  classIdOverride,
  studentIdOverride,
  testIdOverride,
  onBackToClass,
  onStudentSelect,
}) => {
  const {
    classId: routeClassId,
    studentId: routeStudentId,
    testId: routeTestId = 'comprehensive',
  } = useParams<{ classId: string; studentId: string; testId: string }>();
  const classId = classIdOverride ?? routeClassId;
  const studentId = studentIdOverride ?? routeStudentId;
  const testId = testIdOverride ?? routeTestId;
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
      testId={testId}
      hasJwtToken={hasJwtToken}
      dgnssIds={dgnssIds}
      onBackToClass={onBackToClass}
      onStudentSelect={onStudentSelect}
    />
  );
};

export default StudentDashboardPage;
