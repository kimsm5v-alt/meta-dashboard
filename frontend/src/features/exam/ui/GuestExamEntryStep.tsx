import styled from '@emotion/styled';
import { useState } from 'react';
import { ArrowRight, Loader2, User, Info } from 'lucide-react';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, ${({ theme }) => theme.colors.primary[50]}, #ffffff, #eef2ff);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const Wrapper = styled.div`
  width: 100%;
  max-width: 28rem;
`;

const InfoSection = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const ExamBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => `0.5rem ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[100]};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ExamName = styled.h1`
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const InfoText = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const Form = styled.form`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: 1rem;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 2rem;
`;

const FormField = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.5rem;
`;

const RequiredMark = styled.span`
  color: #ef4444;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const IconWrapper = styled(User)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[200]};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const InfoContent = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const InfoIcon = styled(Info)`
  width: 1rem;
  height: 1rem;
  color: #3b82f6;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const InfoMessage = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: #1d4ed8;
`;

const ErrorText = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #dc2626;
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${({ theme }) => `${theme.spacing.md} 1.5rem`};
  background: ${({ theme }) => theme.colors.primary[600]};
  color: #ffffff;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[700]};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const BackButton = styled.button`
  width: 100%;
  padding: 0.75rem 1.5rem;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  background: transparent;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.gray[900]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface GuestExamEntryStepProps {
  examName: string;
  onSubmit: (nickname: string) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export const GuestExamEntryStep: React.FC<GuestExamEntryStepProps> = ({
  examName,
  onSubmit,
  onBack,
  isLoading,
}) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim() || nickname.trim().length < 2) {
      setError('닉네임을 2자 이상 입력해주세요.');
      return;
    }

    try {
      await onSubmit(nickname.trim());
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <Container>
      <Wrapper>
        {/* 검사 정보 */}
        <InfoSection>
          <ExamBadge>META 학습종합검사</ExamBadge>
          <ExamName>{examName}</ExamName>
          <InfoText>게스트로 검사를 응시합니다</InfoText>
        </InfoSection>

        {/* 닉네임 입력 폼 */}
        <Form onSubmit={handleSubmit}>
          <FormField>
            <Label>
              닉네임 <RequiredMark>*</RequiredMark>
            </Label>
            <InputWrapper>
              <IconWrapper />
              <Input
                type='text'
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                placeholder='닉네임을 입력하세요'
                disabled={isLoading}
                autoFocus
                minLength={2}
              />
            </InputWrapper>
          </FormField>

          {/* 안내 문구 */}
          <InfoBox>
            <InfoContent>
              <InfoIcon />
              <InfoMessage>
                이메일로 검사 응시 안내를 받으셨다면, 그룹 가입 시 사용한 닉네임을 입력해주세요.
              </InfoMessage>
            </InfoContent>
          </InfoBox>

          {error && <ErrorText>{error}</ErrorText>}

          <ButtonGroup>
            <SubmitButton type='submit' disabled={isLoading || !nickname.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  확인 중...
                </>
              ) : (
                <>
                  검사 시작
                  <ArrowRight className='w-5 h-5' />
                </>
              )}
            </SubmitButton>

            <BackButton type='button' onClick={onBack} disabled={isLoading}>
              뒤로
            </BackButton>
          </ButtonGroup>
        </Form>
      </Wrapper>
    </Container>
  );
};
