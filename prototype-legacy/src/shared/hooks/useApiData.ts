/**
 * API 데이터 로드 훅
 *
 * 개별 훅들을 re-export하여 기존 사용처 호환성을 유지합니다.
 *
 * 권장 사용법:
 * - 새 코드: 개별 훅 파일에서 직접 import
 * - 기존 코드: 이 파일에서 import (호환성 유지)
 */

// 개별 훅 re-export
export { useCredentials, type CredentialsResult } from './useCredentials';
export { useStudentAnalysis, type UseStudentAnalysisResult } from './useStudentAnalysis';
export { useClassAnalysis, useClassDetail, type UseClassAnalysisResult, type UseClassDetailResult } from './useClassAnalysis';
export { useClassStudents, type UseClassStudentsResult } from './useClassStudents';
export { useTeacherClasses, type UseTeacherClassesResult } from './useTeacherClasses';
export { useApiConfig, type UseApiConfigResult } from './useApiConfig';
