import { useState } from 'react';
import styled from '@emotion/styled';
import { ChevronRight, Info, Loader2 } from 'lucide-react';
import type { StudentType } from '@shared/types';
import { useClassCoachingData } from '@features/coaching/model/useClassCoachingData';
import { CLASS_STRATEGY_CONTENT } from '@features/coaching/data/classStrategyContent';
import { StrategyCard } from './StrategyCard';

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
  gap: 32px;
`;

const StepDot = styled.div<{ $tone: 1 | 2 | 3 }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: white;
  background: ${({ $tone, theme }) =>
    $tone === 1 ? theme.colors.primary[600] : $tone === 2 ? '#3B82F6' : '#22C55E'};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const StepColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 130px;
  text-align: center;
`;

const StepName = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
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

const RankRow = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
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

const RankCount = styled.span`
  margin-left: auto;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
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
  color: ${({ theme }) => theme.colors.gray[400]};
  background: ${({ theme }) => theme.colors.gray[100]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: not-allowed;
`;

const StepGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const DONUT_COLORS: Record<string, string> = {
  자원소진형: '#EF4444',
  '안전 균형형': '#F59E0B',
  '몰입자원 풍부형': '#10B981',
  '냉소적 무기력형': '#EF4444',
  '정서조절 취약형': '#F59E0B',
  '자기주도 몰입형': '#10B981',
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

      <Section>
        <SectionTitle>학급 코칭 제안</SectionTitle>
        <StepStrip>
          {orderedForStep.slice(0, 3).map((item, index) => {
            const stepNumber = (index + 1) as 1 | 2 | 3;
            return (
              <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                <StepColumn>
                  <StepDot $tone={stepNumber}>{stepNumber}</StepDot>
                  <StepName>{item.type}</StepName>
                </StepColumn>
                {index < orderedForStep.slice(0, 3).length - 1 && (
                  <ChevronRight size={20} color='#D1D5DB' />
                )}
              </div>
            );
          })}
        </StepStrip>
      </Section>

      <Section>
        <SectionTitle>반별 학습 유형 분포 · {round}차 검사</SectionTitle>
        <DistributionRow>
          <DonutChart ranked={rankedTypes} total={total} />
          <RankList>
            {rankedTypes.map((item, index) => (
              <RankRow
                key={item.type}
                $active={selected.type === item.type}
                onClick={() => setSelectedType(item.type)}
              >
                <RankBadge>{index + 1}위</RankBadge>
                <RankType>{item.type}</RankType>
                <RankCount>
                  {item.count}명 · {total > 0 ? Math.round((item.count / total) * 100) : 0}%
                </RankCount>
              </RankRow>
            ))}
          </RankList>
        </DistributionRow>
      </Section>

      <Section>
        <SectionTitle>우리 반 우세 유형 특징</SectionTitle>
        <CharacteristicsText>
          {CLASS_STRATEGY_CONTENT[selected.type]?.characteristics ??
            '이 유형의 학급전략 콘텐츠는 아직 준비되지 않았습니다.'}
        </CharacteristicsText>
      </Section>

      <Section>
        <SectionTitle>우리 반 검사 결과 함께 보기</SectionTitle>
        <WorksheetRow>
          <WorksheetText>
            검사 직후, 학생들이 스스로 결과를 해석하고 자기이해를 넓히도록 돕는 학급 전체 활동지
            수업이에요.
          </WorksheetText>
          <WorksheetButton type='button' disabled title='활동지 콘텐츠 연동 준비 중입니다'>
            <Info size={14} /> 활동지 살펴보기 (준비 중)
          </WorksheetButton>
        </WorksheetRow>
      </Section>

      <StepGrid>
        {orderedForStep.slice(0, 3).map((item, index) => (
          <StrategyCard
            key={item.type}
            step={(index + 1) as 1 | 2 | 3}
            type={item.type}
            content={CLASS_STRATEGY_CONTENT[item.type]}
          />
        ))}
      </StepGrid>
    </Wrapper>
  );
};

export default ClassCoachingSection;
