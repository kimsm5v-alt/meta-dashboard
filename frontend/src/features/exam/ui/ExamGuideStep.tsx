import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import type { StudentInfo } from './StudentInfoStep';

type SchoolLevel = 'elementary' | 'middle' | 'high' | '';

export interface StudentExamContext {
  ordNo: number;
  schoolName?: string;
  schoolLevel?: string;
  grade?: number;
  classNumber?: number;
  prefilledName?: string;
  prefilledStudentNumber?: string;
}

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, #f5f3ff, #ffffff, #eef2ff);
  padding: 2rem 1rem;
`;

const ContentWrapper = styled.div<{ $wide?: boolean }>`
  max-width: ${({ $wide }) => ($wide ? '54rem' : '42rem')};
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const ExamBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}18`};
  border: 1px solid ${({ $color }) => `${$color}40`};
  margin-bottom: 0.75rem;
`;

const BadgeDot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const Section = styled.div``;

const SectionDivider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  padding-top: 1.5rem;
`;

const SectionHeader = styled.div<{ $color?: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;

  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${({ $color, theme }) => $color || theme.colors.primary[500]};
  }
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const GuidelineList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const GuidelineItem = styled.li`
  display: flex;
  gap: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const GuidelineNumber = styled.span<{ $color: string }>`
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $color }) => `${$color}18`};
  color: ${({ $color }) => $color};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GuidelineText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.6;
`;

const ExampleBox = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 1rem;
`;

const ExampleQuestion = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 1rem;
`;

const ExampleQuestionNumber = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const RadioGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;

  @media (min-width: 768px) {
    gap: 1rem;
  }
`;

const RadioLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
`;

const RadioInput = styled.input`
  width: 1.25rem;
  height: 1.25rem;
`;

const RadioLabelText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-align: center;
  white-space: nowrap;
`;

/* ──────────── Info Form Styled Components ──────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const InfoFormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: ${fadeUp} 0.3s ease-out;
`;

const FormField = styled.div``;

const FieldLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
`;

const FieldError = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: #ef4444;
  margin-top: 0.375rem;
`;

const TextInput = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1.5px solid ${({ $hasError, theme }) => ($hasError ? '#ef4444' : theme.colors.gray[200])};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[900]};
  background: ${({ theme }) => theme.colors.gray[50]};
  transition: border-color 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${({ $hasError, theme }) => ($hasError ? '#ef4444' : theme.colors.primary[400])};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ToggleButton = styled.button<{ $isSelected: boolean; $color: string }>`
  flex: 1;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  border: 1.5px solid ${({ $isSelected, $color }) => ($isSelected ? $color : 'transparent')};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${({ $isSelected, $color }) => ($isSelected ? `${$color}18` : '#f3f4f6')};
  color: ${({ $isSelected, $color, theme }) => ($isSelected ? $color : theme.colors.gray[500])};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GradeRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const GradeSelect = styled.select<{ $hasError?: boolean }>`
  flex: 2;
  padding: 0.625rem 0.875rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1.5px solid ${({ $hasError, theme }) => ($hasError ? '#ef4444' : theme.colors.gray[200])};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: ${({ theme }) => theme.colors.gray[50]};
  cursor: pointer;
  transition: border-color 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[400]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SmallInput = styled(TextInput)`
  flex: 1;
  text-align: center;
`;

/* ──────────── Button Styled Components ──────────── */

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
`;

const BackButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.gray[200]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StartButton = styled.button<{ $hasBackButton: boolean; $color: string }>`
  flex: ${({ $hasBackButton }) => ($hasBackButton ? '2' : '1')};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: ${({ $color }) => $color};
  color: #ffffff;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: none;
  cursor: pointer;
  transition: filter 0.15s ease;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
    filter: none;
  }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinningIcon = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

/* ──────────── Numbered Section Styled Components (student context) ──────────── */

const NumberedSectionWrapper = styled.div`
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
`;

