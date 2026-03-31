import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { validateExamCode } from '@features/exam/api/examService';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    to bottom right,
    ${({ theme }) => theme.colors.primary[50]},
    white,
    #eef2ff
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 28rem;
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LogoCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: 9999px;
  background: ${({ theme }) => theme.colors.primary[100]};
  margin-bottom: 1rem;
`;

const LogoIcon = styled(GraduationCap)`
  width: 2.5rem;
  height: 2.5rem;
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const FormCard = styled.form`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.5rem;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Prefix = styled.span`
  font-size: 1.125rem;
  font-family: monospace;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const CodeInput = styled.input`
  flex: 1;
  text-align: center;
  font-size: 1.5rem;
  font-family: monospace;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 0.75rem 1rem;
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #dc2626;
`;

const SubmitButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
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

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingIcon = styled(Loader2)`
  width: 1.25rem;
  height: 1.25rem;
  animation: ${spin} 1s linear infinite;
`;

const ArrowIcon = styled(ArrowRight)`
  width: 1.25rem;
  height: 1.25rem;
`;

const HelpText = styled.p`
  text-align: center;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 1.5rem;
`;

export const ExamCodeEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullCode = `META-${code.toUpperCase()}`;

    if (code.length < 4) {
      setError('검사 코드 4자리를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await validateExamCode(fullCode);

      if (result.valid) {
        navigate(`/exam/${fullCode}`);
      } else {
        setError('유효하지 않은 검사 코드입니다. 다시 확인해주세요.');
      }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4);
    setCode(value);
    setError('');
  };

  return (
    <PageContainer>
      <ContentWrapper>
        {/* 로고 영역 */}
        <LogoSection>
          <LogoCircle>
            <LogoIcon />
          </LogoCircle>
          <PageTitle>학습심리정서검사</PageTitle>
          <PageSubtitle>선생님께 받은 검사 코드를 입력하세요</PageSubtitle>
        </LogoSection>

        {/* 코드 입력 폼 */}
        <FormCard onSubmit={handleSubmit}>
          <FormGroup>
            <Label>검사 코드</Label>
            <InputRow>
              <Prefix>META -</Prefix>
              <CodeInput
                type='text'
                value={code}
                onChange={handleCodeChange}
                placeholder='____'
                maxLength={4}
                autoFocus
                disabled={isLoading}
              />
            </InputRow>
            {error && <ErrorText>{error}</ErrorText>}
          </FormGroup>

          <SubmitButton type='submit' disabled={isLoading || code.length < 4}>
            {isLoading ? (
              <>
                <LoadingIcon />
                확인 중...
              </>
            ) : (
              <>
                검사 시작하기
                <ArrowIcon />
              </>
            )}
          </SubmitButton>
        </FormCard>

        {/* 안내 문구 */}
        <HelpText>검사 코드를 모르시나요? 선생님께 문의하세요.</HelpText>
      </ContentWrapper>
    </PageContainer>
  );
};
