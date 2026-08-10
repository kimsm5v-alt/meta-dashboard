import { useState, useCallback } from 'react';
import type { Class, Student } from '@shared/types';
import type { ContextMode } from '@features/ai-room/types';
import { getStudentSelectionKey } from '@features/ai-room/utils/studentSelectionKey';

// ============================================================================
// Hook Interface
// ============================================================================

interface UseContextModeReturn {
  mode: ContextMode;
  selectedClass: Class | null;
  selectedStudents: Student[];
  isStudentModalOpen: boolean;
  setIsStudentModalOpen: (open: boolean) => void;
  getContextLabel: () => string;
  isPromptDisabled: boolean;
  /** Reset context selections (used when creating a new conversation) */
  resetSelections: () => void;
  /** 대화 전환 시 해당 대화의 선택 상태(모드/반/학생)를 모달 없이 복원 */
  restoreSelections: (mode: ContextMode, cls: Class | null, students: Student[]) => void;
  /**
   * TargetPicker(다중 학급 대상 선택)의 선택 결과를 기존 mode/selectedClass/selectedStudents
   * 계약으로 변환한다. contextBuilder.ts는 이 세 값만 알고 있으므로 여기서 흡수한다.
   * - 전체 학급의 전 학생이 선택됨 → mode:'all'
   * - 정확히 한 반의 전 학생만 선택됨 → mode:'class', selectedClass=그 반
   * - 그 외(여러 반 걸친 부분/개별 선택) → mode:'student', selectedStudents=평탄화 목록
   */
  applyTargetSelection: (students: Student[], allClasses: Class[]) => void;
  /** 헤더 요약 칩의 ✕ — 해당 반 학생 전체를 선택에서 제거 */
  removeClassSelection: (classId: string) => void;
}

// ============================================================================
// Hook
// ============================================================================

export const useContextMode = (): UseContextModeReturn => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [mode, setMode] = useState<ContextMode>('all');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------
  const getContextLabel = useCallback((): string => {
    if (mode === 'all') return '전체';
    if (mode === 'class' && selectedClass)
      return `${selectedClass.grade}-${selectedClass.classNumber}반`;
    if (mode === 'student' && selectedStudents.length > 0) {
      return selectedStudents.length === 1
        ? selectedStudents[0].name
        : `학생 ${selectedStudents.length}명`;
    }
    return '전체';
  }, [mode, selectedClass, selectedStudents]);

  const isPromptDisabled =
    (mode === 'class' && !selectedClass) || (mode === 'student' && selectedStudents.length === 0);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const resetSelections = () => {
    setMode('all');
    setSelectedClass(null);
    setSelectedStudents([]);
  };

  // TargetPicker를 열지 않고 상태만 복원한다 (대화 전환 시)
  const restoreSelections = (newMode: ContextMode, cls: Class | null, students: Student[]) => {
    setMode(newMode);
    setSelectedClass(cls);
    setSelectedStudents(students);
  };

  const applyTargetSelection = (students: Student[], allClasses: Class[]) => {
    const allStudentsFlat = allClasses.flatMap((c) => c.students);
    const selectedKeys = new Set(students.map(getStudentSelectionKey));

    const isEverySelected =
      allStudentsFlat.length > 0 &&
      allStudentsFlat.every((student) => selectedKeys.has(getStudentSelectionKey(student)));
    if (isEverySelected) {
      setMode('all');
      setSelectedClass(null);
      // mode='all'은 대상 미선택 기본값으로도 쓰인다. 사용자가 전체 학급을
      // 명시적으로 선택한 경우에는 학생 목록을 보존해 두 상태를 구분한다.
      setSelectedStudents(allStudentsFlat);
      return;
    }

    const wholeClassMatch = allClasses.find(
      (cls) =>
        cls.students.length > 0 &&
        cls.students.length === students.length &&
        cls.students.every((student) => selectedKeys.has(getStudentSelectionKey(student))),
    );
    if (wholeClassMatch) {
      setMode('class');
      setSelectedClass(wholeClassMatch);
      setSelectedStudents([]);
      return;
    }

    setMode('student');
    setSelectedClass(null);
    setSelectedStudents(students);
  };

  const removeClassSelection = (classId: string) => {
    if (mode === 'class' && selectedClass?.id === classId) {
      setMode('all');
      setSelectedClass(null);
      setSelectedStudents([]);
      return;
    }
    const next = selectedStudents.filter((s) => s.classId !== classId);
    setMode(next.length > 0 ? 'student' : 'all');
    setSelectedClass(null);
    setSelectedStudents(next);
  };

  return {
    mode,
    selectedClass,
    selectedStudents,
    isStudentModalOpen,
    setIsStudentModalOpen,
    getContextLabel,
    isPromptDisabled,
    resetSelections,
    restoreSelections,
    applyTargetSelection,
    removeClassSelection,
  };
};
