import { useState } from 'react';
import styled from '@emotion/styled';
import { ChevronRight, Info, Loader2 } from 'lucide-react';
import type { StudentType } from '@shared/types';
import { useClassCoachingData } from '@features/coaching/model/useClassCoachingData';
import { CLASS_STRATEGY_CONTENT } from '@features/coaching/data/classStrategyContent';
import { StrategyCard } from './StrategyCard';
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

const RoundToggleRow = styled.div`
  display: flex;
  gap: 8px;
`;

const RoundButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  color: ${({ $active, theme }) => ($active ? 'white' : theme.colors.text.secondary)};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary[600] : theme.colors.gray[100]};
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

const Section = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const SectionTitle = styled.h3`
  margin: 0 0 20px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
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
  color: ${({ $tone, theme }) =>
    $tone === 1 ? theme.colors.primary[600] : $tone === 2 ? '#3B82F6' : '#22C55E'};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const StepFixedTitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const StepSubtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const STEP_LABEL_TEXT: Record<1 | 2 | 3, string> = { 1: 'STEP 1', 2: 'STEP 2', 3: 'STEP 3' };
const STEP_FIXED_TITLE: Record<1 | 2 | 3, string> = {
  1: '학급 대표 전략 코칭',
  2: '추가 코칭 1',
  3: '추가 코칭 2',
};

const SectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const RoundCaption = styled.p`
  margin: 0 0 20px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

const MethodTooltip = styled.div`
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  z-index: 50;
  width: 420px;
  max-width: 80vw;
  margin-top: 8px;
  padding: ${({ theme }) => theme.spacing.md};
  background: #111827;
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease;
`;

const MethodTooltipTitle = styled.p`
  margin: 0 0 10px;
  color: #fbbf24;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const MethodTooltipText = styled.p`
  margin: 8px 0 0;
  color: #e5e7eb;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: 1.6;

  &:first-of-type {
    margin-top: 0;
  }
`;

const InfoTriggerWrap = styled.div`
  position: relative;
  display: flex;

  &:hover ${MethodTooltip} {
    visibility: visible;
    opacity: 1;
  }
`;

const InfoTrigger = styled(Info)`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.colors.gray[400]};
  cursor: help;
`;

const DistributionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
`;

const DonutWrap = styled.div`
  position: relative;
  width: 180px;
  height: 180px;
  flex-shrink: 0;
`;

const DonutCenter = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  pointer-events: none;
`;

const DonutCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const DonutUnit = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const RankList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RankItemWrap = styled.div`
  position: relative;

  &:hover ${MethodTooltip} {
    visibility: visible;
    opacity: 1;
  }
`;

const RankTooltip = styled(MethodTooltip)`
  left: 100%;
  top: 0;
  transform: none;
  width: 280px;
  margin-top: 0;
  margin-left: 8px;
`;

const RankRow = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 14px;
  background: ${({ $active, theme }) => ($active ? theme.colors.primary[50] : 'transparent')};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const RankBadge = styled.span`
  width: 28px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const RankType = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const RankMarker = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  line-height: 1;
`;

const RankCount = styled.span`
  margin-left: auto;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const TwoColGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const SubSectionTitle = styled.h3`
  margin: 0 0 12px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const CharacteristicsText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.7;
`;

const WorksheetRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const WorksheetText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.6;
`;

const WorksheetButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  padding: 8px 16px;
  color: ${({ theme }) => theme.colors.primary[600]};
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: not-allowed;
`;

const TIMELINE_HEADING: Record<1 | 2 | 3, string> = {
  1: '우선 이것부터 시작하세요',
  2: '여유가 생기면 추가로',
  3: '더 깊이 있게',
};

const DONUT_COLORS: Record<string, string> = {
  자원소진형: '#EF4444',
  '안전 균형형': '#F59E0B',
  '몰입자원 풍부형': '#10B981',
  '냉소적 무기력형': '#EF4444',
  '정서조절 취약형': '#F59E0B',
  '자기주도 몰입형': '#10B981',
};

const TYPE_MARKERS: Record<string, string> = {
  자원소진형: '🔴',
  '안전 균형형': '🟡',
  '몰입자원 풍부형': '🟢',
  '냉소적 무기력형': '🔴',
  '정서조절 취약형': '🟡',
  '자기주도 몰입형': '🟢',
};

