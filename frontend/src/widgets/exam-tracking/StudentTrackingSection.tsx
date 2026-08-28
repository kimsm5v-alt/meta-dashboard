import { useState } from 'react';
import styled from '@emotion/styled';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Card, FactorHeatmapSection } from '@shared/components';
import { useTrackingStudentData } from '@features/exam-tracking/model/useTrackingStudentData';
import { useStudentLearningStatusQuery } from '@features/exam-tracking/api/queries';
import {
  COUNSELOR_LABELS,
  LEVEL_LABELS,
  MOTIVATION_LABELS,
  STUDY_TIME_LABELS,
} from '@features/exam-tracking/api/studentLearningStatusService';
import type { StudentLearningStatusRound } from '@features/exam-tracking/api/studentLearningStatusService';
import { FACTOR_DEFINITIONS } from '@shared/data/factors';
import { TypeClassification } from '@features/student-dashboard/ui';
import { buildStudentDomainData } from '@shared/utils/buildStudentDomainData';
import { getLevel } from '@shared/data/subCategoryScripts';
import { InterventionTimeline } from './InterventionTimeline';

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 4px;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: transparent;
  border: 0;
  cursor: pointer;
`;

const StudentHeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StudentName = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ClassLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const SectionHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const SectionDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const TypeChangeCard = styled(Card)`
  display: flex;
  flex-direction: column;
`;

const LearningStatusCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const LearningStatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.75rem;
`;

const LearningStatusItem = styled.div<{ $changed: boolean }>`
  padding: 1rem;
  border: 1px solid ${({ $changed }) => ($changed ? '#FDE68A' : 'transparent')};
  border-radius: 0.5rem;
  background: ${({ $changed, theme }) => ($changed ? '#FFFBEB' : theme.colors.gray[50])};
`;

const LearningStatusLabel = styled.p`
  margin: 0 0 0.75rem;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-align: center;
`;

const LearningStatusValues = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LearningStatusValue = styled.span<{ $current?: boolean }>`
  flex: 1;
  color: ${({ $current, theme }) => ($current ? '#B45309' : theme.colors.gray[500])};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ $current, theme }) =>
    $current ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};
  line-height: 1.4;
  text-align: center;
  word-break: keep-all;
`;

const LearningStatusMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

const ChangesCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ChangeSectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const ChangeSummary = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  white-space: nowrap;
`;

const ChangeBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ChangeBlockHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChangeBlockTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ChangeBlockCount = styled.span<{ $secondary?: boolean }>`
  padding: 0.125rem 0.5rem;
  color: ${({ $secondary }) => ($secondary ? '#52525B' : '#B45309')};
  background: ${({ $secondary }) => ($secondary ? '#E5E7EB' : '#FEF3C7')};
  border-radius: 999px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ChangeBlockDescription = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const ChangeColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChangeColumn = styled.div<{ $tone: 'improved' | 'attention' }>`
  overflow: hidden;
  border: 1px solid ${({ $tone }) => ($tone === 'improved' ? '#D1FAE5' : '#FEE2E2')};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: white;
`;

