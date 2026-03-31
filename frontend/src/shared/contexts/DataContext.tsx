/**
 * 데이터 중앙 관리 Context
 *
 * 샘플 데이터(MOCK_CLASSES)를 기본으로 사용하고,
 * 새 데이터 import 시 기존 데이터와 병합.
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Class, Teacher } from '@shared/types';
import { MOCK_CLASSES, MOCK_TEACHER } from '@shared/data/mockData';
import { transformFullData } from '@shared/data/dataTransformer';
import {
  saveUploadedData,
  type RawData,
  type UploadMetadata,
} from '@shared/services/storageService';

// ============================================================
// 타입 정의
// ============================================================

type DataSource = 'mock' | 'uploaded' | 'merged';

interface DataContextType {
  classes: Class[];
  teacher: Teacher;
  getClassById: (classId: string) => Class | undefined;
  getStudentById: (
    classId: string,
    studentId: string,
  ) => import('@shared/types').Student | undefined;
  importData: (rawData: RawData, metadata: UploadMetadata) => void;
  resetToDefault: () => void;
  dataSource: DataSource;
  lastUploadedAt: Date | null;
}

const DataContext = createContext<DataContextType | null>(null);

// ============================================================
// 초기 데이터 로드
// ============================================================

/** 초기 데이터 로드 - 항상 샘플 데이터 사용 */
const loadInitialData = (): {
  classes: Class[];
  teacher: Teacher;
  dataSource: DataSource;
  lastUploadedAt: Date | null;
} => {
  return {
    classes: MOCK_CLASSES,
    teacher: MOCK_TEACHER,
    dataSource: 'mock',
    lastUploadedAt: null,
  };
};

/**
 * 기존 클래스 목록과 업로드된 클래스 병합
 * - 동일 classId: 업로드 데이터로 교체
 * - 새 classId: 추가
 */
const mergeClasses = (base: Class[], uploaded: Class[]): Class[] => {
  const uploadedMap = new Map(uploaded.map((c) => [c.id, c]));
  const merged = base.map((c) => uploadedMap.get(c.id) ?? c);

  // 기존에 없는 새로운 클래스 추가
  for (const uc of uploaded) {
    if (!base.some((c) => c.id === uc.id)) {
      merged.push(uc);
    }
  }

  return merged.sort((a, b) => a.grade - b.grade || a.classNumber - b.classNumber);
};

// ============================================================
// Provider 컴포넌트
// ============================================================

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [state, setState] = useState(() => loadInitialData());

  const getClassById = useCallback(
    (classId: string) => state.classes.find((c) => c.id === classId),
    [state.classes],
  );

  const getStudentById = useCallback(
    (classId: string, studentId: string) =>
      state.classes.find((c) => c.id === classId)?.students.find((s) => s.id === studentId),
    [state.classes],
  );

  const importData = useCallback((rawData: RawData, metadata: UploadMetadata) => {
    const { classes: uploadedClasses, teacher: uploadedTeacher } = transformFullData(rawData);

    // localStorage에 저장
    saveUploadedData(rawData, metadata);

    setState((prev) => {
      // 샘플 데이터와 병합
      const newClasses = mergeClasses(prev.classes, uploadedClasses);

      return {
        classes: newClasses,
        teacher: { ...prev.teacher, name: uploadedTeacher.name, classes: newClasses },
        dataSource: 'merged',
        lastUploadedAt: new Date(),
      };
    });
  }, []);

  const resetToDefault = useCallback(() => {
    setState(loadInitialData());
  }, []);

  const value = useMemo<DataContextType>(
    () => ({
      classes: state.classes,
      teacher: state.teacher,
      getClassById,
      getStudentById,
      importData,
      resetToDefault,
      dataSource: state.dataSource,
      lastUploadedAt: state.lastUploadedAt,
    }),
    [state, getClassById, getStudentById, importData, resetToDefault],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// ============================================================
// Hook
// ============================================================

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
