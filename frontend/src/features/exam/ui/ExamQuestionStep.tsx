import styled from '@emotion/styled';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { ExamProgress } from './ExamProgress';
import { QuestionRow } from './QuestionRow';
import type { ExamQuestion } from '../types';

const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.gray[50]};
  display: flex;
  flex-direction: column;
`;

const QuestionList = styled.div`
  flex: 1;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.md}`};
`;

const QuestionListInner = styled.div`
  max-width: 56rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const NavBar = styled.div`
  position: sticky;
  bottom: 0;
  background: ${({ theme }) => theme.colors.background.paper};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => theme.spacing.md};
`;

const NavBarInner = styled.div`
  max-width: 56rem;
  margin: 0 auto;
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PrevButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
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

const NextButton = styled.button`
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
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

const Warning = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #d97706;
  margin-top: 0.5rem;
`;

interface ExamQuestionStepProps {
  questions: ExamQuestion[];
  currentPage: number;
  totalPages: number;
  answeredCount: number;
  totalQuestions: number;
  answers: Record<number, string>;
  savingQuestionNo: number | null;
  onAnswer: (questionNo: number, answer: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSubmit: () => void;
  isLastPage: boolean;
  isSubmitting: boolean;
  paperIdx?: string;
}

export const ExamQuestionStep: React.FC<ExamQuestionStepProps> = ({
  questions,
  currentPage,
  totalPages,
  answeredCount,
  totalQuestions,
  answers,
  savingQuestionNo,
  onAnswer,
  onPrevPage,
  onNextPage,
  onSubmit,
  isLastPage,
  isSubmitting,
  paperIdx = '1',
}) => {
  // 현재 페이지의 모든 문항이 응답되었는지 확인
  const allCurrentPageAnswered = questions.every((q) => answers[q.NO]);

  // 마지막 페이지에서 제출 가능 여부:
  // - 학습종합검사(1): API fullCount가 부정확할 수 있어 124 fallback 유지
  // - 자기조절검사(2+): totalQuestions가 API 응답 기반으로 정확하므로 그대로 사용
  const canSubmit =
    allCurrentPageAnswered &&
    (answeredCount >= totalQuestions || (paperIdx === '1' && answeredCount >= 124));

  return (
    <Container>
      {/* 진행률 헤더 */}
      <ExamProgress
        currentPage={currentPage}
        totalPages={totalPages}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        paperIdx={paperIdx}
      />

      {/* 문항 목록 */}
      <QuestionList>
        <QuestionListInner>
          {questions.map((question) => (
            <QuestionRow
              key={question.NO}
              questionNo={question.NO}
              questionText={question.QESITM_NM}
              selectedValue={answers[question.NO] || ''}
              onSelect={(value) => onAnswer(question.NO, value)}
              isSaving={savingQuestionNo === question.NO}
              choices={question.choices}
            />
          ))}
        </QuestionListInner>
      </QuestionList>

      {/* 하단 네비게이션 */}
      <NavBar>
        <NavBarInner>
          <PrevButton onClick={onPrevPage} disabled={currentPage === 0 || isSubmitting}>
            <ArrowLeft className='w-5 h-5' />
            이전
          </PrevButton>

          {isLastPage ? (
            <SubmitButton onClick={onSubmit} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  제출 중...
                </>
              ) : (
                <>
                  제출하기
                  <ArrowRight className='w-5 h-5' />
                </>
              )}
            </SubmitButton>
          ) : (
            <NextButton onClick={onNextPage} disabled={!allCurrentPageAnswered || isSubmitting}>
              다음
              <ArrowRight className='w-5 h-5' />
            </NextButton>
          )}
        </NavBarInner>

        {/* 미응답 안내 */}
        {!allCurrentPageAnswered && <Warning>모든 문항에 응답해야 다음으로 넘어갈 수 있습니다.</Warning>}
      </NavBar>
    </Container>
  );
};
