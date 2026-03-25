/**
 * Mock Data — full_sample_data.json 기반
 *
 * 기존과 동일한 동기 export 인터페이스를 유지하면서,
 * 랜덤 생성 대신 실제 검사 데이터(88명)를 사용.
 *
 * 새 코드에서는 dataService.ts (async API 패턴) 사용 권장.
 */

import type { Teacher, Class, Student } from '@/shared/types';
import rawData from '@/shared/data/full_sample_data.json';
import { transformFullData } from '@/shared/data/dataTransformer';

// 모듈 로드 시 1회 변환
const { classes, teacher: teacherInfo } = transformFullData(rawData);

// 목업 교사
export const MOCK_TEACHER: Teacher = {
  id: teacherInfo.id,
  name: teacherInfo.name,
  classes: classes,
};

// 목업 학급
export const MOCK_CLASSES: Class[] = classes;

// 조회 함수
export const getClassById = (classId: string): Class | undefined =>
  MOCK_CLASSES.find(c => c.id === classId);

export const getStudentById = (classId: string, studentId: string): Student | undefined =>
  getClassById(classId)?.students.find(s => s.id === studentId);

export default { teacher: MOCK_TEACHER, classes: MOCK_CLASSES, getClassById, getStudentById };
