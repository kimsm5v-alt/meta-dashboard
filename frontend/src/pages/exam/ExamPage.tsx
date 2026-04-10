import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useExamState } from '@features/exam/model/useExamState';
import { useAuth } from '@features/auth/model/AuthContext';
import {
  validateExamCode,
  fetchQuestions,
  saveAnswer,
  submitExam,
  getStudentExamInfo,
  resetExam,
} from '@features/exam/api/examService';
import { saveStudentInfo } from '@features/exam/api/studentInfoService';
import {
  StudentIdEntryStep,
  StudentInfoStep,
  MemberCompleteStep,
  ExamAuthStep,
  GuestExamEntryStep,
  ResumeChoiceStep,
  ExamGuideStep,
  ExamQuestionStep,
  ExamCompleteStep,
} from '@features/exam/ui';
import type { StudentInfo } from '@features/exam/ui/StudentInfoStep';

interface ExamInfo {
  name: string;
  examCode: string; // 항상 숫자 코드
  claId?: string; // API 모드에서 사용
}

interface StudentExamLocationState {
  dgnssResultId: number;
  dgnssId: number;
  ordNo: number;
  examName: string;
  resume?: boolean;
  restart?: boolean;
}

const LoadingContainer = styled.div`
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
`;

const LoadingContent = styled.div`
  text-align: center;
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingSpinner = styled(Loader2)`
  width: 3rem;
  height: 3rem;
  color: ${({ theme }) => theme.colors.primary[500]};
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 1rem;
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ErrorContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, #fef2f2, white, #fff7ed);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const ErrorContent = styled.div`
  width: 100%;
  max-width: 28rem;
  text-align: center;
`;

const ErrorIconCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: 9999px;
  background: #fee2e2;
  margin-bottom: 1rem;
`;

const ErrorIcon = styled(AlertCircle)`
  width: 2.5rem;
  height: 2.5rem;
  color: #dc2626;
`;

const ErrorTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 1.5rem;
`;

const RetryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
  }
`;

