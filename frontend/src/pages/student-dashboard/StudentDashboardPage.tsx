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
  Clock,
  Loader2,
} from 'lucide-react';
import { useStudentAnalysis, useApiConfig } from '@features/api';
import { downloadStudentPdf } from '@shared/services/pdfDownloadService';
import { fetchStudentInfoList } from '@shared/services/dashboardService';
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

const TEST_META: Record<string, { name: string; color: string }> = {
  comprehensive: { name: '학습종합검사', color: '#6366F1' },
  selfreg: { name: '자기조절학습검사', color: '#009F88' },
};

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

const BreadcrumbRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
`;

const TestBadge = styled.span<{ $color: string }>`
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const BreadcrumbNav = styled.nav`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const BreadcrumbSep = styled.span`
  color: ${({ theme }) => theme.colors.gray[300]};
  margin: 0 0.125rem;
`;

const BreadcrumbCurrent = styled.span`
  color: ${({ theme }) => theme.colors.gray[800]};
  font-weight: 500;
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
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('round1');
  const [panelTab, setPanelTab] = useState<PanelTab>(null);
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);

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

  // 학생/차수 변경 시 코칭 전략 자동 로드
  useEffect(() => {
    void fetchCoachingStrategy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, selectedRound]);

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
        {/* 브레드크럼 */}
        <BreadcrumbRow>
          <TestBadge $color={TEST_META[testId]?.color ?? '#6366F1'}>
            {TEST_META[testId]?.name ?? testId}
          </TestBadge>
          <BreadcrumbNav>
            결과보기
            <BreadcrumbSep>›</BreadcrumbSep>
            {TEST_META[testId]?.name ?? testId}
            <BreadcrumbSep>›</BreadcrumbSep>
            {classInfo.grade}학년 {classInfo.classNumber}반
            <BreadcrumbSep>›</BreadcrumbSep>
            <BreadcrumbCurrent>{student.number}번 {student.name}</BreadcrumbCurrent>
          </BreadcrumbNav>
        </BreadcrumbRow>

        {/* Header */}
        <HeaderSection>
          <HeaderLeft>
            <BackButton onClick={() => navigate(`/dashboard/${testId}/class/${classId}`)}>
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
                {classInfo.schoolLevel} · {classInfo.grade}학년 {classInfo.classNumber}반
              </ClassInfo>
            </HeaderTitle>
          </HeaderLeft>

          <HeaderRight>
            {/* 학생 네비게이션 — 프로토타입: ‹ 이전 / X/N / 다음 › 텍스트 버튼 */}
            <NavigationSection>
              <NavButton
                onClick={() => prev && navigate(`/dashboard/${testId}/class/${classId}/student/${prev.id}`)}
                disabled={!prev}
                style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', padding: '0.375rem 0.625rem', fontSize: '0.875rem', fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: '0.5rem', background: 'white', color: '#374151' }}
              >
                <ChevronLeft size={14} /> 이전
              </NavButton>
              <NavCounter>
                {currentIdx + 1} / {classStudents.length}
              </NavCounter>
              <NavButton
                onClick={() => next && navigate(`/dashboard/${testId}/class/${classId}/student/${next.id}`)}
                disabled={!next}
                style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', padding: '0.375rem 0.625rem', fontSize: '0.875rem', fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: '0.5rem', background: 'white', color: '#374151' }}
              >
                다음 <ChevronRight size={14} />
              </NavButton>
            </NavigationSection>
          </HeaderRight>
        </HeaderSection>

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
                  onClick={() => setReportDropdownOpen(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
                >
                  <FileText size={15} />
                  보고서 다운로드
                  <ChevronRight size={14} style={{ transform: reportDropdownOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }} />
                </button>
                {reportDropdownOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setReportDropdownOpen(false)} />
                    <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', width: '14rem', background: 'white', borderRadius: '0.625rem', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB', padding: '0.5rem 0', zIndex: 20 }}>
                      <div style={{ padding: '0.375rem 0.75rem' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: '0.25rem' }}>1차 검사 {!r1 && <span style={{ color: '#D1D5DB' }}>(미실시)</span>}</p>
                        <button disabled={isPdfDownloading || r1?.answerIdx == null} onClick={() => void handleDownloadPdf(1, 1).then(() => setReportDropdownOpen(false))}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', fontSize: '0.875rem', color: '#374151', background: 'none', border: 'none', cursor: r1?.answerIdx != null ? 'pointer' : 'not-allowed', opacity: r1?.answerIdx != null ? 1 : 0.4, borderRadius: '0.375rem' }}>
                          <FileText size={14} color="#EF4444" /> 상세 보고서
                        </button>
                        <button disabled={isPdfDownloading || r1?.answerIdx == null} onClick={() => void handleDownloadPdf(1, 2).then(() => setReportDropdownOpen(false))}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', fontSize: '0.875rem', color: '#374151', background: 'none', border: 'none', cursor: r1?.answerIdx != null ? 'pointer' : 'not-allowed', opacity: r1?.answerIdx != null ? 1 : 0.4, borderRadius: '0.375rem' }}>
                          <FileText size={14} color="#EF4444" /> 요약 보고서
                        </button>
                      </div>
                      {r2 && (
                        <>
                          <div style={{ borderTop: '1px solid #F3F4F6', margin: '0.25rem 0' }} />
                          <div style={{ padding: '0.375rem 0.75rem' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: '0.25rem' }}>2차 검사</p>
                            <button disabled={isPdfDownloading || (r2?.answerIdx == null && r2AnswerIdx == null)} onClick={() => void handleDownloadPdf(2, 1).then(() => setReportDropdownOpen(false))}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', fontSize: '0.875rem', color: '#374151', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.375rem' }}>
                              <FileText size={14} color="#EF4444" /> 상세 보고서
                            </button>
                            <button disabled={isPdfDownloading || (r2?.answerIdx == null && r2AnswerIdx == null)} onClick={() => void handleDownloadPdf(2, 2).then(() => setReportDropdownOpen(false))}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', fontSize: '0.875rem', color: '#374151', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.375rem' }}>
                              <FileText size={14} color="#EF4444" /> 요약 보고서
                            </button>
                          </div>
                        </>
                      )}
                      {pdfError && <p style={{ fontSize: '0.75rem', color: '#EF4444', padding: '0.25rem 0.75rem' }}>다운로드 실패</p>}
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
          <SectionTitle>{isCompare ? 'LPA 유형 변화' : '학습 유형 알아보기'}</SectionTitle>
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

            {/* 유형별 특이점 / 차수 변화가 큰 요인 */}
            <CardSection>
              {isCompare && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <SectionTitle style={{ fontSize: '1rem' }}>1차→2차 변화가 큰 요인</SectionTitle>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>
                    1차와 2차 검사 사이에 가장 큰 변화를 보인 요인입니다.
                  </p>
                </div>
              )}
              <TypeDeviations
                tScores={current.tScores}
                predictedType={current.predictedType}
                schoolLevel={student.schoolLevel}
                isCompare={isCompare}
                prevTScores={isCompare && r1 ? r1.tScores : undefined}
              />
            </CardSection>
          </SectionCard>
        </SectionContainer>

        {/* 코칭 전략 (인라인) */}
        <CoachingStrategy
          moderationPaths={moderationPaths}
          typeName={current.predictedType}
          isLoading={isCoachingLoading}
        />

        {/* 데이터 해석 도우미 (스피드다이얼 FAB) */}
        <DataHelperChatbot
          tScores={current.tScores}
          predictedType={current.predictedType}
          typeProbabilities={current.typeProbabilities}
          schoolLevel={student.schoolLevel}
          deviations={current.deviations}
          onOpenPanel={setPanelTab}
          isPanelOpen={panelTab !== null}
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
  const { classId, studentId, testId = 'comprehensive' } = useParams<{ classId: string; studentId: string; testId: string }>();
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
    />
  );
};

export default StudentDashboardPage;
