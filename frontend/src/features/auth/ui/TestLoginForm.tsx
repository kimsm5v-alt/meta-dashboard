import type React from 'react';
import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { ArrowLeft, LogIn, AlertCircle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@shared/components';

export interface TestCredentials {
  teacherId: string;
  classId: string;
  gradeLevel: 'el' | 'mi' | 'hi';
  jwtToken: string;
}

interface TestAccount extends TestCredentials {
  label: string;
}

interface TestLoginFormProps {
  onLogin: (credentials: TestCredentials) => void;
  isLoading: boolean;
}

const GRADE_LEVEL_OPTIONS = [
  { value: 'el', label: '초등' },
  { value: 'mi', label: '중등' },
  { value: 'hi', label: '고등' },
] as const;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 28rem;
  padding: ${({ theme }) => theme.spacing.xl};
  position: relative;
`;

const BackButton = styled.button`
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  padding: ${({ theme }) => theme.spacing.sm};
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const BackIcon = styled.span`
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  display: inline-flex;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding-top: ${({ theme }) => theme.spacing.md};
`;

const TestModeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  background: #fef3c7;
  color: #b45309;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const BadgeIcon = styled.span`
  width: 0.75rem;
  height: 0.75rem;
  display: inline-flex;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FormGroup = styled.div``;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const SelectWrapper = styled.div`
  position: relative;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 0.75rem;
  outline: none;
  transition: all 0.15s ease;
  appearance: none;
  background: white;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SelectIcon = styled.span`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  pointer-events: none;
  display: inline-flex;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 0.75rem;
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const GradeButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const GradeButton = styled.button<{ $isSelected: boolean }>`
  flex: 1;
  padding: 0.75rem ${({ theme }) => theme.spacing.md};
  border-radius: 0.75rem;
  border: 2px solid
    ${({ $isSelected, theme }) =>
      $isSelected ? theme.colors.primary[500] : theme.colors.gray[200]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: all 0.15s ease;
  cursor: pointer;
  background: ${({ $isSelected, theme }) => ($isSelected ? theme.colors.primary[50] : 'white')};
  color: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.primary[700] : theme.colors.gray[600]};

  &:hover:not(:disabled) {
    border-color: ${({ $isSelected, theme }) =>
      $isSelected ? theme.colors.primary[500] : theme.colors.gray[300]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 0.75rem;
  outline: none;
  transition: all 0.15s ease;
  resize: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: monospace;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: #dc2626;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: #fef2f2;
  padding: 0.75rem ${({ theme }) => theme.spacing.md};
  border-radius: 0.75rem;
`;

const ErrorIcon = styled.span`
  width: 1rem;
  height: 1rem;
  display: inline-flex;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const SubmitButton = styled.button<{ $isLoading: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0.875rem ${({ theme }) => theme.spacing.md};
  border-radius: 0.75rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.25);
  opacity: ${({ $isLoading }) => ($isLoading ? 0.5 : 1)};
  cursor: ${({ $isLoading }) => ($isLoading ? 'not-allowed' : 'pointer')};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const ButtonIcon = styled.span`
  width: 1.25rem;
  height: 1.25rem;
  display: inline-flex;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: ${({ theme }) => theme.radius.full};
  animation: ${spin} 1s linear infinite;
`;

const Notice = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

/** 테스트 계정 목록 로드 (test-accounts.json) */
async function loadTestAccounts(): Promise<TestAccount[]> {
  try {
    const response = await fetch('/test-accounts.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Failed to load test-accounts.json:', e);
  }
  return [];
}

export const TestLoginForm: React.FC<TestLoginFormProps> = ({ onLogin, isLoading }) => {
  const navigate = useNavigate();
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([]);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(-1);

  // 테스트 계정 로드
  useEffect(() => {
    loadTestAccounts().then(setTestAccounts);
  }, []);

  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [gradeLevel, setGradeLevel] = useState<'el' | 'mi' | 'hi'>('mi');
  const [jwtToken, setJwtToken] = useState('');
  const [error, setError] = useState('');

  // 테스트 계정 선택 시 자동 채우기
  useEffect(() => {
    if (selectedAccountIndex >= 0 && selectedAccountIndex < testAccounts.length) {
      const account = testAccounts[selectedAccountIndex];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTeacherId(account.teacherId);

      setClassId(account.classId);

      setGradeLevel(account.gradeLevel);

      setJwtToken(account.jwtToken);
    }
  }, [selectedAccountIndex, testAccounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!teacherId.trim()) {
      setError('교사 ID를 입력해주세요.');
      return;
    }
    if (!classId.trim()) {
      setError('클래스 ID를 입력해주세요.');
      return;
    }
    if (!jwtToken.trim()) {
      setError('JWT 토큰을 입력해주세요.');
      return;
    }

    onLogin({
      teacherId: teacherId.trim(),
      classId: classId.trim(),
      gradeLevel,
      jwtToken: jwtToken.trim(),
    });
  };

  const hasTestAccounts = testAccounts.length > 0;

  return (
    <StyledCard>
      {/* 뒤로가기 버튼 */}
      <BackButton onClick={() => navigate('/')}>
        <BackIcon>
          <ArrowLeft />
        </BackIcon>
      </BackButton>

      {/* 헤더 */}
      <Header>
        <TestModeBadge>
          <BadgeIcon>
            <AlertCircle />
          </BadgeIcon>
          테스트 모드
        </TestModeBadge>
        <Title>임시 로그인</Title>
        <Subtitle>API 테스트용 credentials 입력</Subtitle>
      </Header>

      {/* 폼 */}
      <Form onSubmit={handleSubmit}>
        {/* 테스트 계정 선택 (계정이 있을 때만 표시) */}
        {hasTestAccounts && (
          <FormGroup>
            <Label htmlFor='testAccount'>테스트 계정 선택</Label>
            <SelectWrapper>
              <Select
                id='testAccount'
                value={selectedAccountIndex}
                onChange={(e) => setSelectedAccountIndex(Number(e.target.value))}
                disabled={isLoading}
              >
                <option value={-1}>직접 입력</option>
                {testAccounts.map((account, index) => (
                  <option key={index} value={index}>
                    {account.label}
                  </option>
                ))}
              </Select>
              <SelectIcon>
                <ChevronDown />
              </SelectIcon>
            </SelectWrapper>
          </FormGroup>
        )}

        {/* 교사 ID */}
        <FormGroup>
          <Label htmlFor='teacherId'>교사 ID (tcId)</Label>
          <Input
            id='teacherId'
            type='text'
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            placeholder='예: engreal51-t'
            disabled={isLoading}
          />
        </FormGroup>

        {/* 클래스 ID */}
        <FormGroup>
          <Label htmlFor='classId'>클래스 ID (claId)</Label>
          <Input
            id='classId'
            type='text'
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            placeholder='예: 1c4379432acc4a37ad0b608fd3a16a5c'
            disabled={isLoading}
          />
        </FormGroup>

        {/* 학교급 */}
        <FormGroup>
          <Label>학교급 (gradeLevel)</Label>
          <GradeButtonGroup>
            {GRADE_LEVEL_OPTIONS.map((option) => (
              <GradeButton
                key={option.value}
                type='button'
                onClick={() => setGradeLevel(option.value)}
                $isSelected={gradeLevel === option.value}
                disabled={isLoading}
              >
                {option.label}
              </GradeButton>
            ))}
          </GradeButtonGroup>
        </FormGroup>

        {/* JWT 토큰 (직접 입력 모드일 때만 표시) */}
        {selectedAccountIndex === -1 && (
          <FormGroup>
            <Label htmlFor='jwtToken'>JWT 토큰</Label>
            <Textarea
              id='jwtToken'
              value={jwtToken}
              onChange={(e) => setJwtToken(e.target.value)}
              placeholder='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              rows={3}
              disabled={isLoading}
            />
          </FormGroup>
        )}

        {/* 에러 메시지 */}
        {error && (
          <ErrorMessage>
            <ErrorIcon>
              <AlertCircle />
            </ErrorIcon>
            {error}
          </ErrorMessage>
        )}

        {/* 로그인 버튼 */}
        <SubmitButton type='submit' disabled={isLoading} $isLoading={isLoading}>
          {isLoading ? (
            <Spinner />
          ) : (
            <>
              <ButtonIcon>
                <LogIn />
              </ButtonIcon>
              <span>테스트 로그인</span>
            </>
          )}
        </SubmitButton>
      </Form>

      {/* 안내 문구 */}
      <Notice>실제 회원 체계 구축 전 API 테스트용 임시 로그인입니다.</Notice>
    </StyledCard>
  );
};