/** LPA 유형 설명 — 순위 항목·안내 툴팁에 노출 (프로토타입 ClassCoachingView.tsx 기준) */
const LPA_TYPE_DESCRIPTIONS: Partial<Record<StudentType, string>> = {
  자원소진형:
    '학습에 필요한 심리·정서적 자원이 상대적으로 낮고, 기대나 부담은 크게 느끼는 유형입니다. 먼저 부담을 낮추고 작은 성공 경험을 통해 학습 회복감을 키워주세요.',
  '안전 균형형':
    '전반적으로 안정적인 학습 상태를 보이지만, 스스로 점검하고 조절하는 힘은 더 키워야 할 수 있습니다. 계획·점검 습관을 함께 길러주세요.',
  '몰입자원 풍부형':
    '긍정적 학습 자원이 풍부하고 몰입 가능성이 높은 유형입니다. 강점을 유지하면서 도전 목표와 깊이 있는 학습 경험으로 확장해주세요.',
  '냉소적 무기력형':
    '심리·정서적 자원이 상대적으로 낮고, 성적과 공부 부담을 크게 느끼는 유형입니다. 먼저 부담을 낮추고 정서적 회복감과 작은 성취 경험을 만들어주세요.',
  '정서조절 취약형':
    '학습 자원은 일정 수준 있으나, 성적 압박과 소진을 크게 느끼는 유형입니다. 학습 전략뿐 아니라 감정 조절과 부담 관리 방법을 함께 지원해주세요.',
  '자기주도 몰입형':
    '심리·정서적 자원이 풍부하고 자기주도적 몰입 가능성이 높은 유형입니다. 현재의 강점을 유지하면서 도전 목표와 심화 학습 기회를 제공해주세요.',
};

interface DonutChartProps {
  ranked: { type: StudentType; count: number }[];
  total: number;
}

const DonutChart = ({ ranked, total }: DonutChartProps) => {
  const size = 180;
  const stroke = 30;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const segments = ranked.reduce<
    { type: StudentType; count: number; dash: number; offset: number }[]
  >((acc, item) => {
    const fraction = total > 0 ? item.count / total : 0;
    const dash = fraction * circumference;
    const previous = acc[acc.length - 1];
    const offset = previous ? previous.offset + previous.dash : 0;
    return [...acc, { ...item, dash, offset }];
  }, []);

  return (
    <DonutWrap>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {segments.map((segment) => (
          <circle
            key={segment.type}
            cx={cx}
            cy={cy}
            r={r}
            fill='none'
            stroke={DONUT_COLORS[segment.type] ?? '#9CA3AF'}
            strokeWidth={stroke}
            strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
            strokeDashoffset={-segment.offset}
          />
        ))}
      </svg>
      <DonutCenter>
        <DonutCount>{total}</DonutCount>
        <DonutUnit>명</DonutUnit>
      </DonutCenter>
    </DonutWrap>
  );
};

export interface ClassCoachingSectionProps {
  classId: string;
}