const SectionCircle = styled.div<{ $color: string }>`
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.125rem;
`;

const SectionBodyWrapper = styled.div`
  flex: 1;
`;

const SectionBodyHeading = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
`;

const TwoColumnInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const InfoConfirmPanel = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 1rem;
`;

const InfoConfirmPanelHint = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.75rem;
`;

const InfoConfirmRows = styled.dl`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InfoConfirmRow = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const InfoConfirmLabel = styled.dt`
  color: ${({ theme }) => theme.colors.gray[500]};
  min-width: 4.5rem;
  flex-shrink: 0;
`;

const InfoConfirmValue = styled.dd`
  color: ${({ theme }) => theme.colors.gray[900]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const MinimalInputPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RequiredMark = styled.span`
  color: #ef4444;
  margin-left: 1px;
`;

/* ──────────── Component ──────────── */

interface ExamGuideStepProps {
  examName: string;
  showInfoForm?: boolean;
  initialInfo?: Partial<StudentInfo>;
  studentExamContext?: StudentExamContext;
  onStart: (info?: StudentInfo) => void;
  onBack?: () => void;
  isLoading: boolean;
}

const EXAM_COLOR = (name: string) =>
  name.includes('자기조절') ? '#009F88' : '#9D53E1';

const SCHOOL_LEVEL_LABEL: Record<string, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
};

const GRADE_OPTIONS: Record<string, string[]> = {
  elementary: ['초1', '초2', '초3', '초4', '초5', '초6'],
  middle: ['중1', '중2', '중3'],
  high: ['고1', '고2', '고3'],
};

const GUIDELINES = [
  '검사 문항에는 옳고, 그른 답이 없습니다. 정답이 없으므로 자신의 생각대로 솔직하게 답해주세요.',
  '해당 검사는 학업 성적이나 교과 점수와는 전혀 관련이 없으므로 걱정하지 않아도 됩니다.',
  '내가 바라는 모습이 아닌, 현재의 나를 기준으로 답해주세요.',
  '중간에 검사를 멈추지 않고 전체 문항을 빠짐없이 응답해 주세요. (약 15~20분 소요)',
];

const GuideSection: React.FC<{ color: string }> = ({ color }) => (
  <>
    <GuidelineList>
      {GUIDELINES.map((text, i) => (
        <GuidelineItem key={i}>
          <GuidelineNumber $color={color}>{i + 1}</GuidelineNumber>
          <GuidelineText>{text}</GuidelineText>
        </GuidelineItem>
      ))}
    </GuidelineList>
    <ExampleBox style={{ marginTop: '1rem' }}>
      <ExampleQuestion>
        <ExampleQuestionNumber>질문 1.</ExampleQuestionNumber> 열심히 노력하면 내 능력이
        향상될 수 있다.
      </ExampleQuestion>
      <RadioGroup>
        {['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'].map(
          (label, i) => (
            <RadioLabel key={i}>
              <RadioInput type='radio' name='example' disabled />
              <RadioLabelText>{label}</RadioLabelText>
            </RadioLabel>
          ),
        )}
      </RadioGroup>
    </ExampleBox>
  </>
);

export const ExamGuideStep: React.FC<ExamGuideStepProps> = ({
  examName,
  showInfoForm = false,
  initialInfo,
  studentExamContext,
  onStart,
  onBack,
  isLoading,
}) => {
  const color = EXAM_COLOR(examName);

  /* ── QR flow form state ── */
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('');
  const [formData, setFormData] = useState<StudentInfo>({
    schoolName: initialInfo?.schoolName || '',
    grade: initialInfo?.grade || '',
    classNumber: initialInfo?.classNumber || '',
    studentNumber: initialInfo?.studentNumber || '',
    name: initialInfo?.name || '',
    gender: initialInfo?.gender || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StudentInfo, string>>>({});

  /* ── Student context form state ── */
  const [localName, setLocalName] = useState(studentExamContext?.prefilledName || '');
  const [localStudentNumber, setLocalStudentNumber] = useState(
    studentExamContext?.prefilledStudentNumber || '',
  );
  const [localGender, setLocalGender] = useState<'M' | 'F' | ''>('');
  const [contextErrors, setContextErrors] = useState<{
    studentNumber?: string;
    name?: string;
    gender?: string;
  }>({});

  useEffect(() => {
    if (schoolLevel) {
      setFormData((prev) => ({ ...prev, grade: '' }));
    }
  }, [schoolLevel]);

  const handleField = (field: keyof StudentInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateInfoForm = (): boolean => {
    const newErrors: Partial<Record<keyof StudentInfo, string>> = {};
    if (!formData.schoolName.trim()) newErrors.schoolName = '학교명을 입력해주세요';
    if (!formData.grade) newErrors.grade = '학년을 선택해주세요';
    if (!formData.classNumber.trim()) newErrors.classNumber = '반을 입력해주세요';
    if (!formData.studentNumber.trim()) newErrors.studentNumber = '번호를 입력해주세요';
    if (!formData.name.trim()) newErrors.name = '이름을 입력해주세요';
    if (!formData.gender) newErrors.gender = '성별을 선택해주세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStart = () => {
    if (studentExamContext) {
      const newErrors: typeof contextErrors = {};
      if (!localStudentNumber.trim()) newErrors.studentNumber = '출석번호를 입력해주세요';
      if (!localName.trim()) newErrors.name = '이름을 입력해주세요';
      if (!localGender) newErrors.gender = '성별을 선택해주세요';
      if (Object.keys(newErrors).length > 0) {
        setContextErrors(newErrors);
        return;
      }
      onStart({
        schoolName: studentExamContext.schoolName || '',
        grade: studentExamContext.grade != null ? String(studentExamContext.grade) : '',
        classNumber:
          studentExamContext.classNumber != null ? String(studentExamContext.classNumber) : '',
        studentNumber: localStudentNumber,
        name: localName,
        gender: localGender,
      });
    } else if (showInfoForm) {
      if (!validateInfoForm()) return;
      onStart(formData as StudentInfo);
    } else {
      onStart();
    }
  };

  const isStartEnabled = studentExamContext
    ? localStudentNumber.trim() !== '' && localName.trim() !== '' && localGender !== ''
    : true;

  const gradeOptions = GRADE_OPTIONS[schoolLevel] ?? [];

  /* ════════════════════════════════════════════════════
     Student context mode: "검사 시작 준비"
  ════════════════════════════════════════════════════ */
  if (studentExamContext) {
    const { ordNo, schoolName, schoolLevel: ctxLevel, grade, classNumber } = studentExamContext;

    return (
      <Container>
        <ContentWrapper $wide>
          <Header>
            <ExamBadge $color={color}>
              <BadgeDot $color={color} />
              {examName}
            </ExamBadge>
            <Title>검사 시작 준비</Title>
            <Subtitle>검사 안내를 확인하고 기본 정보를 입력해 주세요</Subtitle>
          </Header>

          <Card>
            {/* ① 검사 안내 */}
            <NumberedSectionWrapper>
              <SectionCircle $color={color}>1</SectionCircle>
              <SectionBodyWrapper>
                <SectionBodyHeading>검사 안내</SectionBodyHeading>
                <GuideSection color={color} />
              </SectionBodyWrapper>
            </NumberedSectionWrapper>

            <SectionDivider style={{ paddingTop: 0, marginTop: 0 }} />

            {/* ② 기본 정보 입력 */}
            <NumberedSectionWrapper>
              <SectionCircle $color={color}>2</SectionCircle>
              <SectionBodyWrapper>
                <SectionBodyHeading>기본 정보 입력</SectionBodyHeading>
                <TwoColumnInfo>
                  {/* Left: read-only confirmation */}
                  <InfoConfirmPanel>
                    <InfoConfirmPanelHint>아래 내용이 맞는지 확인해 주세요</InfoConfirmPanelHint>
                    <InfoConfirmRows>
                      {schoolName && (
                        <InfoConfirmRow>
                          <InfoConfirmLabel>학교</InfoConfirmLabel>
                          <InfoConfirmValue>{schoolName}</InfoConfirmValue>
                        </InfoConfirmRow>
                      )}
                      {ctxLevel && (
                        <InfoConfirmRow>
                          <InfoConfirmLabel>학교급</InfoConfirmLabel>
                          <InfoConfirmValue>
                            {SCHOOL_LEVEL_LABEL[ctxLevel] ?? ctxLevel}
                          </InfoConfirmValue>
                        </InfoConfirmRow>
                      )}
                      {(grade != null || classNumber != null) && (
                        <InfoConfirmRow>
                          <InfoConfirmLabel>학년/반</InfoConfirmLabel>
                          <InfoConfirmValue>
                            {grade != null ? `${grade}학년` : ''}
                            {classNumber != null ? ` ${classNumber}반` : ''}
                          </InfoConfirmValue>
                        </InfoConfirmRow>
                      )}
                      <InfoConfirmRow>
                        <InfoConfirmLabel>차수</InfoConfirmLabel>
                        <InfoConfirmValue>{ordNo}차</InfoConfirmValue>
                      </InfoConfirmRow>
                      <InfoConfirmRow>
                        <InfoConfirmLabel>검사명</InfoConfirmLabel>
                        <InfoConfirmValue>{examName}</InfoConfirmValue>
                      </InfoConfirmRow>
                    </InfoConfirmRows>
                  </InfoConfirmPanel>

                  {/* Right: minimal inputs */}
                  <MinimalInputPanel>
                    <FormField>
                      <FieldLabel>
                        출석번호<RequiredMark>*</RequiredMark>
                      </FieldLabel>
                      <TextInput
                        type='text'
                        value={localStudentNumber}
                        onChange={(e) => {
                          setLocalStudentNumber(e.target.value);
                          if (contextErrors.studentNumber)
                            setContextErrors((p) => ({ ...p, studentNumber: undefined }));
                        }}
                        placeholder='출석번호를 입력하세요'
                        disabled={isLoading}
                        $hasError={!!contextErrors.studentNumber}
                      />
                      {contextErrors.studentNumber && (
                        <FieldError>{contextErrors.studentNumber}</FieldError>
                      )}
                    </FormField>

                    <FormField>
                      <FieldLabel>
                        이름<RequiredMark>*</RequiredMark>
                      </FieldLabel>
                      <TextInput
                        type='text'
                        value={localName}
                        onChange={(e) => {
                          setLocalName(e.target.value);
                          if (contextErrors.name)
                            setContextErrors((p) => ({ ...p, name: undefined }));
                        }}
                        placeholder='이름을 입력하세요'
                        disabled={isLoading}
                        $hasError={!!contextErrors.name}
                      />
                      {contextErrors.name && <FieldError>{contextErrors.name}</FieldError>}
                    </FormField>

                    <FormField>
                      <FieldLabel>
                        성별<RequiredMark>*</RequiredMark>
                      </FieldLabel>
                      <ToggleGroup>
                        <ToggleButton
                          type='button'
                          $isSelected={localGender === 'M'}
                          $color={color}
                          onClick={() => {
                            setLocalGender('M');
                            if (contextErrors.gender)
                              setContextErrors((p) => ({ ...p, gender: undefined }));
                          }}
                          disabled={isLoading}
                        >
                          남자
                        </ToggleButton>
                        <ToggleButton
                          type='button'
                          $isSelected={localGender === 'F'}
                          $color={color}
                          onClick={() => {
                            setLocalGender('F');
                            if (contextErrors.gender)
                              setContextErrors((p) => ({ ...p, gender: undefined }));
                          }}
                          disabled={isLoading}
                        >
                          여자
                        </ToggleButton>
                      </ToggleGroup>
                      {contextErrors.gender && <FieldError>{contextErrors.gender}</FieldError>}
                    </FormField>
                  </MinimalInputPanel>
                </TwoColumnInfo>
              </SectionBodyWrapper>
            </NumberedSectionWrapper>

            {/* Buttons */}
            <ButtonGroup>
              {onBack && (
                <BackButton type='button' onClick={onBack} disabled={isLoading}>
                  <ArrowLeft className='w-5 h-5' />
                  검사 목록
                </BackButton>
              )}
              <StartButton
                type='button'
                onClick={handleStart}
                disabled={isLoading || !isStartEnabled}
                $hasBackButton={!!onBack}
                $color={color}
              >
                {isLoading ? (
                  <>
                    <SpinningIcon className='w-5 h-5' />
                    준비 중...
                  </>
                ) : (
                  <>
                    검사 시작하기
                    <ArrowRight className='w-5 h-5' />
                  </>
                )}
              </StartButton>
            </ButtonGroup>
          </Card>
        </ContentWrapper>
      </Container>
    );
  }

  /* ════════════════════════════════════════════════════
     Original mode: "검사 안내" (QR / no-form)
  ════════════════════════════════════════════════════ */
  return (
    <Container>
      <ContentWrapper>
        <Header>
          <ExamBadge $color={color}>
            <BadgeDot $color={color} />
            {examName}
          </ExamBadge>
          <Title>검사 안내</Title>
          <Subtitle>검사를 시작하기 전에 아래 내용을 읽어주세요</Subtitle>
        </Header>

        <Card>
          {/* 검사 진행 방법 */}
          <Section>
            <SectionHeader $color={color}>
              <SectionTitle>검사 진행 방법</SectionTitle>
            </SectionHeader>
            <GuidelineList>
              {GUIDELINES.map((text, i) => (
                <GuidelineItem key={i}>
                  <GuidelineNumber $color={color}>{i + 1}</GuidelineNumber>
                  <GuidelineText>{text}</GuidelineText>
                </GuidelineItem>
              ))}
            </GuidelineList>
          </Section>

          {/* 예시 문제 */}
          <SectionDivider>
            <SectionHeader $color={color}>
              <SectionTitle>예시 문제</SectionTitle>
            </SectionHeader>
            <ExampleBox>
              <ExampleQuestion>
                <ExampleQuestionNumber>질문 1.</ExampleQuestionNumber> 열심히 노력하면 내 능력이
                향상될 수 있다.
              </ExampleQuestion>
              <RadioGroup>
                {['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'].map(
                  (label, i) => (
                    <RadioLabel key={i}>
                      <RadioInput type='radio' name='example' disabled />
                      <RadioLabelText>{label}</RadioLabelText>
                    </RadioLabel>
                  ),
                )}
              </RadioGroup>
            </ExampleBox>
          </SectionDivider>

          {/* 학생 정보 입력 (QR/게스트 플로우) */}
          {showInfoForm && (
            <SectionDivider>
              <SectionHeader $color={color}>
                <SectionTitle>기본 정보 입력</SectionTitle>
              </SectionHeader>
              <InfoFormGrid>
                {/* 학교명 */}
                <FormField>
                  <FieldLabel>학교명</FieldLabel>
                  <TextInput
                    type='text'
                    value={formData.schoolName}
                    onChange={(e) => handleField('schoolName', e.target.value)}
                    placeholder='학교 이름을 입력하세요'
                    disabled={isLoading}
                    $hasError={!!errors.schoolName}
                  />
                  {errors.schoolName && <FieldError>{errors.schoolName}</FieldError>}
                </FormField>

                {/* 학교급 */}
                <FormField>
                  <FieldLabel>학교급</FieldLabel>
                  <ToggleGroup>
                    {[
                      { value: 'elementary', label: '초등학교' },
                      { value: 'middle', label: '중학교' },
                      { value: 'high', label: '고등학교' },
                    ].map((opt) => (
                      <ToggleButton
                        key={opt.value}
                        type='button'
                        $isSelected={schoolLevel === opt.value}
                        $color={color}
                        onClick={() => setSchoolLevel(opt.value as SchoolLevel)}
                        disabled={isLoading}
                      >
                        {opt.label}
                      </ToggleButton>
                    ))}
                  </ToggleGroup>
                </FormField>

                {/* 학년 · 반 · 번호 */}
                <FormField>
                  <FieldLabel>학년 · 반 · 번호</FieldLabel>
                  <GradeRow>
                    <div style={{ flex: 2 }}>
                      <GradeSelect
                        value={formData.grade}
                        onChange={(e) => handleField('grade', e.target.value)}
                        disabled={isLoading || gradeOptions.length === 0}
                        $hasError={!!errors.grade}
                      >
                        <option value=''>
                          {gradeOptions.length === 0 ? '학교급 선택 필요' : '학년 선택'}
                        </option>
                        {gradeOptions.map((g) => (
                          <option key={g} value={g}>
                            {g.replace(/[초중고]/, '')}학년
                          </option>
                        ))}
                      </GradeSelect>
                      {errors.grade && <FieldError>{errors.grade}</FieldError>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <SmallInput
                        type='text'
                        value={formData.classNumber}
                        onChange={(e) => handleField('classNumber', e.target.value)}
                        placeholder='반'
                        disabled={isLoading}
                        $hasError={!!errors.classNumber}
                      />
                      {errors.classNumber && <FieldError>{errors.classNumber}</FieldError>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <SmallInput
                        type='text'
                        value={formData.studentNumber}
                        onChange={(e) => handleField('studentNumber', e.target.value)}
                        placeholder='번호'
                        disabled={isLoading}
                        $hasError={!!errors.studentNumber}
                      />
                      {errors.studentNumber && <FieldError>{errors.studentNumber}</FieldError>}
                    </div>
                  </GradeRow>
                </FormField>

                {/* 이름 */}
                <FormField>
                  <FieldLabel>이름</FieldLabel>
                  <TextInput
                    type='text'
                    value={formData.name}
                    onChange={(e) => handleField('name', e.target.value)}
                    placeholder='홍길동'
                    disabled={isLoading}
                    $hasError={!!errors.name}
                  />
                  {errors.name && <FieldError>{errors.name}</FieldError>}
                </FormField>

                {/* 성별 */}
                <FormField>
                  <FieldLabel>성별</FieldLabel>
                  <ToggleGroup>
                    <ToggleButton
                      type='button'
                      $isSelected={formData.gender === 'M'}
                      $color={color}
                      onClick={() => handleField('gender', 'M')}
                      disabled={isLoading}
                    >
                      남자
                    </ToggleButton>
                    <ToggleButton
                      type='button'
                      $isSelected={formData.gender === 'F'}
                      $color={color}
                      onClick={() => handleField('gender', 'F')}
                      disabled={isLoading}
                    >
                      여자
                    </ToggleButton>
                  </ToggleGroup>
                  {errors.gender && <FieldError>{errors.gender}</FieldError>}
                </FormField>
              </InfoFormGrid>
            </SectionDivider>
          )}

          {/* 버튼 */}
          <ButtonGroup>
            {onBack && (
              <BackButton type='button' onClick={onBack} disabled={isLoading}>
                <ArrowLeft className='w-5 h-5' />
                이전
              </BackButton>
            )}
            <StartButton
              type='button'
              onClick={handleStart}
              disabled={isLoading}
              $hasBackButton={!!onBack}
              $color={color}
            >
              {isLoading ? (
                <>
                  <SpinningIcon className='w-5 h-5' />
                  준비 중...
                </>
              ) : (
                <>
                  검사 시작
                  <ArrowRight className='w-5 h-5' />
                </>
              )}
            </StartButton>
          </ButtonGroup>
        </Card>
      </ContentWrapper>
    </Container>
  );
};
