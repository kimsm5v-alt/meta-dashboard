import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import {
  ArrowRight,
  ChevronRight,
  FileSearch,
  Info,
  Lightbulb,
  Loader2,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';
import { useStudentAnalysis } from '@features/api';
import { TypeClassification } from '@features/student-dashboard/ui';
import { mapStudentCoachingContent } from '@features/coaching/data/individualCoachingContent';
import { useStudentCoachingQuery } from '@features/coaching/api/queries';
import {
  OverviewStepDot,
  StepDot,
  TimelineList,
  TimelineRow,
  TimelineTrack,
  TimelineLine,
  TimelineContent,
  TimelineHeading,
} from './Timeline';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
`;

const RetryButton = styled.button`
  padding: 7px 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
`;

const NoticeBox = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const NoExamWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
`;

const NoExamIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 24px;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const NoExamEyebrow = styled.p`
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const NoExamTitle = styled.h2`
  margin: 0 0 8px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const NoExamDescription = styled.p`
  max-width: 24rem;
  margin: 0 0 32px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

const NoExamButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  color: ${({ theme }) => theme.colors.primary[600]};
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[50]};
  }
`;

const PrepNotice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.warning.light};
  border: 1px solid ${({ theme }) => theme.colors.warning.main};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const PrepNoticeIcon = styled(Info)`
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  color: ${({ theme }) => theme.colors.warning.dark};
`;

const PrepNoticeTitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.warning.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const PrepNoticeText = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.warning.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.6;
`;

const RoundToggleRow = styled.div`
  display: flex;
  gap: 8px;
`;

const RoundButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  color: ${({ $active, theme }) => ($active ? 'white' : theme.colors.text.secondary)};
  background: ${({ $active, theme }) => ($active ? '#7C3AED' : theme.colors.gray[100])};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;

  &:disabled {
    color: ${({ theme }) => theme.colors.gray[400]};
    background: ${({ theme }) => theme.colors.gray[50]};
    cursor: not-allowed;
  }
`;

const StepStrip = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
`;

const StepColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 140px;
  text-align: center;
`;

const StepLabel = styled.p<{ $tone: 1 | 2 | 3 }>`
  margin: 4px 0 0;
  color: ${({ $tone }) => ($tone === 1 ? '#7C3AED' : $tone === 2 ? '#3B82F6' : '#22C55E')};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const StepFixedTitle = styled.p`
  margin: 0;
  color: #111827;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Section = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid #f3f4f6;
  border-radius: 12px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 20px;
  color: #111827;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const StepArrow = styled(ChevronRight)`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const ContentSectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const ContentSectionTitle = styled.h3`
  margin: 0;
  color: #111827;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const StrengthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StrengthCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.md};
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  border-radius: 8px;
`;

const StrengthBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const StrengthBadge = styled.span`
  padding: 2px 8px;
  color: white;
  background: #16a34a;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const StrengthFactor = styled.span`
  color: #111827;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const StrengthObservation = styled.p`
  margin: 0 0 12px;
  color: #374151;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.625;
`;

const SpeechBubble = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  margin-bottom: 8px;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid #bbf7d0;
  border-radius: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SpeechIcon = styled(MessageSquare)`
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  color: #16a34a;
`;

const SpeechText = styled.p`
  margin: 0;
  color: #166534;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const SpeechHint = styled.p`
  margin: 12px 0 8px;
  color: #6b7280;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const PathwayNotice = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: 16px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
`;

const PathwayNoticeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const PathwayNoticeLabel = styled.span`
  color: #92400e;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const PathwayBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const PathwayBadge = styled.span`
  padding: 2px 8px;
  color: #b91c1c;
  background: #fee2e2;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const PathwayFactor = styled.span`
  color: #111827;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const PathwaySubFactors = styled.span`
  color: #6b7280;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const PathwayInterpretation = styled.p`
  margin: 0;
  color: #374151;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.625;
`;

const CoachingStepCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;

  & + & {
    margin-top: 16px;
  }
`;

const CoachingStepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const CoachingStepNumber = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: white;
  background: #7c3aed;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const CoachingStepText = styled.p`
  margin: 0;
  color: #111827;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const CoachingStepBubble = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const CoachingStepBubbleIcon = styled(MessageSquare)`
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  color: #7c3aed;
`;

const CoachingStepBubbleText = styled.p`
  margin: 0;
  color: #3b0f7a;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const STEP_LABEL_TEXT: Record<1 | 2 | 3, string> = { 1: 'STEP 1', 2: 'STEP 2', 3: 'STEP 3' };
const STEP_FIXED_TITLE: Record<1 | 2 | 3, string> = {
  1: '학생의 유형과',
  2: '유형 대비 강점',
  3: '맞춤 코칭 제안',
};
const STEP_SUBTITLE: Record<1 | 2 | 3, string> = {
  1: '주요 특징 확인',
  2: '확인과 인정',
  3: '확인 및 실행',
};
const TIMELINE_HEADING: Record<1 | 2 | 3, string> = {
  1: '학생의 유형과 주요 특징 확인',
  2: '유형 대비 강점 확인과 인정',
  3: '맞춤 코칭 제안 확인 및 실행',
};

