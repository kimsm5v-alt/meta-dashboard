// frontend/src/widgets/school-record/StudentWritingSection.tsx
import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  History,
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@features/auth';
import {
  streamSchoolRecordGeneration,
  type GenerationWarning,
  type RecordGenerationAction,
} from '@features/school-record/api/schoolRecordAgentApi';
import { useSchoolRecordStudentData } from '@features/school-record/model/useSchoolRecordStudentData';
import {
  buildAgentObservation,
  buildAgentStudentInput,
  buildGenerationRequest,
} from '@features/school-record/utils/buildAgentRequest';
import { buildObservationInput } from '@features/school-record/utils/buildObservationInput';
import { classSubtitle } from '@features/school-record/utils/formatters';
import { FACTOR_INFO } from '@features/school-record/data/factorInfo';
import { CONTINUITY_OPTIONS, FREETEXT_PLACEHOLDER } from '@features/school-record/data/situations';

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BackButton = styled.button`
  padding: 8px;
  color: ${({ theme }) => theme.colors.gray[500]};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ResetButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text.secondary};
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Section = styled.section`
  padding: 20px;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
`;

const StepBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  color: white;
  background: ${({ theme }) => theme.colors.primary[500]};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const SectionSubtitle = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const FactorRowLabel = styled.div`
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const FactorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const FactorCard = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  text-align: left;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary[50] : theme.colors.background.paper};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary[300] : theme.colors.gray[200])};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;

  &:hover {
    background: ${({ theme, $active }) =>
      $active ? theme.colors.primary[50] : theme.colors.gray[50]};
  }
`;

const CheckBox = styled.span<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary[500] : theme.colors.background.paper};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary[500] : theme.colors.gray[300])};
  border-radius: 4px;
`;

const FactorName = styled.span<{ $active: boolean }>`
  display: block;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary[700] : theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium};
`;

const FactorDesc = styled.span`
  display: block;
  margin-top: 2px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const Divider = styled.div`
  margin: 16px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const ObservationEmpty = styled.div`
  padding: 24px 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

const ObservationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ObservationBlock = styled.div`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const ObservationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
`;

const ObservationFactorTag = styled.span`
  padding: 2px 8px;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const ObservationQuestion = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const BehaviorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const BehaviorButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  text-align: left;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary[50] : theme.colors.background.paper};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary[300] : theme.colors.gray[200])};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary[700] : theme.colors.text.secondary};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};
  cursor: pointer;
`;

const FieldLabel = styled.div`
  margin: 16px 0 8px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  resize: none;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[300]};
  }
`;

const ContinuityRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const ContinuityChip = styled.button<{ $active: boolean }>`
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

const SaveRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
`;

const SavedNotice = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.colors.success.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const TempSaveButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;

  &:disabled {
    color: ${({ theme }) => theme.colors.gray[300]};
    border-color: ${({ theme }) => theme.colors.gray[200]};
    cursor: not-allowed;
  }
`;

const CounselingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CounselingRow = styled.label<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary[50] : theme.colors.background.paper};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary[300] : theme.colors.gray[200])};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
`;

const CounselingCategory = styled.span`
  flex-shrink: 0;
  padding: 2px 6px;
  color: ${({ theme }) => theme.colors.gray[500]};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 4px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const CounselingSummary = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CounselingDate = styled.span`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const SavedContentBox = styled.div`
  padding: 16px;
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const SavedContentText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.75;
  white-space: pre-wrap;
`;

const SectionHeaderAction = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;

const PreviousButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.gray[500]};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const PreviousBox = styled.div`
  padding: 12px;
  margin-bottom: 12px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const PreviousHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const RestoreButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.colors.primary[600]};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
`;

const GenerateButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
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

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const SpinningLoader = styled(Loader2)`
  animation: school-record-spin 1s linear infinite;

  @keyframes school-record-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const GenerateHint = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const EmptyResult = styled.div`
  padding: 24px;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

const StaleNotice = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
  color: ${({ theme }) => theme.colors.primary[700]};
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const ResultTextarea = styled.textarea`
  width: 100%;
  min-height: 112px;
  padding: 8px 10px;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.75;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[400]};
  }
