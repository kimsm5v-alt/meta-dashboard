import { useState, useCallback } from 'react';
import type { ExamState, ExamStep, ExamQuestion } from '../types';

const initialState: ExamState = {
  step: 'number',
  studentNumber: null,
  dgnssResultId: null,
  currentPage: 0,
  answers: {},
  totalQuestions: 124,
  omrIdx: null,
  isSubmitting: false,
  questions: [],
  totalPages: 7,  // 124 / 20 = 6.2 → 7 페이지
  answeredCount: 0,
};

export function useExamState() {
  const [state, setState] = useState<ExamState>(initialState);

  const setStep = useCallback((step: ExamStep) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const setStudentNumber = useCallback((number: number) => {
    setState(prev => ({ ...prev, studentNumber: number }));
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const setAnswer = useCallback((questionNo: number, answer: string) => {
    setState(prev => {
      const newAnswers = { ...prev.answers, [questionNo]: answer };
      const answeredCount = Object.keys(newAnswers).filter(k => newAnswers[Number(k)] !== '').length;
      return { ...prev, answers: newAnswers, answeredCount };
    });
  }, []);

  const setQuestions = useCallback((questions: ExamQuestion[]) => {
    setState(prev => ({ ...prev, questions }));
  }, []);

  const setOmrIdx = useCallback((omrIdx: number) => {
    setState(prev => ({ ...prev, omrIdx }));
  }, []);

  const setDgnssResultId = useCallback((dgnssResultId: number) => {
    setState(prev => ({ ...prev, dgnssResultId }));
  }, []);

  const setTotalPages = useCallback((totalPages: number) => {
    setState(prev => ({ ...prev, totalPages }));
  }, []);

  const setTotalQuestions = useCallback((totalQuestions: number) => {
    setState(prev => ({ ...prev, totalQuestions }));
  }, []);

  const setIsSubmitting = useCallback((isSubmitting: boolean) => {
    setState(prev => ({ ...prev, isSubmitting }));
  }, []);

  const loadExistingAnswers = useCallback((existingAnswers: Record<number, string>) => {
    setState(prev => {
      const mergedAnswers = { ...prev.answers, ...existingAnswers };
      const answeredCount = Object.keys(mergedAnswers).filter(k => mergedAnswers[Number(k)] !== '').length;
      return { ...prev, answers: mergedAnswers, answeredCount };
    });
  }, []);

  const loadQuestions = useCallback((
    questions: ExamQuestion[],
    totalPages: number,
    totalQuestions: number,
    omrIdx: number
  ) => {
    setState(prev => ({
      ...prev,
      questions,
      // 이미 유효한 값이 설정되어 있으면 유지 (페이지 이동 시 덮어쓰기 방지)
      totalPages: prev.totalPages > 0 && totalPages > 0 ? Math.max(prev.totalPages, totalPages) : totalPages || prev.totalPages,
      totalQuestions: prev.totalQuestions > 0 && totalQuestions > 0 ? Math.max(prev.totalQuestions, totalQuestions) : totalQuestions || prev.totalQuestions,
      omrIdx,
    }));
  }, []);

  const nextPage = useCallback(() => {
    setState(prev => {
      if (prev.currentPage < prev.totalPages - 1) {
        return { ...prev, currentPage: prev.currentPage + 1 };
      }
      return prev;
    });
  }, []);

  const prevPage = useCallback(() => {
    setState(prev => {
      if (prev.currentPage > 0) {
        return { ...prev, currentPage: prev.currentPage - 1 };
      }
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    setStep,
    setStudentNumber,
    setDgnssResultId,
    setCurrentPage,
    setAnswer,
    setQuestions,
    setOmrIdx,
    setTotalPages,
    setTotalQuestions,
    setIsSubmitting,
    loadExistingAnswers,
    loadQuestions,
    nextPage,
    prevPage,
    reset,
  };
}
