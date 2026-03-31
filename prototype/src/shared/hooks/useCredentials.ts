/**
 * 인증 정보 헬퍼 훅
 *
 * AuthContext에서 credentials를 가져와 편리하게 사용할 수 있도록 변환합니다.
 */

import { useAuth } from '@/features/auth';
import type { SchoolLevel } from '@/shared/types';

export interface CredentialsResult {
  tcId: string;
  claId: string;
  gradeLevel: string;
  schoolLevel: SchoolLevel;
  hasCredentials: boolean;
}

/**
 * 인증 정보에서 교사/학급 정보 추출
 */
export function useCredentials(): CredentialsResult {
  const { credentials } = useAuth();

  const tcId = credentials?.teacherId ?? '';
  const claId = credentials?.classId ?? '';
  const gradeLevel = credentials?.gradeLevel ?? 'mi';
  const schoolLevel: SchoolLevel = gradeLevel === 'el' ? '초등' : '중등';

  return { tcId, claId, gradeLevel, schoolLevel, hasCredentials: !!credentials };
}
