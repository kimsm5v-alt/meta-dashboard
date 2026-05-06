import styled from '@emotion/styled';
import { useMemo } from 'react';
import { calculate4StepDiagnosis, getLevel } from '@shared/utils/calculate4StepDiagnosis';
import { CATEGORY_COLORS } from '@shared/data/lpaProfiles';
import { clamp, TYPE_DESCRIPTIONS } from '@features/student-dashboard/ui/four-step/constants';
import { StepCard } from '@features/student-dashboard/ui/four-step/StepCard';
import { SubSection } from '@features/student-dashboard/ui/four-step/SubSection';
import { BarItem } from '@features/student-dashboard/ui/four-step/BarItem';
import { LeafFactorItem } from '@features/student-dashboard/ui/four-step/DualBar';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GuideHeader = styled.div`
  margin-bottom: 0.5rem;
`;

const GuideTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const GuideDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const PrimaryText = styled.span`
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Step4Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;
`;

const QuadrantWrapper = styled.div`
  grid-column: span 2 / span 2;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const QuadrantContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const YAxisLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 0.25rem;
`;

const QuadrantRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

const QuadrantChart = styled.div`
  position: relative;
  flex: 1;
  aspect-ratio: 4 / 3;
  background: white;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const QuadrantBg = styled.div`
  position: absolute;
  inset: 0;
`;

const QuadrantCell = styled.div<{
  $position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  $bgColor: string;
}>`
  position: absolute;
  width: 50%;
  height: 50%;
  background: ${({ $bgColor }) => $bgColor};
  opacity: 0.3;
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ $position }) => {
    switch ($position) {
      case 'top-left':
        return 'top: 0; left: 0; border-right: 1px solid #4b5563; border-bottom: 1px solid #4b5563;';
      case 'top-right':
        return 'top: 0; right: 0; border-bottom: 1px solid #4b5563;';
      case 'bottom-left':
        return 'bottom: 0; left: 0; border-right: 1px solid #4b5563;';
      case 'bottom-right':
        return 'bottom: 0; right: 0;';
    }
  }}
`;

const QuadrantNumber = styled.span`
  font-size: 9px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const ConnectorLine = styled.line`
  stroke: #9ca3af;
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
`;

const PrevDot = styled.div<{ $left: number; $top: number }>`
  position: absolute;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: ${({ theme }) => theme.colors.gray[400]};
  transform: translate(-50%, -50%);
  z-index: 10;
  opacity: 0.6;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
`;

const PrevDotLabel = styled.div`
  position: absolute;
  top: -1.25rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.125rem 0.25rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 8px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  white-space: nowrap;
  background: ${({ theme }) => theme.colors.gray[400]};
  color: white;
`;

const CurrentDot = styled.div<{ $left: number; $top: number; $isHighSkill: boolean }>`
  position: absolute;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 2px solid white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translate(-50%, -50%);
  z-index: 20;
  background: ${({ $isHighSkill }) => ($isHighSkill ? '#2563eb' : '#ef4444')};
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
`;

const CurrentDotLabel = styled.div<{ $isHighSkill: boolean }>`
  position: absolute;
  top: -1.75rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.125rem 0.375rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: ${({ $isHighSkill }) => ($isHighSkill ? '#2563eb' : '#ef4444')};
  color: white;
`;

const XAxisLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-left: 0.25rem;
  writing-mode: vertical-lr;
`;

const LegendContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.625rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const LegendTitle = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const LegendCircle = styled.div<{ $color: string; $opacity?: number }>`
  width: 0.75rem;
  height: 0.75rem;
  background: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.radius.full};
  ${({ $opacity }) => $opacity && `opacity: ${$opacity};`}
`;

const LegendLabel = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const TypeInfoPanel = styled.div`
  grid-column: span 3 / span 3;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: white;
  overflow: hidden;