export const ClassCoachingSection = ({ classId }: ClassCoachingSectionProps) => {
  const {
    classData,
    isHighSchool,
    round,
    setRound,
    round2Available,
    rankedTypes,
    isLoading,
    error,
    refetch,
  } = useClassCoachingData(classId);
  const [selectedType, setSelectedType] = useState<StudentType | null>(null);

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
        <span>학급 정보를 불러오지 못했습니다.</span>
        <RetryButton onClick={refetch}>다시 시도</RetryButton>
      </CenterBox>
    );
  }

  if (!classData) {
    return (
      <NoticeBox>
        <p>선택한 반 정보를 찾을 수 없습니다.</p>
      </NoticeBox>
    );
  }

  if (isHighSchool) {
    return (
      <NoticeBox>
        <p>고등학교는 학급 코칭을 지원하지 않습니다.</p>
      </NoticeBox>
    );
  }

  if (rankedTypes.length === 0) {
    return (
      <NoticeBox>
        <p>이 반의 {round}차 검사 결과가 없습니다.</p>
      </NoticeBox>
    );
  }

  const selectedRanked = selectedType
    ? rankedTypes.find((item) => item.type === selectedType)
    : undefined;
  const orderedForStep = selectedRanked
    ? [selectedRanked, ...rankedTypes.filter((item) => item.type !== selectedType)]
    : rankedTypes;

  const selected = orderedForStep[0];
  const total = rankedTypes.reduce((sum, item) => sum + item.count, 0);
  const stepItems = orderedForStep.slice(0, 3);

  return (
    <Wrapper>
      <RoundToggleRow>
        <RoundButton
          $active={round === 1}
          onClick={() => {
            setRound(1);
            setSelectedType(null);
          }}
        >
          1차 검사
        </RoundButton>
        <RoundButton
          $active={round === 2}
          disabled={!round2Available}
          onClick={() => {
            setRound(2);
            setSelectedType(null);
          }}
        >
          2차 검사{!round2Available && ' (예정)'}
        </RoundButton>
      </RoundToggleRow>

      <PrepNotice>
        <PrepNoticeIcon />
        <div>
          <PrepNoticeTitle>
            코칭 준비: 우리 반 학습 유형 분포와 우세 유형 특징을 확인하세요.
          </PrepNoticeTitle>
          <PrepNoticeText>
            우리 반 검사 결과 함께 보기로 학생들이 스스로 결과를 해석하고, 자기이해를 돕는 활동을
            진행하시는 것을 추천합니다.
          </PrepNoticeText>
        </div>
      </PrepNotice>

      <Section>
        <SectionTitle>학급 코칭 제안</SectionTitle>
        <StepStrip>
          {stepItems.map((item, index) => {
            const stepNumber = (index + 1) as 1 | 2 | 3;
            return (
              <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                <StepColumn>
                  <OverviewStepDot $tone={stepNumber}>{stepNumber}</OverviewStepDot>
                  <StepLabel $tone={stepNumber}>{STEP_LABEL_TEXT[stepNumber]}</StepLabel>
                  <StepFixedTitle>{STEP_FIXED_TITLE[stepNumber]}</StepFixedTitle>
                  <StepSubtitle>
                    {stepNumber === 1 ? `(${item.type} 중심)` : `(${item.type})`}
                  </StepSubtitle>
                </StepColumn>
                {index < stepItems.length - 1 && <ChevronRight size={24} color='#D1D5DB' />}
              </div>
            );
          })}
        </StepStrip>
      </Section>

      <Section>
        <SectionTitleRow>
          <SectionTitle style={{ margin: 0 }}>반별 학습 유형 분포</SectionTitle>
          <InfoTriggerWrap>
            <InfoTrigger />
            <MethodTooltip>
              <MethodTooltipTitle>학생유형 분포 비교</MethodTooltipTitle>
              <MethodTooltipText>
                비상교육은 학생을 단순한 점수로 구분하지 않고, 학습 특성이 함께 나타나는 패턴을
                분석하기 위해 LPA 기반 학습유형 분석을 도입했습니다.
              </MethodTooltipText>
              <MethodTooltipText>
                LPA는 최근 교육·심리·사회과학 연구에서 활용되는 통계 분석 기법으로, 학생의 학습
                부담, 심리·정서적 자원, 학습 몰입을 종합적으로 살펴 유사한 학습 상태를 유형화합니다.
              </MethodTooltipText>
              <MethodTooltipText>
                이를 통해 선생님께서는 학생의 현재 상태를 더 입체적으로 이해하고, 유형별로 필요한
                지원 방향을 확인할 수 있습니다.
              </MethodTooltipText>
            </MethodTooltip>
          </InfoTriggerWrap>
        </SectionTitleRow>
        <RoundCaption>{round}차 검사</RoundCaption>
        <DistributionRow>
          <DonutChart ranked={rankedTypes} total={total} />
          <RankList>
            {rankedTypes.map((item, index) => (
              <RankItemWrap key={item.type}>
                <RankRow
                  $active={selectedType === item.type}
                  onClick={() => setSelectedType(item.type)}
                >
                  <RankBadge>{index + 1}위</RankBadge>
                  <RankMarker>{TYPE_MARKERS[item.type] ?? '⚪'}</RankMarker>
                  <RankType>{item.type}</RankType>
                  <RankCount>
                    {item.count}명 · {total > 0 ? Math.round((item.count / total) * 100) : 0}%
                  </RankCount>
                </RankRow>
                <RankTooltip>
                  <MethodTooltipTitle>{item.type}</MethodTooltipTitle>
                  <MethodTooltipText>{LPA_TYPE_DESCRIPTIONS[item.type]}</MethodTooltipText>
                </RankTooltip>
              </RankItemWrap>
            ))}
          </RankList>
        </DistributionRow>
      </Section>

      <TwoColGrid>
        <Section>
          <SubSectionTitle>우리 반 우세 유형 특징</SubSectionTitle>
          <CharacteristicsText>
            {CLASS_STRATEGY_CONTENT[selected.type]?.characteristics ??
              '이 유형의 학급전략 콘텐츠는 아직 준비되지 않았습니다.'}
          </CharacteristicsText>
        </Section>

        <Section>
          <SubSectionTitle>우리 반 검사 결과 함께 보기</SubSectionTitle>
          <WorksheetRow>
            <WorksheetText>
              검사 직후, 학생들이 스스로 결과를 해석하고 자기이해를 넓히도록 돕는 학급 전체 활동지
              수업이에요.
            </WorksheetText>
            <WorksheetButton type='button' disabled title='활동지 콘텐츠 연동 준비 중입니다'>
              활동지 살펴보기 <ChevronRight size={16} />
            </WorksheetButton>
          </WorksheetRow>
        </Section>
      </TwoColGrid>

      <TimelineList>
        {stepItems.map((item, index) => {
          const stepNumber = (index + 1) as 1 | 2 | 3;
          return (
            <TimelineRow key={item.type}>
              <TimelineTrack>
                <StepDot $tone={stepNumber}>{stepNumber}</StepDot>
                <TimelineLine />
              </TimelineTrack>
              <TimelineContent>
                <TimelineHeading>{TIMELINE_HEADING[stepNumber]}</TimelineHeading>
                <StrategyCard
                  step={stepNumber}
                  type={item.type}
                  content={CLASS_STRATEGY_CONTENT[item.type]}
                />
              </TimelineContent>
            </TimelineRow>
          );
        })}
      </TimelineList>
    </Wrapper>
  );
};

export default ClassCoachingSection;
