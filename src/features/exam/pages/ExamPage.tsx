import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useExamState } from '../hooks/useExamState';
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
  ResumeChoiceStep,
  ExamGuideStep,
  ExamQuestionStep,
  ExamCompleteStep,
} from '../components';

interface ExamInfo {
  name: string;
  examCode: string;  // 항상 숫자 코드
  claId?: string;    // API 모드에서 사용
}

export const ExamPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingQuestionNo, setSavingQuestionNo] = useState<number | null>(null);
  const [pendingAnsweredCount, setPendingAnsweredCount] = useState(0);

  const {
    state,
    setStep,
    setStudentNumber,
    setDgnssResultId,
    setAnswer,
    loadQuestions,
    loadExistingAnswers,
    nextPage,
    prevPage,
  } = useExamState();

  // QR 코드 검증
  // 형식: 4자리 숫자 코드 (내부적으로 claId 매핑)
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

  // 학생 ID 입력 후 dgnssResultId 조회 및 문항 로드
  const handleStudentIdSubmit = useCallback(async (stdtId: string) => {
    if (!examInfo) return;

    setIsLoading(true);
    try {
      // 학생 ID로 검사 정보 조회 (/stnt/list API)
      // API 모드: claId 사용, Mock 모드: 숫자 코드 사용
      const claIdOrCode = examInfo.claId || examInfo.examCode;
      const examResult = await getStudentExamInfo(claIdOrCode, stdtId);
      if (!examResult) {
        throw new Error('진행 중인 검사가 없습니다.');
      }

      const { dgnssResultId } = examResult;
      setDgnssResultId(dgnssResultId);

      // 문항 로드
      const result = await fetchQuestions(dgnssResultId, 0, 20);

      // 기존 답변 로드
      const existingAnswers: Record<number, string> = {};
      result.questions.forEach((q) => {
        if (q.answer) {
          existingAnswers[q.NO] = q.answer;
        }
      });

      loadQuestions(result.questions, result.totalPages, result.totalQuestions, result.omrIdx);
      loadExistingAnswers(existingAnswers);

      // stdtId에서 번호 추출 (예: engreal51-s3 → 3)
      const numberMatch = stdtId.match(/s(\d+)$/);
      const studentNumber = numberMatch ? parseInt(numberMatch[1], 10) : 0;
      setStudentNumber(studentNumber);

      // 기존 응답이 있으면 이어하기/새로하기 선택 화면으로
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

  // 이어하기: 기존 응답 유지하고 검사 계속
  const handleResume = useCallback(() => {
    setStep('guide');
  }, [setStep]);

  // 새로하기: 기존 응답 초기화
  const handleRestart = useCallback(async () => {
    if (!state.dgnssResultId) return;

    setIsLoading(true);
    try {
      // 답변 초기화 API 호출
      const result = await resetExam(state.dgnssResultId, 0, 20);

      // 초기화된 문항 로드
      loadQuestions(result.questions, result.totalPages, result.totalQuestions, result.omrIdx);
      loadExistingAnswers({});
      setPendingAnsweredCount(0);
      setStep('guide');
    } finally {
      setIsLoading(false);
    }
  }, [state.dgnssResultId, loadQuestions, loadExistingAnswers, setStep]);

  // 검사 시작 (안내 → 문항)
  const handleStartExam = useCallback(async () => {
    if (!state.dgnssResultId) return;

    setIsLoading(true);
    try {
      // 첫 페이지 문항 로드
      const result = await fetchQuestions(state.dgnssResultId, 0, 20);
      loadQuestions(result.questions, result.totalPages, result.totalQuestions, result.omrIdx);

      // 기존 답변 로드
      const existingAnswers: Record<number, string> = {};
      result.questions.forEach((q) => {
        if (q.answer) {
          existingAnswers[q.NO] = q.answer;
        }
      });
      loadExistingAnswers(existingAnswers);

      setStep('questions');
    } finally {
      setIsLoading(false);
    }
  }, [state.dgnssResultId, loadQuestions, loadExistingAnswers, setStep]);

  // 답변 저장
  const handleAnswer = useCallback(async (questionNo: number, answer: string) => {
    if (!state.omrIdx) return;

    // 즉시 UI 업데이트
    setAnswer(questionNo, answer);

    // API 저장
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

      // 기존 답변 병합
      const existingAnswers: Record<number, string> = { ...state.answers };
      result.questions.forEach((q) => {
        if (q.answer) {
          existingAnswers[q.NO] = q.answer;
        }
      });
      loadExistingAnswers(existingAnswers);

      nextPage();
      window.scrollTo(0, 0);
    } finally {
      setIsLoading(false);
    }
  }, [state, loadQuestions, loadExistingAnswers, nextPage]);

  // 이전 페이지
  const handlePrevPage = useCallback(async () => {
    if (!state.dgnssResultId) return;

    const prevPageIndex = state.currentPage - 1;
    if (prevPageIndex < 0) return;

    setIsLoading(true);
    try {
      const result = await fetchQuestions(state.dgnssResultId, prevPageIndex, 20);
      loadQuestions(result.questions, result.totalPages, result.totalQuestions, result.omrIdx);

      prevPage();
      window.scrollTo(0, 0);
    } finally {
      setIsLoading(false);
    }
  }, [state.dgnssResultId, state.currentPage, loadQuestions, prevPage]);

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

  // 이메일 제출 (현재는 제출 완료 상태에서만 호출)
  const handleEmailSubmit = useCallback(async (_email: string) => {
    // TODO: 이메일 전송 API 구현 필요
    setIsLoading(true);
    try {
      // 이메일 전송 로직
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 로딩 화면
  if (isValidating) {
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
      return (
        <ExamQuestionStep
          questions={state.questions}
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          answeredCount={Object.keys(state.answers).length}
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
