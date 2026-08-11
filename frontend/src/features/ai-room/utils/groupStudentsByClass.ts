import type { Class, Student } from '@shared/types';

export interface StudentClassGroup {
  classId: string;
  className: string;
  students: Student[];
  /** 해당 반의 전체 학생 수(선택된 수가 아니라 반 자체 인원) */
  totalInClass: number;
}

/** 선택된 학생들을 소속 반별로 그룹화 (헤더 요약 칩, 모달 우측 목록에서 공용으로 사용) */
export const groupStudentsByClass = (
  students: Student[],
  classes: Class[],
): StudentClassGroup[] => {
  const groups = new Map<string, StudentClassGroup>();

  for (const student of students) {
    const cls = classes.find((c) => c.id === student.classId);
    const classId = cls?.id ?? student.classId;
    const className = cls ? `${cls.grade}-${cls.classNumber}반` : '기타';

    if (!groups.has(classId)) {
      groups.set(classId, {
        classId,
        className,
        students: [],
        totalInClass: cls?.students.length ?? 0,
      });
    }
    groups.get(classId)!.students.push(student);
  }

  return Array.from(groups.values());
};
