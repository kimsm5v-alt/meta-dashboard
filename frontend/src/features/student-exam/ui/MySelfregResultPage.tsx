/**
 * 학생용 자기조절학습검사 결과 페이지
 *
 * MyResultPage(학습종합검사 결과)와 동일한 데이터 로딩 패턴.
 * 표시: DiagnosisSummary + SelfregFactorAnalysis (20개 요인)
 * 미표시: LPA 유형 분류, 코칭 전략
 */

import { useState, useEffect, useRef } from 'react';
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
import { SelfregFactorAnalysis } from '@features/student-dashboard';
import { SelfregDiagnosisSummary } from './SelfregDiagnosisSummary';
import { getMyGroups } from '@features/groups/api/groupService';
import { fetchSelfregFullAnalysis, fetchStudentInfoList } from '@shared/services/dashboardService';
import { getStudentExamList } from '../api/studentExamService';
import { downloadStudentPdf } from '@shared/services/pdfDownloadService';

type ViewMode = 'round1' | 'round2' | 'compare';

// ============================================================
// 자기조절 결과 모델 (종합검사 Assessment와 분리)
// ============================================================

interface SelfregRound {
  round: 1 | 2;
  /** 20개 요인 T-score (index 0~19) */
  tScores: number[];
  reliabilityWarnings: string[];
  answerIdx: number | null;
}

interface SelfregResult {
  name: string;
  /** 2차 제출 완료 여부 (결과 미공개 안내용) */
  round2Submitted: boolean;
  rounds: SelfregRound[];
}

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

const ExamTypeBadge = styled.span`
  padding: 4px 12px;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: #ffffff;
  background: #009f88;
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

const SpinningLoader = styled(Loader2)`
  width: 16px;
  height: 16px;
  animation: ${spin} 1s linear infinite;
`;

const ViewModeContainer = styled.div`
  display: flex;
  align-items: center;
