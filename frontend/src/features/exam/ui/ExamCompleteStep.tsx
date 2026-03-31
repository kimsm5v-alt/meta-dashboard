import styled from '@emotion/styled';
import { useState } from 'react';
import { CheckCircle2, Mail, Send, Loader2 } from 'lucide-react';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, #d1fae5, #ffffff, #ccfbf1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const Wrapper = styled.div`
  width: 100%;
  max-width: 28rem;
`;

const CenteredWrapper = styled(Wrapper)`
  text-align: center;
`;

const SuccessIconCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 6rem;
  height: 6rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: #d1fae5;
  margin-bottom: 1.5rem;
`;

const IconCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: #d1fae5;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h1`
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 1.5rem;
`;

const EmailInfoCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const EmailLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const EmailValue = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const InfoSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
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

const InputWrapper = styled.div`
  position: relative;
`;

const IconWrapper = styled(Mail)`
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
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md} 3rem`};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px #d1fae5;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  margin-top: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #dc2626;
`;

const SubmitButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${({ theme }) => `${theme.spacing.md} 1.5rem`};
  background: #10b981;
  color: #ffffff;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const Notice = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 1.5rem;
`;

interface ExamCompleteStepProps {
  studentNumber: number;
  onSubmitEmail: (email: string) => Promise<void>;
  isSubmitting: boolean;
}

export const ExamCompleteStep: React.FC<ExamCompleteStepProps> = ({
  studentNumber,
  onSubmitEmail,
  isSubmitting,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      await onSubmitEmail(email);
      setIsSubmitted(true);
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  if (isSubmitted) {
    return (
      <Container>
        <CenteredWrapper>
          <SuccessIconCircle>
            <CheckCircle2 className='w-12 h-12 text-emerald-600' />
          </SuccessIconCircle>
          <Title>결과가 발송되었습니다!</Title>
          <Description>
            입력하신 이메일로 검사 결과 PDF가 발송됩니다.
            <br />
            메일이 도착하지 않으면 스팸함을 확인해주세요.
          </Description>
          <EmailInfoCard>
            <EmailLabel>발송 이메일</EmailLabel>
            <EmailValue>{email}</EmailValue>
          </EmailInfoCard>
        </CenteredWrapper>
      </Container>
    );
  }

  return (
    <Container>
      <Wrapper>
        {/* 완료 메시지 */}
        <InfoSection>
          <IconCircle>
            <CheckCircle2 className='w-10 h-10 text-emerald-600' />
          </IconCircle>
          <Title>검사 완료!</Title>
          <Description>
            {studentNumber}번 학생, 검사를 완료했습니다.
            <br />
            결과를 받을 이메일 주소를 입력해주세요.
          </Description>
        </InfoSection>

        {/* 이메일 입력 폼 */}
        <Form onSubmit={handleSubmit}>
          <FormField>
            <Label>이메일 주소</Label>
            <InputWrapper>
              <IconWrapper />
              <Input
                type='email'
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder='example@email.com'
                disabled={isSubmitting}
              />
            </InputWrapper>
            {error && <ErrorText>{error}</ErrorText>}
          </FormField>

          <SubmitButton type='submit' disabled={isSubmitting || !email.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className='w-5 h-5 animate-spin' />
                발송 중...
              </>
            ) : (
              <>
                결과 받기
                <Send className='w-5 h-5' />
              </>
            )}
          </SubmitButton>
        </Form>

        {/* 안내 문구 */}
        <Notice>※ 입력하신 이메일로 결과 PDF가 발송됩니다.</Notice>
      </Wrapper>
    </Container>
  );
};