`;

const WarningBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 7px 10px;
  margin-top: 8px;
  color: ${({ theme }) => theme.colors.error.main};
  background: ${({ theme }) => theme.colors.error.light};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const CharCount = styled.div`
  margin-top: 6px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  text-align: right;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
    border-color: ${({ theme }) => theme.colors.primary[300]};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const CenterBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 0;
`;

const ErrorMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.error.main};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const RetryButton = styled.button`
  padding: 7px 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
`;

export interface StudentWritingSectionProps {
  classId: string;
  studentId: string;
  onBack: () => void;
}

interface LocalInput {
  factorCodes: string[];
  behaviorCodes: string[];
  freeText: string;
  continuityCode: string | null;
  counselingRefs: string[];
}

const emptyInput: LocalInput = {
  factorCodes: [],
  behaviorCodes: [],
  freeText: '',
  continuityCode: null,
  counselingRefs: [],
};

interface LocalGenerationResult {
  text: string;
  warnings: GenerationWarning[];
}

const inputSignature = (input: LocalInput): string =>
  JSON.stringify({
    factors: [...input.factorCodes].sort(),
    behaviors: [...input.behaviorCodes].sort(),
    freeText: input.freeText.trim(),
    continuityCode: input.continuityCode,
    counselingRefs: [...input.counselingRefs].sort(),
  });

const countChars = (text: string): number => text.replace(/\s/g, '').length;

export const StudentWritingSection = ({
  classId,
  studentId,
  onBack,
}: StudentWritingSectionProps) => {
  const { user } = useAuth();
  const {
    classData,
    student,
    profile,
    draft,
    counselingOptions,
    isLoading,
    error,
    saveDraft,
    isSaving,
    deleteDraft,
    isDeleting,
    retry,
  } = useSchoolRecordStudentData(classId, studentId);

  if (isLoading) {
    return (
      <Wrapper>
        <CenterBox>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </CenterBox>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <CenterBox role='alert'>
          <ErrorMessage>생활기록부 작성 정보를 불러오지 못했습니다.</ErrorMessage>
          <RetryButton type='button' onClick={retry}>
            다시 시도
          </RetryButton>
        </CenterBox>
      </Wrapper>
    );
  }

  if (!classData || !student || !profile) {
    return (
      <Wrapper>
        <CenterBox>학생 정보를 찾을 수 없습니다.</CenterBox>
      </Wrapper>
    );
  }

  return (
    <StudentWritingForm
      user={user}
      classData={classData}
      student={student}
      profile={profile}
      draft={draft}
      counselingOptions={counselingOptions}
      saveDraft={saveDraft}
      isSaving={isSaving}
      deleteDraft={deleteDraft}
      isDeleting={isDeleting}
      onBack={onBack}
    />
  );
};

// 로딩/미존재 가드를 통과한 뒤에만 마운트되는 폼 본체.
// draft가 이 시점엔 이미 resolve된 값(null 또는 실제 초안)이므로
// useState(initialInput)의 lazy init이 첫 렌더에서 정확한 값을 사용한다.
type SchoolRecordStudentData = ReturnType<typeof useSchoolRecordStudentData>;

interface StudentWritingFormProps extends Pick<
  SchoolRecordStudentData,
  'draft' | 'counselingOptions' | 'saveDraft' | 'isSaving' | 'deleteDraft' | 'isDeleting'
> {
  user: ReturnType<typeof useAuth>['user'];
  classData: NonNullable<SchoolRecordStudentData['classData']>;
  student: NonNullable<SchoolRecordStudentData['student']>;
  profile: NonNullable<SchoolRecordStudentData['profile']>;
  onBack: () => void;
}

const StudentWritingForm = ({
  user,
  classData,
  student,
  profile,
  draft,
  counselingOptions,
  saveDraft,
  isSaving,
  deleteDraft,
  isDeleting,
  onBack,
}: StudentWritingFormProps) => {
  const initialInput: LocalInput = draft?.observationInput
    ? {
        factorCodes: draft.observationInput.observations.map((o) => o.factor),
        behaviorCodes: draft.observationInput.observations.flatMap((o) => o.behaviorCodes),
        freeText: draft.observationInput.freeText,
        continuityCode: draft.observationInput.continuityCode,
        counselingRefs: draft.observationInput.counselingRefs,
      }
    : emptyInput;

  const [input, setInput] = useState<LocalInput>(initialInput);
  const [tempSaved, setTempSaved] = useState(false);
  const [result, setResult] = useState<LocalGenerationResult | null>(
    draft?.content ? { text: draft.content, warnings: [] } : null,
  );
  const [generatedText, setGeneratedText] = useState(draft?.generatedText ?? draft?.content ?? '');
  const [generationSignature, setGenerationSignature] = useState<string | null>(
    draft?.content ? inputSignature(initialInput) : null,
  );
  const [generating, setGenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const generationControllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      generationControllerRef.current?.abort();
    },
    [],
  );

  const strengths = profile.strengths.map((item) => item.factorName);
  const improvements = profile.weaknesses.map((item) => item.factorName);
  const selectedFactors = [...strengths, ...improvements].filter((f) =>
    input.factorCodes.includes(f),
  );

  const toggleFactor = (factor: string) => {
    if (input.factorCodes.includes(factor)) {
      const recommended = FACTOR_INFO[factor]?.recommendedBehaviors ?? [];
      setInput((prev) => ({
        ...prev,
        factorCodes: prev.factorCodes.filter((f) => f !== factor),
        behaviorCodes: prev.behaviorCodes.filter((b) => !recommended.includes(b)),
      }));
    } else {
      setInput((prev) => ({ ...prev, factorCodes: [...prev.factorCodes, factor] }));
    }
    setTempSaved(false);
  };

  const toggleBehavior = (behavior: string) => {
    setInput((prev) => ({
      ...prev,
      behaviorCodes: prev.behaviorCodes.includes(behavior)
        ? prev.behaviorCodes.filter((b) => b !== behavior)
        : [...prev.behaviorCodes, behavior],
    }));
    setTempSaved(false);
  };

  const toggleCounseling = (id: string) => {
    setInput((prev) => ({
      ...prev,
      counselingRefs: prev.counselingRefs.includes(id)
        ? prev.counselingRefs.filter((c) => c !== id)
        : [...prev.counselingRefs, id],
    }));
    setTempSaved(false);
  };

  const hasDraftInput =
    input.factorCodes.length > 0 ||
    input.behaviorCodes.length > 0 ||
    input.freeText.trim().length > 0 ||
    input.continuityCode !== null ||
    input.counselingRefs.length > 0;

  const getObservationInput = () =>
    buildObservationInput({
      strengthFactors: strengths,
      factorCodes: input.factorCodes,
      behaviorCodes: input.behaviorCodes,
      freeText: input.freeText,
      continuityCode: input.continuityCode,
      counselingRefs: input.counselingRefs,
      factorInfo: FACTOR_INFO,
    });

  const handleTempSave = async () => {
    if (!hasDraftInput || isSaving || isDeleting) return;
    const observationInput = getObservationInput();
    try {
      await saveDraft({
        status: draft && draft.status !== 'EMPTY' ? draft.status : 'INPUTTING',
        source: draft?.source ?? undefined,
        content: result?.text ?? draft?.content ?? undefined,
        generatedText: generatedText || draft?.generatedText || undefined,
        strengths,
        improvements,
        observationInput,
      });
      setTempSaved(true);
      setTimeout(() => setTempSaved(false), 2500);
    } catch {
      toast.error('임시저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleReset = async () => {
    if (isDeleting || isSaving || generating) return;
    try {
      await deleteDraft();
      setInput(emptyInput);
      setResult(null);
      setGeneratedText('');
      setGenerationSignature(null);
      setEditMode(false);
      setTempSaved(false);
    } catch {
      toast.error('작성 내용을 초기화하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const hasInput = hasDraftInput || Boolean(result?.text);
  const canGenerate = input.behaviorCodes.length >= 1;
  const currentText = editMode ? editText : (result?.text ?? '');
  const isStale =
    Boolean(result) &&
    generationSignature !== null &&
    inputSignature(input) !== generationSignature;

  const runGenerate = async (action: RecordGenerationAction) => {
    if (
      generating ||
      (action === 'generate' && !canGenerate) ||
      (action !== 'generate' && !result)
    ) {
      return;
    }

    const previousResult = result;
    const observationInput = getObservationInput();
    const observation = buildAgentObservation(observationInput, counselingOptions, student.name);
    const request = buildGenerationRequest({
      classData,
      source: 'INDIVIDUAL_OBSERVATION',
      action,
      streamTokens: true,
      students: [
        buildAgentStudentInput({
          student,
          profile,
          observation,
          previousText: action === 'generate' ? undefined : result?.text,
        }),
      ],
    });

    const controller = new AbortController();
    generationControllerRef.current = controller;
    setGenerating(true);
    setEditMode(false);

    try {
      await streamSchoolRecordGeneration(request, {
        signal: controller.signal,
        onEvent: async (event) => {
          if (event.type === 'student_start') {
            setResult({ text: '', warnings: [] });
            return;
          }
          if (event.type === 'token') {
            setResult((current) => ({
              text: `${current?.text ?? ''}${event.text}`,
              warnings: current?.warnings ?? [],
            }));
            return;
          }
          if (event.type === 'student_error' || event.type === 'error') {
            throw new Error(event.message);
          }
          if (event.type !== 'student_done') return;

          setResult({ text: event.text, warnings: event.warnings });
          await saveDraft({
            status: 'DRAFT',
            source: 'INDIVIDUAL_OBSERVATION',
            content: event.text,
            generatedText: event.text,
            strengths,
            improvements,
            observationInput,
          });
          setGeneratedText(event.text);
          setGenerationSignature(inputSignature(input));
        },
      });
    } catch (error) {
      setResult(previousResult);
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        toast.error(
          error instanceof Error
            ? error.message
            : '문구를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        );
      }
    } finally {
      if (generationControllerRef.current === controller) {
        generationControllerRef.current = null;
      }
      setGenerating(false);
    }
  };

  const handleSaveContent = async () => {
    const text = currentText.trim();
    if (!text || isSaving || generating) return;
    try {
      await saveDraft({
        status: editMode ? 'EDITED' : 'DRAFT',
        source: 'INDIVIDUAL_OBSERVATION',
        content: text,
        generatedText: generatedText || text,
        strengths,
        improvements,
        observationInput: getObservationInput(),
      });
      setResult({ text, warnings: editMode ? [] : (result?.warnings ?? []) });
      setEditMode(false);
      toast.success('문구를 저장했습니다.');
    } catch {
      toast.error('문구를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleCopy = async () => {
    if (!currentText) return;
    await navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = async () => {
    if (!draft?.previousContent || isSaving || generating) return;
    try {
      await saveDraft({
        status: 'DRAFT',
        source: 'INDIVIDUAL_OBSERVATION',
        content: draft.previousContent,
        generatedText: generatedText || draft.previousContent,
        strengths,
        improvements,
        observationInput: getObservationInput(),
      });
      setResult({ text: draft.previousContent, warnings: [] });
      setEditMode(false);
      setShowPrevious(false);
    } catch {
      toast.error('이전 문구를 복원하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <Wrapper>
      <HeaderRow>
        <HeaderLeft>
          <BackButton onClick={onBack} title='학급 현황'>
            <ArrowLeft size={20} />
          </BackButton>
          <div>
            <Title>
              {student.number}번 {student.name}
            </Title>
            <Subtitle>
              {classSubtitle(
                user?.schoolName,
                classData.schoolLevel,
                classData.grade,
                classData.classNumber,
              )}
            </Subtitle>
          </div>
        </HeaderLeft>
        {hasInput && (
          <ResetButton onClick={handleReset} disabled={isSaving || isDeleting || generating}>
            <RotateCcw size={14} /> {isDeleting ? '초기화 중…' : '처음부터'}
          </ResetButton>
        )}
      </HeaderRow>

      <Sections>
        <Section>
          <SectionHeader>
            <StepBadge>1</StepBadge>
            <div>
              <SectionTitle>검사 결과에서 살펴볼 요인</SectionTitle>
              <SectionSubtitle>
                실제로 관찰한 요인을 선택하면 아래에 관찰 질문이 나타납니다.
              </SectionSubtitle>
            </div>
          </SectionHeader>

          <FactorRowLabel>강점 요인 TOP 3</FactorRowLabel>
          <FactorGrid>
            {strengths.map((factor) => {
              const active = input.factorCodes.includes(factor);
              return (
                <FactorCard key={factor} $active={active} onClick={() => toggleFactor(factor)}>
                  <CheckBox $active={active}>
                    {active && <Check size={11} color='white' />}
                  </CheckBox>
                  <span>
                    <FactorName $active={active}>{factor}</FactorName>
                    <FactorDesc>{FACTOR_INFO[factor]?.description}</FactorDesc>
                  </span>
                </FactorCard>
              );
            })}
          </FactorGrid>

          <div style={{ marginTop: 16 }}>
            <FactorRowLabel>보완 요인 TOP 3</FactorRowLabel>
            <FactorGrid>
              {improvements.map((factor) => {
                const active = input.factorCodes.includes(factor);
                return (
                  <FactorCard key={factor} $active={active} onClick={() => toggleFactor(factor)}>
                    <CheckBox $active={active}>
                      {active && <Check size={11} color='white' />}
                    </CheckBox>
                    <span>
                      <FactorName $active={active}>{factor}</FactorName>
                      <FactorDesc>{FACTOR_INFO[factor]?.description}</FactorDesc>
                    </span>
                  </FactorCard>
                );
              })}
            </FactorGrid>
          </div>

          <Divider />

          <SectionHeader>
            <StepBadge>2</StepBadge>
            <div>
              <SectionTitle>선생님이 관찰한 모습</SectionTitle>
              <SectionSubtitle>
                선택한 요인의 관찰 질문에 답하고, 필요하면 구체적 장면을 적어 주세요.
              </SectionSubtitle>
            </div>
          </SectionHeader>

          {selectedFactors.length === 0 ? (
            <ObservationEmpty>위에서 관찰한 요인을 선택하면 질문이 나타납니다.</ObservationEmpty>
          ) : (
            <ObservationList>
              {selectedFactors.map((factor) => {
                const info = FACTOR_INFO[factor];
                if (!info) return null;
                return (
                  <ObservationBlock key={factor}>
                    <ObservationHeader>
                      <ObservationFactorTag>{factor}</ObservationFactorTag>
                      <ObservationQuestion>{info.question}</ObservationQuestion>
                    </ObservationHeader>
                    <BehaviorGrid>
                      {info.recommendedBehaviors.map((behavior) => {
                        const active = input.behaviorCodes.includes(behavior);
                        return (
                          <BehaviorButton
                            key={behavior}
                            $active={active}
                            onClick={() => toggleBehavior(behavior)}
                          >
                            <CheckBox $active={active}>
                              {active && <Check size={11} color='white' />}
                            </CheckBox>
                            {behavior}
                          </BehaviorButton>
                        );
                      })}
                    </BehaviorGrid>
                  </ObservationBlock>
                );
              })}
            </ObservationList>
          )}

          <FieldLabel>구체적인 장면이 있다면 적어주세요 (선택)</FieldLabel>
          <Textarea
            value={input.freeText}
            onChange={(event) => {
              setInput((prev) => ({ ...prev, freeText: event.target.value }));
              setTempSaved(false);
            }}
            rows={2}
            maxLength={100}
            placeholder={FREETEXT_PLACEHOLDER[student.schoolLevel]}
          />

          <FieldLabel>지속성</FieldLabel>
          <ContinuityRow>
            {CONTINUITY_OPTIONS.map((option) => (
              <ContinuityChip
                key={option.code}
                $active={input.continuityCode === option.code}
                onClick={() => {
                  setInput((prev) => ({
                    ...prev,
                    continuityCode: prev.continuityCode === option.code ? null : option.code,
                  }));
                  setTempSaved(false);
                }}
              >
                {option.label}
              </ContinuityChip>
            ))}
          </ContinuityRow>

          <SaveRow>
            {tempSaved && (
              <SavedNotice>
                <Check size={14} /> 임시저장되었습니다
              </SavedNotice>
            )}
            <TempSaveButton
              onClick={handleTempSave}
              disabled={!hasDraftInput || isSaving || isDeleting}
            >
              <Save size={14} /> {isSaving ? '저장 중…' : '임시저장'}
            </TempSaveButton>
          </SaveRow>
        </Section>

        {counselingOptions.length > 0 && (
          <Section>
            <SectionHeader>
              <div>
                <SectionTitle>상담·관찰 기록 참고 · {counselingOptions.length}건</SectionTitle>
                <SectionSubtitle>문구에 반영할 기록을 선택하세요.</SectionSubtitle>
              </div>
            </SectionHeader>
            <CounselingList>
              {counselingOptions.map((record) => {
                const active = input.counselingRefs.includes(record.id);
                return (
                  <CounselingRow key={record.id} $active={active}>
                    <input
                      type='checkbox'
                      checked={active}
                      onChange={() => toggleCounseling(record.id)}
                    />
                    <CounselingCategory>{record.category}</CounselingCategory>
                    <CounselingSummary>{record.summary}</CounselingSummary>
                    <CounselingDate>{record.date}</CounselingDate>
                  </CounselingRow>
                );
              })}
            </CounselingList>
          </Section>
        )}

        <Section>
          <SectionHeaderAction>
            <div>
              <SectionTitle>AI 생성 문구</SectionTitle>
              <SectionSubtitle>
                선택한 정보로 참고 문구를 생성합니다. 생성 후 편집·저장할 수 있어요.
              </SectionSubtitle>
            </div>
            {draft?.previousContent && (
              <PreviousButton type='button' onClick={() => setShowPrevious((current) => !current)}>
                <History size={14} /> 이전 문구 보기
              </PreviousButton>
            )}
          </SectionHeaderAction>

          {showPrevious && draft?.previousContent && (
            <PreviousBox>
              <PreviousHeader>
                <span>이전 저장 문구{draft.savedAt ? ` · ${draft.savedAt} 저장` : ''}</span>
                <RestoreButton type='button' onClick={() => void handleRestore()}>
                  <RotateCcw size={12} /> 현재 문구로 복원
                </RestoreButton>
              </PreviousHeader>
              <SavedContentText>{draft.previousContent}</SavedContentText>
            </PreviousBox>
          )}

          {!result && (
            <div style={{ marginBottom: 12 }}>
              <GenerateButton
                type='button'
                onClick={() => void runGenerate('generate')}
                disabled={!canGenerate || generating}
              >
                {generating ? <SpinningLoader size={16} /> : <Sparkles size={16} />}
                {generating ? '문구 생성 중…' : '문구 생성'}
              </GenerateButton>
              {!canGenerate && (
                <GenerateHint>
                  관찰한 요인을 선택하고 관련 행동을 1개 이상 골라 주세요.
                </GenerateHint>
              )}
            </div>
          )}

          {isStale && (
            <StaleNotice>
              <span>입력 내용이 바뀌었어요. 최신 내용으로 다시 생성할 수 있어요.</span>
              <GenerateButton
                type='button'
                onClick={() => void runGenerate('generate')}
                disabled={!canGenerate || generating}
              >
                <Sparkles size={14} /> {generating ? '생성 중…' : '다시 생성'}
              </GenerateButton>
            </StaleNotice>
          )}

          {!result ? (
            <EmptyResult>관찰한 모습을 선택하면 AI가 참고 문구를 제안합니다.</EmptyResult>
          ) : (
            <SavedContentBox>
              {editMode ? (
                <ResultTextarea
                  value={editText}
                  onChange={(event) => setEditText(event.target.value)}
                />
              ) : (
                <SavedContentText>
                  {result.text || (generating ? '문구를 생성하고 있습니다…' : '')}
                </SavedContentText>
              )}
              {result.warnings.length > 0 && (
                <WarningBox>
                  <AlertTriangle size={14} />
                  <span>
                    기재 유의 표현:{' '}
                    {result.warnings
                      .map((warning) => `‘${warning.match}’(${warning.label})`)
                      .join(', ')}
                  </span>
                </WarningBox>
              )}
              <CharCount>{countChars(currentText)}자</CharCount>
            </SavedContentBox>
          )}

          {result && (
            <ActionRow>
              <ActionButton
                type='button'
                onClick={() => void runGenerate('rewrite')}
                disabled={generating}
              >
                다른 표현
              </ActionButton>
              <ActionButton type='button' onClick={() => void handleCopy()} disabled={generating}>
                {copied ? <Check size={14} /> : <Copy size={14} />} 복사
              </ActionButton>
              {editMode ? (
                <ActionButton
                  type='button'
                  onClick={() => setEditMode(false)}
                  disabled={generating}
                >
                  편집 취소
                </ActionButton>
              ) : (
                <ActionButton
                  type='button'
                  onClick={() => {
                    setEditMode(true);
                    setEditText(result.text);
                  }}
                  disabled={generating}
                >
                  <Pencil size={14} /> 문구 수정
                </ActionButton>
              )}
              <GenerateButton
                type='button'
                onClick={() => void handleSaveContent()}
                disabled={!currentText.trim() || isSaving || generating}
              >
                {isSaving ? '저장 중…' : '저장'}
              </GenerateButton>
            </ActionRow>
          )}
        </Section>
      </Sections>
    </Wrapper>
  );
};