`;

const TabGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const TabButton = styled.button<{ $isActive: boolean; $color?: string }>`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  background: ${({ $isActive, $color }) => ($isActive ? ($color ?? '#009F88') : '#F3F4F6')};
  color: ${({ $isActive }) => ($isActive ? '#ffffff' : '#4B5563')};

  &:hover {
    background: ${({ $isActive, $color }) => ($isActive ? ($color ?? '#009F88') : '#E5E7EB')};
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

const LoadingSpinner = styled(Loader2)`
  width: 32px;
  height: 32px;
  color: #009f88;
  animation: ${spin} 1s linear infinite;
  margin: 0 auto ${({ theme }) => theme.spacing.sm};
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

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const ContentRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

// ============================================================
// Content
// ============================================================

interface ContentProps {
  round: SelfregRound;
  prevRound?: SelfregRound;
  isCompare: boolean;
}

const MySelfregResultContent: React.FC<ContentProps> = ({ round, prevRound, isCompare }) => {
  const tScores = round.tScores;
  const prevTScores = isCompare && prevRound ? prevRound.tScores : undefined;

  return (
    <ContentRoot>
      <SelfregDiagnosisSummary tScores={tScores} />
      <SelfregFactorAnalysis tScores={tScores} prevTScores={prevTScores} showCompare={isCompare} />
    </ContentRoot>
  );
};

// ============================================================
// Page
// ============================================================

export const MySelfregResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { resultId: _resultId } = useParams<{ resultId: string }>();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('round1');
  const [result, setResult] = useState<SelfregResult | null>(null);
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

        const groups = await getMyGroups(user.id, true);

        if (groups.length === 0) {
          setError('아직 시행한 검사 결과가 없습니다.');
          return;
        }

        let foundResult: SelfregResult | null = null;
        let foundDgnssIds: { round1?: number; round2?: number } = {};

        for (const group of groups) {
          try {
            // paperIdx='2' 자기조절학습검사만 필터링
            const examList = await getStudentExamList(group.claId, user.stdtId);
            const selfregExams = examList.filter((e) => e.paperIdx === '2');
            const hasResults = selfregExams.some((e) => e.hasResult);
            if (!hasResults) continue;

            const r1Exam = selfregExams.find((e) => e.hasResult && e.ordNo === 1);
            const r2Exam = selfregExams.find((e) => e.hasResult && e.ordNo === 2);
            const round2Submitted = selfregExams.some(
              (e) => e.ordNo === 2 && e.submittedAt != null,
            );

            const fullAnalysis = await fetchSelfregFullAnalysis(group.claId, user.stdtId, 'Y');
            if (!fullAnalysis.round1 && !fullAnalysis.round2) continue;

            // answerIdx를 fetchStudentInfoList에서 가져오기
            let r1AnswerIdx: number | null = null;
            let r2AnswerIdx: number | null = null;

            if (r1Exam?.dgnssId) {
              try {
                const r1List = await fetchStudentInfoList(r1Exam.dgnssId);
                const r1Entry = r1List.find((item) => item.stdtId === user.stdtId);
                r1AnswerIdx = r1Entry?.answerIdx ?? null;
              } catch {
                // fallback to API answerIdx
                r1AnswerIdx = fullAnalysis.round1?.answerIdx ?? null;
              }
            }

            if (r2Exam?.dgnssId) {
              try {
                const r2List = await fetchStudentInfoList(r2Exam.dgnssId);
                const r2Entry = r2List.find((item) => item.stdtId === user.stdtId);
                r2AnswerIdx = r2Entry?.answerIdx ?? null;
              } catch {
                // fallback to API answerIdx
                r2AnswerIdx = fullAnalysis.round2?.answerIdx ?? null;
              }
            }

            const rounds: SelfregRound[] = [];
            if (fullAnalysis.round1) {
              rounds.push({
                round: 1,
                ...fullAnalysis.round1,
                answerIdx: r1AnswerIdx ?? fullAnalysis.round1.answerIdx,
              });
            }
            if (fullAnalysis.round2) {
              rounds.push({
                round: 2,
                ...fullAnalysis.round2,
                answerIdx: r2AnswerIdx ?? fullAnalysis.round2.answerIdx,
              });
            }

            foundResult = {
              name: user.name ?? '학생',
              round2Submitted,
              rounds,
            };
            foundDgnssIds = { round1: r1Exam?.dgnssId, round2: r2Exam?.dgnssId };
            break;
          } catch (err) {
            console.warn(`[MySelfregResultPage] 그룹 ${group.claId} 조회 실패:`, err);
          }
        }

        if (!foundResult) {
          setError('아직 시행한 자기조절학습검사 결과가 없습니다.');
          return;
        }

        setDgnssIds(foundDgnssIds);
        setResult(foundResult);
      } catch (err) {
        console.error('[MySelfregResultPage] 결과 로드 실패:', err);
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
    const roundData = result?.rounds.find((r) => r.round === round);
    if (!dgnssId || roundData?.answerIdx == null || !user?.stdtId) return;
    setIsPdfDownloading(round);
    setPdfError(false);
    setIsDropdownOpen(false);
    try {
      await downloadStudentPdf({
        userId: user.stdtId,
        userType: 'S',
        dgnssId,
        answerIdx: roundData.answerIdx,
        ordNo: round,
      });
    } catch {
      setPdfError(true);
    } finally {
      setIsPdfDownloading(null);
    }
  };

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

  if (!result) {
    return (
      <ErrorContainer>
        <ErrorContent>
          <ErrorText>결과를 찾을 수 없습니다.</ErrorText>
        </ErrorContent>
      </ErrorContainer>
    );
  }

  const r1 = result.rounds.find((r) => r.round === 1);
  const r2 = result.rounds.find((r) => r.round === 2);
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
      <PageHeader>
        <HeaderLeft>
          <BackButton onClick={() => navigate('/student/exams')}>
            <ArrowLeft />
          </BackButton>
          <HeaderContent>
            <HeaderTitleRow>
              <ExamTypeBadge>자기조절학습검사</ExamTypeBadge>
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
            </HeaderTitleRow>
            <PageSubtitle>{user?.name ?? result.name}님의 자기조절학습검사 결과</PageSubtitle>
          </HeaderContent>
        </HeaderLeft>

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
                <DropdownItem
                  onClick={() => void handleDownloadPdf(2)}
                  disabled={!r2 || r2.answerIdx == null}
                >
                  2차 보고서
                </DropdownItem>
              </DropdownMenu>
            )}
          </DropdownWrapper>
          {pdfError && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>다운로드 실패</span>}
        </div>
      </PageHeader>

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

      {result.round2Submitted && !r2 && (
        <InfoBox>
          <Clock />
          <p>2차 검사를 제출했습니다. 검사 종료 후 결과가 공개됩니다.</p>
        </InfoBox>
      )}

      <MySelfregResultContent
        round={current}
        prevRound={isCompare ? r1 : undefined}
        isCompare={isCompare}
      />
    </PageRoot>
  );
};
