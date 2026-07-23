import { MOCK_CLASSES } from '../data/mockClasses';
import type { TargetSelection } from '../components/TargetPicker';
import type { StudentItem } from '../types';

/** 대상 선택: 학급 id → 선택된 학생 id 목록 (다중 학급 지원) */
export const emptySelection = (): TargetSelection => ({ byClass: {} });

export const getClass = (classId: string) => MOCK_CLASSES.find((c) => c.id === classId) ?? MOCK_CLASSES[0];

/** 해당 학급이 전원 선택되었는지 */
export const isWholeClass = (classId: string, ids: string[]): boolean => {
  const cls = getClass(classId);
  return ids.length > 0 && ids.length === cls.students.length;
};

export interface SelectedStudent extends StudentItem {
  classId: string;
  className: string;
}

/** 선택된 전체 학생 (학급 교차 평탄화) */
export const getSelectedStudents = (sel: TargetSelection): SelectedStudent[] => {
  const out: SelectedStudent[] = [];
  Object.entries(sel.byClass).forEach(([classId, ids]) => {
    const cls = getClass(classId);
    cls.students.forEach((s) => {
      if (ids.includes(s.id)) out.push({ ...s, classId, className: cls.name });
    });
  });
  return out;
};

export const hasTarget = (sel: TargetSelection): boolean =>
  Object.values(sel.byClass).some((ids) => ids.length > 0);

/** 삭제 가능한 칩 (학급 단위 요약) */
export interface TargetChip {
  key: string;
  label: string;
  classId: string;
}

export const targetChips = (sel: TargetSelection): TargetChip[] => {
  const chips: TargetChip[] = [];
  Object.entries(sel.byClass).forEach(([classId, ids]) => {
    if (!ids.length) return;
    const cls = getClass(classId);
    const label = isWholeClass(classId, ids) ? `${cls.name} 전체` : `${cls.name} ${ids.length}명`;
    chips.push({ key: classId, label, classId });
  });
  return chips;
};

/** 대상 표기 문자열 */
export const targetLabel = (sel: TargetSelection): string => targetChips(sel).map((c) => c.label).join(', ');
