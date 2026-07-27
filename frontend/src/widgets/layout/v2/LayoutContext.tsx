import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { useLocation } from 'react-router-dom';

import {
  adjustScopeForMenu,
  getMenuKeyFromPath,
  getMenuScopeConfig,
  INITIAL_SCOPE,
  INITIAL_SCOPE_MEMORY,
  isScopeEqual,
  isScopeMemoryEqual,
  useScopeSync,
} from '@shared/scope';
import type { MenuScopeConfig, Scope, ScopeMemory } from '@shared/scope';

export interface LayoutContextValue {
  scope: Scope;
  currentMenuConfig: MenuScopeConfig;
  setScope: (scope: Scope) => void;
  selectAll: () => void;
  selectClass: (classId: string) => void;
  selectStudent: (classId: string, studentId: string) => void;
  expandedClassId: string | null;
  setExpandedClassId: (id: string | null) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { urlScope, updateURL } = useScopeSync();

  const [scope, setScopeState] = useState<Scope>(INITIAL_SCOPE);
  const [scopeMemory, setScopeMemory] = useState<ScopeMemory>(INITIAL_SCOPE_MEMORY);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const currentMenuKey = useMemo(() => getMenuKeyFromPath(location.pathname), [location.pathname]);
  const currentMenuConfig = useMemo(() => getMenuScopeConfig(currentMenuKey), [currentMenuKey]);

  const setScope = useCallback(
    (newScope: Scope) => {
      if (!isScopeEqual(newScope, scope)) {
        updateURL(newScope);
      }
    },
    [scope, updateURL],
  );

  const selectAll = useCallback(() => {
    setScope({ level: 'all' });
    setExpandedClassId(null);
  }, [setScope]);

  const selectClass = useCallback(
    (classId: string) => {
      if (currentMenuConfig.class) {
        setScope({ level: 'class', classId });
      }
    },
    [currentMenuConfig.class, setScope],
  );

  const selectStudent = useCallback(
    (classId: string, studentId: string) => {
      if (currentMenuConfig.student) {
        setScope({ level: 'student', classId, studentId });
        setScopeMemory((previousMemory) => ({
          ...previousMemory,
          lastStudentId: studentId,
          lastClassId: classId,
        }));
      }
    },
    [currentMenuConfig.student, setScope],
  );

  /* eslint-disable react-hooks/set-state-in-effect -- URL and pathname are external router state
     that must synchronize the provider state. */
  useEffect(() => {
    const { adjustedScope, updatedMemory } = adjustScopeForMenu(
      urlScope,
      currentMenuConfig,
      scopeMemory,
    );

    if (!isScopeEqual(adjustedScope, scope)) {
      setScopeState(adjustedScope);
    }
    if (!isScopeMemoryEqual(updatedMemory, scopeMemory)) {
      setScopeMemory(updatedMemory);
    }
    if (!isScopeEqual(adjustedScope, urlScope)) {
      updateURL(adjustedScope);
    }

    if (adjustedScope.classId && currentMenuConfig.student) {
      setExpandedClassId(adjustedScope.classId);
    } else if (!currentMenuConfig.student) {
      setExpandedClassId(null);
    }
  }, [currentMenuConfig, scope, scopeMemory, updateURL, urlScope]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const contextValue = useMemo<LayoutContextValue>(
    () => ({
      scope,
      currentMenuConfig,
      setScope,
      selectAll,
      selectClass,
      selectStudent,
      expandedClassId,
      setExpandedClassId,
    }),
    [scope, currentMenuConfig, setScope, selectAll, selectClass, selectStudent, expandedClassId],
  );

  return <LayoutContext.Provider value={contextValue}>{children}</LayoutContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useLayoutContext(): LayoutContextValue {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }

  return context;
}
