/**
 * 데이터 중앙 관리 Context
 *
 * 모드별 데이터 관리:
 * - demo: MOCK_CLASSES 샘플 데이터 (읽기 전용)
 * - dev: 빈 상태에서 시작, 업로드된 데이터만 사용
 *
 * localStorage에서 업로드 데이터를 자동 복원하고,
 * 새 데이터 import 시 기존 데이터와 병합.
 */

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import type { Class, Teacher } from '@/shared/types';
import { MOCK_CLASSES, MOCK_TEACHER } from '@/shared/data/mockData';
import { transformFullData } from '@/shared/data/dataTransformer';
import {
  loadUploadedData,
  saveUploadedData,
  clearUploadedData,
  type RawData,
  type UploadMetadata,
} from '@/shared/services/storageService';
import { useAppMode, type AppMode } from './AppModeContext';

// ============================================================
// 타입 정의
// ============================================================

type DataSource = 'mock' | 'uploaded' | 'merged';

interface DataContextType {
  classes: Class[];
  teacher: Teacher;
  getClassById: (classId: string) => Class | undefined;
  getStudentById: (classId: string, studentId: string) => import('@/shared/types').Student | undefined;
  importData: (rawData: RawData, metadata: UploadMetadata) => void;
  resetToDefault: () => void;
  dataSource: DataSource;
  lastUploadedAt: Date | null;
}

const DataContext = createContext<DataContextType | null>(null);

// ============================================================
// 초기 데이터 로드 (모드별 분기)
// ============================================================

/** 빈 교사 데이터 */
const EMPTY_TEACHER: Teacher = {
  id: 'dev-teacher',
  name: '테스트 교사',
  classes: [],
};

/** 모드별 초기 데이터 로드 */
const loadInitialData = (mode: AppMode | null): {
  classes: Class[];
  teacher: Teacher;
  dataSource: DataSource;
  lastUploadedAt: Date | null;
} => {
  // 데모 모드: 샘플 데이터
  if (mode === 'demo') {
    return {
      classes: MOCK_CLASSES,
      teacher: MOCK_TEACHER,
      dataSource: 'mock',
      lastUploadedAt: null,
    };
  }

  // 개발 테스트 모드: localStorage에서 복원 (없으면 빈 상태)
  if (mode === 'dev') {
    const stored = loadUploadedData();
    if (!stored) {
      return {
        classes: [],
        teacher: EMPTY_TEACHER,
        dataSource: 'uploaded',
        lastUploadedAt: null,
      };
    }

    try {
      const { classes: uploadedClasses, teacher: uploadedTeacher } = transformFullData(stored.rawData);
      return {
        classes: uploadedClasses,
        teacher: { ...EMPTY_TEACHER, name: uploadedTeacher.name, classes: uploadedClasses },
        dataSource: 'uploaded',
        lastUploadedAt: new Date(stored.uploadedAt),
      };
    } catch {
      clearUploadedData();
      return {
        classes: [],
        teacher: EMPTY_TEACHER,
        dataSource: 'uploaded',
        lastUploadedAt: null,
      };
    }
  }

  // 모드 미선택: 기본 샘플 데이터
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
  const uploadedMap = new Map(uploaded.map(c => [c.id, c]));
  const merged = base.map(c => uploadedMap.get(c.id) ?? c);

  // 기존에 없는 새로운 클래스 추가
  for (const uc of uploaded) {
    if (!base.some(c => c.id === uc.id)) {
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
  const { mode, isDemo } = useAppMode();
  const [state, setState] = useState(() => loadInitialData(mode));

  // 모드 변경 시 데이터 재로드
  useEffect(() => {
    setState(loadInitialData(mode));
  }, [mode]);

  const getClassById = useCallback(
    (classId: string) => state.classes.find(c => c.id === classId),
    [state.classes],
  );

  const getStudentById = useCallback(
    (classId: string, studentId: string) =>
      state.classes.find(c => c.id === classId)?.students.find(s => s.id === studentId),
    [state.classes],
  );

  const importData = useCallback((rawData: RawData, metadata: UploadMetadata) => {
    const { classes: uploadedClasses, teacher: uploadedTeacher } = transformFullData(rawData);

    // 개발 모드에서만 저장
    if (!isDemo) {
      saveUploadedData(rawData, metadata);
    }

    setState(prev => {
      // 데모 모드: 샘플 데이터와 병합
      // 개발 모드: 업로드 데이터만 사용
      const newClasses = isDemo
        ? mergeClasses(prev.classes, uploadedClasses)
        : uploadedClasses;

      return {
        classes: newClasses,
        teacher: { ...prev.teacher, name: uploadedTeacher.name, classes: newClasses },
        dataSource: isDemo ? 'merged' : 'uploaded',
        lastUploadedAt: new Date(),
      };
    });
  }, [isDemo]);

  const resetToDefault = useCallback(() => {
    if (!isDemo) {
      clearUploadedData();
    }
    setState(loadInitialData(mode));
  }, [isDemo, mode]);

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
