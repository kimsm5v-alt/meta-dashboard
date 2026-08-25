import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  FileText,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { useClassStudents } from '@features/api';
import { useStudentLearningStatusQuery } from '@features/exam-tracking/api/queries';
import { fetchStudentExamList } from '@features/exam/api/examService';
import {
  fetchSelfregFullAnalysis,
  fetchTeacherExams,
  fetchStudentInfoList,
} from '@shared/services/dashboardService';
import { downloadStudentPdf } from '@shared/services/pdfDownloadService';
import {
  SelfregInsightSummary,
  SelfregLearningStatusCard,
  SelfregProfileTable,
  SelfregResultOverview,
} from '@features/student-dashboard/ui';

// ============================================================
// Types
// ============================================================

interface SelfregRound {
  round: 1 | 2;
  tScores: number[];
  reliabilityWarnings: string[];
  answerIdx: number | null;
  assessedAt: string | null;
}

type ViewMode = 'round1' | 'round2';

// ============================================================
// Styled Components
// ============================================================

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const BackButton = styled.button`
  padding: 0.5rem;
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

const TitleArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const WarnBadge = styled.span<{ $variant: 'reliability' | 'attention' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  ${({ $variant }) =>
    $variant === 'reliability'
      ? 'background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;'
      : 'background: #fffbeb; color: #d97706; border: 1px solid #fde68a;'}
  svg {
    width: 12px;
    height: 12px;
  }
`;

const SubTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const NavSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0.375rem 0.625rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: white;
  color: ${({ theme }) => theme.colors.gray[700]};
  cursor: pointer;
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  &:not(:disabled):hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const AssessmentDates = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-left: 3.5rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }
`;

const TabGroup = styled.div`
  display: flex;
  gap: 0.375rem;
`;

const TabBtn = styled.button<{ $isActive: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  background: ${({ $isActive }) => ($isActive ? '#009F88' : '#F3F4F6')};
  color: ${({ $isActive }) => ($isActive ? '#ffffff' : '#4B5563')};
  &:hover {
    background: ${({ $isActive }) => ($isActive ? '#009F88' : '#E5E7EB')};
  }
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 16rem;
`;

const CenterContent = styled.div`
  text-align: center;
`;

const SpinIcon = styled(Loader2)`
  width: 32px;
  height: 32px;
  color: #009f88;
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 0.5rem;
`;

const CenterText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ContentRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const StepSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StepNumber = styled.span`
  display: grid;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: #334155;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 700;
`;

const StepContent = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 0.25rem;
`;

const StepHeading = styled.div`
  min-height: 2rem;

  > div {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.gray[900]};
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }

  p {
    margin: 0.25rem 0 0 2.5rem;
    color: ${({ theme }) => theme.colors.gray[500]};
    font-size: 0.75rem;
  }