export const ExamPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // 학생(회원) 플로우 여부 확인
  const studentExamState = location.state as StudentExamLocationState | undefined;
  const isStudentFlow = !code && !!studentExamState?.dgnssResultId;

  const [isValidating, setIsValidating] = useState(!isStudentFlow);
  const [isValid, setIsValid] = useState(isStudentFlow);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingQuestionNo, setSavingQuestionNo] = useState<number | null>(null);
  const [pendingAnsweredCount, setPendingAnsweredCount] = useState(0);
  const [isRestartMode, setIsRestartMode] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

  const {
    state,
    setStep,
    setStudentNumber,
    setDgnssResultId,
    setAnswer,
    setCurrentPage,
    loadQuestions,
    loadExistingAnswers,
  } = useExamState();

  // 학생(회원) 플로우 초기화
  useEffect(() => {
    if (!isStudentFlow || !studentExamState) return;

    const init = async () => {
      setExamInfo({
        name: studentExamState.examName,
        examCode: '', // 학생용은 코드 없음
      });
      setDgnssResultId(studentExamState.dgnssResultId);

      // user의 studentNumber 추출 (stdtId에서)
      if (user?.stdtId) {
        const numberMatch = user.stdtId.match(/s(\d+)$/);
        const studentNumber = numberMatch ? parseInt(numberMatch[1], 10) : 0;
        setStudentNumber(studentNumber);
      }

      // resume/restart 처리
      if (studentExamState.resume || studentExamState.restart) {
        setIsLoading(true);
        try {
          if (studentExamState.restart) {
            setIsRestartMode(true);
          }

          // 이어하기: 마지막 답변 페이지 계산
          // 새로하기: 0페이지부터 시작
          let startPage = 0;
          if (!studentExamState.restart && studentExamState.resume) {
            // 첫 페이지 로드해서 answeredCount 확인
            const initialResult = await fetchQuestions(studentExamState.dgnssResultId, 0, 20);
            if (initialResult.answeredCount > 0) {
              // 마지막 답변 페이지 계산 (0-based)
              // 예: answeredCount=63 → page=3 (61-80번)
              startPage = Math.floor((initialResult.answeredCount - 1) / 20);
            }
          }

          const result = studentExamState.restart
            ? await resetExam(studentExamState.dgnssResultId, 0, 20)
            : await fetchQuestions(studentExamState.dgnssResultId, startPage, 20);

          const existingAnswers: Record<number, string> = {};
          if (!studentExamState.restart) {
            result.questions.forEach((q) => {
              if (q.answer) {
                existingAnswers[q.NO] = q.answer;
              }
            });
          }

          loadQuestions(
            result.questions,
            result.totalPages,
            result.totalQuestions,
            result.omrIdx,
            result.answeredCount,
          );
          loadExistingAnswers(existingAnswers);
          setCurrentPage(startPage); // 계산된 페이지로 설정

          if (!studentExamState.restart && result.answeredCount > 0) {
            setPendingAnsweredCount(result.answeredCount);
            setStep('resume-choice');
          } else {
            setStep('guide');
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        // 새로 시작 → student-info 단계로
        setStep('student-info');
      }
    };

    init();
  }, [isStudentFlow, studentExamState, user, setDgnssResultId, setStudentNumber, loadQuestions, loadExistingAnswers, setStep]);

  // QR 코드 검증
  useEffect(() => {
    if (isStudentFlow) return; // 학생 플로우면 스킵

    const validate = async () => {
      if (!code) {
        navigate('/exam');
        return;
      }

      try {
        const result = await validateExamCode(code);
        if (result.valid && result.examCode) {
          setIsValid(true);
          setExamInfo({
            name: result.name || '학습심리정서검사',
            examCode: result.examCode,
            claId: result.claId,
          });
        } else {
          setIsValid(false);
        }
      } catch {
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [code, navigate, isStudentFlow]);

  // 인증 상태에 따라 초기 step 결정 (QR 코드 플로우만)
  useEffect(() => {
    if (isStudentFlow) return; // 학생 플로우는 스킵
    if (isValidating || authLoading || !isValid) return;

    if (isAuthenticated) {
      // 로그인 상태 → stdtId 입력 단계
      if (state.step === 'auth' || state.step === 'guest-entry') {
        setStep('number');
      }
    } else {
      // 비로그인 상태 → 인증 선택 단계
      if (state.step === 'number') {
        setStep('auth');
      }
    }
  }, [isAuthenticated, authLoading, isValidating, isValid, state.step, setStep, isStudentFlow]);

  // 게스트 검사 시작 (닉네임만 입력)
  const handleGuestSubmit = useCallback(
    async (nickname: string) => {
      if (!examInfo) return;

      setIsLoading(true);
      try {
        const claIdOrCode = examInfo.claId || examInfo.examCode;
        // TODO: 게스트 전용 API 호출로 교체 (닉네임 기반 매칭)
        const stdtId = `guest-${nickname}`;
        const examResult = await getStudentExamInfo(claIdOrCode, stdtId);
        if (!examResult) {
          throw new Error('진행 중인 검사가 없습니다. 선생님께 문의하세요.');
        }

        const { dgnssResultId } = examResult;
        setDgnssResultId(dgnssResultId);

        // 먼저 첫 페이지 로드해서 answeredCount 확인
        const initialResult = await fetchQuestions(dgnssResultId, 0, 20);

        // 이어하기인 경우 마지막 답변 페이지 계산
        let startPage = 0;
        if (initialResult.answeredCount > 0) {
          startPage = Math.floor((initialResult.answeredCount - 1) / 20);
        }

        // 시작 페이지 로드
        const result = startPage === 0
          ? initialResult
          : await fetchQuestions(dgnssResultId, startPage, 20);

        const existingAnswers: Record<number, string> = {};
        result.questions.forEach((q) => {
          if (q.answer) {
            existingAnswers[q.NO] = q.answer;
          }
        });

        loadQuestions(
          result.questions,
          result.totalPages,
          result.totalQuestions,
          result.omrIdx,
          result.answeredCount,
        );
        loadExistingAnswers(existingAnswers);
        setStudentNumber(0);
        setCurrentPage(startPage);

        if (result.answeredCount > 0) {
          setPendingAnsweredCount(result.answeredCount);
          setStep('resume-choice');
        } else {
          setStep('guide');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [examInfo, loadQuestions, loadExistingAnswers, setStudentNumber, setDgnssResultId, setCurrentPage, setStep],
  );

  // 학생 ID 입력 후 dgnssResultId 조회
  const handleStudentIdSubmit = useCallback(
    async (stdtId: string) => {
      if (!examInfo) return;

      setIsLoading(true);
      try {
        const claIdOrCode = examInfo.claId || examInfo.examCode;
        const examResult = await getStudentExamInfo(claIdOrCode, stdtId);
        if (!examResult) {
          throw new Error('진행 중인 검사가 없습니다.');
        }

        const { dgnssResultId } = examResult;
        setDgnssResultId(dgnssResultId);

        const numberMatch = stdtId.match(/s(\d+)$/);
        const studentNumber = numberMatch ? parseInt(numberMatch[1], 10) : 0;
        setStudentNumber(studentNumber);

        // 학생 정보 입력 단계로 이동
        setStep('student-info');
      } finally {
        setIsLoading(false);
      }
    },
    [examInfo, setStudentNumber, setDgnssResultId, setStep],
  );

  // 학생 정보 입력 후 문항 로드
  const handleStudentInfoSubmit = useCallback(
    async (info: StudentInfo) => {
      if (!state.dgnssResultId) return;

      setIsLoading(true);
      try {
        // 학생 정보 저장 (localStorage)
        await saveStudentInfo(state.dgnssResultId, info);
        setStudentInfo(info);

        // 먼저 첫 페이지 로드해서 answeredCount 확인
        const initialResult = await fetchQuestions(state.dgnssResultId, 0, 20);

        // 이어하기인 경우 마지막 답변 페이지 계산
        let startPage = 0;
        if (initialResult.answeredCount > 0) {
          startPage = Math.floor((initialResult.answeredCount - 1) / 20);
        }

        // 시작 페이지 로드
        const result = startPage === 0
          ? initialResult
          : await fetchQuestions(state.dgnssResultId, startPage, 20);

        const existingAnswers: Record<number, string> = {};
        result.questions.forEach((q) => {
          if (q.answer) {
            existingAnswers[q.NO] = q.answer;
          }
        });

        loadQuestions(
          result.questions,
          result.totalPages,
          result.totalQuestions,
          result.omrIdx,
          result.answeredCount,
        );
        loadExistingAnswers(existingAnswers);
        setCurrentPage(startPage);

        if (result.answeredCount > 0) {
          setPendingAnsweredCount(result.answeredCount);
          setStep('resume-choice');
        } else {
          setStep('guide');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [state.dgnssResultId, loadQuestions, loadExistingAnswers, setCurrentPage, setStep],
  );

  // 이어하기 (guide 건너뛰고 바로 문항으로)
  const handleResume = useCallback(() => {
    setIsRestartMode(false);
    setStep('questions');
  }, [setStep]);

  // 새로하기
  const handleRestart = useCallback(() => {
    setIsRestartMode(true);
    loadExistingAnswers({});
    setPendingAnsweredCount(0);
    setStep('guide');
  }, [loadExistingAnswers, setStep]);

  // 검사 시작
  const handleStartExam = useCallback(async () => {
    if (!state.dgnssResultId) return;

    setIsLoading(true);
    try {
      const result = isRestartMode
        ? await resetExam(state.dgnssResultId, 0, 20)
        : await fetchQuestions(state.dgnssResultId, 0, 20);

      loadQuestions(
        result.questions,
        result.totalPages,
        result.totalQuestions,
        result.omrIdx,
        result.answeredCount,
      );

      const existingAnswers: Record<number, string> = {};
      if (!isRestartMode) {
        result.questions.forEach((q) => {
          if (q.answer) {
            existingAnswers[q.NO] = q.answer;
          }
        });
      }
      loadExistingAnswers(existingAnswers);

      setIsRestartMode(false);
      setStep('questions');
    } finally {
      setIsLoading(false);
    }
  }, [state.dgnssResultId, isRestartMode, loadQuestions, loadExistingAnswers, setStep]);

  // 답변 저장
  const handleAnswer = useCallback(
    async (questionNo: number, answer: string) => {
      if (!state.omrIdx) return;

      setAnswer(questionNo, answer);

      setSavingQuestionNo(questionNo);
      try {
        await saveAnswer(state.omrIdx, questionNo, answer);
      } finally {
        setSavingQuestionNo(null);
      }
    },
    [state.omrIdx, setAnswer],
  );

  // 다음 페이지
  const handleNextPage = useCallback(async () => {
    if (!state.dgnssResultId) return;

    const nextPageIndex = state.currentPage + 1;
    if (nextPageIndex >= state.totalPages) return;

    setIsLoading(true);
    try {
      const result = await fetchQuestions(state.dgnssResultId, nextPageIndex, 20);
      loadQuestions(
        result.questions,
        result.totalPages,
        result.totalQuestions,
        result.omrIdx,
        result.answeredCount,
      );

      const existingAnswers: Record<number, string> = { ...state.answers };
      result.questions.forEach((q) => {
        if (q.answer) {
          existingAnswers[q.NO] = q.answer;
        }
      });
      loadExistingAnswers(existingAnswers);

      setCurrentPage(nextPageIndex);
      window.scrollTo(0, 0);
    } finally {
      setIsLoading(false);
    }
  }, [state, loadQuestions, loadExistingAnswers, setCurrentPage]);

  // 이전 페이지
  const handlePrevPage = useCallback(async () => {
    if (!state.dgnssResultId) return;

    const prevPageIndex = state.currentPage - 1;
    if (prevPageIndex < 0) return;

    setIsLoading(true);
    try {
      const result = await fetchQuestions(state.dgnssResultId, prevPageIndex, 20);
      loadQuestions(
        result.questions,
        result.totalPages,
        result.totalQuestions,
        result.omrIdx,
        result.answeredCount,
      );

      // 기존 답변 유지 + 새로 로드한 페이지의 답변 병합
      const existingAnswers: Record<number, string> = { ...state.answers };
      result.questions.forEach((q) => {
        if (q.answer) {
          existingAnswers[q.NO] = q.answer;
        }
      });
      loadExistingAnswers(existingAnswers);

      setCurrentPage(prevPageIndex);
      window.scrollTo(0, 0);
    } finally {
      setIsLoading(false);
    }
  }, [state, loadQuestions, loadExistingAnswers, setCurrentPage]);

  // 검사 제출
  const handleSubmit = useCallback(async () => {
    if (!state.dgnssResultId) return;

    setIsLoading(true);
    try {
      await submitExam(state.dgnssResultId);
      setStep('complete');
    } finally {
      setIsLoading(false);
    }
  }, [state.dgnssResultId, setStep]);

  // 이메일 제출
  const handleEmailSubmit = useCallback(async (_email: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 로딩 화면
  if ((!isStudentFlow && isValidating) || authLoading) {
    return (
      <LoadingContainer>
        <LoadingContent>
          <LoadingSpinner />
          <LoadingText>검사 정보를 확인하고 있습니다...</LoadingText>
        </LoadingContent>
      </LoadingContainer>
    );
  }

  // 유효하지 않은 코드 (QR 코드 플로우만)
  if (!isStudentFlow && (!isValid || !examInfo)) {
    return (
      <ErrorContainer>
        <ErrorContent>
          <ErrorIconCircle>
            <ErrorIcon />
          </ErrorIconCircle>
          <ErrorTitle>유효하지 않은 검사 코드</ErrorTitle>
          <ErrorMessage>
            검사 코드가 올바르지 않거나 만료되었습니다.
            <br />
            선생님께 문의하여 올바른 코드를 받아주세요.
          </ErrorMessage>
          <RetryButton onClick={() => navigate('/exam')}>코드 다시 입력하기</RetryButton>
        </ErrorContent>
      </ErrorContainer>
    );
  }

  // 학생 플로우인데 examInfo가 없으면 초기화 대기
  if (isStudentFlow && !examInfo) {
    return (
      <LoadingContainer>
        <LoadingContent>
          <LoadingSpinner />
          <LoadingText>검사 준비 중...</LoadingText>
        </LoadingContent>
      </LoadingContainer>
    );
  }

  // examInfo가 없으면 렌더링하지 않음 (위에서 모든 케이스 처리됨)
  if (!examInfo) {
    return null;
  }

  // Step별 렌더링
  switch (state.step) {
    case 'auth':
      return (
        <ExamAuthStep
          examName={examInfo.name}
          examCode={code || ''}
          onGuestStart={() => setStep('guest-entry')}
        />
      );

    case 'guest-entry':
      return (
        <GuestExamEntryStep
          examName={examInfo.name}
          onSubmit={handleGuestSubmit}
          onBack={() => setStep('auth')}
          isLoading={isLoading}
        />
      );

    case 'number':
      return (
        <StudentIdEntryStep
          examName={examInfo.name}
          onSubmit={handleStudentIdSubmit}
          isLoading={isLoading}
        />
      );

    case 'student-info':
      return (
        <StudentInfoStep
          examName={examInfo.name}
          initialData={studentInfo || undefined}
          onSubmit={handleStudentInfoSubmit}
          isLoading={isLoading}
        />
      );

    case 'resume-choice':
      return (
        <ResumeChoiceStep
          examName={examInfo.name}
          answeredCount={pendingAnsweredCount}
          totalQuestions={state.totalQuestions}
          onResume={handleResume}
          onRestart={handleRestart}
          isLoading={isLoading}
        />
      );

    case 'guide':
      return (
        <ExamGuideStep
          studentNumber={state.studentNumber || 0}
          onStart={handleStartExam}
          onBack={() => setStep('number')}
          isLoading={isLoading}
        />
      );

    case 'questions':
      return (
        <ExamQuestionStep
          questions={state.questions}
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          answeredCount={state.answeredCount}
          totalQuestions={state.totalQuestions}
          answers={state.answers}
          savingQuestionNo={savingQuestionNo}
          onAnswer={handleAnswer}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onSubmit={handleSubmit}
          isLastPage={state.currentPage === state.totalPages - 1}
          isSubmitting={state.isSubmitting || isLoading}
        />
      );

    case 'complete':
      // 회원/게스트 분기
      if (user && user.memberType !== 'guest') {
        return <MemberCompleteStep userName={user.name} />;
      }
      return (
        <ExamCompleteStep
          studentNumber={state.studentNumber!}
          onSubmitEmail={handleEmailSubmit}
          isSubmitting={isLoading}
        />
      );

    default:
      return null;
  }
};
