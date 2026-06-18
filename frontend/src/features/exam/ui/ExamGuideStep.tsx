import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Loader2, Lock, CheckCircle2, Search } from 'lucide-react';
import type { StudentInfo } from './StudentInfoStep';
import { SchoolSearchModal } from './SchoolSearchModal';
import { neisGradeToSchoolLevel, type SchoolSearchResult } from '../api/schoolSearchService';

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
  background: #f5f6fa;
  padding: 24px;
`;

const ContentWrapper = styled.div<{ $wide?: boolean }>`
  max-width: ${({ $wide }) => ($wide ? '67.5rem' : '42rem')};
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: left;
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
  background: #009f8815;
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
  background: #009f8815;
  color: #009f88;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GuidelineText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.6;
`;

const ExampleDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 1rem;
`;

const ExampleBox = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 1.25rem;
`;

const ExampleInstruction = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const ExampleQuestion = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[900]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ExampleQuestionNumber = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-right: 0.5rem;
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
  background: #ffffff;
  transition: border-color 0.15s ease;
  min-height: 3rem;

  &:focus {
    outline: none;
    border-color: ${({ $hasError, theme }) => ($hasError ? '#ef4444' : theme.colors.primary[1000])};
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
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.15s ease;
  min-height: 3rem;
  min-width: 436px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[1000]};
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
  margin-top: 1rem;
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

/* ──────────── Section with External Header ──────────── */

const SectionWrapper = styled.div`
  margin-bottom: 2rem;
`;

const SectionHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const SectionNumber = styled.div<{ $color: string }>`
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  color: white;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SectionHeading = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GenderRow = styled.div`
  max-width: 18.75rem;
`;

const RequiredMark = styled.span`
  color: #ef4444;
  margin-left: 1px;
`;

/* ──────────── Locked Field (Read-only with auto badge) ──────────── */

const LockedFieldWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.gray[50]};
  min-height: 3rem;
`;

const LockedValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[900]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const AutoBadge = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}15`};

  svg {
    width: 0.75rem;
    height: 0.75rem;
  }
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

const EXAM_COLOR = (name: string) => (name.includes('자기조절') ? '#009F88' : '#9D53E1');

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
  {
    text: "검사 응답에는 옳고, 그른 답이 없습니다. 각 문항에 대한 자신의 생각과 느낌을 바탕으로 '전혀 그렇지 않다(1점)부터 매우 그렇다(5점)' 까지 나에게 해당하는 점수를 선택해 주세요.",
    boldParts: ['옳고, 그른 답이 없습니다', "'전혀 그렇지 않다(1점)부터 매우 그렇다(5점)'"],
  },
  {
    text: '해당 검사는 학업 성적이나 교과 점수와 무관하니 편안한 마음으로 응답해 주세요.',
    boldParts: ['학업 성적이나 교과 점수와 무관'],
  },
  {
    text: '내가 바라는 모습이 아닌, 현재의 나를 가장 잘 나타내는 답변에 체크해 주세요.',
    boldParts: ['현재의 나를 가장 잘 나타내는 답변'],
  },
  {
    text: '중간에 검사를 멈추지 않고 전체 문항을 모두 응답해야 선생님께 제출되니, 한 문항도 빠뜨리지 말고 성실하게 응답해 주세요.',
    boldParts: ['전체 문항을 모두 응답해야 선생님께 제출'],
  },
];

// 텍스트에서 볼드 처리
const renderTextWithBold = (text: string, boldParts: string[]) => {
  let result = text;
  boldParts.forEach((part) => {
    result = result.replace(
      part,
      `<strong style="font-weight: 600; color: #111827;">${part}</strong>`,
    );
  });
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
};

