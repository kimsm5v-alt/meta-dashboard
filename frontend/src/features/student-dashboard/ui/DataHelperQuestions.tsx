import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { Search, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const IntroText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.625;
`;

const GroupSection = styled.div``;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.625rem;
`;

const GroupIconWrapper = styled.div<{ $gradient: string }>`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: ${({ theme }) => theme.radius.md};
  background: linear-gradient(to bottom right, ${({ $gradient }) => $gradient});
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GroupTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const QuestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const QuestionButton = styled.button<{ $isAnswered: boolean; $bgColor?: string; $borderColor?: string; $textColor?: string }>`
  width: 100%;
  text-align: left;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid
    ${({ $isAnswered, $borderColor, theme }) =>
      $isAnswered ? $borderColor || theme.colors.gray[200] : theme.colors.gray[200]};
  background: ${({ $isAnswered, $bgColor }) => ($isAnswered ? $bgColor || 'transparent' : 'transparent')};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[300]};
    background: ${({ theme }) => theme.colors.primary[50]}80;
  }
`;

const QuestionContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const QuestionLabel = styled.span<{ $isAnswered: boolean; $textColor?: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ $isAnswered, $textColor, theme }) =>
    $isAnswered ? $textColor || theme.colors.gray[700] : theme.colors.gray[700]};
  transition: color 0.15s ease;

  ${QuestionButton}:hover & {
    color: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const Footer = styled.div`
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const FooterText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  line-height: 1.625;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const NavigateButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${({ theme }) => `0.625rem ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.xl};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary[600]};
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[100]};
  }
`;

interface DataHelperQuestionsProps {
  onSelect: (questionId: string) => void;
  answeredQuestions: string[];
}

const QUESTION_GROUPS = [
  {
    id: 'diagnosis',
    label: '진단 해석',
    icon: Search,
    color: '#3b82f6, #6366f1',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    textColor: '#1d4ed8',
    questions: [
      { id: 'diagnosis-1', label: '총평 상세히 알려줘' },
      { id: 'diagnosis-2', label: '11개 요인에 대해 자세히 알려줘' },
      { id: 'diagnosis-3', label: '이 학생의 강점은?' },
      { id: 'diagnosis-4', label: '이 학생의 보완점은?' },
    ],
  },
  {
    id: 'type',
    label: '유형 해석',
    icon: BarChart3,
    color: '#a855f7, #ec4899',
    bgColor: '#faf5ff',
    borderColor: '#e9d5ff',
    textColor: '#7e22ce',
    questions: [
      { id: 'type-1', label: '전체 유형별 특징 알려줘' },
      { id: 'type-2', label: '이 학생의 유형 세부특성 알려줘' },
      { id: 'type-3', label: '개인별 특성은 어떻게 알 수 있어?' },
    ],
  },
];

export const DataHelperQuestions: React.FC<DataHelperQuestionsProps> = ({
  onSelect,
  answeredQuestions,
}) => {
  const navigate = useNavigate();

  return (
    <Container>
      <IntroText>
        궁금한 질문을 선택하면 AI가 이 학생의 데이터를 기반으로 답변해 드려요.
      </IntroText>

      {QUESTION_GROUPS.map((group) => {
        const Icon = group.icon;
        return (
          <GroupSection key={group.id}>
            <GroupHeader>
              <GroupIconWrapper $gradient={group.color}>
                <Icon className='w-3.5 h-3.5 text-white' />
              </GroupIconWrapper>
              <GroupTitle>{group.label}</GroupTitle>
            </GroupHeader>
            <QuestionList>
              {group.questions.map((q) => {
                const isAnswered = answeredQuestions.includes(q.id);
                return (
                  <QuestionButton
                    key={q.id}
                    onClick={() => onSelect(q.id)}
                    $isAnswered={isAnswered}
                    $bgColor={group.bgColor}
                    $borderColor={group.borderColor}
                    $textColor={group.textColor}
                  >
                    <QuestionContent>
                      <QuestionLabel $isAnswered={isAnswered} $textColor={group.textColor}>
                        {q.label}
                      </QuestionLabel>
                      {isAnswered && (
                        <CheckCircle2
                          className='w-4 h-4 flex-shrink-0'
                          style={{ color: group.textColor }}
                        />
                      )}
                    </QuestionContent>
                  </QuestionButton>
                );
              })}
            </QuestionList>
          </GroupSection>
        );
      })}

      {/* AI 어시스턴트 이동 */}
      <Footer>
        <FooterText>더 깊은 분석이 필요하다면 AI 어시스턴트와 자유롭게 대화해 보세요.</FooterText>
        <NavigateButton onClick={() => navigate('/ai-room')}>
          AI 어시스턴트로 이동하기
          <ArrowRight className='w-4 h-4' />
        </NavigateButton>
      </Footer>
    </Container>
  );
};
