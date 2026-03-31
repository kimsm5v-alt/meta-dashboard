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
  resetExam,
} from '../services/examService';
import { saveStudentInfo } from '../services/studentInfoService';
import {
  ExamAuthStep,
  StudentInfoStep,
  ResumeChoiceStep,
  ExamGuideStep,
  ExamQuestionStep,
  ExamCompleteStep,
  MemberCompleteStep,
  GuestCompleteStep,
} from '../components';
import type { StudentInfo } from '../components/StudentInfoStep';

interface StudentExamInfo {
  dgnssResultId: number;
  dgnssId: number;
  ordNo: number;
  examName: string;
  resume?: boolean;   // 이어하기 플래그 (안내 페이지 스킵)
  restart?: boolean;  // 새로하기 플래그
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
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // 학생용 검사 정보 (MyExamListPage에서 전달됨)
  const studentExamInfo = (location.state as StudentExamInfo) || null;

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
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

  // QR 코드 검증 또는 학생 검사 정보 처리
  useEffect(() => {
    // 인증 로딩 중에는 대기
    if (authLoading) return;

    const validate = async () => {
      // 학생/게스트용 state-based 검사 시작 (코드 검증 불필요)
      if (studentExamInfo && isAuthenticated && user) {
        setIsValid(true);
        setExamInfo({
          name: studentExamInfo.examName,
          examCode: String(studentExamInfo.dgnssId), // dgnssId를 코드로 사용
          claId: user.classId,
        });
        setIsValidating(false);
        return;
      }

      // state 없이 직접 URL 접근 시 (새로고침 등) → 검사 목록으로 리다이렉트
      if (!studentExamInfo && isAuthenticated && user) {
        const redirectPath = user.memberType === 'guest' ? '/guest/exams' : '/student/exams';
        navigate(redirectPath, { replace: true });
        return;
      }

      // QR 코드 검증 (기존 흐름)
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
  }, [code, navigate, studentExamInfo, isAuthenticated, user, authLoading]);

  // 인증 상태에 따라 초기 step 결정
  useEffect(() => {
    if (isValidating || authLoading || !isValid) return;

    // 학생용 검사 시작 (state 기반 - MyExamListPage에서 전달)
    if (studentExamInfo && isAuthenticated && user?.stdtId) {
      if (state.step === 'auth' || state.step === 'number') {
        // dgnssResultId를 바로 사용하여 검사 시작
        handleStudentExamStart(studentExamInfo);
      }
      return;
    }

    // URL 직접 접속 시: 로그인 여부에 따라 분기
    if (!isAuthenticated) {
      // 비로그인 → auth 단계 (로그인 필요)
      if (state.step !== 'auth') {
        setStep('auth');
      }
    } else {
      // 로그인 완료 → 검사 목록으로 리다이렉트 (검사 선택 필요)
      // 또는 auth 단계에서 로그인 성공 시 검사 목록으로 이동
      if (state.step === 'auth') {
        const redirectPath = user?.memberType === 'guest' ? '/guest/exams' : '/student/exams';
        navigate(redirectPath);
      }
    }
  }, [isAuthenticated, authLoading, isValidating, isValid, state.step, setStep, studentExamInfo, user, navigate]);

  // 학생용 검사 시작 (state 기반)
  const handleStudentExamStart = useCallback(async (info: StudentExamInfo) => {
    setIsLoading(true);
    try {
      setDgnssResultId(info.dgnssResultId);

      // 새로하기인 경우 resetExam 호출
      const result = info.restart
        ? await resetExam(info.dgnssResultId, 0, 20)
        : await fetchQuestions(info.dgnssResultId, 0, 20);

      const existingAnswers: Record<number, string> = {};
      if (!info.restart) {
        result.questions.forEach((q) => {
          if (q.answer) {
            existingAnswers[q.NO] = q.answer;
          }
        });
      }

      loadQuestions(result.questions, result.totalPages, result.totalQuestions, result.omrIdx);
      loadExistingAnswers(existingAnswers);
      setStudentNumber(0);

      // 이어하기인 경우 바로 문항 페이지로 이동 (안내 페이지 스킵)
      if (info.resume) {
        setStep('questions');
        return;
      }

      // answeredCount 저장
      setPendingAnsweredCount(result.answeredCount);

      // 학생 정보 입력 단계로 이동
      setStep('student-info');
    } catch (error) {
      console.error('[ExamPage] 학생 검사 시작 실패:', error);
      alert('검사를 불러올 수 없습니다. 다시 시도해주세요.');
      navigate('/student/exams');
    } finally {
      setIsLoading(false);
    }
  }, [loadQuestions, loadExistingAnswers, setStudentNumber, setDgnssResultId, setStep, navigate]);


  // 학생 정보 입력 완료
  const handleStudentInfoSubmit = useCallback(async (info: StudentInfo) => {
    if (!state.dgnssResultId) {
      console.error('[ExamPage] dgnssResultId가 없습니다');
      return;
    }

    setStudentInfo(info);

    setIsLoading(true);
    try {
      // 학생 정보 저장 (임시로 localStorage, 추후 백엔드 API 연결)
      await saveStudentInfo(state.dgnssResultId, info);
      console.log('[ExamPage] 학생 정보 저장 완료:', info);

      // 이미 로드된 answeredCount 확인
      if (pendingAnsweredCount > 0) {
        setStep('resume-choice');
      } else {
        setStep('guide');
      }
    } catch (error) {
      console.error('[ExamPage] 학생 정보 저장 실패:', error);
      alert('학생 정보 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [state.dgnssResultId, pendingAnsweredCount, setStep]);

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
        />
      );

    case 'student-info':
      return (
        <StudentInfoStep
          examName={examInfo.name}
          initialData={studentInfo || undefined}
          onSubmit={handleStudentInfoSubmit}
          onBack={() => setStep('number')}
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
      // 회원: 바로 완료 화면
      if (user && user.memberType !== 'guest') {
        return (
          <MemberCompleteStep
            userName={user.name}
          />
        );
      }
      // 게스트: PDF 발송 안내 + 회원 전환 유도
      if (user && user.memberType === 'guest') {
        return (
          <GuestCompleteStep
            email={user.email}
            userName={user.name}
          />
        );
      }
      // 비로그인 (QR 코드 직접 응시): 이메일 입력
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
