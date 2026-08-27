import type { Class } from '@shared/types';

/**
 * HSJ-118: 반 표기를 그룹명으로 통일한다. `Class.name`(그룹관리에서 설정한 그룹명)이
 * 없는 경우에만 `${grade}-${classNumber}반` 조합값으로 폴백한다.
 */
export const getClassDisplayName = (cls: Class): string =>
  cls.name ?? `${cls.grade}-${cls.classNumber}반`;