const ChangeColumnHeader = styled.div<{ $tone: 'improved' | 'attention' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: ${({ $tone }) => ($tone === 'improved' ? '#065F46' : '#991B1B')};
  background: ${({ $tone }) => ($tone === 'improved' ? '#ECFDF5' : '#FEF2F2')};
`;

const ChangeColumnIcon = styled.span<{ $tone: 'improved' | 'attention' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  color: ${({ $tone }) => ($tone === 'improved' ? '#059669' : '#DC2626')};
  background: ${({ $tone }) => ($tone === 'improved' ? '#D1FAE5' : '#FEE2E2')};
  border-radius: 50%;
`;

const ChangeColumnTitle = styled.h4`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ChangeColumnCount = styled.span<{ $tone: 'improved' | 'attention' }>`
  margin-left: auto;
  padding: 0.125rem 0.5rem;
  color: ${({ $tone }) => ($tone === 'improved' ? '#047857' : '#B91C1C')};
  background: ${({ $tone }) => ($tone === 'improved' ? '#D1FAE5' : '#FEE2E2')};
  border-radius: 999px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ChangeList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const ChangeItem = styled.li`
  display: grid;
  grid-template-columns: 5rem 2.25rem 6.25rem minmax(5rem, 1fr) 3rem;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:last-child {
    border-bottom: 0;
  }
`;

const ChangeFactorName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const NegativeBadge = styled.span`
  width: fit-content;
  padding: 0.125rem 0.375rem;
  color: ${({ theme }) => theme.colors.gray[600]};
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const LevelChange = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  white-space: nowrap;
`;

const LevelBadge = styled.span<{ $tone: 'improved' | 'attention' }>`
  padding: 0.125rem 0.375rem;
  color: ${({ $tone }) => ($tone === 'improved' ? '#047857' : '#B91C1C')};
  background: ${({ $tone }) => ($tone === 'improved' ? '#D1FAE5' : '#FEE2E2')};
  border-radius: 0.25rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ChangeTrack = styled.span`
  overflow: hidden;
  height: 0.5rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 999px;
`;

const ChangeBar = styled.span<{ $tone: 'improved' | 'attention'; $width: number }>`
  display: block;
  width: ${({ $width }) => $width}%;
  height: 100%;
  background: ${({ $tone }) => ($tone === 'improved' ? '#6EE7B7' : '#FCA5A5')};
  border-radius: inherit;
`;

const ChangeScore = styled.span<{ $tone: 'improved' | 'attention' }>`
  color: ${({ $tone }) => ($tone === 'improved' ? '#059669' : '#DC2626')};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-align: right;
`;

const NoChangeText = styled.p`
  margin: 0;
  padding: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const MoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 100%;
  padding: 0.5rem 1rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  background: white;
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
`;

const AiSummaryCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  background: linear-gradient(135deg, #f0f2ff 0%, #faf7ff 100%);
`;

const AiSummaryTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const AiSummaryText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.65;
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
`;

const EmptyText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  padding: 48px 0;
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: 6px 12px;
  color: ${({ theme }) => theme.colors.primary[700]};
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
`;

const NoticeBox = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.warning.light};
  border: 1px solid ${({ theme }) => theme.colors.warning.main};
  border-radius: ${({ theme }) => theme.radius.xl};
  text-align: center;
