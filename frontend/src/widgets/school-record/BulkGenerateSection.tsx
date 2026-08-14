import { useState } from 'react';
import styled from '@emotion/styled';
import { ArrowLeft } from 'lucide-react';

import { SITUATIONS, SITUATION_BEHAVIORS } from '@features/school-record/data/situations';
import type { GenerationSource } from '@features/school-record/types';

import { AiGenerationNotice } from './AiGenerationNotice';

const Frame = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Content = styled.div`
  max-width: 760px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.gray[500]};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const Title = styled.h2`
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const HelperText = styled.p`
  margin: 0 0 20px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const MethodList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MethodCard = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  text-align: left;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary[50] : theme.colors.background.paper};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary[400] : theme.colors.gray[200])};
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;

  &:hover {
    background: ${({ theme, $active }) =>
      $active ? theme.colors.primary[50] : theme.colors.gray[50]};
  }
`;

const RadioDot = styled.span<{ $active: boolean }>`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  border: 5px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary[500] : theme.colors.gray[300])};
  border-radius: 50%;
`;

const MethodTitle = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const MethodDesc = styled.span`
  display: block;
  margin-top: 2px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const FooterRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
`;

const CancelButton = styled.button`
  padding: 8px 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  padding: 8px 20px;
  color: white;
  background: ${({ theme }) => theme.colors.primary[500]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const FieldLabel = styled.label`
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
`;

const Chip = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  color: ${({ theme, $active }) => ($active ? 'white' : theme.colors.text.secondary)};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary[500] : theme.colors.background.paper};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary[500] : theme.colors.gray[200])};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 16px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[300]};
  }
`;

const NoticeText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

type Phase = 'method' | 'commonForm';

export interface BulkGenerateSectionStudent {
  studentId: string;
  no: number;
  name: string;
}

export interface BulkGenerateSectionProps {
  students: BulkGenerateSectionStudent[];
  onBack: () => void;
}

const METHODS: { key: GenerationSource; title: string; desc: string }[] = [
  {
    key: 'TEST_ONLY',
    title: '검사 결과만으로 초안 만들기',
    desc: '강점·성장 가능성 중심 초안을 빠르게 생성',
  },
  {
    key: 'COMMON_CONTEXT',
    title: '공통 상황을 추가하여 만들기',
    desc: '학급 프로젝트·발표 등 함께한 활동 반영',
  },
  {
    key: 'INDIVIDUAL_OBSERVATION',
    title: '학생별 관찰 정보를 확인한 뒤 만들기',
    desc: '소수 학생을 각각 확인하며 생성',
  },
];

export const BulkGenerateSection = ({ students, onBack }: BulkGenerateSectionProps) => {
  const [phase, setPhase] = useState<Phase>('method');
  const [method, setMethod] = useState<GenerationSource>('TEST_ONLY');
  const [commonSituation, setCommonSituation] = useState('GROUP_ACTIVITY');
  const [activityText, setActivityText] = useState('');
  const [commonBehaviors, setCommonBehaviors] = useState<string[]>([]);

  const commonBehaviorOptions = SITUATION_BEHAVIORS[commonSituation] ?? [];

  if (phase === 'method') {
    return (
      <Frame>
        <Content>
          <BackButton type='button' onClick={onBack}>
            <ArrowLeft size={16} /> 뒤로
          </BackButton>
          <Title>선택한 {students.length}명의 문구를 어떻게 만들까요?</Title>
          <HelperText>추천은 안내이며 방식을 강제하지 않습니다.</HelperText>
          <MethodList role='radiogroup' aria-label='문구 생성 방식'>
            {METHODS.map((option) => (
              <MethodCard
                key={option.key}
                type='button'
                role='radio'
                aria-checked={method === option.key}
                $active={method === option.key}
                onClick={() => setMethod(option.key)}
              >
                <RadioDot $active={method === option.key} />
                <span>
                  <MethodTitle>{option.title}</MethodTitle>
                  <MethodDesc>{option.desc}</MethodDesc>
                </span>
              </MethodCard>
            ))}
          </MethodList>

          {method === 'COMMON_CONTEXT' ? (
            <FooterRow>
              <CancelButton type='button' onClick={onBack}>
                취소
              </CancelButton>
              <PrimaryButton type='button' onClick={() => setPhase('commonForm')}>
                다음
              </PrimaryButton>
            </FooterRow>
          ) : (
            <div style={{ marginTop: 24 }}>
              <AiGenerationNotice />
            </div>
          )}
        </Content>
      </Frame>
    );
  }

  return (
    <Frame>
      <Content>
        <BackButton type='button' onClick={() => setPhase('method')}>
          <ArrowLeft size={16} /> 뒤로
        </BackButton>
        <Title>공통 상황을 입력하세요</Title>
        <div style={{ height: 16 }} />
        <FieldLabel as='div'>공통 상황</FieldLabel>
        <ChipRow>
          {SITUATIONS.filter((situation) => situation.code !== 'ETC').map((situation) => (
            <Chip
              key={situation.code}
              type='button'
              aria-pressed={commonSituation === situation.code}
              $active={commonSituation === situation.code}
              onClick={() => {
                if (commonSituation === situation.code) return;
                setCommonSituation(situation.code);
                setCommonBehaviors([]);
              }}
            >
              {situation.label}
            </Chip>
          ))}
        </ChipRow>
        <FieldLabel htmlFor='school-record-common-activity'>활동 또는 장면</FieldLabel>
        <TextInput
          id='school-record-common-activity'
          value={activityText}
          onChange={(event) => setActivityText(event.target.value)}
          placeholder='예) 학급 프로젝트 발표 준비'
        />
        <FieldLabel as='div'>공통 행동 (최소 1개)</FieldLabel>
        <ChipRow>
          {commonBehaviorOptions.map((behavior) => (
            <Chip
              key={behavior}
              type='button'
              aria-pressed={commonBehaviors.includes(behavior)}
              $active={commonBehaviors.includes(behavior)}
              onClick={() =>
                setCommonBehaviors((current) =>
                  current.includes(behavior)
                    ? current.filter((item) => item !== behavior)
                    : [...current, behavior],
                )
              }
            >
              {behavior}
            </Chip>
          ))}
        </ChipRow>
        <NoticeText>실제 참여한 학생에게만 적용해 주세요.</NoticeText>

        <div style={{ marginTop: 24 }}>
          <AiGenerationNotice
            subText={
              commonBehaviors.length === 0 ? '공통 행동을 1개 이상 선택해 주세요.' : undefined
            }
          />
        </div>
      </Content>
    </Frame>
  );
};
