import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { MessageCircleQuestion, X, Sparkles } from 'lucide-react';
import { DataHelperQuestions } from './DataHelperQuestions';
import { DataHelperAnswer } from './DataHelperAnswer';
import { getDataHelperAnswer, type StudentData, type QuestionId } from '../api/dataHelperService';
import type { StudentType, SchoolLevel, FactorDeviation } from '@shared/types';

const FabButton = styled.button<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 50;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $isOpen, theme }) => ($isOpen ? '#4b5563' : theme.colors.primary[500])};
  border: none;
  cursor: pointer;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.xl};
    background: ${({ $isOpen }) => ($isOpen ? '#374151' : '#7c3aed')};
  }
`;

const FabIcon = styled(MessageCircleQuestion)`
  width: 1.5rem;
  height: 1.5rem;
  color: #ffffff;
`;

const CloseIcon = styled(X)`
  width: 1.5rem;
  height: 1.5rem;
  color: #ffffff;
`;

const ChatPanel = styled.div`
  position: fixed;
  bottom: 6rem;
  right: 1.5rem;
  z-index: 50;
  width: 420px;
  height: 560px;
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeInSlideUp 0.2s ease-out;

  @keyframes fadeInSlideUp {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Header = styled.div`
  padding: ${({ theme }) => `${theme.spacing.md} 1.25rem`};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SparklesIcon = styled(Sparkles)`
  width: 1.25rem;
  height: 1.25rem;
`;

const HeaderTitle = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: 15px;
`;

const HeaderCloseButton = styled.button`
  padding: 0.375rem;
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const HeaderCloseIcon = styled(X)`
  width: 1rem;
  height: 1rem;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
`;

interface DataHelperChatbotProps {
  tScores: number[];
  predictedType: StudentType;
  typeProbabilities: Record<string, number>;
  schoolLevel: SchoolLevel;
  deviations: FactorDeviation[];
}

const QUESTION_LABELS: Record<string, string> = {
  'diagnosis-1': '총평 상세히 알려줘',
  'diagnosis-2': '11개 요인에 대해 자세히 알려줘',
  'diagnosis-3': '이 학생의 강점은?',
  'diagnosis-4': '이 학생의 보완점은?',
  'type-1': '전체 유형별 특징 알려줘',
  'type-2': '이 학생의 유형 세부특성 알려줘',
  'type-3': '개인별 특성은 어떻게 알 수 있어?',
};

export const DataHelperChatbot: React.FC<DataHelperChatbotProps> = ({
  tScores,
  predictedType,
  typeProbabilities,
  schoolLevel,
  deviations,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 학생이 변경되면 캐시 초기화
  useEffect(() => {
    setAnswers({});
    setSelectedQuestion(null);
  }, [tScores, predictedType]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const fab = document.getElementById('data-helper-fab');
        if (fab && fab.contains(e.target as Node)) return;
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectQuestion = async (questionId: string) => {
    setSelectedQuestion(questionId);

    // 이미 캐시된 답변이 있으면 API 호출 안 함
    if (answers[questionId]) return;

    setLoading(true);
    try {
      const studentData: StudentData = {
        tScores,
        predictedType,
        typeProbabilities,
        schoolLevel,
        deviations,
      };
      const result = await getDataHelperAnswer(questionId as QuestionId, studentData);
      setAnswers((prev) => ({ ...prev, [questionId]: result }));
    } catch {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: '답변을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedQuestion(null);
  };

  return (
    <>
      {/* FAB 버튼 */}
      <FabButton
        id='data-helper-fab'
        onClick={() => setIsOpen((prev) => !prev)}
        $isOpen={isOpen}
        title='데이터 해석 도우미'
      >
        {isOpen ? <CloseIcon /> : <FabIcon />}
      </FabButton>

      {/* 챗봇 창 */}
      {isOpen && (
        <ChatPanel ref={panelRef}>
          {/* 헤더 */}
          <Header>
            <HeaderLeft>
              <SparklesIcon />
              <HeaderTitle>데이터 해석 도우미</HeaderTitle>
            </HeaderLeft>
            <HeaderCloseButton onClick={() => setIsOpen(false)}>
              <HeaderCloseIcon />
            </HeaderCloseButton>
          </Header>

          {/* 콘텐츠 */}
          <ContentArea>
            {selectedQuestion ? (
              <DataHelperAnswer
                question={QUESTION_LABELS[selectedQuestion] || ''}
                answer={answers[selectedQuestion] || ''}
                loading={loading && !answers[selectedQuestion]}
                onBack={handleBack}
              />
            ) : (
              <DataHelperQuestions
                onSelect={handleSelectQuestion}
                answeredQuestions={Object.keys(answers)}
              />
            )}
          </ContentArea>
        </ChatPanel>
      )}
    </>
  );
};
