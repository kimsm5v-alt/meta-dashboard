import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useExamState } from '../hooks/useExamState';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  validateExamCode,
  fetchQuestions,
  saveAnswer,
  submitExam,
  getStudentExamInfo,
  resetExam,
} from '../services/examService';
import {
  StudentIdEntryStep,
  ExamAuthStep,
  GuestExamEntryStep,
  ResumeChoiceStep,
  ExamGuideStep,
  ExamQuestionStep,
  ExamCompleteStep,
  GuestCompleteStep,
} from '../components';

interface GuestInfo {
  isGuest: boolean;
  nickname: string;
  email: string;
}

interface ExamInfo {
  name: string;
  examCode: string;  // 항상 숫자 코드
  claId?: string;    // API 모드에서 사용
}

export const ExamPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // 게스트 정보 (ExamCodeEntryPage에서 전달됨)
  const guestInfo = (location.state as GuestInfo) || null;

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingQuestionNo, setSavingQuestionNo] = useState<number | null>(null);
  const [pendingAnsweredCount, setPendingAnsweredCount] = useState(0);
  const [isRestartMode, setIsRestartMode] = useState(false);

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

  // QR 코드 검증
  useEffect(() => {
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
  }, [code, navigate]);

  // 인증 상태에 따라 초기 step 결정
  useEffect(() => {
    if (isValidating || authLoading || !isValid) return;

    // 게스트 정보가 있으면 바로 검사 시작
    if (guestInfo?.isGuest) {
      if (state.step === 'auth' || state.step === 'guest-entry') {
        // 게스트 정보로 검사 시작
        handleGuestStart(guestInfo.nickname, guestInfo.email);
      }
      return;
    }

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
  }, [isAuthenticated, authLoading, isValidating, isValid, state.step, setStep, guestInfo]);

  // 게스트 검사 시작 (닉네임 + 이메일)
  const handleGuestStart = useCallback(async (nickname: string, _email: string) => {
    if (!examInfo) return;

    setIsLoading(true);
    try {
      const claIdOrCode = examInfo.claId || examInfo.examCode;
      // TODO: 게스트 전용 API 호출로 교체 (닉네임 + 이메일 기반)
      const stdtId = `guest-${nickname}`;
      const examResult = await getStudentExamInfo(claIdOrCode, stdtId);
      if (!examResult) {
        throw new Error('진행 중인 검사가 없습니다. 선생님께 문의하세요.');
      }

      const { dgnssResultId } = examResult;
      setDgnssResultId(dgnssResultId);

      const result = await fetchQuestions(dgnssResultId, 0, 20);

      const existingAnswers: Record<number, string> = {};
      result.questions.forEach((q) => {
        if (q.answer) {
          existingAnswers[q.NO] = q.answer;
        }
      });

      loadQuestions(result.questions, result.totalPages, result.totalQuestions, result.omrIdx);
      loadExistingAnswers(existingAnswers);
      setStudentNumber(0);

      if (result.answeredCount > 0) {
        setPendingAnsweredCount(result.answeredCount);
        setStep('resume-choice');
      } else {
        setStep('guide');
      }
    } finally {
      setIsLoading(false);
    }
  }, [examInfo, loadQuestions, loadExistingAnswers, setStudentNumber, setDgnssResultId, setStep]);

  // 기존 게스트 진입 단계용 (auth → guest-entry 흐름에서 사용)
  const handleGuestSubmit = useCallback(async (nickname: string) => {
    // 이메일 없이 닉네임만으로 시작 (기존 흐름 유지)
    await handleGuestStart(nickname, '');
  }, [handleGuestStart]);

  // 학생 ID 입력 후 dgnssResultId 조회 및 문항 로드
  const handleStudentIdSubmit = useCallback(async (stdtId: string) => {
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

      const result = await fetchQuestions(dgnssResultId, 0, 20);

      const existingAnswers: Record<number, string> = {};
      result.questions.forEach((q) => {
        if (q.answer) {
          existingAnswers[q.NO] = q.answer;
        }
      });

      loadQuestions(result.questions, result.totalPages, result.totalQuestions, result.omrIdx);
      loadExistingAnswers(existingAnswers);

      const numberMatch = stdtId.match(/s(\d+)$/);
      const studentNumber = numberMatch ? parseInt(numberMatch[1], 10) : 0;
      setStudentNumber(studentNumber);

      if (result.answeredCount > 0) {
        setPendingAnsweredCount(result.answeredCount);
        setStep('resume-choice');
      } else {
        setStep('guide');
      }
    } finally {
      setIsLoading(false);
    }
  }, [examInfo, loadQuestions, loadExistingAnswers, setStudentNumber, setDgnssResultId, setStep]);

  // 이어하기
  const handleResume = useCallback(() => {
    setIsRestartMode(false);
    setStep('guide');
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

      loadQuestions(result.questions, result.totalPages, result.totalQuestions, result.omrIdx);

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
  const handleAnswer = useCallback(async (questionNo: number, answer: string) => {
    if (!state.omrIdx) return;

    setAnswer(questionNo, answer);

    setSavingQuestionNo(questionNo);
    try {
      await saveAnswer(state.omrIdx, questionNo, answer);
    } finally {
      setSavingQuestionNo(null);
    }
  }, [state.omrIdx, setAnswer]);

  // 다음 페이지
  const handleNextPage = useCallback(async () => {
    if (!state.dgnssResultId) return;

    const nextPageIndex = state.currentPage + 1;
    if (nextPageIndex >= state.totalPages) return;

    setIsLoading(true);
    try {
      const result = await fetchQuestions(state.dgnssResultId, nextPageIndex, 20);
      loadQuestions(result.questions, result.totalPages, result.totalQuestions, result.omrIdx);

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
      loadQuestions(result.questions, result.totalPages, result.totalQuestions, result.omrIdx);

      setCurrentPage(prevPageIndex);
      window.scrollTo(0, 0);
    } finally {
      setIsLoading(false);
    }
  }, [state.dgnssResultId, state.currentPage, loadQuestions, setCurrentPage]);

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
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 로딩 화면
  if (isValidating || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">검사 정보를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // 유효하지 않은 코드
  if (!isValid || !examInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">유효하지 않은 검사 코드</h1>
          <p className="text-gray-600 mb-6">
            검사 코드가 올바르지 않거나 만료되었습니다.
            <br />
            선생님께 문의하여 올바른 코드를 받아주세요.
          </p>
          <button
            onClick={() => navigate('/exam')}
            className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            코드 다시 입력하기
          </button>
        </div>
      </div>
    );
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
      // 실제 응답 수 계산 (빈 문자열 제외)
      const actualAnsweredCount = Object.values(state.answers).filter(v => v !== '').length;
      return (
        <ExamQuestionStep
          questions={state.questions}
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          answeredCount={actualAnsweredCount}
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
      // 게스트인 경우 GuestCompleteStep 표시
      if (guestInfo?.isGuest) {
        return (
          <GuestCompleteStep
            email={guestInfo.email}
            nickname={guestInfo.nickname}
            onConvertToMember={() => navigate('/signup', { state: { email: guestInfo.email } })}
            onClose={() => navigate('/')}
          />
        );
      }
      // 로그인 사용자인 경우 기존 ExamCompleteStep 표시
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
