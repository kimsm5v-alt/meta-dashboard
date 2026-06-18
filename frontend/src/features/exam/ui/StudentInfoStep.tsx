/**
 * 학생 정보 입력 단계
 *
 * 검사 시작 전에 학생의 기본 정보를 입력받습니다.
 * - 회원/게스트 모두 사용
 * - 학교명, 학년, 반, 번호, 이름, 성별 입력
 */

import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

export interface StudentInfo {
  schoolName: string;
  grade: string;
  classNumber: string;
  studentNumber: string;
  name: string;
  gender: 'M' | 'F' | '';
  /** NEIS 표준학교코드 — 학교 검색으로 선택 시 채워짐(나이스 연동 등록용). */
  schoolCode?: string;
}

type SchoolLevel = 'elementary' | 'middle' | 'high' | '';

interface StudentInfoStepProps {
  examName: string;
  initialData?: Partial<StudentInfo>;
  onSubmit: (info: StudentInfo) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div`
  min-height: 100vh;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
`;

const Content = styled.div`
  width: 100%;
  max-width: 32rem;
`;

const Header = styled.div<{ $delay?: string }>`
  margin-bottom: 4rem;
  animation: ${fadeUp} 0.6s ease-out both;
  animation-delay: ${({ $delay }) => $delay || '0s'};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.gray[900]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: 34px;
  line-height: 1.2;
  letter-spacing: -0.025em;
  margin-bottom: 0.75rem;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;

const FormGroup = styled.div<{ $delay?: string }>`
  animation: ${fadeUp} 0.6s ease-out both;
  animation-delay: ${({ $delay }) => $delay || '0s'};
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
`;

const TextInput = styled.input<{ $isFocused: boolean; $hasError: boolean }>`
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid
    ${({ $isFocused, $hasError, theme }) =>
      $hasError ? '#ef4444' : $isFocused ? theme.colors.primary[500] : theme.colors.gray[200]};
  padding-bottom: 0.75rem;
  font-size: 1.25rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  transition: border-color 0.15s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  color: #ef4444;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  margin-top: 0.5rem;
`;

const SchoolLevelButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const SchoolLevelButton = styled.button<{ $isSelected: boolean }>`
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 9999px;
  border: none;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.primary[500] : theme.colors.gray[100]};
  color: ${({ $isSelected }) => ($isSelected ? '#ffffff' : '#6b7280')};
  transform: ${({ $isSelected }) => ($isSelected ? 'scale(1.02)' : 'scale(1)')};
  box-shadow: ${({ $isSelected, theme }) =>
    $isSelected ? `0 4px 12px ${theme.colors.primary[500]}40` : 'none'};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: scale(1.02);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const GradeClassNumberRow = styled.div`
  display: flex;
  gap: 1rem;
`;

