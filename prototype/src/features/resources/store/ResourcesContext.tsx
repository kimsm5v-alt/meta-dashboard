/**
 * 수업 자료실 상태 저장소.
 * 목업의 전역 `nav` 상태 + MY 배열 직접 변이 + render() 를 React 로 승격.
 * 스코프(전체/반)는 LayoutV2 에서 파생해 함께 제공한다.
 */
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLayoutContext } from '@/app/LayoutV2';
import { MY } from '../mock-data';
import { scopeFromClass } from '../utils/format';
import type { MyLesson, ReportStatus, Scope } from '../types';

// ============================================
// 상태 · 액션
// ============================================

/** GNB 2depth 3분할: 수업 자료실 / 나의 자료 / 수업 결과보기 */
export type LessonTab = 'library' | 'myData' | 'results';
export type RdTab = 'slide' | 'student';
export type RsFilter = '전체' | ReportStatus;

/** 풀스크린 오버레이 (저작툴·배포·실시간 수업) — Phase 6·7에서 확장 */
export interface OverlayState {
  kind: 'editor' | 'deploy' | 'live';
  contentId?: string | null;
  /** 오버레이를 연 출처 (저작툴→배포 복귀용) */
  from?: 'editor';
}

interface ResourcesState {
  myLessons: MyLesson[];
  activeTab: LessonTab;
  rsFilter: RsFilter;
  rdReport: string | null; // 선택된 리포트 id
  rdTab: RdTab;
  rdStu: string | null;
  rdSlide: number;
  overlay: OverlayState | null;
}

type Action =
  | { type: 'SET_TAB'; tab: LessonTab }
  | { type: 'SET_RS_FILTER'; filter: RsFilter }
  | { type: 'DELETE_MY'; id: string }
  | { type: 'OPEN_REPORT'; id: string; firstStudent: string | null }
  | { type: 'CLOSE_REPORT' }
  | { type: 'SET_RD_TAB'; tab: RdTab }
  | { type: 'SELECT_SLIDE'; index: number }
  | { type: 'SELECT_STUDENT'; name: string }
  | { type: 'RESET_REPORT' } // 스코프 전환 시 상세 이탈 (목업 pickScope)
  | { type: 'OPEN_OVERLAY'; overlay: OverlayState }
  | { type: 'CLOSE_OVERLAY' };

const initialState: ResourcesState = {
  myLessons: MY,
  activeTab: 'library',
  rsFilter: '전체',
  rdReport: null,
  rdTab: 'student',
  rdStu: null,
  rdSlide: 0,
  overlay: null,
};

function reducer(state: ResourcesState, action: Action): ResourcesState {
  switch (action.type) {
    case 'SET_TAB':
      // 탭 전환 시 리포트 상세 닫힘 (기존 SET_ML_VIEW 역할 흡수)
      return { ...state, activeTab: action.tab, rdReport: null };
    case 'SET_RS_FILTER':
      return { ...state, rsFilter: action.filter };
    case 'DELETE_MY':
      return { ...state, myLessons: state.myLessons.filter((x) => x.id !== action.id) };
    case 'OPEN_REPORT':
      return { ...state, rdReport: action.id, rdTab: 'student', rdSlide: 0, rdStu: action.firstStudent };
    case 'CLOSE_REPORT':
      return { ...state, rdReport: null };
    case 'SET_RD_TAB':
      return { ...state, rdTab: action.tab };
    case 'SELECT_SLIDE':
      return { ...state, rdSlide: action.index };
    case 'SELECT_STUDENT':
      return { ...state, rdStu: action.name };
    case 'RESET_REPORT':
      return { ...state, rdReport: null };
    case 'OPEN_OVERLAY':
      return { ...state, overlay: action.overlay };
    case 'CLOSE_OVERLAY':
      return { ...state, overlay: null };
    default:
      return state;
  }
}

// ============================================
// Context
// ============================================

interface ResourcesContextValue extends ResourcesState {
  /** LayoutV2 에서 파생된 현재 스코프 ('전체' | 반명) */
  scope: Scope;
  isAll: boolean;
  /** 토스트 (목업 toast() 대체) */
  toastMsg: string | null;
  toast: (msg: string) => void;
  // 액션
  setTab: (tab: LessonTab) => void;
  setRsFilter: (filter: RsFilter) => void;
  deleteMy: (id: string) => void;
  openReport: (id: string, firstStudent: string | null) => void;
  closeReport: () => void;
  setRdTab: (tab: RdTab) => void;
  selectSlide: (index: number) => void;
  selectStudent: (name: string) => void;
  openOverlay: (overlay: OverlayState) => void;
  closeOverlay: () => void;
}

const ResourcesContext = createContext<ResourcesContextValue | null>(null);

export function useResources(): ResourcesContextValue {
  const ctx = useContext(ResourcesContext);
  if (!ctx) throw new Error('useResources must be used within <ResourcesProvider>');
  return ctx;
}

// ============================================
// Provider
// ============================================

export function ResourcesProvider({ children }: { children: ReactNode }) {
  const { selectedClass } = useLayoutContext();
  const scope = scopeFromClass(selectedClass?.name);
  const isAll = scope === '전체';

  const [state, dispatch] = useReducer(reducer, initialState);

  // 스코프 전환 시 리포트 상세에서 이탈 (목업 pickScope)
  useEffect(() => {
    dispatch({ type: 'RESET_REPORT' });
  }, [scope]);

  // 토스트
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1900);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const value = useMemo<ResourcesContextValue>(
    () => ({
      ...state,
      scope,
      isAll,
      toastMsg,
      toast,
      setTab: (tab) => dispatch({ type: 'SET_TAB', tab }),
      setRsFilter: (filter) => dispatch({ type: 'SET_RS_FILTER', filter }),
      deleteMy: (id) => dispatch({ type: 'DELETE_MY', id }),
      openReport: (id, firstStudent) => dispatch({ type: 'OPEN_REPORT', id, firstStudent }),
      closeReport: () => dispatch({ type: 'CLOSE_REPORT' }),
      setRdTab: (tab) => dispatch({ type: 'SET_RD_TAB', tab }),
      selectSlide: (index) => dispatch({ type: 'SELECT_SLIDE', index }),
      selectStudent: (name) => dispatch({ type: 'SELECT_STUDENT', name }),
      openOverlay: (overlay) => dispatch({ type: 'OPEN_OVERLAY', overlay }),
      closeOverlay: () => dispatch({ type: 'CLOSE_OVERLAY' }),
    }),
    [state, scope, isAll, toastMsg, toast],
  );

  return <ResourcesContext.Provider value={value}>{children}</ResourcesContext.Provider>;
}
