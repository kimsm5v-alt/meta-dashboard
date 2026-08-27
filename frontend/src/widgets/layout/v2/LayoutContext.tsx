import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { useLocation } from 'react-router-dom';

import { useMyGroupsQuery } from '@features/api';
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
  // HSJ-119: "전체" 스코프 미지원 메뉴에서 첫 번째 반을 자동 선택하기 위해 필요.
  // ScopeTree와 동일한 queryKey를 쓰므로(useMyGroupsQuery) 캐시를 공유해 중복 호출되지 않는다.
  const { data: groups = [] } = useMyGroupsQuery();
  const firstClassId = groups[0]?.id;

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
        setScopeMemory((previousMemory) => ({
          ...previousMemory,
          lastClassId: classId,
          lastStudentId: undefined,
          shouldRestoreStudent: false,
        }));
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
          shouldRestoreStudent: false,
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
      firstClassId,
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
  }, [currentMenuConfig, firstClassId, scope, scopeMemory, updateURL, urlScope]);
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
  const context = useOptionalLayoutContext();

  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }

  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOptionalLayoutContext(): LayoutContextValue | null {
  return useContext(LayoutContext);
}