`;

const NoticeText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.warning.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

type ChangeTone = 'improved' | 'attention';

interface FactorChangeItem {
  index: number;
  name: string;
  delta: number;
  isPositive: boolean;
  previousLevel: ReturnType<typeof getLevel>;
  currentLevel: ReturnType<typeof getLevel>;
  levelChanged: boolean;
  tone: ChangeTone;
}

const getLearningStatusItems = (
  previous: StudentLearningStatusRound,
  current: StudentLearningStatusRound,
) => [
  {
    label: '학업 성취도',
    previous: previous.academicAchievement
      ? LEVEL_LABELS[previous.academicAchievement]
      : '응답 없음',
    current: current.academicAchievement ? LEVEL_LABELS[current.academicAchievement] : '응답 없음',
  },
  {
    label: '성적 만족도',
    previous: previous.gradeSatisfaction ? LEVEL_LABELS[previous.gradeSatisfaction] : '응답 없음',
    current: current.gradeSatisfaction ? LEVEL_LABELS[current.gradeSatisfaction] : '응답 없음',
  },
  {
    label: '학습 동기',
    previous: previous.learningMotivation
      ? MOTIVATION_LABELS[previous.learningMotivation]
      : '응답 없음',
    current: current.learningMotivation
      ? MOTIVATION_LABELS[current.learningMotivation]
      : '응답 없음',
  },
  {
    label: '혼자 공부 시간',
    previous: previous.selfStudyTime ? STUDY_TIME_LABELS[previous.selfStudyTime] : '응답 없음',
    current: current.selfStudyTime ? STUDY_TIME_LABELS[current.selfStudyTime] : '응답 없음',
  },
  {
    label: '학습 고민 상담',
    previous: previous.learningCounselor
      ? COUNSELOR_LABELS[previous.learningCounselor]
      : '응답 없음',
    current: current.learningCounselor ? COUNSELOR_LABELS[current.learningCounselor] : '응답 없음',
  },
];

interface ChangeFactorColumnProps {
  factors: FactorChangeItem[];
  tone: ChangeTone;
  showLevelChange: boolean;
  expanded: boolean;
  onToggle: () => void;
}

const ChangeFactorColumn = ({
  factors,
  tone,
  showLevelChange,
  expanded,
  onToggle,
}: ChangeFactorColumnProps) => {
  const visibleFactors = expanded ? factors : factors.slice(0, 5);
  const hiddenCount = Math.max(factors.length - 5, 0);
  const maxDelta = Math.max(...factors.map(({ delta }) => Math.abs(delta)), 1);
  const Icon = tone === 'improved' ? TrendingUp : TrendingDown;

  return (
    <ChangeColumn $tone={tone}>
      <ChangeColumnHeader $tone={tone}>
        <ChangeColumnIcon $tone={tone}>
          <Icon size={16} />
        </ChangeColumnIcon>
        <ChangeColumnTitle>{tone === 'improved' ? '개선' : '주의'}</ChangeColumnTitle>
        <ChangeColumnCount $tone={tone}>{factors.length}개</ChangeColumnCount>
      </ChangeColumnHeader>
      {visibleFactors.length > 0 ? (
        <ChangeList>
          {visibleFactors.map((factor) => (
            <ChangeItem key={factor.index}>
              <ChangeFactorName>{factor.name}</ChangeFactorName>
              <span>{!factor.isPositive && <NegativeBadge>부적</NegativeBadge>}</span>
              <LevelChange>
                {showLevelChange ? (
                  <>
                    {factor.previousLevel}
                    <ArrowRight size={12} />
                    <LevelBadge $tone={tone}>{factor.currentLevel}</LevelBadge>
                  </>
                ) : (
                  `${factor.previousLevel} 유지`
                )}
              </LevelChange>
              <ChangeTrack>
                <ChangeBar $tone={tone} $width={(Math.abs(factor.delta) / maxDelta) * 100} />
              </ChangeTrack>
              <ChangeScore $tone={tone}>
                {factor.delta > 0 ? '+' : ''}
                {Math.round(factor.delta)}
              </ChangeScore>
            </ChangeItem>
          ))}
        </ChangeList>
      ) : (
        <NoChangeText>해당 요인 없음</NoChangeText>
      )}
      {hiddenCount > 0 && (
        <MoreButton onClick={onToggle}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? '접기' : `${hiddenCount}개 더보기`}
        </MoreButton>
      )}
    </ChangeColumn>
  );
};

interface StudentTrackingSectionProps {
  classId: string;
  assessmentStudentId: string;
  recordStudentId: string;
  onBack?: () => void;
}

export const StudentTrackingSection = ({
  classId,
  assessmentStudentId,
  recordStudentId,
  onBack,
}: StudentTrackingSectionProps) => {
  const [expandedChanges, setExpandedChanges] = useState<Record<string, boolean>>({});
  const { classData, student, isLoading, error, refetch } = useTrackingStudentData(
    classId,
    assessmentStudentId,
  );
  const learningStatusQuery = useStudentLearningStatusQuery(classId, assessmentStudentId);

  if (isLoading) {
    return (
      <Wrapper>
        <Card>
          <CenterBox>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </CenterBox>
        </Card>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <Card>
          <CenterBox style={{ flexDirection: 'column' }}>
            <EmptyText style={{ padding: 0 }}>학생 정보를 불러오지 못했습니다.</EmptyText>
            <RetryButton onClick={refetch}>
              <RefreshCw size={14} /> 다시 시도
            </RetryButton>
          </CenterBox>
        </Card>
      </Wrapper>
    );
  }

  if (!classData || !student) {
    return (
      <Wrapper>
        <Card>
          <EmptyText>선택한 학생을 찾을 수 없습니다.</EmptyText>
        </Card>
      </Wrapper>
    );
  }

  const round1 = student.assessments.find((a) => a.round === 1);
  const round2 = student.assessments.find((a) => a.round === 2);
  const previousLearningStatus = learningStatusQuery.data?.rounds.find(({ ordNo }) => ordNo === 1);
  const currentLearningStatus = learningStatusQuery.data?.rounds.find(({ ordNo }) => ordNo === 2);
  const learningStatusItems =
    previousLearningStatus && currentLearningStatus
      ? getLearningStatusItems(previousLearningStatus, currentLearningStatus)
      : [];

  const factorChanges =
    round1 && round2
      ? FACTOR_DEFINITIONS.map((factor) => {
          const before = round1.tScores[factor.index];
          const after = round2.tScores[factor.index];
          const delta = after - before;
          const tone: ChangeTone = factor.isPositive
            ? delta > 0
              ? 'improved'
              : 'attention'
            : delta < 0
              ? 'improved'
              : 'attention';
          const previousLevel = getLevel(before);
          const currentLevel = getLevel(after);

          return {
            index: factor.index,
            name: factor.name,
            delta,
            isPositive: factor.isPositive,
            previousLevel,
            currentLevel,
            levelChanged: previousLevel !== currentLevel,
            tone,
          } satisfies FactorChangeItem;
        })
          .filter(({ delta }) => Number.isFinite(delta) && Math.abs(delta) >= 5)
          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      : [];
  const improvedChanges = factorChanges.filter(({ tone }) => tone === 'improved');
  const attentionChanges = factorChanges.filter(({ tone }) => tone === 'attention');
  const levelChanged = factorChanges.filter(({ levelChanged: changed }) => changed);
  const withinLevel = factorChanges.filter(({ levelChanged: changed }) => !changed);
  const scoreDelta =
    factorChanges.reduce((sum, { delta }) => sum + delta, 0) / Math.max(factorChanges.length, 1);
  const aiSummary =
    scoreDelta > 1
      ? '긍정적인 변화가 관찰됩니다.'
      : scoreDelta < -1
        ? '주의가 필요한 변화가 관찰됩니다.'
        : '안정적인 상태를 유지하고 있습니다.';

  if (!round2) {
    return (
      <Wrapper>
        <HeaderRow>
          <StudentName>
            {student.number}번 {student.name}
          </StudentName>
          <ClassLabel>
            {classData.grade}-{classData.classNumber}반
          </ClassLabel>
        </HeaderRow>
        <NoticeBox>
          <NoticeText>이 학생은 아직 2차 검사를 응시하지 않았습니다.</NoticeText>
        </NoticeBox>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <HeaderRow>
        {onBack && (
          <BackButton onClick={onBack} aria-label='이전으로'>
            <ArrowLeft size={22} />
          </BackButton>
        )}
        <StudentHeaderText>
          <StudentName>
            {student.number}번 {student.name}
          </StudentName>
          <ClassLabel>
            {student.schoolLevel} {student.grade}학년 {classData.classNumber}반
          </ClassLabel>
        </StudentHeaderText>
      </HeaderRow>

      {round1 && (
        <AiSummaryCard>
          <AiSummaryTitle>
            <Sparkles size={20} /> AI 변화 분석
          </AiSummaryTitle>
          <AiSummaryText>{aiSummary}</AiSummaryText>
          <AiSummaryText>
            1차와 2차 검사에서 개선 요인 {improvedChanges.length}개, 주의 요인{' '}
            {attentionChanges.length}개가 확인되었습니다.
          </AiSummaryText>
        </AiSummaryCard>
      )}

      {round1 && (
        <LearningStatusCard>
          <SectionTitle>학습 현황 변화</SectionTitle>
          {learningStatusQuery.isLoading ? (
            <LearningStatusMessage>학습 현황을 불러오는 중입니다.</LearningStatusMessage>
          ) : learningStatusQuery.error ? (
            <LearningStatusMessage>
              학습 현황을 불러오지 못했습니다.
              <RetryButton onClick={() => void learningStatusQuery.refetch()}>
                <RefreshCw size={14} /> 다시 시도
              </RetryButton>
            </LearningStatusMessage>
          ) : learningStatusItems.length === 0 ? (
            <LearningStatusMessage>비교할 회차별 학습 현황이 없습니다.</LearningStatusMessage>
          ) : (
            <LearningStatusGrid>
              {learningStatusItems.map((item) => {
                const changed = item.previous !== item.current;
                return (
                  <LearningStatusItem key={item.label} $changed={changed}>
                    <LearningStatusLabel>{item.label}</LearningStatusLabel>
                    <LearningStatusValues>
                      <LearningStatusValue>{item.previous}</LearningStatusValue>
                      <ArrowRight size={14} color={changed ? '#F59E0B' : '#D1D5DB'} />
                      <LearningStatusValue $current>{item.current}</LearningStatusValue>
                    </LearningStatusValues>
                  </LearningStatusItem>
                );
              })}
            </LearningStatusGrid>
          )}
        </LearningStatusCard>
      )}

      {round1 && (
        <Card>
          <SectionHeading style={{ marginBottom: '16px' }}>
            <SectionTitle>38개 요인 분석</SectionTitle>
            <SectionDescription>1차와 2차 검사 결과를 비교합니다.</SectionDescription>
          </SectionHeading>
          <FactorHeatmapSection
            domainData={buildStudentDomainData(round2.tScores, round2.midCategoryScores)}
            prevDomainData={buildStudentDomainData(round1.tScores, round1.midCategoryScores)}
          />
        </Card>
      )}

      {round1 && (
        <ChangesCard>
          <ChangeSectionHeader>
            <SectionTitle>주요 변화 요인</SectionTitle>
            <ChangeSummary>
              1차 대비 2차 검사에서 5점 이상 변화 · 부적 요인은 점수가 낮아질수록 개선
            </ChangeSummary>
          </ChangeSectionHeader>
          {factorChanges.length > 0 ? (
            <>
              {levelChanged.length > 0 && (
                <ChangeBlock>
                  <ChangeBlockHeader>
                    <ChangeBlockTitle>구간 변화</ChangeBlockTitle>
                    <ChangeBlockCount>{levelChanged.length}개</ChangeBlockCount>
                    <ChangeBlockDescription>구간이 달라진 요인입니다.</ChangeBlockDescription>
                  </ChangeBlockHeader>
                  <ChangeColumns>
                    <ChangeFactorColumn
                      factors={levelChanged.filter(({ tone }) => tone === 'improved')}
                      tone='improved'
                      showLevelChange
                      expanded={!!expandedChanges['level-improved']}
                      onToggle={() =>
                        setExpandedChanges((current) => ({
                          ...current,
                          'level-improved': !current['level-improved'],
                        }))
                      }
                    />
                    <ChangeFactorColumn
                      factors={levelChanged.filter(({ tone }) => tone === 'attention')}
                      tone='attention'
                      showLevelChange
                      expanded={!!expandedChanges['level-attention']}
                      onToggle={() =>
                        setExpandedChanges((current) => ({
                          ...current,
                          'level-attention': !current['level-attention'],
                        }))
                      }
                    />
                  </ChangeColumns>
                </ChangeBlock>
              )}
              {withinLevel.length > 0 && (
                <ChangeBlock>
                  <ChangeBlockHeader>
                    <ChangeBlockTitle>구간 내 변화</ChangeBlockTitle>
                    <ChangeBlockCount $secondary>{withinLevel.length}개</ChangeBlockCount>
                    <ChangeBlockDescription>
                      구간은 그대로지만 점수가 5점 이상 변화한 요인입니다.
                    </ChangeBlockDescription>
                  </ChangeBlockHeader>
                  <ChangeColumns>
                    <ChangeFactorColumn
                      factors={withinLevel.filter(({ tone }) => tone === 'improved')}
                      tone='improved'
                      showLevelChange={false}
                      expanded={!!expandedChanges['within-improved']}
                      onToggle={() =>
                        setExpandedChanges((current) => ({
                          ...current,
                          'within-improved': !current['within-improved'],
                        }))
                      }
                    />
                    <ChangeFactorColumn
                      factors={withinLevel.filter(({ tone }) => tone === 'attention')}
                      tone='attention'
                      showLevelChange={false}
                      expanded={!!expandedChanges['within-attention']}
                      onToggle={() =>
                        setExpandedChanges((current) => ({
                          ...current,
                          'within-attention': !current['within-attention'],
                        }))
                      }
                    />
                  </ChangeColumns>
                </ChangeBlock>
              )}
            </>
          ) : (
            <EmptyText>5점 이상 변화한 요인이 없습니다.</EmptyText>
          )}
        </ChangesCard>
      )}

      {round1 && (
        <TypeChangeCard>
          <TypeClassification
            predictedType={round2.predictedType}
            typeProbabilities={round2.typeProbabilities}
            schoolLevel={student.schoolLevel}
            showCompare
            prevType={round1.predictedType}
            prevTypeProbabilities={round1.typeProbabilities}
          />
        </TypeChangeCard>
      )}

      <InterventionTimeline studentId={recordStudentId} classId={classData.id} />
    </Wrapper>
  );
};
