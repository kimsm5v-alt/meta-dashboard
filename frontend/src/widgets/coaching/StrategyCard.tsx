import { useState } from 'react';
import styled from '@emotion/styled';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { StudentType } from '@shared/types';
import type { LPATypeStrategy } from '@features/coaching/types';

const STEP_LABEL: Record<1 | 2 | 3, string> = {
  1: 'STEP 1',
  2: 'STEP 2',
  3: 'STEP 3',
} as const;

const Wrapper = styled.div<{ $primary: boolean }>`
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ $primary, theme }) =>
    $primary
      ? `linear-gradient(135deg, ${theme.colors.primary[50]} 0%, #EEF2FF 100%)`
      : theme.colors.background.paper};
  border: 1px solid
    ${({ $primary, theme }) => ($primary ? theme.colors.primary[100] : theme.colors.gray[100])};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const Badge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
`;

const StepChip = styled.span<{ $primary: boolean }>`
  padding: 2px 10px;
  color: ${({ $primary }) => ($primary ? 'white' : 'inherit')};
  background: ${({ $primary, theme }) =>
    $primary ? theme.colors.primary[600] : theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const TypeChip = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Title = styled.h4`
  margin: 0 0 12px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Description = styled.p`
  margin: 0 0 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.65;
`;

const ActionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
`;

const ActionRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const ActionNumber = styled.span<{ $primary: boolean }>`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: ${({ $primary }) => ($primary ? 'white' : 'inherit')};
  background: ${({ $primary, theme }) =>
    $primary ? theme.colors.primary[600] : theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ActionText = styled.span`
  padding-top: 2px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const IndicatorBox = styled.div`
  padding: 14px;
  margin-bottom: 14px;
  background: ${({ theme }) => theme.colors.success.light};
  border: 1px solid ${({ theme }) => theme.colors.success.main};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const IndicatorTitle = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  color: ${({ theme }) => theme.colors.success.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const IndicatorRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: ${({ theme }) => theme.colors.success.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const NoteBox = styled.div`
  padding: 12px;
  margin-bottom: 14px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const AdvancedToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  padding-top: 14px;
  color: ${({ theme }) => theme.colors.primary[700]};
  background: none;
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.primary[100]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
`;

const AdvancedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
`;

const AdvancedItem = styled.div`
  padding: 14px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: ${({ theme }) => theme.radius.md};
`;

const AdvancedTitle = styled.h5`
  margin: 0 0 6px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const AdvancedDescription = styled.p`
  margin: 0 0 8px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const AdvancedBullets = styled.ul`
  list-style: disc;
  margin: 0;
  padding-left: 18px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const AdvancedBullet = styled.li`
  margin-bottom: 4px;
`;

const EmptyBox = styled.div`
  padding: 24px;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

export interface StrategyCardProps {
  step: 1 | 2 | 3;
  type: StudentType;
  content?: LPATypeStrategy;
}

export const StrategyCard = ({ step, type, content }: StrategyCardProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isPrimary = step === 1;

  if (!content) {
    return (
      <Wrapper $primary={isPrimary}>
        <Badge>
          <StepChip $primary={isPrimary}>{STEP_LABEL[step]}</StepChip>
          <TypeChip>{type} 대상</TypeChip>
        </Badge>
        <EmptyBox>이 유형의 학급전략 콘텐츠는 아직 준비되지 않았습니다.</EmptyBox>
      </Wrapper>
    );
  }

  return (
    <Wrapper $primary={isPrimary}>
      <Badge>
        <StepChip $primary={isPrimary}>{STEP_LABEL[step]}</StepChip>
        <TypeChip>{type} 대상</TypeChip>
      </Badge>

      <Title>{content.strategyTitle}</Title>

      {isPrimary && <Description>{content.strategyDescription}</Description>}

      <ActionList>
        {content.actionItems.map((item, index) => (
          <ActionRow key={index}>
            <ActionNumber $primary={isPrimary}>{index + 1}</ActionNumber>
            <ActionText>{item}</ActionText>
          </ActionRow>
        ))}
      </ActionList>

      {isPrimary && content.successIndicators.length > 0 && (
        <IndicatorBox>
          <IndicatorTitle>
            <Check size={14} /> 2주 후 이런 변화가 보이면 작동 중이에요
          </IndicatorTitle>
          {content.successIndicators.map((indicator, index) => (
            <IndicatorRow key={index}>
              <input type='checkbox' />
              {indicator}
            </IndicatorRow>
          ))}
        </IndicatorBox>
      )}

      {content.noteForOtherTypes && (
        <NoteBox>
          <strong>👥 다른 유형에는?</strong> {content.noteForOtherTypes}
        </NoteBox>
      )}

      {isPrimary && (
        <>
          <AdvancedToggle type='button' onClick={() => setShowAdvanced((current) => !current)}>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            심화 코칭 2가지 더 보기
          </AdvancedToggle>
          {showAdvanced && (
            <AdvancedList>
              {content.advancedStrategies.map((advanced, index) => (
                <AdvancedItem key={index}>
                  <AdvancedTitle>{advanced.title}</AdvancedTitle>
                  <AdvancedDescription>{advanced.description}</AdvancedDescription>
                  <AdvancedBullets>
                    {advanced.actionItems.map((item, itemIndex) => (
                      <AdvancedBullet key={itemIndex}>{item}</AdvancedBullet>
                    ))}
                  </AdvancedBullets>
                </AdvancedItem>
              ))}
            </AdvancedList>
          )}
        </>
      )}
    </Wrapper>
  );
};

export default StrategyCard;
