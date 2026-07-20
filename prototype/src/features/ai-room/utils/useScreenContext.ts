import { useLocation } from 'react-router-dom';
import { SCREEN_LABELS, resolveScreenQuestions } from '../data/screenQuestions';
import type { SuggestedQuestion } from '../types';

/** 라우트 경로 → screenKey */
export const pathToScreenKey = (pathname: string): string => {
  if (pathname.startsWith('/home')) return 'home';
  if (pathname.startsWith('/exam/management')) return 'exam-management';
  if (pathname.startsWith('/exam/result')) return 'exam-result';
  if (pathname.startsWith('/exam/counseling')) return 'exam-counseling';
  if (pathname.startsWith('/exam/tracking')) return 'exam-tracking';
  if (pathname.startsWith('/coaching/class')) return 'coaching-class';
  if (pathname.startsWith('/coaching/individual')) return 'coaching-individual';
  if (pathname.startsWith('/lesson')) return 'lesson';
  return 'home';
};

export interface ScreenContext {
  screenKey: string;
  screenLabel: string;
  questions: SuggestedQuestion[];
}

/**
 * 현재 화면(라우트) 컨텍스트 + 화면별 추천 질문
 * @param hasStudent LNB에서 학생이 선택되었는지 (결과보기·학생상담의 학생 단위 질문 노출용)
 */
export function useScreenContext(hasStudent = false): ScreenContext {
  const { pathname } = useLocation();
  const screenKey = pathToScreenKey(pathname);
  return {
    screenKey,
    screenLabel: SCREEN_LABELS[screenKey] ?? '홈',
    questions: resolveScreenQuestions(screenKey, hasStudent),
  };
}
