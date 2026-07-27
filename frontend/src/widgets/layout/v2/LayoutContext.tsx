import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import {
  adjustScopeForMenu,
  getMenuKeyFromPath,
  getMenuScopeConfig,
  INITIAL_SCOPE,
  INITIAL_SCOPE_MEMORY,
  isScopeEqual,
  parseScopeFromSearchParams,
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [scope, setScopeState] = useState<Scope>(INITIAL_SCOPE);
  const [scopeMemory, setScopeMemory] = useState<ScopeMemory>(INITIAL_SCOPE_MEMORY);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const currentMenuKey = useMemo(() => getMenuKeyFromPath(location.pathname), [location.pathname]);
  const currentMenuConfig = useMemo(() => getMenuScopeConfig(currentMenuKey), [currentMenuKey]);

  const isSyncingRef = useRef(false);
  const lastScopeRef = useRef<Scope>(scope);
  const lastPathRef = useRef(location.pathname);

  const updateURL = useCallback(
    (newScope: Scope) => {
      const params = new URLSearchParams(searchParams);
      params.delete('class');
      params.delete('student');

      if (newScope.classId) {
        params.set('class', newScope.classId);
      }
      if (newScope.studentId) {
        params.set('student', newScope.studentId);
      }

      if (params.toString() !== searchParams.toString()) {
        isSyncingRef.current = true;
        void setSearchParams(params, { replace: true });
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 0);
      }
    },
    [searchParams, setSearchParams],
  );

  const setScope = useCallback(
    (newScope: Scope) => {
      if (!isScopeEqual(newScope, scope)) {
        setScopeState(newScope);
        lastScopeRef.current = newScope;
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
    if (isSyncingRef.current) return;

    const hasClassParam = searchParams.has('class');
    const hasStudentParam = searchParams.has('student');

    if (hasClassParam || hasStudentParam) {
      const urlScope = parseScopeFromSearchParams(searchParams);

      if (!isScopeEqual(urlScope, lastScopeRef.current)) {
        lastScopeRef.current = urlScope;
        setScopeState(urlScope);

        if (urlScope.classId && currentMenuConfig.student) {
          setExpandedClassId(urlScope.classId);
        }
      }
    }
  }, [currentMenuConfig.student, searchParams]);

  useEffect(() => {
    if (lastPathRef.current === location.pathname) return;
    lastPathRef.current = location.pathname;

    const urlScope = parseScopeFromSearchParams(searchParams);
    const hasUrlParams = searchParams.has('class') || searchParams.has('student');
    const baseScope = hasUrlParams ? urlScope : scope;
    const { adjustedScope, updatedMemory } = adjustScopeForMenu(
      baseScope,
      currentMenuConfig,
      scopeMemory,
    );

    if (hasUrlParams || !isScopeEqual(adjustedScope, scope)) {
      setScopeState(adjustedScope);
      setScopeMemory(updatedMemory);
      lastScopeRef.current = adjustedScope;

      if (!hasUrlParams) {
        updateURL(adjustedScope);
      }
    }

    if (adjustedScope.classId && currentMenuConfig.student) {
      setExpandedClassId(adjustedScope.classId);
    } else if (!currentMenuConfig.student) {
      setExpandedClassId(null);
    }
  }, [currentMenuConfig, location.pathname, scope, scopeMemory, searchParams, updateURL]);
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