`;

const TypeInfoHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const TypeInfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TypeCodeBadge = styled.span`
  padding: 0.125rem 0.5rem;
  background: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const TypeName = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const PrevTypeHint = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const TypeDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-top: 0.375rem;
  line-height: 1.6;
`;

const ScoresSection = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const ScoresGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
`;

const ScoreItem = styled.div`
  text-align: center;
`;

const ScoreItemLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.25rem;
`;

const ScoreItemValueRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
`;

const ScoreItemValue = styled.div<{ $color: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $color }) => $color};
`;

const DeltaValue = styled.span<{ $positive: boolean }>`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ $positive }) => ($positive ? '#10b981' : '#ef4444')};
`;

const ScoreProgressBar = styled.div`
  height: 0.25rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.full};
  margin-top: 0.25rem;
  overflow: hidden;
`;

const ScoreProgressFill = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  border-radius: ${({ theme }) => theme.radius.full};
  width: ${({ $width }) => $width}%;
  background-color: ${({ $color }) => $color};
`;

const CoachingSection = styled.div`
  padding: 0.75rem 1rem;
`;

const CoachingTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: 0.5rem;
`;

const CoachingList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const CoachingItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const CoachingBullet = styled.span`
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-top: 1px;
`;

// ============================================================
// Props
// ============================================================

interface FourStepInterpretationProps {
  tScores: number[];
  prevTScores?: number[];
  midCategoryScores?: Record<string, number> | null;
  prevMidCategoryScores?: Record<string, number> | null;
  studentName: string;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function FourStepInterpretation({
  tScores,
  prevTScores,
  midCategoryScores,
  prevMidCategoryScores,
  studentName,
}: FourStepInterpretationProps) {
  const diagnosis = useMemo(
    () => calculate4StepDiagnosis(tScores, midCategoryScores),
    [tScores, midCategoryScores],
  );
  const prevDiagnosis = useMemo(
    () => (prevTScores ? calculate4StepDiagnosis(prevTScores, prevMidCategoryScores) : null),
    [prevTScores, prevMidCategoryScores],
  );
  const isCompare = !!prevDiagnosis;

  return (
    <Container>
      {/* 가이드 헤더 */}
      <GuideHeader>
        <GuideTitle>4단계 해석 가이드</GuideTitle>
        <GuideDescription>
          보다 학생을 더 잘 이해하기 위해 검사 결과를 4단계로 나눠서 봅니다.
        </GuideDescription>
      </GuideHeader>

      {/* Step 1: 공부 마음 */}
      <StepCard
        step={1}
        title={'공부 마음 : "공부하고 싶은 마음이 있나요?"'}
        subtitle={
          <>
            <span>학업열의·성장 동기가 있는지, 학업소진·번아웃 상태는 아닌지</span>
            <br />
            <PrimaryText>→ 동기가 없으면 아무리 가르쳐도 소용없어요</PrimaryText>
          </>
        }
        showBarLegend
        isCompare={isCompare}
      >
        <SubSection title='긍정적 공부 마음' level={getLevel(diagnosis.step1.긍정.종합)}>
          <BarItem
            label='학업열의'
            score={diagnosis.step1.긍정.학업열의}
            prevScore={prevDiagnosis?.step1.긍정.학업열의}
            subCategoryKey='학업열의'
            tScores={tScores}
            prevTScores={prevTScores}
          />
          <BarItem
            label='성장력'
            score={diagnosis.step1.긍정.성장력}
            prevScore={prevDiagnosis?.step1.긍정.성장력}
            subCategoryKey='성장력'
            tScores={tScores}
            prevTScores={prevTScores}
          />
        </SubSection>

        <SubSection
          title='부정적 공부 마음'
          level={getLevel(diagnosis.step1.부정.학업소진)}
          isNegativeSection
        >
          <BarItem
            label='학업소진'
            score={diagnosis.step1.부정.학업소진}
            prevScore={prevDiagnosis?.step1.부정.학업소진}
            isNegative
            subCategoryKey='학업소진'
            tScores={tScores}
            prevTScores={prevTScores}
          />
        </SubSection>
      </StepCard>

      {/* Step 2: 공부 자원 */}
      <StepCard
        step={2}
        title={'공부 자원 : "공부할 수 있는 환경이 되나요?"'}
        subtitle={
          <>
            <span>자존감·자신감·지지 관계가 있는지, 스트레스·방해 요인은 없는지</span>
            <br />
            <PrimaryText>→ 환경이 안 받쳐주면 마음만으론 안 돼요</PrimaryText>
          </>
        }
        showBarLegend
        isCompare={isCompare}
      >
        <SubSection title='개인 자원' level={getLevel(diagnosis.step2.개인.종합)}>
          <BarItem
            label='긍정적자아'
            score={diagnosis.step2.개인.긍정적자아}
            prevScore={prevDiagnosis?.step2.개인.긍정적자아}
            subCategoryKey='긍정적자아'
            tScores={tScores}
            prevTScores={prevTScores}
          />
          <BarItem
            label='대인관계능력'
            score={diagnosis.step2.개인.대인관계능력}
            prevScore={prevDiagnosis?.step2.개인.대인관계능력}
            subCategoryKey='대인관계능력'
            tScores={tScores}
            prevTScores={prevTScores}
          />
        </SubSection>

        <SubSection title='환경 자원' level={getLevel(diagnosis.step2.환경.종합)}>
          <BarItem
            label='지지적관계'
            score={diagnosis.step2.환경.지지적관계}
            prevScore={prevDiagnosis?.step2.환경.지지적관계}
            subCategoryKey='지지적관계'
            tScores={tScores}
            prevTScores={prevTScores}
          />
        </SubSection>

        <SubSection
          title='자원 방해'
          level={getLevel(diagnosis.step2.방해.학업스트레스)}
          isNegativeSection
        >
          <BarItem
            label='학업스트레스'
            score={diagnosis.step2.방해.학업스트레스}
            prevScore={prevDiagnosis?.step2.방해.학업스트레스}
            isNegative
            subCategoryKey='학업스트레스'
            tScores={tScores}
            prevTScores={prevTScores}
          />
          <BarItem
            label='학습방해물'
            score={diagnosis.step2.방해.학습방해물}
            prevScore={prevDiagnosis?.step2.방해.학습방해물}
            isNegative
            subCategoryKey='학습방해물'
            tScores={tScores}
            prevTScores={prevTScores}
          />
          <BarItem
            label='학업관계스트레스'
            score={diagnosis.step2.방해.학업관계스트레스}
            prevScore={prevDiagnosis?.step2.방해.학업관계스트레스}
            isNegative
            subCategoryKey='학업관계스트레스'
            tScores={tScores}
            prevTScores={prevTScores}
          />
        </SubSection>
      </StepCard>

      {/* Step 3: 공부 기술 */}
      <StepCard
        step={3}
        title={'공부 기술 : "어떻게 공부하는지 알고 있나요?"'}
        subtitle={
          <>
            <span>계획·시간 관리·학습 전략을 아는지, 감정 조절·집중력은 어떤지</span>
            <br />
            <PrimaryText>→ 방법을 모르면 노력해도 성적이 안 나와요</PrimaryText>
          </>
        }
        showBarLegend
        isCompare={isCompare}
      >
        <SubSection title='학습 재설계' level={getLevel(diagnosis.step3.학습.종합)}>
          <BarItem
            label='메타인지'
            score={diagnosis.step3.학습.메타인지}
            prevScore={prevDiagnosis?.step3.학습.메타인지}
            subCategoryKey='메타인지'
            tScores={tScores}
            prevTScores={prevTScores}
          />
          <BarItem
            label='학습기술'
            score={diagnosis.step3.학습.학습기술}
            prevScore={prevDiagnosis?.step3.학습.학습기술}
            subCategoryKey='학습기술'
            tScores={tScores}
            prevTScores={prevTScores}
          />
        </SubSection>

        <SubSection title='마음 재설계' level={getLevel(diagnosis.step3.마음.종합)}>
          <LeafFactorItem
            label='자기정서조절'
            score={diagnosis.step3.마음.자기정서조절}
            prevScore={prevDiagnosis?.step3.마음.자기정서조절}
            color={CATEGORY_COLORS['대인관계능력'] ?? '#9CA3AF'}
          />
        </SubSection>
      </StepCard>

      {/* Step 4: 학습 유형 */}
      <StepCard
        step={4}
        title={'학습 유형 : "그래서 이 학생에게 뭐가 필요한가요?"'}
        subtitle={
          <>
            <span>1~3단계를 종합하여 8가지 유형 판정 및 맞춤 코칭 전략 제시</span>
            <br />
            <PrimaryText>→ 이 학생에게 지금 가장 필요한 게 뭔지 알려줘요</PrimaryText>
          </>
        }
      >
        <Step4Grid>
          {/* 사분면 그래프 */}
          <QuadrantWrapper>
            <QuadrantContainer>
              {/* Y축 레이블 */}
              <YAxisLabel>공부마음 ↑</YAxisLabel>

              <QuadrantRow>
                <QuadrantChart>
                  {/* 사분면 배경 */}
                  <QuadrantBg>
                    <QuadrantCell $position='top-left' $bgColor='#dbeafe'>
                      <QuadrantNumber>2</QuadrantNumber>
                    </QuadrantCell>
                    <QuadrantCell $position='top-right' $bgColor='#dcfce7'>
                      <QuadrantNumber>1</QuadrantNumber>
                    </QuadrantCell>
                    <QuadrantCell $position='bottom-left' $bgColor='#fee2e2'>
                      <QuadrantNumber>3</QuadrantNumber>
                    </QuadrantCell>
                    <QuadrantCell $position='bottom-right' $bgColor='#fef9c3'>
                      <QuadrantNumber>4</QuadrantNumber>
                    </QuadrantCell>
                  </QuadrantBg>

                  {/* 1차 위치 (비교 모드) */}
                  {prevDiagnosis && (
                    <>
                      {/* 1차→2차 연결선 */}
                      <svg
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          zIndex: 10,
                          pointerEvents: 'none',
                        }}
                      >
                        <ConnectorLine
                          x1={`${clamp(((prevDiagnosis.step4.공부자원 - 20) / 60) * 100)}%`}
                          y1={`${clamp(100 - ((prevDiagnosis.step4.공부마음 - 20) / 60) * 100)}%`}
                          x2={`${clamp(((diagnosis.step4.공부자원 - 20) / 60) * 100)}%`}
                          y2={`${clamp(100 - ((diagnosis.step4.공부마음 - 20) / 60) * 100)}%`}
                        />
                      </svg>
                      <PrevDot
                        $left={clamp(((prevDiagnosis.step4.공부자원 - 20) / 60) * 100)}
                        $top={clamp(100 - ((prevDiagnosis.step4.공부마음 - 20) / 60) * 100)}
                      >
                        <PrevDotLabel>1차</PrevDotLabel>
                      </PrevDot>
                    </>
                  )}

                  {/* 2차(현재) 위치 */}
                  <CurrentDot
                    $left={clamp(((diagnosis.step4.공부자원 - 20) / 60) * 100)}
                    $top={clamp(100 - ((diagnosis.step4.공부마음 - 20) / 60) * 100)}
                    $isHighSkill={diagnosis.step4.공부기술 >= 50}
                  >
                    <CurrentDotLabel $isHighSkill={diagnosis.step4.공부기술 >= 50}>
                      {isCompare ? '2차' : studentName}
                    </CurrentDotLabel>
                  </CurrentDot>
                </QuadrantChart>

                <XAxisLabel>공부자원 ↑</XAxisLabel>
              </QuadrantRow>

              {/* 범례 */}
              <LegendContainer>
                <LegendTitle>공부기술</LegendTitle>
                <LegendItem>
                  <LegendCircle $color='#2563eb' />
                  <LegendLabel>높음(≥50)</LegendLabel>
                </LegendItem>
                <LegendItem>
                  <LegendCircle $color='#ef4444' />
                  <LegendLabel>낮음(&lt;50)</LegendLabel>
                </LegendItem>
                {isCompare && (
                  <LegendItem>
                    <LegendCircle $color='#9ca3af' $opacity={0.6} />
                    <LegendLabel>1차</LegendLabel>
                  </LegendItem>
                )}
              </LegendContainer>
            </QuadrantContainer>
          </QuadrantWrapper>

          {/* 유형 정보 */}
          <TypeInfoPanel>
            {/* 유형명 헤더 */}
            <TypeInfoHeader>
              <TypeInfoRow>
                <TypeCodeBadge>{diagnosis.step4.유형코드}</TypeCodeBadge>
                <TypeName>{diagnosis.step4.유형명}</TypeName>
                {isCompare &&
                  prevDiagnosis &&
                  prevDiagnosis.step4.유형코드 !== diagnosis.step4.유형코드 && (
                    <PrevTypeHint>
                      (1차: {prevDiagnosis.step4.유형코드} {prevDiagnosis.step4.유형명})
                    </PrevTypeHint>
                  )}
              </TypeInfoRow>
              <TypeDescription>
                {TYPE_DESCRIPTIONS[diagnosis.step4.유형코드] || ''}
              </TypeDescription>
            </TypeInfoHeader>

            {/* 3개 점수 */}
            <ScoresSection>
              <ScoresGrid>
                {(
                  [
                    {
                      label: '공부 마음',
                      value: diagnosis.step4.공부마음,
                      prev: prevDiagnosis?.step4.공부마음,
                      color: '#3B82F6',
                    },
                    {
                      label: '공부 자원',
                      value: diagnosis.step4.공부자원,
                      prev: prevDiagnosis?.step4.공부자원,
                      color: '#10B981',
                    },
                    {
                      label: '공부 기술',
                      value: diagnosis.step4.공부기술,
                      prev: prevDiagnosis?.step4.공부기술,
                      color: '#8B5CF6',
                    },
                  ] as const
                ).map((item) => {
                  const delta = item.prev != null ? item.value - item.prev : null;
                  return (
                    <ScoreItem key={item.label}>
                      <ScoreItemLabel>{item.label}</ScoreItemLabel>
                      <ScoreItemValueRow>
                        <ScoreItemValue $color={item.color}>
                          {item.value.toFixed(0)}
                        </ScoreItemValue>
                        {delta != null && Math.abs(delta) >= 0.5 && (
                          <DeltaValue $positive={delta > 0}>
                            {delta > 0 ? '+' : ''}
                            {delta.toFixed(0)}
                          </DeltaValue>
                        )}
                      </ScoreItemValueRow>
                      <ScoreProgressBar>
                        <ScoreProgressFill
                          $width={clamp(((item.value - 20) / 60) * 100)}
                          $color={item.color}
                        />
                      </ScoreProgressBar>
                    </ScoreItem>
                  );
                })}
              </ScoresGrid>
            </ScoresSection>

            {/* 코칭 전략 */}
            <CoachingSection>
              <CoachingTitle>맞춤 코칭 전략</CoachingTitle>
              <CoachingList>
                {diagnosis.step4.코칭전략.map((strategy, i) => (
                  <CoachingItem key={i}>
                    <CoachingBullet>·</CoachingBullet>
                    <span>{strategy}</span>
                  </CoachingItem>
                ))}
              </CoachingList>
            </CoachingSection>
          </TypeInfoPanel>
        </Step4Grid>
      </StepCard>
    </Container>
  );
}
