/**
 * 학생용 결과 대시보드 페이지
 *
 * 교사용 StudentDashboardPage (L3)에서 아래 기능 제외:
 * 1. 코칭 전략 보기 버튼 & 팝업
 * 2. 우측 패널 (생기부, 상담, 관찰)
 * 3. 학생 네비게이션 (이전/다음 학생)
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Loader2,
  Download,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@features/auth/model/AuthContext';
import { formatAttentionTooltip } from '@shared/utils/attentionChecker';
import { buildStudentDomainData } from '@shared/utils/buildStudentDomainData';
import { FactorHeatmapSection } from '@shared/components/FactorHeatmapSection';
import { DiagnosisSummary } from '@features/student-dashboard';
import { getMyGroups } from '@features/groups/api/groupService';
import { fetchStudentFullAnalysis, convertToAssessment } from '@shared/services/dashboardService';
import { getStudentExamList } from '../api/studentExamService';
import { downloadStudentPdf } from '@shared/services/pdfDownloadService';
import { SCHOOL_LEVEL_MAP } from '@shared/types';
import type { Student, SchoolLevel, Assessment } from '@shared/types';

type ViewMode = 'round1' | 'round2' | 'compare';

interface MyResultContentProps {
  student: Student;
  assessment: Assessment;
  prevAssessment?: Assessment;
  isCompare: boolean;
}

const ContentRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SectionCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const SectionContent = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
`;

const SectionDivider = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const MyResultContent: React.FC<MyResultContentProps> = ({
  assessment,
  prevAssessment,
  isCompare,
}) => {
  const domainData = useMemo(
    () => buildStudentDomainData(assessment.tScores),
    [assessment.tScores],
  );

  const prevDomainData = useMemo(
    () =>
      isCompare && prevAssessment ? buildStudentDomainData(prevAssessment.tScores) : undefined,
    [isCompare, prevAssessment],
  );

  return (
    <ContentRoot>
      <Section>
        <SectionCard>
          <SectionContent>
            <DiagnosisSummary tScores={assessment.tScores} studentType={assessment.predictedType} />
          </SectionContent>
          <SectionDivider />
          <SectionContent>
            <FactorHeatmapSection domainData={domainData} prevDomainData={prevDomainData} />
          </SectionContent>
        </SectionCard>
      </Section>

      {/* 2. 학습 유형 알아보기 */}
      {/* <Section>
        <SectionTitle>나의 학습 유형</SectionTitle>
        <SectionCard>
          <SectionContent>
            <TypeClassification
              predictedType={assessment.predictedType}
              typeProbabilities={assessment.typeProbabilities}
              schoolLevel={student.schoolLevel}
            />
          </SectionContent>
          <SectionDivider />
          <SectionContent>
            <TypeDeviations
              tScores={assessment.tScores}
              predictedType={assessment.predictedType}
              schoolLevel={student.schoolLevel}
              onCoachingClick={() => setIsCoachingOpen(true)}
            />
          </SectionContent>
        </SectionCard>
      </Section> */}

      {/* 데이터 해석 도우미 (스피드다이얼 FAB) */}
      {/* <DataHelperChatbot
        onOpenPanel={() => {}}
        isPanelOpen={false}
      /> */}
    </ContentRoot>
  );
};

const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const BackButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const HeaderTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Badge = styled.span<{ $bg: string; $text: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  border: 1px solid ${({ $text }) => $text}33;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ExamTypeBadge = styled.span`
  padding: 4px 12px;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: #ffffff;
  background: #9d53e1;
`;

const PageSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const DropdownWrapper = styled.div`
  position: relative;
`;

const DropdownTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 160px;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  z-index: 10;
  overflow: hidden;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  background: none;
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:first-of-type {
    border-top: none;
  }
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ViewModeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TabGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  background: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.primary[500] : theme.colors.gray[100]};
  color: ${({ theme, $isActive }) => ($isActive ? '#ffffff' : theme.colors.gray[600])};

  &:hover {
    background: ${({ theme, $isActive }) =>
      $isActive ? theme.colors.primary[600] : theme.colors.gray[200]};
  }
`;

const InfoBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: ${({ theme }) => theme.spacing.sm};
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: ${({ theme }) => theme.radius.lg};

  svg {
    width: 16px;
    height: 16px;
    color: #3b82f6;
    flex-shrink: 0;
  }

  p {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    color: #1e40af;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 256px;
`;

const LoadingContent = styled.div`
  text-align: center;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const LoadingSpinner = styled(Loader2)`
  width: 32px;
  height: 32px;
  color: ${({ theme }) => theme.colors.primary[500]};
  animation: ${spin} 1s linear infinite;
  margin: 0 auto ${({ theme }) => theme.spacing.sm};
