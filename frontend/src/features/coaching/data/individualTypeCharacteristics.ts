import { LPA_PROFILE_DATA } from '@shared/data/lpaProfiles';
import type { SchoolLevel, StudentType } from '@shared/types';

export function getIndividualTypeCharacteristics(
  schoolLevel: SchoolLevel,
  type: StudentType,
): string[] {
  const levelData = schoolLevel === '중등' ? LPA_PROFILE_DATA.중등 : LPA_PROFILE_DATA.초등;
  return levelData.types.find((t) => t.name === type)?.characteristics ?? [];
}
