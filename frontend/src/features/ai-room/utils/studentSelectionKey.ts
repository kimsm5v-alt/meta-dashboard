import type { Student } from '@shared/types';

/**
 * 학생 ID는 학급 안에서만 유일할 수 있으므로 대상 선택에서는 학급 ID와 함께 비교한다.
 */
export const getStudentSelectionKey = (student: Pick<Student, 'classId' | 'id'>): string =>
  `${student.classId}:${student.id}`;