`;

const SpinningLoader = styled(Loader2)`
  width: 16px;
  height: 16px;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 256px;
`;

const ErrorContent = styled.div`
  text-align: center;
`;

const ErrorIcon = styled(AlertTriangle)`
  width: 32px;
  height: 32px;
  color: #f59e0b;
  margin: 0 auto ${({ theme }) => theme.spacing.sm};
`;

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ErrorButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

export const MyResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { resultId: _resultId } = useParams<{ resultId: string }>();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('round1');
  const [student, setStudent] = useState<Student | null>(null);
  const [dgnssIds, setDgnssIds] = useState<{ round1?: number; round2?: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPdfDownloading, setIsPdfDownloading] = useState<1 | 2 | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdfError) return;
    const id = setTimeout(() => setPdfError(false), 4000);
    return () => clearTimeout(id);
  }, [pdfError]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadResult = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!user?.stdtId) {
          setError('아직 시행한 검사 결과가 없습니다.');
          return;
        }

        // 속한 모든 그룹 조회 (학생은 여러 그룹에 속할 수 있음)
        // includeInactive=true로 탈퇴/방출된 그룹도 포함하여 과거 검사 결과 조회 가능
        const groups = await getMyGroups(user.id, true);

        if (groups.length === 0) {
          setError('아직 시행한 검사 결과가 없습니다.');
          return;
        }

        const groupsToCheck = groups.map((g) => ({
          claId: g.claId,
          schoolLevel: SCHOOL_LEVEL_MAP[g.schoolLevel] ?? '중등',
        }));

        // 모든 그룹에서 검사 목록 조회
        let hasAnyResults = false;
        const allAnalyses: Array<{
          claId: string;
          analysis: Awaited<ReturnType<typeof fetchStudentFullAnalysis>>;
          schoolLevel: SchoolLevel;
          dgnssIds: { round1?: number; round2?: number };
        }> = [];

        for (const group of groupsToCheck) {
          try {
            const examList = await getStudentExamList(group.claId, user.stdtId);
            const hasResults = examList.some((e) => e.hasResult === true);

            if (hasResults) {
              hasAnyResults = true;
              const r1Exam = examList.find((e) => e.hasResult && e.ordNo === 1);
              const r2Exam = examList.find((e) => e.hasResult && e.ordNo === 2);
              const groupDgnssIds = { round1: r1Exam?.dgnssId, round2: r2Exam?.dgnssId };
              const fullAnalysis = await fetchStudentFullAnalysis(
                group.claId,
                user.stdtId,
                '1',
                'Y',
              );
              if (fullAnalysis.round1 || fullAnalysis.round2) {
                allAnalyses.push({
                  claId: group.claId,
                  analysis: fullAnalysis,
                  schoolLevel: group.schoolLevel,
                  dgnssIds: groupDgnssIds,
                });
              }
            }
          } catch (err) {
            // 특정 그룹 조회 실패는 무시하고 다른 그룹 계속 시도
            console.warn(`[MyResultPage] 그룹 ${group.claId} 조회 실패:`, err);
          }
        }

        if (!hasAnyResults || allAnalyses.length === 0) {
          setError('아직 시행한 검사 결과가 없습니다.');
          return;
        }

        // 첫 번째 그룹의 데이터 사용 (여러 그룹이 있으면 첫 번째 선택)
        const selectedGroup = allAnalyses[0];
        setDgnssIds(selectedGroup.dgnssIds);
        const { analysis: fullAnalysis, schoolLevel } = selectedGroup;

        const assessments: Assessment[] = [];
        if (fullAnalysis.round1) {
          assessments.push(convertToAssessment(user.stdtId, 1, fullAnalysis.round1, schoolLevel));
        }
        if (fullAnalysis.round2) {
          assessments.push(convertToAssessment(user.stdtId, 2, fullAnalysis.round2, schoolLevel));
        }

        const studentData: Student = {
          id: user.stdtId,
          classId: selectedGroup.claId,
          name: user.name ?? '학생',
          number: 0,
          schoolLevel,
          grade: 0,
          assessments,
        };

        setStudent(studentData);
      } catch (err) {
        console.error('[MyResultPage] 결과 로드 실패:', err);
        setError('결과를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleDownloadPdf = async (round: 1 | 2) => {
    const dgnssId = round === 1 ? dgnssIds.round1 : dgnssIds.round2;
    const assessment = student?.assessments.find((a) => a.round === round);
    if (!dgnssId || assessment?.answerIdx == null || !user?.stdtId) return;
    setIsPdfDownloading(round);
    setPdfError(false);
    setIsDropdownOpen(false);
    try {
      await downloadStudentPdf({
        userId: user.stdtId,
        userType: 'S',
        dgnssId,
        answerIdx: assessment.answerIdx,
        ordNo: round,
      });
    } catch {
      setPdfError(true);
    } finally {
      setIsPdfDownloading(null);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingContent>
          <LoadingSpinner />
          <LoadingText>결과를 불러오는 중...</LoadingText>
        </LoadingContent>
      </LoadingContainer>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <ErrorContainer>
        <ErrorContent>
          <ErrorIcon />
          <ErrorText>{error}</ErrorText>
          <ErrorButton onClick={() => navigate('/student/exams')}>검사 목록으로</ErrorButton>
        </ErrorContent>
      </ErrorContainer>
    );
  }

  if (!student) {
    return (
      <ErrorContainer>
        <ErrorContent>
          <ErrorText>결과를 찾을 수 없습니다.</ErrorText>
        </ErrorContent>
      </ErrorContainer>
    );
  }

  const r1 = student.assessments.find((a) => a.round === 1);
  const r2 = student.assessments.find((a) => a.round === 2);
  const selectedRound: 1 | 2 = viewMode === 'round1' ? 1 : 2;
  const isCompare = viewMode === 'compare';
  const current = selectedRound === 2 && r2 ? r2 : r1;

  if (!current) {
    return (
      <ErrorContainer>
        <ErrorContent>
          <ErrorText>검사 결과가 없습니다.</ErrorText>
        </ErrorContent>
      </ErrorContainer>
    );
  }

  return (
    <PageRoot>
      {/* 헤더 */}
      <PageHeader>
        <HeaderLeft>
          <BackButton onClick={() => navigate('/student/exams')}>
            <ArrowLeft />
          </BackButton>
          <HeaderContent>
            <HeaderTitleRow>
              <ExamTypeBadge>학습종합검사</ExamTypeBadge>
              <PageTitle>나의 검사 결과</PageTitle>
              {current.reliabilityWarnings.length > 0 && (
                <Badge
                  $bg='#fef2f2'
                  $text='#dc2626'
                  title={`신뢰도 주의: ${current.reliabilityWarnings.join(', ')}`}
                >
                  <ShieldAlert />
                  신뢰도 주의
                </Badge>
              )}
              {current.attentionResult.needsAttention && (
                <Badge
                  $bg='#fef3c7'
                  $text='#d97706'
                  title={formatAttentionTooltip(current.attentionResult)}
                >
                  <AlertTriangle />
                  관심 필요
                </Badge>
              )}
            </HeaderTitleRow>
            <PageSubtitle>{user?.name || student.name}님의 학습종합검사 결과</PageSubtitle>
          </HeaderContent>
        </HeaderLeft>

        {/* PDF 다운로드 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DropdownWrapper ref={dropdownRef}>
            <DropdownTrigger
              onClick={() => setIsDropdownOpen((p) => !p)}
              disabled={isPdfDownloading !== null}
            >
              {isPdfDownloading && <SpinningLoader />}
              <Download />
              보고서 다운로드
              <ChevronDown
                style={{
                  width: 16,
                  height: 16,
                  transition: 'transform 0.2s',
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </DropdownTrigger>
            {isDropdownOpen && (
              <DropdownMenu>
                <DropdownItem
                  onClick={() => void handleDownloadPdf(1)}
                  disabled={!r1 || r1.answerIdx == null}
                >
                  1차 보고서
                </DropdownItem>
                {r2 && (
                  <DropdownItem
                    onClick={() => void handleDownloadPdf(2)}
                    disabled={r2.answerIdx == null}
                  >
                    2차 보고서
                  </DropdownItem>
                )}
              </DropdownMenu>
            )}
          </DropdownWrapper>
          {pdfError && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>다운로드 실패</span>}
        </div>
      </PageHeader>

      {/* 차수 선택 */}
      <ViewModeContainer>
        <TabGroup>
          {[
            { mode: 'round1' as ViewMode, label: '1차 검사' },
            ...(r2
              ? [
                  { mode: 'round2' as ViewMode, label: '2차 검사' },
                  { mode: 'compare' as ViewMode, label: '차수 변화' },
                ]
              : []),
          ].map(({ mode, label }) => (
            <TabButton key={mode} onClick={() => setViewMode(mode)} $isActive={viewMode === mode}>
              {label}
            </TabButton>
          ))}
        </TabGroup>
      </ViewModeContainer>

      {/* 2차 검사 진행중 안내 */}
      {student.round2Submitted && !r2 && (
        <InfoBox>
          <Clock />
          <p>2차 검사를 제출했습니다. 검사 종료 후 결과가 공개됩니다.</p>
        </InfoBox>
      )}

      {/* 메인 콘텐츠 */}
      <MyResultContent
        student={student}
        assessment={current}
        prevAssessment={isCompare ? r1 : undefined}
        isCompare={isCompare}
      />
    </PageRoot>
  );
};
