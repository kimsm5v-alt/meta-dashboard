import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { AlertCircle, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { schoolRecordApi } from '@features/school-record/api/schoolRecordApi';
import { streamSchoolRecordGeneration } from '@features/school-record/api/schoolRecordAgentApi';
import { schoolRecordKeys } from '@features/school-record/api/queryKeys';
import { SITUATIONS, SITUATION_BEHAVIORS } from '@features/school-record/data/situations';
import type { GenerationSource, StudentProfile } from '@features/school-record/types';
import {
  buildAgentStudentInput,
  buildGenerationRequest,
} from '@features/school-record/utils/buildAgentRequest';
import type { Class, Student } from '@shared/types';

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

const TextButton = styled.button`
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

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const FieldLabel = styled.label`
  display: block;
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

const ProgressSummary = styled.p`
  margin: 4px 0 16px;
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const StudentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StudentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const StateLabel = styled.span<{ $state: GenerationState }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme, $state }) =>
    $state === 'saved'
      ? theme.colors.success.main
      : $state === 'failed'
        ? theme.colors.error.main
        : $state === 'generating' || $state === 'saving'
          ? theme.colors.primary[600]
          : theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};

  svg {
    animation: ${({ $state }) =>
      $state === 'generating' || $state === 'saving'
        ? 'school-record-spin 1s linear infinite'
        : 'none'};
  }

  @keyframes school-record-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ResultHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const SuccessText = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.success.main};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const ResultList = styled.div`
  margin-top: 16px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const ResultItem = styled.div`
  padding: 12px 14px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  }
`;

const ResultMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const SourceChip = styled.span`
  padding: 2px 6px;
  color: ${({ theme }) => theme.colors.gray[500]};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 10.5px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const EditButton = styled.button`
  margin-left: auto;
  padding: 0;
  color: ${({ theme }) => theme.colors.primary[600]};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
`;

const ResultText = styled.p<{ $failed?: boolean }>`
  margin: 0;
  color: ${({ theme, $failed }) =>
    $failed ? theme.colors.error.main : theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.65;
  word-break: keep-all;
`;

type Phase = 'method' | 'commonForm' | 'progress' | 'result';
type GenerationState = 'waiting' | 'generating' | 'saving' | 'saved' | 'failed';

interface BulkResult {
  text: string;
  error?: string;
}

export interface BulkGenerateSectionStudent {
  student: Student;
  profile: StudentProfile;
}

export interface BulkGenerateSectionProps {
  classData: Class;
  students: BulkGenerateSectionStudent[];
  onBack: () => void;
  onEditStudent: (studentId: string) => void;
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

const SOURCE_LABEL: Record<GenerationSource, string> = {
  TEST_ONLY: '검사 결과',
  COMMON_CONTEXT: '공통 상황',
  INDIVIDUAL_OBSERVATION: '학생별 관찰',
};

const stateLabel = (state: GenerationState) => {
  if (state === 'saved')
    return (
      <>
        <Check size={14} /> 저장됨
      </>
    );
  if (state === 'failed')
    return (
      <>
        <AlertCircle size={14} /> 실패
      </>
    );
  if (state === 'generating')
    return (
      <>
        <Loader2 size={14} /> 생성 중
      </>
    );
  if (state === 'saving')
    return (
      <>
        <Loader2 size={14} /> 저장 중
      </>
    );
  return '대기';
};

export const BulkGenerateSection = ({
  classData,
  students,
  onBack,
  onEditStudent,
}: BulkGenerateSectionProps) => {
  const queryClient = useQueryClient();
  const controllerRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<Phase>('method');
  const [method, setMethod] = useState<GenerationSource>('TEST_ONLY');
  const [commonSituation, setCommonSituation] = useState('GROUP_ACTIVITY');
  const [activityText, setActivityText] = useState('');
  const [commonBehaviors, setCommonBehaviors] = useState<string[]>([]);
  const [states, setStates] = useState<Record<string, GenerationState>>({});
  const [results, setResults] = useState<Record<string, BulkResult>>({});

  useEffect(() => () => controllerRef.current?.abort(), []);

  const commonBehaviorOptions = SITUATION_BEHAVIORS[commonSituation] ?? [];
  const completedCount = useMemo(
    () => Object.values(states).filter((state) => state === 'saved' || state === 'failed').length,
    [states],
  );
  const savedCount = Object.values(states).filter((state) => state === 'saved').length;

  const updateState = (studentId: string, state: GenerationState) => {
    setStates((current) => ({ ...current, [studentId]: state }));
  };

  const runBulk = async () => {
    if (controllerRef.current || method === 'INDIVIDUAL_OBSERVATION') return;

    const initialStates = Object.fromEntries(
      students.map(({ student }) => [student.id, 'waiting' as const]),
    );
    setStates(initialStates);
    setResults({});
    setPhase('progress');

    const request = buildGenerationRequest({
      classData,
      source: method,
      action: 'generate',
      streamTokens: false,
      students: students.map(({ student, profile }) =>
        buildAgentStudentInput({ student, profile }),
      ),
      ...(method === 'COMMON_CONTEXT'
        ? {
            commonContext: {
              situation_label:
                SITUATIONS.find((situation) => situation.code === commonSituation)?.label ?? '',
              activity_text: activityText.trim(),
              behaviors: commonBehaviors,
            },
          }
        : {}),
    });

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await streamSchoolRecordGeneration(request, {
        signal: controller.signal,
        onEvent: async (event) => {
          if (event.type === 'student_start') {
            updateState(event.student_id, 'generating');
            return;
          }
          if (event.type === 'student_error') {
            updateState(event.student_id, 'failed');
            setResults((current) => ({
              ...current,
              [event.student_id]: { text: '', error: event.message },
            }));
            return;
          }
          if (event.type === 'error') throw new Error(event.message);
          if (event.type !== 'student_done') return;

          setResults((current) => ({
            ...current,
            [event.student_id]: { text: event.text },
          }));
          updateState(event.student_id, 'saving');

          const selected = students.find(({ student }) => student.id === event.student_id);
          if (!selected) throw new Error('생성 결과에 해당하는 학생을 찾을 수 없습니다.');

          try {
            await schoolRecordApi.saveDraft({
              studentId: selected.student.id,
              classId: classData.id,
              status: 'DRAFT',
              source: method,
              content: event.text,
              generatedText: event.text,
              strengths: selected.profile.strengths.map((item) => item.factorName),
              improvements: selected.profile.weaknesses.map((item) => item.factorName),
            });
            updateState(event.student_id, 'saved');
          } catch {
            updateState(event.student_id, 'failed');
            setResults((current) => ({
              ...current,
              [event.student_id]: {
                text: event.text,
                error: '문구는 생성됐지만 자동 저장하지 못했습니다.',
              },
            }));
          }
        },
      });
      await queryClient.invalidateQueries({ queryKey: schoolRecordKeys.classList(classData.id) });
      setPhase('result');
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setStates((current) =>
          Object.fromEntries(
            Object.entries(current).map(([studentId, state]) => [
              studentId,
              state === 'waiting' || state === 'generating' || state === 'saving'
                ? 'failed'
                : state,
            ]),
          ),
        );
        toast.error(
          error instanceof Error
            ? error.message
            : '문구를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        );
        setPhase('result');
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

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
          <FooterRow>
            <TextButton type='button' onClick={onBack}>
              취소
            </TextButton>
            <PrimaryButton
              type='button'
              onClick={() => {
                if (method === 'COMMON_CONTEXT') setPhase('commonForm');
                else if (method === 'INDIVIDUAL_OBSERVATION') {
                  const firstStudent = students[0]?.student;
                  if (firstStudent) onEditStudent(firstStudent.id);
                } else void runBulk();
              }}
            >
              다음
            </PrimaryButton>
          </FooterRow>
        </Content>
      </Frame>
    );
  }

  if (phase === 'commonForm') {
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
          <FooterRow>
            <TextButton type='button' onClick={() => setPhase('method')}>
              이전
            </TextButton>
            <PrimaryButton
              type='button'
              disabled={commonBehaviors.length === 0}
              onClick={() => void runBulk()}
            >
              생성 시작
            </PrimaryButton>
          </FooterRow>
        </Content>
      </Frame>
    );
  }

  if (phase === 'progress') {
    return (
      <Frame>
        <Content>
          <BackButton type='button' onClick={onBack}>
            <ArrowLeft size={16} /> 뒤로
          </BackButton>
          <Title>{students.length}명의 문구를 만들고 있습니다</Title>
          <ProgressSummary>
            {completedCount} / {students.length} 완료
          </ProgressSummary>
          <StudentList>
            {students.map(({ student }) => {
              const state = states[student.id] ?? 'waiting';
              return (
                <StudentRow key={student.id}>
                  <span>
                    {student.number}번 {student.name}
                  </span>
                  <StateLabel $state={state}>{stateLabel(state)}</StateLabel>
                </StudentRow>
              );
            })}
          </StudentList>
        </Content>
      </Frame>
    );
  }

  return (
    <Frame>
      <Content>
        <BackButton type='button' onClick={onBack}>
          <ArrowLeft size={16} /> 뒤로
        </BackButton>
        <ResultHeader>
          <div>
            <Title>생성 완료 · {savedCount}명</Title>
            <SuccessText>
              <Check size={14} /> 저장된 문구는 학생별로 확인하고 수정할 수 있어요.
            </SuccessText>
          </div>
          <PrimaryButton type='button' onClick={onBack}>
            목록으로
          </PrimaryButton>
        </ResultHeader>
        <ResultList>
          {students.map(({ student }) => {
            const state = states[student.id] ?? 'failed';
            const result = results[student.id];
            return (
              <ResultItem key={student.id}>
                <ResultMeta>
                  <span>
                    {student.number}번 {student.name}
                  </span>
                  <SourceChip>{SOURCE_LABEL[method]}</SourceChip>
                  <StateLabel $state={state}>{stateLabel(state)}</StateLabel>
                  <EditButton type='button' onClick={() => onEditStudent(student.id)}>
                    수정
                  </EditButton>
                </ResultMeta>
                {result?.error ? <ResultText $failed>{result.error}</ResultText> : null}
                {result?.text ? <ResultText>{result.text}</ResultText> : null}
              </ResultItem>
            );
          })}
        </ResultList>
        <NoticeText style={{ marginTop: 12 }}>
          검사 결과를 바탕으로 만든 참고 문구입니다. 학생의 실제 학교생활 모습을 확인한 뒤 활용해
          주세요.
        </NoticeText>
      </Content>
    </Frame>
  );
};