const GuideSection: React.FC<{ color: string }> = ({ color }) => (
  <>
    {/* 검사 진행 방법 */}
    <Section>
      <SectionHeader $color={color}>
        <CheckCircle2 />
        <SectionTitle>검사 진행 방법</SectionTitle>
      </SectionHeader>
      <GuidelineList>
        {GUIDELINES.map((guideline, i) => (
          <GuidelineItem key={i}>
            <GuidelineNumber $color={color}>{i + 1}</GuidelineNumber>
            <GuidelineText>{renderTextWithBold(guideline.text, guideline.boldParts)}</GuidelineText>
          </GuidelineItem>
        ))}
      </GuidelineList>
    </Section>

    {/* 예시 문제 */}
    <Section style={{ marginTop: '1.5rem' }}>
      <SectionHeader $color={color}>
        <CheckCircle2 />
        <SectionTitle>예시 문제</SectionTitle>
      </SectionHeader>
      <ExampleDescription>
        검사를 시작하기 전에 예시를 보며 검사 방법을 확인해 주세요.
      </ExampleDescription>
      <ExampleBox>
        <ExampleInstruction>
          다음 문항은 여러분이 어떤 환경에서 공부하는 것을 더 좋아하는지를 묻는 질문입니다. 각
          문항을 읽고, 요즘 자신의 생각이나 느낌과 가장 가까운 곳에 체크해 주세요.
        </ExampleInstruction>
        <ExampleQuestion>
          <ExampleQuestionNumber>질문 1.</ExampleQuestionNumber>
          열심히 노력하면 내 능력이 향상될 수 있다.
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
    </Section>
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

  // 🔴 TEST: 모든 필드를 입력 가능하게 만들기 위해 빈 context로 강제 설정
  // studentExamContext = {
  //   ordNo: 1,
  //   examName: examName,
  //   schoolName: undefined,
  //   schoolLevel: undefined,
  //   grade: undefined,
  //   classNumber: undefined,
  //   prefilledName: '고우진',
  //   prefilledStudentNumber: '1',
  // }

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

  /* ── Editable group fields (when missing from context) ── */
  const [editableSchoolName, setEditableSchoolName] = useState('');
  const [editableSchoolLevel, setEditableSchoolLevel] = useState<SchoolLevel>('');
  // NEIS 학교 검색
  const [schoolSearchOpen, setSchoolSearchOpen] = useState(false);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string>('');
  const [editableGrade, setEditableGrade] = useState('');
  const [editableClassNumber, setEditableClassNumber] = useState('');

  const [contextErrors, setContextErrors] = useState<{
    studentNumber?: string;
    name?: string;
    gender?: string;
    schoolName?: string;
    schoolLevel?: string;
    grade?: string;
    classNumber?: string;
  }>({});

  useEffect(() => {
    if (schoolLevel) {
      setFormData((prev) => ({ ...prev, grade: '' }));
    }
  }, [schoolLevel]);

  useEffect(() => {
    if (editableSchoolLevel) {
      setEditableGrade('');
    }
  }, [editableSchoolLevel]);

  const handleField = (field: keyof StudentInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // NEIS 학교 검색 선택 — 학교명 + 학교코드(나이스 연동) + 학교급 자동 채움
  const handleSchoolSelect = (school: SchoolSearchResult) => {
    setEditableSchoolName(school.name);
    setSelectedSchoolCode(school.code);
    const level = neisGradeToSchoolLevel(school.grade);
    if (level) setEditableSchoolLevel(level);
    setContextErrors((p) => ({ ...p, schoolName: undefined, schoolLevel: undefined }));
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

      // Validate always-required fields
      if (!localStudentNumber.trim()) newErrors.studentNumber = '출석번호를 입력해주세요';
      if (!localName.trim()) newErrors.name = '이름을 입력해주세요';
      if (!localGender) newErrors.gender = '성별을 선택해주세요';

      // Validate editable group fields (if context doesn't have them)
      const { schoolName, schoolLevel: ctxLevel, grade, classNumber } = studentExamContext;
      if (!schoolName && !editableSchoolName.trim()) newErrors.schoolName = '학교를 입력해주세요';
      if (!ctxLevel && !editableSchoolLevel) newErrors.schoolLevel = '학교급을 선택해주세요';
      if (grade == null && !editableGrade) newErrors.grade = '학년을 선택해주세요';
      if (classNumber == null && !editableClassNumber.trim())
        newErrors.classNumber = '반을 입력해주세요';

      if (Object.keys(newErrors).length > 0) {
        setContextErrors(newErrors);
        return;
      }

      // Prepare StudentInfo with context data or editable values
      const finalSchoolName = schoolName || editableSchoolName;
      const finalGrade = grade != null ? String(grade) : editableGrade;
      const finalClassNumber = classNumber != null ? String(classNumber) : editableClassNumber;

      onStart({
        schoolName: finalSchoolName,
        grade: finalGrade,
        classNumber: finalClassNumber,
        studentNumber: localStudentNumber,
        name: localName,
        gender: localGender,
        // 학교 직접입력(검색) 케이스에서만 NEIS 학교코드 — 컨텍스트(동기화) 학교면 미포함
        schoolCode: schoolName ? undefined : (selectedSchoolCode || undefined),
      });
    } else if (showInfoForm) {
      if (!validateInfoForm()) return;
      onStart(formData as StudentInfo);
    } else {
      onStart();
    }
  };

  const isStartEnabled = studentExamContext
    ? (() => {
        const { schoolName, schoolLevel: ctxLevel, grade, classNumber } = studentExamContext;
        const hasSchoolName = !!schoolName || editableSchoolName.trim() !== '';
        const hasSchoolLevel = !!ctxLevel || editableSchoolLevel !== '';
        const hasGrade = grade != null || editableGrade !== '';
        const hasClassNumber = classNumber != null || editableClassNumber.trim() !== '';
        return (
          localStudentNumber.trim() !== '' &&
          localName.trim() !== '' &&
          localGender !== '' &&
          hasSchoolName &&
          hasSchoolLevel &&
          hasGrade &&
          hasClassNumber
        );
      })()
    : true;

  const gradeOptions = GRADE_OPTIONS[schoolLevel] ?? [];
  const editableGradeOptions = GRADE_OPTIONS[editableSchoolLevel] ?? [];

  /* ════════════════════════════════════════════════════
     Student context mode: "검사 시작 준비"
  ════════════════════════════════════════════════════ */
  if (studentExamContext) {
    const { schoolName, schoolLevel: ctxLevel, grade, classNumber } = studentExamContext;

    return (
      <Container>
        <ContentWrapper $wide>
          <Header>
            <ExamBadge $color={color}>{examName}</ExamBadge>
            <Title>검사 시작 준비</Title>
            <Subtitle>검사 안내를 확인하고 기본 정보를 입력해 주세요</Subtitle>
          </Header>

          {/* ① 검사 안내 */}
          <SectionWrapper>
            <SectionHeaderRow>
              <SectionNumber $color={color}>1</SectionNumber>
              <SectionHeading>검사 안내</SectionHeading>
            </SectionHeaderRow>
            <Card>
              <GuideSection color={color} />
            </Card>
          </SectionWrapper>

          {/* ② 기본 정보 입력 */}
          <SectionWrapper>
            <SectionHeaderRow>
              <SectionNumber $color={color}>2</SectionNumber>
              <SectionHeading>기본 정보 입력</SectionHeading>
            </SectionHeaderRow>
            <Card>
              <InfoGrid>
                {/* 검사 (전체 너비, 항상 잠금) */}
                <FormField>
                  <FieldLabel>검사</FieldLabel>
                  <LockedFieldWrapper>
                    <LockedValue>{examName}</LockedValue>
                    <AutoBadge $color={color}>
                      <Lock size={12} />
                      자동
                    </AutoBadge>
                  </LockedFieldWrapper>
                </FormField>

                {/* 2열 그리드 */}
                <TwoColumnGrid>
                  {/* 학교 */}
                  <FormField>
                    <FieldLabel>학교{!schoolName && <RequiredMark>*</RequiredMark>}</FieldLabel>
                    {schoolName ? (
                      <LockedFieldWrapper>
                        <LockedValue>{schoolName}</LockedValue>
                        <AutoBadge $color={color}>
                          <Lock size={12} />
                          자동
                        </AutoBadge>
                      </LockedFieldWrapper>
                    ) : (
                      <>
                        {/* NEIS 학교 검색 — 클릭 시 모달, 직접 타이핑 대신 검색으로 선택(학교코드 연동) */}
                        <div style={{ position: 'relative' }}>
                          <TextInput
                            type='text'
                            value={editableSchoolName}
                            readOnly
                            onClick={() => !isLoading && setSchoolSearchOpen(true)}
                            placeholder='학교 검색'
                            disabled={isLoading}
                            $hasError={!!contextErrors.schoolName}
                            style={{ cursor: isLoading ? 'not-allowed' : 'pointer', paddingRight: 32 }}
                          />
                          <Search
                            size={16}
                            style={{
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#9CA3AF',
                              pointerEvents: 'none',
                            }}
                          />
                        </div>
                        {contextErrors.schoolName && (
                          <FieldError>{contextErrors.schoolName}</FieldError>
                        )}
                      </>
                    )}
                  </FormField>

                  {/* NEIS 학교 검색 모달 (학교 직접입력 케이스) */}
                  <SchoolSearchModal
                    isOpen={schoolSearchOpen}
                    onClose={() => setSchoolSearchOpen(false)}
                    onSelect={handleSchoolSelect}
                  />

                  {/* 학교급 */}
                  <FormField>
                    <FieldLabel>학교급{!ctxLevel && <RequiredMark>*</RequiredMark>}</FieldLabel>
                    {ctxLevel ? (
                      <LockedFieldWrapper>
                        <LockedValue>{SCHOOL_LEVEL_LABEL[ctxLevel]}</LockedValue>
                        <AutoBadge $color={color}>
                          <Lock size={12} />
                          자동
                        </AutoBadge>
                      </LockedFieldWrapper>
                    ) : (
                      <>
                        <GradeSelect
                          value={editableSchoolLevel}
                          onChange={(e) => {
                            setEditableSchoolLevel(e.target.value as SchoolLevel);
                            if (contextErrors.schoolLevel)
                              setContextErrors((p) => ({ ...p, schoolLevel: undefined }));
                          }}
                          disabled={isLoading}
                          $hasError={!!contextErrors.schoolLevel}
                        >
                          <option value=''>선택</option>
                          <option value='elementary'>초등학교</option>
                          <option value='middle'>중학교</option>
                          <option value='high'>고등학교</option>
                        </GradeSelect>
                        {contextErrors.schoolLevel && (
                          <FieldError>{contextErrors.schoolLevel}</FieldError>
                        )}
                      </>
                    )}
                  </FormField>

                  {/* 학년 */}
                  <FormField>
                    <FieldLabel>학년{!grade && <RequiredMark>*</RequiredMark>}</FieldLabel>
                    {grade ? (
                      <LockedFieldWrapper>
                        <LockedValue>{grade}학년</LockedValue>
                        <AutoBadge $color={color}>
                          <Lock size={12} />
                          자동
                        </AutoBadge>
                      </LockedFieldWrapper>
                    ) : (
                      <>
                        <GradeSelect
                          value={editableGrade}
                          onChange={(e) => {
                            setEditableGrade(e.target.value);
                            if (contextErrors.grade)
                              setContextErrors((p) => ({ ...p, grade: undefined }));
                          }}
                          disabled={isLoading || !editableSchoolLevel}
                          $hasError={!!contextErrors.grade}
                        >
                          <option value=''>
                            {editableSchoolLevel ? '선택' : '학교급을 먼저 선택'}
                          </option>
                          {editableGradeOptions.map((g) => (
                            <option key={g} value={g}>
                              {g.replace(/[초중고]/, '')}학년
                            </option>
                          ))}
                        </GradeSelect>
                        {contextErrors.grade && <FieldError>{contextErrors.grade}</FieldError>}
                      </>
                    )}
                  </FormField>

                  {/* 반 */}
                  <FormField>
                    <FieldLabel>
                      반{!classNumber && <RequiredMark>*</RequiredMark>}
                    </FieldLabel>
                    {classNumber ? (
                      <LockedFieldWrapper>
                        <LockedValue>{classNumber}반</LockedValue>
                        <AutoBadge $color={color}>
                          <Lock size={12} />
                          자동
                        </AutoBadge>
                      </LockedFieldWrapper>
                    ) : (
                      <>
                        <TextInput
                          type='text'
                          value={editableClassNumber}
                          onChange={(e) => {
                            setEditableClassNumber(e.target.value);
                            if (contextErrors.classNumber)
                              setContextErrors((p) => ({ ...p, classNumber: undefined }));
                          }}
                          placeholder='반'
                          disabled={isLoading}
                          $hasError={!!contextErrors.classNumber}
                        />
                        {contextErrors.classNumber && (
                          <FieldError>{contextErrors.classNumber}</FieldError>
                        )}
                      </>
                    )}
                  </FormField>

                  {/* 번호 */}
                  <FormField>
                    <FieldLabel>
                      번호<RequiredMark>*</RequiredMark>
                    </FieldLabel>
                    <TextInput
                      type='text'
                      value={localStudentNumber}
                      onChange={(e) => {
                        setLocalStudentNumber(e.target.value);
                        if (contextErrors.studentNumber)
                          setContextErrors((p) => ({ ...p, studentNumber: undefined }));
                      }}
                      placeholder='번호'
                      disabled={isLoading}
                      $hasError={!!contextErrors.studentNumber}
                    />
                    {contextErrors.studentNumber && (
                      <FieldError>{contextErrors.studentNumber}</FieldError>
                    )}
                  </FormField>

                  {/* 이름 */}
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
                      placeholder='이름'
                      disabled={isLoading}
                      $hasError={!!contextErrors.name}
                    />
                    {contextErrors.name && <FieldError>{contextErrors.name}</FieldError>}
                  </FormField>
                </TwoColumnGrid>

                {/* 성별 (단독 행) */}
                <FormField>
                  <FieldLabel>
                    성별<RequiredMark>*</RequiredMark>
                  </FieldLabel>
                  <GenderRow>
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
                  </GenderRow>
                  {contextErrors.gender && <FieldError>{contextErrors.gender}</FieldError>}
                </FormField>
              </InfoGrid>
            </Card>
          </SectionWrapper>

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
              <CheckCircle2 />
              <SectionTitle>검사 진행 방법</SectionTitle>
            </SectionHeader>
            <GuidelineList>
              {GUIDELINES.map((guideline, i) => (
                <GuidelineItem key={i}>
                  <GuidelineNumber $color={color}>{i + 1}</GuidelineNumber>
                  <GuidelineText>
                    {renderTextWithBold(guideline.text, guideline.boldParts)}
                  </GuidelineText>
                </GuidelineItem>
              ))}
            </GuidelineList>
          </Section>

          {/* 예시 문제 */}
          <SectionDivider>
            <SectionHeader $color={color}>
              <CheckCircle2 />
              <SectionTitle>예시 문제</SectionTitle>
            </SectionHeader>
            <ExampleDescription>
              검사를 시작하기 전에 예시를 보며 검사 방법을 확인해 주세요.
            </ExampleDescription>
            <ExampleBox>
              <ExampleInstruction>
                다음 문항은 여러분이 어떤 환경에서 공부하는 것을 더 좋아하는지를 묻는 질문입니다. 각
                문항을 읽고, 요즘 자신의 생각이나 느낌과 가장 가까운 곳에 체크해 주세요.
              </ExampleInstruction>
              <ExampleQuestion>
                <ExampleQuestionNumber>질문 1.</ExampleQuestionNumber>
                열심히 노력하면 내 능력이 향상될 수 있다.
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