`;

// ============================================================
// Page
// ============================================================

interface SelfregStudentDashboardPageProps {
  classIdOverride?: string;
  studentIdOverride?: string;
  onBackToClass?: () => void;
  onStudentSelect?: (studentId: string) => void;
}

export const SelfregStudentDashboardPage: React.FC<SelfregStudentDashboardPageProps> = ({
  classIdOverride,
  studentIdOverride,
  onBackToClass,
  onStudentSelect,
}) => {
  const {
    classId: routeClassId,
    studentId: routeStudentId,
    testId = 'selfreg',
  } = useParams<{
    classId: string;
    studentId: string;
    testId: string;
  }>();
  const classId = classIdOverride ?? routeClassId;
  const studentId = studentIdOverride ?? routeStudentId;
  const navigate = useNavigate();

  const { students, classInfo, isLoading: studentsLoading } = useClassStudents(classId, '2');
  const learningStatusQuery = useStudentLearningStatusQuery(classId, studentId, 2);

  const [rounds, setRounds] = useState<SelfregRound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('round1');
  const [selfregDgnssIds, setSelfregDgnssIds] = useState<{ round1?: number; round2?: number }>({});
  const [isPdfDownloading, setIsPdfDownloading] = useState<1 | 2 | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);

  useEffect(() => {
    if (!pdfError) return;
    const id = setTimeout(() => setPdfError(false), 4000);
    return () => clearTimeout(id);
  }, [pdfError]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setViewMode('round1');
  }, [studentId]);

  useEffect(() => {
    if (!classId || !studentId) return;
    setIsLoading(true);

    setError(null);

    const loadData = async () => {
      try {
        const [result, studentExams] = await Promise.all([
          fetchSelfregFullAnalysis(classId, studentId, 'N'),
          fetchStudentExamList(classId, studentId),
        ]);
        const parsed: SelfregRound[] = [];
        if (result.round1)
          parsed.push({
            round: 1,
            ...result.round1,
            assessedAt:
              studentExams.find((exam) => exam.paperIdx === '2' && exam.ordNo === 1)?.submDt ??
              null,
          });
        if (result.round2)
          parsed.push({
            round: 2,
            ...result.round2,
            assessedAt:
              studentExams.find((exam) => exam.paperIdx === '2' && exam.ordNo === 2)?.submDt ??
              null,
          });
        setRounds(parsed);
      } catch {
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [classId, studentId]);

  useEffect(() => {
    if (!classId) return;
    fetchTeacherExams(classId, '', '2')
      .then((exams) => {
        const selfreg = exams.filter((e) => e.paperIdx === '2' && e.dgnssAt === 'N');
        setSelfregDgnssIds({
          round1: selfreg.find((e) => e.ordNo === 1)?.dgnssId,
          round2: selfreg.find((e) => e.ordNo === 2)?.dgnssId,
        });
      })
      .catch(() => {
        /* dgnssIds 없으면 버튼 비활성화 */
      });
  }, [classId]);

  // answerIdx 보충 (fetchStudentInfoList 사용)
  useEffect(() => {
    if (!studentId || !selfregDgnssIds.round1 || rounds.length === 0) return;

    // 이미 answerIdx가 모두 있으면 스킵
    if (rounds.every((r) => r.answerIdx != null)) return;

    const updateAnswerIndices = async () => {
      const updatedRounds = [...rounds];
      let hasChanges = false;

      for (let i = 0; i < updatedRounds.length; i++) {
        const round = updatedRounds[i];
        if (round.answerIdx != null) continue; // 이미 있으면 스킵

        const dgnssId = round.round === 1 ? selfregDgnssIds.round1 : selfregDgnssIds.round2;
        if (!dgnssId) continue;

        try {
          const list = await fetchStudentInfoList(dgnssId);
          const entry = list.find((item) => item.stdtId === studentId);
          if (entry?.answerIdx != null) {
            updatedRounds[i] = { ...round, answerIdx: entry.answerIdx };
            hasChanges = true;
          }
        } catch {
          // 실패 시 그대로 유지
        }
      }

      if (hasChanges) {
        setRounds(updatedRounds);
      }
    };

    void updateAnswerIndices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, selfregDgnssIds.round1, selfregDgnssIds.round2, rounds.length]);

  const handleDownloadPdf = async (round: 1 | 2, type: 1 | 2 = 1) => {
    const dgnssId = round === 1 ? selfregDgnssIds.round1 : selfregDgnssIds.round2;
    const roundData = rounds.find((r) => r.round === round);
    if (!dgnssId || roundData?.answerIdx == null || !studentId) return;
    setIsPdfDownloading(round);
    setPdfError(false);
    setReportDropdownOpen(false);
    try {
      await downloadStudentPdf({
        userId: studentId,
        userType: 'S',
        dgnssId,
        answerIdx: roundData.answerIdx,
        ordNo: round,
        type,
      });
    } catch {
      setPdfError(true);
    } finally {
      setIsPdfDownloading(null);
    }
  };

  const student = students.find((s) => s.id === studentId);
  const currentIdx = students.findIndex((s) => s.id === studentId);
  const prev = currentIdx > 0 ? students[currentIdx - 1] : null;
  const next = currentIdx < students.length - 1 ? students[currentIdx + 1] : null;

  const r1 = rounds.find((r) => r.round === 1);
  const r2 = rounds.find((r) => r.round === 2);
  const selectedRound: 1 | 2 = viewMode === 'round1' ? 1 : 2;
  const current = selectedRound === 2 && r2 ? r2 : r1;
  const currentLearningStatus = learningStatusQuery.data?.rounds.find(
    (round) => round.ordNo === selectedRound,
  );
  const formatAssessmentDate = (date?: string | null) => {
    if (!date) return '-';
    const parts = date.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    return parts ? `${parts[1]}년 ${Number(parts[2])}월 ${Number(parts[3])}일` : date;
  };

  const classLabel = classInfo ? `${classInfo.grade}학년 ${classInfo.classNumber}반` : '';

  if (isLoading || studentsLoading) {
    return (
      <CenterBox>
        <CenterContent>
          <SpinIcon />
          <CenterText>데이터를 불러오는 중...</CenterText>
        </CenterContent>
      </CenterBox>
    );
  }

  if (error) {
    return (
      <CenterBox>
        <CenterContent>
          <AlertTriangle
            style={{ width: 32, height: 32, color: '#f59e0b', margin: '0 auto 0.5rem' }}
          />
          <CenterText>{error}</CenterText>
        </CenterContent>
      </CenterBox>
    );
  }

  if (!current) {
    return (
      <CenterBox>
        <CenterText>자기조절학습검사 결과가 없습니다.</CenterText>
      </CenterBox>
    );
  }

  return (
    <PageRoot>
      {/* Header */}
      <PageHeader>
        <HeaderLeft>
          <BackButton
            onClick={() =>
              onBackToClass ? onBackToClass() : navigate(`/dashboard/${testId}/class/${classId}`)
            }
          >
            <ArrowLeft />
          </BackButton>
          <TitleArea>
            <TitleRow>
              <PageTitle>{student ? `${student.number}번 ${student.name}` : '학생'}</PageTitle>
              {current.reliabilityWarnings.length > 0 && (
                <WarnBadge $variant='reliability'>
                  <ShieldAlert />
                  신뢰도 주의
                </WarnBadge>
              )}
            </TitleRow>
            {classLabel && <SubTitle>{classLabel}</SubTitle>}
          </TitleArea>
        </HeaderLeft>

        <NavSection>
          <NavBtn
            disabled={!prev}
            onClick={() => {
              if (!prev) return;
              if (onStudentSelect) onStudentSelect(prev.id);
              else navigate(`/dashboard/${testId}/class/${classId}/student/${prev.id}`);
            }}
          >
            <ChevronLeft size={14} /> 이전
          </NavBtn>
          <NavBtn
            disabled={!next}
            onClick={() => {
              if (!next) return;
              if (onStudentSelect) onStudentSelect(next.id);
              else navigate(`/dashboard/${testId}/class/${classId}/student/${next.id}`);
            }}
          >
            다음 <ChevronRight size={14} />
          </NavBtn>
          {/* 보고서 다운로드 */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setReportDropdownOpen((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.875rem',
                background: '#0F9F8F',
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
              <ChevronDown
                size={14}
                style={{
                  transform: reportDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.15s',
                }}
              />
            </button>
            {reportDropdownOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 19 }}
                  onClick={() => setReportDropdownOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 4px)',
                    width: '13rem',
                    background: 'white',
                    borderRadius: '0.625rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    border: '1px solid #E5E7EB',
                    padding: '0.5rem 0',
                    zIndex: 20,
                  }}
                >
                  {/* 1차 */}
                  <div style={{ padding: '0.25rem 0.75rem' }}>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#6B7280',
                        marginBottom: '0.125rem',
                      }}
                    >
                      1차 검사 {!r1 && <span style={{ color: '#D1D5DB' }}>(미실시)</span>}
                    </p>
                    <button
                      disabled={
                        isPdfDownloading !== null ||
                        !selfregDgnssIds.round1 ||
                        r1?.answerIdx == null
                      }
                      onClick={() => void handleDownloadPdf(1, 1)}
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
                      disabled={
                        isPdfDownloading !== null ||
                        !selfregDgnssIds.round1 ||
                        r1?.answerIdx == null
                      }
                      onClick={() => void handleDownloadPdf(1, 2)}
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
                  {/* 2차 */}
                  {r2 && (
                    <>
                      <div style={{ borderTop: '1px solid #F3F4F6', margin: '0.25rem 0' }} />
                      <div style={{ padding: '0.25rem 0.75rem' }}>
                        <p
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#6B7280',
                            marginBottom: '0.125rem',
                          }}
                        >
                          2차 검사
                        </p>
                        <button
                          disabled={
                            isPdfDownloading !== null ||
                            !selfregDgnssIds.round2 ||
                            r2?.answerIdx == null
                          }
                          onClick={() => void handleDownloadPdf(2, 1)}
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
                            cursor: r2?.answerIdx != null ? 'pointer' : 'not-allowed',
                            opacity: r2?.answerIdx != null ? 1 : 0.4,
                            borderRadius: '0.375rem',
                          }}
                        >
                          <FileText size={14} color='#EF4444' /> 상세 보고서
                        </button>
                        <button
                          disabled={
                            isPdfDownloading !== null ||
                            !selfregDgnssIds.round2 ||
                            r2?.answerIdx == null
                          }
                          onClick={() => void handleDownloadPdf(2, 2)}
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
                            cursor: r2?.answerIdx != null ? 'pointer' : 'not-allowed',
                            opacity: r2?.answerIdx != null ? 1 : 0.4,
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
                      style={{ fontSize: '0.75rem', color: '#EF4444', padding: '0.25rem 0.75rem' }}
                    >
                      다운로드 실패
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </NavSection>
      </PageHeader>

      <AssessmentDates>
        <span>
          <Calendar size={16} />
          1차 검사: {formatAssessmentDate(r1?.assessedAt)}
        </span>
        {r2 && (
          <span>
            <Calendar size={16} />
            2차 검사: {formatAssessmentDate(r2.assessedAt)}
          </span>
        )}
      </AssessmentDates>

      {/* Content */}
      <ContentRoot>
        <SelfregInsightSummary scores={current.tScores} />
        <TabGroup>
          {[
            { mode: 'round1' as ViewMode, label: '1차 검사' },
            ...(r2 ? [{ mode: 'round2' as ViewMode, label: '2차 검사' }] : []),
          ].map(({ mode, label }) => (
            <TabBtn key={mode} $isActive={viewMode === mode} onClick={() => setViewMode(mode)}>
              {label}
            </TabBtn>
          ))}
        </TabGroup>
        <StepSection>
          <StepContent>
            <StepHeading>
              <div>
                <StepNumber>1</StepNumber>
                <h2>학습 현황</h2>
              </div>
              <p>학생이 직접 응답한 학습 상황입니다</p>
            </StepHeading>
            <SelfregLearningStatusCard
              status={currentLearningStatus}
              isLoading={learningStatusQuery.isLoading}
            />
          </StepContent>
        </StepSection>
        <StepSection>
          <StepContent>
            <StepHeading>
              <div>
                <StepNumber>2</StepNumber>
                <h2>종합 결과</h2>
              </div>
              <p>자기조절학습 관련 동기·인지·행동전략의 전체 수준을 확인합니다</p>
            </StepHeading>
            <SelfregResultOverview
              subjectName={student ? `${student.name} 학생` : '학생'}
              scores={r1?.tScores ?? current.tScores}
              round2Scores={r2?.tScores}
              selectedRound={selectedRound}
              onRoundChange={(round) => setViewMode(round === 1 ? 'round1' : 'round2')}
            />
          </StepContent>
        </StepSection>
        <StepSection>
          <StepContent>
            <StepHeading>
              <div>
                <StepNumber>3</StepNumber>
                <h2>종합 해석</h2>
              </div>
              <p>전체 요인의 T점수를 선형 눈금으로 비교합니다</p>
            </StepHeading>
            <SelfregProfileTable
              scores={r1?.tScores ?? current.tScores}
              round2Scores={r2?.tScores}
              selectedRound={selectedRound}
              showHeader={false}
            />
          </StepContent>
        </StepSection>
      </ContentRoot>
    </PageRoot>
  );
};

export default SelfregStudentDashboardPage;
