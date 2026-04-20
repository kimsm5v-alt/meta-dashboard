import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useState } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, #f5f3ff, #ffffff, #eef2ff);
  padding: 2rem 1rem;
`;

const ContentWrapper = styled.div`
  max-width: 42rem;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
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

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
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

const GuidelineNumber = styled.span`
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[100]};
  color: ${({ theme }) => theme.colors.primary[600]};
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
  color: ${({ theme }) => theme.colors.primary[600]};
  border-color: ${({ theme }) => theme.colors.gray[300]};

  &:focus {
    ring: 2px;
    ring-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const RadioLabelText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-align: center;
  white-space: nowrap;
`;

const ConsentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ConsentLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const Checkbox = styled.input`
  margin-top: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.primary[600]};
  border-color: ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.sm};

  &:focus {
    ring: 2px;
    ring-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const ConsentText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const RequiredBadge = styled.span`
  color: #ef4444;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

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

const StartButton = styled.button<{ $hasBackButton: boolean }>`
  flex: ${({ $hasBackButton }) => ($hasBackButton ? '2' : '1')};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
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

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinningIcon = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

interface ExamGuideStepProps {
  studentNumber: number;
  onStart: () => void;
  onBack?: () => void; // optional: 직접 모드에서는 뒤로가기 없음
  isLoading: boolean;
}

export const ExamGuideStep: React.FC<ExamGuideStepProps> = ({
  studentNumber: _studentNumber,
  onStart,
  onBack,
  isLoading,
}) => {
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [sensitiveAgreed, setSensitiveAgreed] = useState(false);

  const canStart = privacyAgreed && sensitiveAgreed;

  const guidelines = [
    '검사 문항에는 옳고, 그른 답이 없습니다. 정답이 없으므로 자신의 생각대로 솔직하게 답해주세요.',
    '해당 검사는 학업 성적이나 교과 점수와는 전혀 관련이 없으므로 걱정하지 않아도 됩니다.',
    '내가 바라는 모습이 아닌, 현재의 나를 기준으로 답해주세요.',
    '중간에 검사를 멈추지 않고 전체 문항을 빠짐없이 응답해 주세요. (약 15~20분 소요)',
  ];

  return (
    <Container>
      <ContentWrapper>
        {/* 헤더 */}
        <Header>
          <Title>검사 안내</Title>
          <Subtitle>검사를 시작하기 전에 아래 내용을 읽어주세요</Subtitle>
        </Header>

        <Card>
          {/* 검사 진행 방법 */}
          <Section>
            <SectionHeader>
              <CheckCircle2 className='w-5 h-5 text-primary-500' />
              <SectionTitle>검사 진행 방법</SectionTitle>
            </SectionHeader>
            <GuidelineList>
              {guidelines.map((guideline, index) => (
                <GuidelineItem key={index}>
                  <GuidelineNumber>{index + 1}</GuidelineNumber>
                  <GuidelineText>{guideline}</GuidelineText>
                </GuidelineItem>
              ))}
            </GuidelineList>
          </Section>

          {/* 예시 문제 */}
          <SectionDivider>
            <SectionHeader>
              <CheckCircle2 className='w-5 h-5 text-primary-500' />
              <SectionTitle>예시 문제</SectionTitle>
            </SectionHeader>
            <ExampleBox>
              <ExampleQuestion>
                <ExampleQuestionNumber>질문 1.</ExampleQuestionNumber> 열심히 노력하면 내 능력이
                향상될 수 있다.
              </ExampleQuestion>
              <RadioGroup>
                {['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'].map(
                  (label, index) => (
                    <RadioLabel key={index}>
                      <RadioInput type='radio' name='example' disabled />
                      <RadioLabelText>{label}</RadioLabelText>
                    </RadioLabel>
                  ),
                )}
              </RadioGroup>
            </ExampleBox>
          </SectionDivider>

          {/* 개인정보 동의 */}
          <SectionDivider>
            <SectionHeader>
              <CheckCircle2 className='w-5 h-5 text-primary-500' />
              <SectionTitle>개인정보 수집·이용 동의</SectionTitle>
            </SectionHeader>
            <ConsentList>
              <ConsentLabel>
                <Checkbox
                  type='checkbox'
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                />
                <ConsentText>
                  <RequiredBadge>[필수]</RequiredBadge> 개인정보 수집 및 이용에 동의합니다.
                </ConsentText>
              </ConsentLabel>
              <ConsentLabel>
                <Checkbox
                  type='checkbox'
                  checked={sensitiveAgreed}
                  onChange={(e) => setSensitiveAgreed(e.target.checked)}
                />
                <ConsentText>
                  <RequiredBadge>[필수]</RequiredBadge> 민감정보 수집 및 이용에 동의합니다.
                </ConsentText>
              </ConsentLabel>
            </ConsentList>
          </SectionDivider>

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
              onClick={onStart}
              disabled={!canStart || isLoading}
              $hasBackButton={!!onBack}
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
