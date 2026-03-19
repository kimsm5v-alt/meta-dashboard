import { useState, useRef, useEffect, useCallback } from 'react';
import type { Class, Student } from '@/shared/types';
import type { ContextMode } from '@/features/ai-room/types';

// ============================================================================
// Hook Interface
// ============================================================================

interface UseContextModeReturn {
  mode: ContextMode;
  setMode: (mode: ContextMode) => void;
  selectedClass: Class | null;
  selectedStudents: Student[];
  setSelectedStudents: (students: Student[] | ((prev: Student[]) => Student[])) => void;
  isClassDropdownOpen: boolean;
  setIsClassDropdownOpen: (open: boolean) => void;
  isStudentModalOpen: boolean;
  setIsStudentModalOpen: (open: boolean) => void;
  classDropdownRef: React.RefObject<HTMLDivElement>;
  handleModeChange: (newMode: ContextMode) => void;
  handleClassSelect: (cls: Class) => void;
  removeStudent: (studentId: string) => void;
  getContextLabel: () => string;
  isPromptDisabled: boolean;
  /** Reset context selections (used when creating a new conversation) */
  resetSelections: () => void;
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
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  const classDropdownRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const handleModeChange = (newMode: ContextMode) => {
    setMode(newMode);
    if (newMode === 'all') {
      setSelectedClass(null);
      setSelectedStudents([]);
    } else if (newMode === 'class') {
      setSelectedStudents([]);
      setIsClassDropdownOpen(true);
    } else if (newMode === 'student') {
      setSelectedClass(null);
      setIsStudentModalOpen(true);
    }
  };

  const handleClassSelect = (cls: Class) => {
    setSelectedClass(cls);
    setIsClassDropdownOpen(false);
  };

  const removeStudent = (studentId: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const resetSelections = () => {
    setMode('all');
    setSelectedClass(null);
    setSelectedStudents([]);
  };

  return {
    mode,
    setMode,
    selectedClass,
    selectedStudents,
    setSelectedStudents,
    isClassDropdownOpen,
    setIsClassDropdownOpen,
    isStudentModalOpen,
    setIsStudentModalOpen,
    classDropdownRef,
    handleModeChange,
    handleClassSelect,
    removeStudent,
    getContextLabel,
    isPromptDisabled,
    resetSelections,
  };
};
