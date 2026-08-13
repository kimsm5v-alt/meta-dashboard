import styled from '@emotion/styled';
import { ArrowLeft, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Card, FactorHeatmapSection } from '@shared/components';
import { useTrackingStudentData } from '@features/exam-tracking/model/useTrackingStudentData';
import { FACTOR_DEFINITIONS } from '@shared/data/factors';
import { TypeClassification } from '@features/student-dashboard/ui';
import { buildStudentDomainData } from '@shared/utils/buildStudentDomainData';
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
  gap: ${({ theme }) => theme.spacing.md};
`;

const ChangesCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
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
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'improved' ? theme.colors.success.light : theme.colors.warning.light};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const ChangeColumnTitle = styled.h3<{ $tone: 'improved' | 'attention' }>`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  color: ${({ theme, $tone }) =>
    $tone === 'improved' ? theme.colors.success.dark : theme.colors.warning.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ChangeList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const ChangeItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ChangeScore = styled.span<{ $tone: 'improved' | 'attention' }>`
  color: ${({ theme, $tone }) =>
    $tone === 'improved' ? theme.colors.success.dark : theme.colors.warning.dark};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const NoChangeText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
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
  const { classData, student, isLoading, error, refetch } = useTrackingStudentData(
    classId,
    assessmentStudentId,
  );

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

  const factorChanges =
    round1 && round2
      ? FACTOR_DEFINITIONS.map((factor) => {
          const before = round1.tScores[factor.index];
          const after = round2.tScores[factor.index];
          const delta = after - before;
          const improved = factor.isPositive ? delta > 0 : delta < 0;

          return { factor, delta, improved };
        })
          .filter(({ delta }) => Number.isFinite(delta) && Math.abs(delta) >= 5)
          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      : [];
  const improvedChanges = factorChanges.filter(({ improved }) => improved).slice(0, 3);
  const attentionChanges = factorChanges.filter(({ improved }) => !improved).slice(0, 3);
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
          <SectionHeading>
            <SectionTitle>주요 변화 요인</SectionTitle>
            <SectionDescription>
              1차 대비 2차 검사에서 5점 이상 변화한 요인입니다. 부적 요인은 점수가 낮아질수록
              개선으로 봅니다.
            </SectionDescription>
          </SectionHeading>
          {factorChanges.length > 0 ? (
            <ChangeColumns>
              <ChangeColumn $tone='improved'>
                <ChangeColumnTitle $tone='improved'>개선</ChangeColumnTitle>
                {improvedChanges.length > 0 ? (
                  <ChangeList>
                    {improvedChanges.map(({ factor, delta }) => (
                      <ChangeItem key={factor.index}>
                        {factor.name}
                        <ChangeScore $tone='improved'>
                          {delta > 0 ? '+' : ''}
                          {delta}점
                        </ChangeScore>
                      </ChangeItem>
                    ))}
                  </ChangeList>
                ) : (
                  <NoChangeText>해당하는 요인이 없습니다.</NoChangeText>
                )}
              </ChangeColumn>
              <ChangeColumn $tone='attention'>
                <ChangeColumnTitle $tone='attention'>주의</ChangeColumnTitle>
                {attentionChanges.length > 0 ? (
                  <ChangeList>
                    {attentionChanges.map(({ factor, delta }) => (
                      <ChangeItem key={factor.index}>
                        {factor.name}
                        <ChangeScore $tone='attention'>
                          {delta > 0 ? '+' : ''}
                          {delta}점
                        </ChangeScore>
                      </ChangeItem>
                    ))}
                  </ChangeList>
                ) : (
                  <NoChangeText>해당하는 요인이 없습니다.</NoChangeText>
                )}
              </ChangeColumn>
            </ChangeColumns>
          ) : (
            <EmptyText>5점 이상 변화한 요인이 없습니다.</EmptyText>
          )}
        </ChangesCard>
      )}

      {round1 && (
        <TypeChangeCard>
          <SectionHeading>
            <SectionTitle>학습 유형 분류</SectionTitle>
            <SectionDescription>1차와 2차 검사 결과의 학습 유형입니다.</SectionDescription>
          </SectionHeading>
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
