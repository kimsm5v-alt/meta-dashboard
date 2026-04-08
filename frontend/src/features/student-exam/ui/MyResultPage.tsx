/**
 * 학생용 결과 대시보드 페이지
 *
 * 교사용 StudentDashboardPage (L3)에서 아래 기능 제외:
 * 1. 코칭 전략 보기 버튼 & 팝업
 * 2. 우측 패널 (생기부, 상담, 관찰)
 * 3. 학생 네비게이션 (이전/다음 학생)
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { ArrowLeft, ShieldAlert, AlertTriangle, Clock, Loader2, Download } from 'lucide-react';
import { useAuthStore } from '@features/auth/model/useAuthStore';
import { formatAttentionTooltip, checkAttention } from '@shared/utils/attentionChecker';
import { buildStudentDomainData } from '@shared/utils/buildStudentDomainData';
import { FactorHeatmapSection } from '@shared/components/FactorHeatmapSection';
import {
  DiagnosisSummary,
  TypeClassification,
  TypeDeviations,
  DataHelperChatbot,
} from '@features/student-dashboard';
import { fetchStudentResult } from '../api/studentExamService';
import { classifyStudent, getTypeDeviations } from '@shared/utils/lpaClassifier';
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

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
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
  student,
  assessment,
  prevAssessment,
  isCompare,
}) => {
  const domainData = useMemo(
    () => buildStudentDomainData(assessment.tScores),
    [assessment.tScores],
  );

  const prevDomainData = useMemo(
    () => (isCompare && prevAssessment ? buildStudentDomainData(prevAssessment.tScores) : undefined),
    [isCompare, prevAssessment],
  );

  return (
    <ContentRoot>
      {/* 1. 진단결과 한눈에 보기 */}
      <Section>
        <SectionTitle>나의 진단 결과</SectionTitle>
        <SectionCard>
          <SectionContent>
            <DiagnosisSummary
              tScores={assessment.tScores}
              studentType={assessment.predictedType}
            />
          </SectionContent>
          <SectionDivider />
          <SectionContent>
            <FactorHeatmapSection domainData={domainData} prevDomainData={prevDomainData} />
          </SectionContent>
        </SectionCard>
      </Section>

      {/* 2. 학습 유형 알아보기 */}
      <Section>
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
            />
          </SectionContent>
        </SectionCard>
      </Section>

      {/* 데이터 해석 도우미 (플로팅 챗봇) */}
      <DataHelperChatbot
        tScores={assessment.tScores}
        predictedType={assessment.predictedType}
        typeProbabilities={assessment.typeProbabilities}
        schoolLevel={student.schoolLevel}
        deviations={assessment.deviations}
      />
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

const PDFButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
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

  svg {
    width: 16px;
    height: 16px;
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
  color: ${({ theme, $isActive }) =>
    $isActive ? '#ffffff' : theme.colors.gray[600]};

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
  const user = useAuthStore((state) => state.user);

  const [viewMode, setViewMode] = useState<ViewMode>('round1');
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResult = async () => {
      // TODO: 실제 학생 로그인 구현 후 user 정보에서 가져오기
      // 현재는 Mock 데이터 사용
      const mockStudentId = 's001';
      const mockStudentName = user?.name || '홍길동';
      const mockSchoolLevel: SchoolLevel = '중등';

      setIsLoading(true);
      try {
        // Mock API 호출
        const { tScores, reliabilityWarnings } = await fetchStudentResult(mockStudentId, '1');

        // LPA 분류
        const { predictedType, confidence, allProbabilities } = classifyStudent(tScores, mockSchoolLevel);

        // 유형별 편차
        const deviations = getTypeDeviations(tScores, predictedType, mockSchoolLevel);

        // 관심 필요 판별
        const attentionResult = checkAttention(tScores);

        // Assessment 생성
        const assessment: Assessment = {
          id: `assessment-${Date.now()}`,
          studentId: mockStudentId,
          round: 1,
          assessedAt: new Date(),
          predictedType,
          typeConfidence: confidence,
          typeProbabilities: allProbabilities,
          tScores,
          reliabilityWarnings,
          attentionResult,
          deviations,
        };

        // Student 객체 생성
        const studentData: Student = {
          id: mockStudentId,
          classId: 'class-001',
          name: mockStudentName,
          number: 1,
          schoolLevel: mockSchoolLevel,
          grade: 2,
          round2Submitted: false,
          assessments: [assessment],
        };

        setStudent(studentData);
      } catch (err) {
        console.error('[MyResultPage] 결과 로드 실패:', err);
        setError('아직 시행한 검사 결과가 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          <ErrorButton onClick={() => navigate('/student/exams')}>
            검사 목록으로
          </ErrorButton>
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
              <PageTitle>나의 검사 결과</PageTitle>
              {current.reliabilityWarnings.length > 0 && (
                <Badge
                  $bg="#fef2f2"
                  $text="#dc2626"
                  title={`신뢰도 주의: ${current.reliabilityWarnings.join(', ')}`}
                >
                  <ShieldAlert />
                  신뢰도 주의
                </Badge>
              )}
              {current.attentionResult.needsAttention && (
                <Badge
                  $bg="#fef3c7"
                  $text="#d97706"
                  title={formatAttentionTooltip(current.attentionResult)}
                >
                  <AlertTriangle />
                  관심 필요
                </Badge>
              )}
            </HeaderTitleRow>
            <PageSubtitle>{user?.name || student.name}님의 학습심리정서검사 결과</PageSubtitle>
          </HeaderContent>
        </HeaderLeft>

        {/* PDF 다운로드 */}
        <PDFButton>
          <Download />
          PDF 다운로드
        </PDFButton>
      </PageHeader>

      {/* 차수 선택 */}
      <ViewModeContainer>
        <TabGroup>
          {([
            { mode: 'round1' as ViewMode, label: '1차 검사' },
            ...(r2
              ? [
                  { mode: 'round2' as ViewMode, label: '2차 검사' },
                  { mode: 'compare' as ViewMode, label: '차수 변화' },
                ]
              : []),
          ]).map(({ mode, label }) => (
            <TabButton
              key={mode}
              onClick={() => setViewMode(mode)}
              $isActive={viewMode === mode}
            >
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
