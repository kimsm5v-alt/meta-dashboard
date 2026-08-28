import type { Class } from '@shared/types';

/**
 * HSJ-118: 반 표기를 그룹명으로 통일한다. `Class.name`(그룹관리에서 설정한 그룹명)이
 * 없는 경우에만 `${grade}-${classNumber}반` 조합값으로 폴백한다.
 */
export const getClassDisplayName = (cls: Class): string =>
  cls.name ?? `${cls.grade}-${cls.classNumber}반`;

/**
 * HSJ-121: 결과보기(반/학생) 헤더의 소속 정보 표기.
 * `학교명 · 학교급 N학년 N반` 형태로 조합하되, 학년/반은 값이 있을 때만 표기한다.
 * (예: 비상중학교 · 중등 2학년 1반 / schoolName 없으면 "중등 2학년 1반"만 표기)
 */
export const formatClassLocationLabel = (info: {
  schoolName?: string;
  schoolLevel?: string;
  grade?: number;
  classNumber?: number;
}): string => {
  const classPart = [
    info.schoolLevel,
    info.grade ? `${info.grade}학년` : null,
    info.classNumber ? `${info.classNumber}반` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return [info.schoolName, classPart].filter(Boolean).join(' · ');
};