export interface IndividualCoachingSectionProps {
  classId: string;
  studentId: string;
}

export const IndividualCoachingSection = ({
  classId,
  studentId,
}: IndividualCoachingSectionProps) => {
  const navigate = useNavigate();
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);
  const { student, classInfo, isLoading, error, refetch } = useStudentAnalysis(classId, studentId);

  const r1 = student?.assessments.find((a) => a.round === 1);
  const r2 = student?.assessments.find((a) => a.round === 2);
  const selectedAssessment = selectedRound === 2 ? r2 : (r1 ?? r2);

  const {
    data: coachingData,
    isLoading: isCoachingLoading,
    error: coachingError,
    refetch: refetchCoaching,
  } = useStudentCoachingQuery(selectedAssessment?.answerIdx);

  if (isLoading) {
    return (
      <CenterBox>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </CenterBox>
    );
  }

  if (error) {
    return (
      <CenterBox style={{ flexDirection: 'column', gap: 12 }}>
        <span>학생 정보를 불러오지 못했습니다.</span>
        <RetryButton onClick={refetch}>다시 시도</RetryButton>
      </CenterBox>
    );
  }

  if (!student || !classInfo) {
    return (
      <NoticeBox>
        <p>선택한 학생 정보를 찾을 수 없습니다.</p>
      </NoticeBox>
    );
  }

  if (classInfo.schoolLevel === '고등') {
    return (
      <NoticeBox>
        <p>고등학교는 개별 코칭을 지원하지 않습니다.</p>
      </NoticeBox>
    );
  }

  if (!r1 && !r2) {
    return (
      <NoExamWrap>
        <NoExamIcon>
          <FileSearch size={32} />
        </NoExamIcon>
        <NoExamEyebrow>검사 결과 없음</NoExamEyebrow>
        <NoExamTitle>{student.name} 학생은 아직 검사를 완료하지 않았습니다</NoExamTitle>
        <NoExamDescription>검사 완료 후 맞춤형 코칭 전략을 확인할 수 있습니다</NoExamDescription>
        <NoExamButton type='button' onClick={() => navigate('/exam/management')}>
          검사 관리로 이동
          <ArrowRight size={16} />
        </NoExamButton>
      </NoExamWrap>
    );
  }

  if (isCoachingLoading) {
    return (
      <CenterBox>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </CenterBox>
    );
  }

  if (coachingError) {
    return (
      <CenterBox style={{ flexDirection: 'column', gap: 12 }}>
        <span>코칭 콘텐츠를 불러오지 못했습니다.</span>
        <RetryButton onClick={() => void refetchCoaching()}>다시 시도</RetryButton>
      </CenterBox>
    );
  }

  const { strengthPraises, coachingPathway } = coachingData
    ? mapStudentCoachingContent(coachingData, student.name || '학생')
    : { strengthPraises: [], coachingPathway: null };

  if (strengthPraises.length === 0 && !coachingPathway) {
    return (
      <NoticeBox>
        <p>이 학생의 코칭 콘텐츠가 아직 준비되지 않았습니다.</p>
      </NoticeBox>
    );
  }

  return (
    <Wrapper>
      <RoundToggleRow>
        <RoundButton $active={selectedRound === 1} onClick={() => setSelectedRound(1)}>
          1차 검사
        </RoundButton>
        <RoundButton
          $active={selectedRound === 2}
          disabled={!r2}
          onClick={() => setSelectedRound(2)}
        >
          2차 검사{!r2 && ' (예정)'}
        </RoundButton>
      </RoundToggleRow>

      <PrepNotice>
        <PrepNoticeIcon />
        <div>
          <PrepNoticeTitle>코칭 준비: 학생 진단 검사 결과를 먼저 확인하세요</PrepNoticeTitle>
          <PrepNoticeText>
            검사 결과만으로 판단하기 어려운 부분은 학생과의 대화(질문)를 통해 다시 한번 확인한 후
            코칭을 진행하세요.
          </PrepNoticeText>
        </div>
      </PrepNotice>

      <Section>
        <SectionTitle>코칭 진행 순서</SectionTitle>
        <StepStrip>
          {([1, 2, 3] as const).map((step, index) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
              <StepColumn>
                <OverviewStepDot $tone={step}>{step}</OverviewStepDot>
                <StepLabel $tone={step}>{STEP_LABEL_TEXT[step]}</StepLabel>
                <StepFixedTitle>{STEP_FIXED_TITLE[step]}</StepFixedTitle>
                <StepFixedTitle>{STEP_SUBTITLE[step]}</StepFixedTitle>
              </StepColumn>
              {index < 2 && <StepArrow />}
            </div>
          ))}
        </StepStrip>
      </Section>

      <TimelineList>
        <TimelineRow>
          <TimelineTrack>
            <StepDot $tone={1}>1</StepDot>
            <TimelineLine />
          </TimelineTrack>
          <TimelineContent>
            <TimelineHeading>{TIMELINE_HEADING[1]}</TimelineHeading>
            <Section>
              <TypeClassification
                predictedType={selectedAssessment!.predictedType}
                typeProbabilities={selectedAssessment!.typeProbabilities}
                schoolLevel={classInfo.schoolLevel}
                showDetailIcons={false}
              />
            </Section>
          </TimelineContent>
        </TimelineRow>

        <TimelineRow>
          <TimelineTrack>
            <StepDot $tone={2}>2</StepDot>
            <TimelineLine />
          </TimelineTrack>
          <TimelineContent>
            <TimelineHeading>{TIMELINE_HEADING[2]}</TimelineHeading>
            <Section>
              <ContentSectionHeader>
                <ThumbsUp size={20} color='#16A34A' />
                <ContentSectionTitle>이 학생만의 칭찬 포인트, 인정해 주세요</ContentSectionTitle>
              </ContentSectionHeader>
              <StrengthGrid>
                {strengthPraises.map((praise, index) => (
                  <StrengthCard key={praise.factor}>
                    <StrengthBadgeRow>
                      <StrengthBadge>인정 {index + 1}</StrengthBadge>
                      <StrengthFactor>{praise.factor}</StrengthFactor>
                    </StrengthBadgeRow>
                    <StrengthObservation>{praise.observation}</StrengthObservation>
                    <SpeechBubble>
                      <SpeechIcon />
                      <SpeechText>&ldquo;{praise.praiseLine}&rdquo;</SpeechText>
                    </SpeechBubble>
                    <SpeechHint>더 이야기하고 싶다면 이렇게 물어보세요</SpeechHint>
                    <SpeechBubble>
                      <SpeechIcon />
                      <SpeechText>&ldquo;{praise.praiseQuestion}&rdquo;</SpeechText>
                    </SpeechBubble>
                  </StrengthCard>
                ))}
              </StrengthGrid>
            </Section>
          </TimelineContent>
        </TimelineRow>

        <TimelineRow>
          <TimelineTrack>
            <StepDot $tone={3}>3</StepDot>
            <TimelineLine />
          </TimelineTrack>
          <TimelineContent>
            <TimelineHeading>{TIMELINE_HEADING[3]}</TimelineHeading>
            {coachingPathway ? (
              <Section>
                <ContentSectionHeader>
                  <Lightbulb size={20} color='#D97706' />
                  <ContentSectionTitle>이 학생에게 맞는 코칭, 이렇게 해보세요</ContentSectionTitle>
                </ContentSectionHeader>
                <PathwayNotice>
                  <PathwayNoticeHeader>
                    <Info size={16} color='#D97706' />
                    <PathwayNoticeLabel>이 학생, 이것만 신경 써주세요</PathwayNoticeLabel>
                  </PathwayNoticeHeader>
                  <PathwayBadgeRow>
                    <PathwayBadge>맞춤</PathwayBadge>
                    <PathwayFactor>{coachingPathway.weakFactor}</PathwayFactor>
                    <PathwaySubFactors>
                      ({coachingPathway.focusFactor} · {coachingPathway.targetFactor})
                    </PathwaySubFactors>
                  </PathwayBadgeRow>
                  <PathwayInterpretation>{coachingPathway.interpretation}</PathwayInterpretation>
                </PathwayNotice>

                <CoachingStepCard>
                  <CoachingStepHeader>
                    <CoachingStepNumber>1</CoachingStepNumber>
                    <CoachingStepText>{coachingPathway.coaching1Method}</CoachingStepText>
                  </CoachingStepHeader>
                  <CoachingStepBubble>
                    <CoachingStepBubbleIcon />
                    <CoachingStepBubbleText>
                      &ldquo;{coachingPathway.coaching1Line}&rdquo;
                    </CoachingStepBubbleText>
                  </CoachingStepBubble>
                </CoachingStepCard>

                <CoachingStepCard>
                  <CoachingStepHeader>
                    <CoachingStepNumber>2</CoachingStepNumber>
                    <CoachingStepText>{coachingPathway.coaching2Action}</CoachingStepText>
                  </CoachingStepHeader>
                  <CoachingStepBubble>
                    <CoachingStepBubbleIcon />
                    <CoachingStepBubbleText>
                      &ldquo;{coachingPathway.coaching2Line}&rdquo;
                    </CoachingStepBubbleText>
                  </CoachingStepBubble>
                </CoachingStepCard>
              </Section>
            ) : (
              <NoticeBox>
                <p>맞춤 코칭 콘텐츠가 아직 준비되지 않았습니다.</p>
              </NoticeBox>
            )}
          </TimelineContent>
        </TimelineRow>
      </TimelineList>
    </Wrapper>
  );
};

export default IndividualCoachingSection;