const GradeSelect = styled.select<{ $isFocused: boolean; $hasError: boolean }>`
  flex: 2;
  padding: 1rem;
  text-align: center;
  font-size: 1.125rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: 1rem;
  border: 2px solid
    ${({ $isFocused, $hasError, theme }) =>
      $hasError ? '#ef4444' : $isFocused ? theme.colors.primary[500] : theme.colors.gray[200]};
  background: #fafafa;
  cursor: pointer;
  transition: border-color 0.15s ease;

  &:focus {
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NumberInput = styled.input<{ $isFocused: boolean; $hasError: boolean }>`
  flex: 1;
  padding: 1rem;
  text-align: center;
  font-size: 1.125rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: 1rem;
  border: 2px solid
    ${({ $isFocused, $hasError, theme }) =>
      $hasError ? '#ef4444' : $isFocused ? theme.colors.primary[500] : theme.colors.gray[200]};
  background: #fafafa;
  transition: border-color 0.15s ease;

  &:focus {
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Divider = styled.div<{ $delay?: string }>`
  height: 1px;
  background: ${({ theme }) => theme.colors.gray[200]};
  animation: ${fadeUp} 0.6s ease-out both;
  animation-delay: ${({ $delay }) => $delay || '0s'};
`;

const GenderButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const GenderButton = styled.button<{ $isSelected: boolean }>`
  padding: 1rem;
  border-radius: 1rem;
  border: none;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.primary[500] : theme.colors.gray[100]};
  color: ${({ $isSelected }) => ($isSelected ? '#ffffff' : '#6b7280')};
  transform: ${({ $isSelected }) => ($isSelected ? 'scale(1.02)' : 'scale(1)')};
  box-shadow: ${({ $isSelected, theme }) =>
    $isSelected ? `0 4px 12px ${theme.colors.primary[500]}40` : 'none'};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: scale(1.02);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const SubmitButton = styled.button<{ $delay?: string }>`
  width: 100%;
  padding: 1.25rem;
  border-radius: 1rem;
  border: none;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: 1rem;
  color: white;
  background: ${({ theme }) => theme.colors.primary[500]};
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 8px 24px ${({ theme }) => theme.colors.primary[500]}59;
  margin-top: 2rem;
  animation: ${fadeUp} 0.6s ease-out both;
  animation-delay: ${({ $delay }) => $delay || '0s'};

  &:hover:not(:disabled) {
    filter: brightness(1.05);
    transform: scale(1.01);
  }

  &:active:not(:disabled) {
    transform: scale(0.99);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: brightness(0.9);
  }
`;

const Notice = styled.div<{ $delay?: string }>`
  margin-top: 3rem;
  text-align: center;
  animation: ${fadeUp} 0.6s ease-out both;
  animation-delay: ${({ $delay }) => $delay || '0s'};
`;

const NoticeText = styled.p`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

export const StudentInfoStep: React.FC<StudentInfoStepProps> = ({
  examName,
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('');
  const [formData, setFormData] = useState<StudentInfo>({
    schoolName: initialData?.schoolName || '',
    grade: initialData?.grade || '',
    classNumber: initialData?.classNumber || '',
    studentNumber: initialData?.studentNumber || '',
    name: initialData?.name || '',
    gender: initialData?.gender || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StudentInfo, string>>>({});
  const [focusedField, setFocusedField] = useState<string>('');

  // 학교급 변경 시 학년 초기화
  useEffect(() => {
    if (schoolLevel) {
      setFormData((prev) => ({ ...prev, grade: '' }));
    }
  }, [schoolLevel]);

  const handleChange = (field: keyof StudentInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSchoolLevelChange = (level: SchoolLevel) => {
    setSchoolLevel(level);
  };

  const getGradeOptions = (): string[] => {
    switch (schoolLevel) {
      case 'elementary':
        return ['초1', '초2', '초3', '초4', '초5', '초6'];
      case 'middle':
        return ['중1', '중2', '중3'];
      case 'high':
        return ['고1', '고2', '고3'];
      default:
        return [];
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StudentInfo, string>> = {};

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = '학교명을 입력해주세요';
    }
    if (!formData.grade) {
      newErrors.grade = '학년을 선택해주세요';
    }
    if (!formData.classNumber.trim()) {
      newErrors.classNumber = '반을 입력해주세요';
    }
    if (!formData.studentNumber.trim()) {
      newErrors.studentNumber = '번호를 입력해주세요';
    }
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData as StudentInfo);
    }
  };

  return (
    <Container>
      <Content>
        {/* 헤더 */}
        <Header>
          <Title>{examName}.</Title>
          <Subtitle>검사를 시작하기 전에 기본 정보를 입력해주세요</Subtitle>
        </Header>

        {/* 폼 */}
        <Form onSubmit={handleSubmit}>
          {/* 학교명 */}
          <FormGroup $delay='0.1s'>
            <Label>학교명</Label>
            <TextInput
              type='text'
              value={formData.schoolName}
              onChange={(e) => handleChange('schoolName', e.target.value)}
              onFocus={() => setFocusedField('schoolName')}
              onBlur={() => setFocusedField('')}
              placeholder='학교 이름을 입력하세요'
              disabled={isLoading}
              $isFocused={focusedField === 'schoolName'}
              $hasError={!!errors.schoolName}
            />
            {errors.schoolName && <ErrorText>{errors.schoolName}</ErrorText>}
          </FormGroup>

          {/* 학교급 */}
          <FormGroup $delay='0.2s'>
            <Label>학교급</Label>
            <SchoolLevelButtonGroup>
              {[
                { value: 'elementary', label: '초등학교' },
                { value: 'middle', label: '중학교' },
                { value: 'high', label: '고등학교' },
              ].map((option) => (
                <SchoolLevelButton
                  key={option.value}
                  type='button'
                  onClick={() => handleSchoolLevelChange(option.value as SchoolLevel)}
                  disabled={isLoading}
                  $isSelected={schoolLevel === option.value}
                >
                  {option.label}
                </SchoolLevelButton>
              ))}
            </SchoolLevelButtonGroup>
          </FormGroup>

          {/* 학년 · 반 · 번호 */}
          <FormGroup $delay='0.3s'>
            <Label>학년 · 반 · 번호</Label>
            <GradeClassNumberRow>
              {/* 학년 */}
              <div style={{ flex: 2 }}>
                <GradeSelect
                  value={formData.grade}
                  onChange={(e) => handleChange('grade', e.target.value)}
                  onFocus={() => setFocusedField('grade')}
                  onBlur={() => setFocusedField('')}
                  disabled={isLoading || getGradeOptions().length === 0}
                  $isFocused={focusedField === 'grade'}
                  $hasError={!!errors.grade}
                >
                  <option value=''>
                    {getGradeOptions().length === 0 ? '학교급 선택 필요' : '학년 선택'}
                  </option>
                  {getGradeOptions().map((grade) => (
                    <option key={grade} value={grade}>
                      {grade.replace('초', '').replace('중', '').replace('고', '')}학년
                    </option>
                  ))}
                </GradeSelect>
                {errors.grade && <ErrorText>{errors.grade}</ErrorText>}
              </div>

              {/* 반 */}
              <div style={{ flex: 1 }}>
                <NumberInput
                  type='text'
                  value={formData.classNumber}
                  onChange={(e) => handleChange('classNumber', e.target.value)}
                  onFocus={() => setFocusedField('classNumber')}
                  onBlur={() => setFocusedField('')}
                  placeholder='반'
                  disabled={isLoading}
                  $isFocused={focusedField === 'classNumber'}
                  $hasError={!!errors.classNumber}
                />
                {errors.classNumber && <ErrorText>{errors.classNumber}</ErrorText>}
              </div>

              {/* 번호 */}
              <div style={{ flex: 1 }}>
                <NumberInput
                  type='text'
                  value={formData.studentNumber}
                  onChange={(e) => handleChange('studentNumber', e.target.value)}
                  onFocus={() => setFocusedField('studentNumber')}
                  onBlur={() => setFocusedField('')}
                  placeholder='번호'
                  disabled={isLoading}
                  $isFocused={focusedField === 'studentNumber'}
                  $hasError={!!errors.studentNumber}
                />
                {errors.studentNumber && <ErrorText>{errors.studentNumber}</ErrorText>}
              </div>
            </GradeClassNumberRow>
          </FormGroup>

          {/* 디바이더 */}
          <Divider $delay='0.5s' />

          {/* 이름 */}
          <FormGroup $delay='0.6s'>
            <Label>이름</Label>
            <TextInput
              type='text'
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField('')}
              placeholder='홍길동'
              disabled={isLoading}
              $isFocused={focusedField === 'name'}
              $hasError={!!errors.name}
            />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}
          </FormGroup>

          {/* 성별 */}
          <FormGroup $delay='0.7s'>
            <Label>성별</Label>
            <GenderButtonGroup>
              <GenderButton
                type='button'
                onClick={() => handleChange('gender', 'M')}
                disabled={isLoading}
                $isSelected={formData.gender === 'M'}
              >
                남자
              </GenderButton>
              <GenderButton
                type='button'
                onClick={() => handleChange('gender', 'F')}
                disabled={isLoading}
                $isSelected={formData.gender === 'F'}
              >
                여자
              </GenderButton>
            </GenderButtonGroup>
            {errors.gender && <ErrorText>{errors.gender}</ErrorText>}
          </FormGroup>

          {/* CTA 버튼 */}
          <SubmitButton type='submit' disabled={isLoading} $delay='0.8s'>
            {isLoading ? '처리 중...' : '검사 시작하기'}
          </SubmitButton>
        </Form>

        {/* 안내 */}
        <Notice $delay='0.9s'>
          <NoticeText>입력하신 정보는 검사 결과 분석 및 통계 자료로 활용됩니다</NoticeText>
        </Notice>
      </Content>
    </Container>
  );
};
