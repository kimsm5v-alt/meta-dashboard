/**
 * 앱 모드 Context
 *
 * 데모 모드 / 개발 테스트 모드 전환 관리
 * - demo: 샘플 데이터 (읽기 전용)
 * - dev: 빈 상태 시작, localStorage에 누적 저장
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

// ============================================================
// 타입 정의
// ============================================================

export type AppMode = 'demo' | 'dev';

interface AppModeContextType {
  mode: AppMode | null;
  setMode: (mode: AppMode) => void;
  clearMode: () => void;
  isDemo: boolean;
  isDev: boolean;
}

const AppModeContext = createContext<AppModeContextType | null>(null);

// ============================================================
// 상수
// ============================================================

const STORAGE_KEY = 'meta_dashboard_app_mode';

// ============================================================
// Provider
// ============================================================

interface AppModeProviderProps {
  children: ReactNode;
}

export const AppModeProvider: React.FC<AppModeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'demo' || stored === 'dev' ? stored : null;
  });

  const setMode = useCallback((newMode: AppMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);
    setModeState(newMode);
  }, []);

  const clearMode = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setModeState(null);
  }, []);

  const value = useMemo<AppModeContextType>(
    () => ({
      mode,
      setMode,
      clearMode,
      isDemo: mode === 'demo',
      isDev: mode === 'dev',
    }),
    [mode, setMode, clearMode]
  );

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
};

// ============================================================
// Hook
// ============================================================

export const useAppMode = (): AppModeContextType => {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
};
