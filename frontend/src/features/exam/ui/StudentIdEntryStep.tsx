import styled from '@emotion/styled';
import { useState } from 'react';
import { ArrowRight, Loader2, User } from 'lucide-react';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    to bottom right,
    ${({ theme }) => theme.colors.primary[50]},
    #ffffff,
    #eef2ff
  );
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
  margin-bottom: 2rem;
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

const InputSection = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.5rem;
  text-align: center;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const IconWrapper = styled.div`
  position: absolute;
  inset-top: 0;
  inset-bottom: 0;
  left: 0;
  padding-left: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  pointer-events: none;
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md} 3rem`};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[200]};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[300]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Hint = styled.p`
  margin-top: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-align: center;
`;

const ErrorText = styled.p`
  margin-top: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #dc2626;
  text-align: center;
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

interface StudentIdEntryStepProps {
  examName: string;
  onSubmit: (stdtId: string) => Promise<void>;
  isLoading: boolean;
}

export const StudentIdEntryStep: React.FC<StudentIdEntryStepProps> = ({
  examName,
  onSubmit,
  isLoading,
}) => {
  const [stdtId, setStdtId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedId = stdtId.trim();
    if (!trimmedId) {
      setError('학생 ID를 입력해주세요.');
      return;
    }

    try {
      await onSubmit(trimmedId);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStdtId(e.target.value);
    setError('');
  };

  return (
    <Container>
      <Wrapper>
        {/* 검사 정보 */}
        <InfoSection>
          <ExamBadge>META 학습종합검사</ExamBadge>
          <ExamName>{examName}</ExamName>
          <InfoText>본인의 학생 ID를 입력해주세요</InfoText>
        </InfoSection>

        {/* ID 입력 폼 */}
        <Form onSubmit={handleSubmit}>
          <InputSection>
            <Label>학생 ID</Label>
            <InputWrapper>
              <IconWrapper>
                <User className='w-5 h-5 text-gray-400' />
              </IconWrapper>
              <Input
                type='text'
                value={stdtId}
                onChange={handleChange}
                placeholder='예: engreal51-s1'
                autoFocus
                disabled={isLoading}
              />
            </InputWrapper>
            <Hint>선생님께 안내받은 학생 ID를 입력하세요</Hint>
            {error && <ErrorText>{error}</ErrorText>}
          </InputSection>

          <SubmitButton type='submit' disabled={isLoading || !stdtId.trim()}>
            {isLoading ? (
              <>
                <Loader2 className='w-5 h-5 animate-spin' />
                확인 중...
              </>
            ) : (
              <>
                다음
                <ArrowRight className='w-5 h-5' />
              </>
            )}
          </SubmitButton>
        </Form>
      </Wrapper>
    </Container>
  );
};
