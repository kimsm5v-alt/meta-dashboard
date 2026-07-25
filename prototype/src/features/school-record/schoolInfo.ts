/**
 * 학교 정보 (mock) — 검사 탭 헤더 표기와 동일 규격
 * @see shared/components/StudentHeader.tsx, features/assessment
 */
export const SCHOOL_INFO = {
  schoolName: '한빛중학교',
  eduLevel: '중학교',
};

/** "2-3반" → "한빛중학교 · 중학교 2학년 3반" */
export const classSubtitle = (className: string): string => {
  const [grade, cls] = className.replace('반', '').split('-');
  return `${SCHOOL_INFO.schoolName} · ${SCHOOL_INFO.eduLevel} ${grade}학년 ${cls}반`;
};
