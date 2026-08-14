import type { SchoolLevel } from '@shared/types';
import type { DraftStatus } from '../types';

export type DisplayStatusKey = 'empty' | 'inprogress' | 'done';

export interface DisplayStatusMeta {
  key: DisplayStatusKey;
  label: string;
  action: string;
}

/** 작성 상태 3분류 (미작성 / 작성 중 / 작성 완료) — prototype shared.tsx displayStatus와 동일 매핑 */
export function displayStatus(status: DraftStatus): DisplayStatusMeta {
  switch (status) {
    case 'DRAFT':
    case 'EDITED':
      return { key: 'done', label: '작성 완료', action: '수정' };
    case 'INPUTTING':
    case 'GENERATING':
      return { key: 'inprogress', label: '작성 중', action: '수정' };
    default:
      return { key: 'empty', label: '미작성', action: '작성' };
  }
}

const EDU_LEVEL_LABEL: Record<SchoolLevel, string> = {
  초등: '초등학교',
  중등: '중학교',
  고등: '고등학교',
};

/** "한빛중학교 · 중학교 2학년 3반" 형태. schoolName이 없으면 학교급/학년/반만 표기. */
export function classSubtitle(
  schoolName: string | undefined,
  schoolLevel: SchoolLevel,
  grade: number,
  classNumber: number,
): string {
  const parts = [
    schoolName,
    `${EDU_LEVEL_LABEL[schoolLevel]} ${grade}학년 ${classNumber}반`,
  ].filter((part): part is string => Boolean(part));
  return parts.join(' · ');
}
