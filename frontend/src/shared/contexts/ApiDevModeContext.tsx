/**
 * API 개발자 모드 Context
 *
 * 백엔드 개발자가 화면에서 필요한 API를 확인할 수 있도록
 * 개발자 모드 ON/OFF 상태를 관리합니다.
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

// ============================================================
// 타입 정의
// ============================================================

interface ApiDevModeContextType {
  isApiDevMode: boolean;
  toggleApiDevMode: () => void;
  setApiDevMode: (value: boolean) => void;
}

const ApiDevModeContext = createContext<ApiDevModeContextType | null>(null);

// localStorage 키
const STORAGE_KEY = 'meta_dashboard_api_dev_mode';

// ============================================================
// Provider 컴포넌트
// ============================================================

interface ApiDevModeProviderProps {
  children: ReactNode;
}

export const ApiDevModeProvider: React.FC<ApiDevModeProviderProps> = ({ children }) => {
  const [isApiDevMode, setIsApiDevMode] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const toggleApiDevMode = useCallback(() => {
    setIsApiDevMode((prev) => {
      const newValue = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(newValue));
      } catch {
        // localStorage 접근 실패 시 무시
      }
      return newValue;
    });
  }, []);

  const setApiDevMode = useCallback((value: boolean) => {
    setIsApiDevMode(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // localStorage 접근 실패 시 무시
    }
  }, []);

  const value = useMemo<ApiDevModeContextType>(
    () => ({
      isApiDevMode,
      toggleApiDevMode,
      setApiDevMode,
    }),
    [isApiDevMode, toggleApiDevMode, setApiDevMode],
  );

  return <ApiDevModeContext.Provider value={value}>{children}</ApiDevModeContext.Provider>;
};

// ============================================================
// Hook
// ============================================================

export const useApiDevMode = (): ApiDevModeContextType => {
  const context = useContext(ApiDevModeContext);
  if (!context) {
    throw new Error('useApiDevMode must be used within an ApiDevModeProvider');
  }
  return context;
};
