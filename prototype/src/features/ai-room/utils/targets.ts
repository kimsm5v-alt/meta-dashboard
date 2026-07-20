import { MOCK_CLASSES } from '../data/mockClasses';
import type { TargetSelection } from '../components/TargetPicker';

export const emptySelection = (classId = MOCK_CLASSES[0].id): TargetSelection => ({
  classId,
  studentIds: [],
  wholeClass: false,
});

export const getClass = (classId: string) => MOCK_CLASSES.find((c) => c.id === classId) ?? MOCK_CLASSES[0];

export const getSelectedStudents = (sel: TargetSelection) =>
  getClass(sel.classId).students.filter((s) => sel.studentIds.includes(s.id));

/** 선택 상태 → 대상 표기 문자열 (예: '6학년 1반 전체', '고우진, 김서연') */
export const targetLabel = (sel: TargetSelection): string => {
  const cls = getClass(sel.classId);
  if (sel.wholeClass) return `${cls.name} 전체`;
  const names = getSelectedStudents(sel).map((s) => s.name);
  return names.join(', ');
};

/** 선택 여부 */
export const hasTarget = (sel: TargetSelection): boolean => sel.wholeClass || sel.studentIds.length > 0;

/** 삭제 가능한 칩 목록 */
export interface TargetChip {
  key: string;
  label: string;
  /** whole class 칩이면 studentId 없음 */
  studentId?: string;
}

export const targetChips = (sel: TargetSelection): TargetChip[] => {
  const cls = getClass(sel.classId);
  if (sel.wholeClass) return [{ key: 'whole', label: `${cls.name} 전체` }];
  return getSelectedStudents(sel).map((s) => ({ key: s.id, label: s.name, studentId: s.id }));
};
