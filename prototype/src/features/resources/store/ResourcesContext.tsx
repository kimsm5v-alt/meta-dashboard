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
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useLayoutContext } from '@/app/LayoutV2';
import { MY } from '../mock-data';
import { DEFAULT_LESSON_CLASS_ID, scopeFromClass } from '../utils/format';
import type { Errata, MyLesson, ReportStatus, Scope } from '../types';

// ============================================
// 상태 · 액션
// ============================================

/** GNB 2depth 3분할: 수업 자료실 / 나의 자료 / 수업 결과보기 */
export type LessonTab = 'library' | 'myData' | 'results';
export type RdTab = 'slide' | 'student';
export type RsFilter = '전체' | ReportStatus;

/** 풀스크린 오버레이 (저작툴·배포·실시간 수업·제출 캡처) */
export interface OverlayState {
  kind: 'editor' | 'deploy' | 'live' | 'capture';
  contentId?: string | null;
  /** 오버레이를 연 출처 (저작툴→배포 복귀용) */
  from?: 'editor';
  // === capture 전용 ===
  articleId?: string;
  studentId?: string;
  /** 이전/다음이 훑는 축 — 페이지별 보기는 학생 순회, 학생별 보기는 페이지 순회 */
  axis?: 'student' | 'article';
}

/** 교사 수동 채점 결과 키 — `${articleId}::${studentId}` */
export const gradeKey = (articleId: string, studentId: string) => `${articleId}::${studentId}`;

interface ResourcesState {
  myLessons: MyLesson[];
  activeTab: LessonTab;
  rsFilter: RsFilter;
  rdReport: string | null; // 선택된 리포트 id
  rdTab: RdTab;
  rdStu: string | null;
  rdSlide: number;
  overlay: OverlayState | null;
  /** 교사가 이번 세션에 매긴 수동 채점 (프로토타입 — 메모리 보관) */
  grades: Record<string, Errata>;
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
  | { type: 'CLOSE_OVERLAY' }
  | { type: 'SET_GRADE'; key: string; errata: Errata | null };

const initialState: ResourcesState = {
  myLessons: MY,
  activeTab: 'library',
  rsFilter: '전체',
  rdReport: null,
  rdTab: 'student',
  rdStu: null,
  rdSlide: 0,
  overlay: null,
  grades: {},
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
    case 'SET_GRADE': {
      const grades = { ...state.grades };
      if (action.errata == null) delete grades[action.key];
      else grades[action.key] = action.errata;
      return { ...state, grades };
    }
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
  /** 제출 캡처 뷰어 열기 (교사 수동 채점 진입점) */
  openCapture: (articleId: string, studentId: string, axis: 'student' | 'article') => void;
  /** 교사 수동 채점 — null 이면 채점 해제 */
  setGrade: (articleId: string, studentId: string, errata: Errata | null) => void;
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
  const { selectedClass, selectClass, scope: appScope, currentMenuConfig } = useLayoutContext();
  const scope = scopeFromClass(selectedClass?.name);
  const isAll = scope === '전체';

  // 수업 진입 시 기본 스코프 = LNB 첫 번째 반 (app/ 미변경 제약으로 feature 쪽에서 1회만 주입).
  // LayoutV2 는 첫 렌더에서 INITIAL_SCOPE('전체')로 시작하고 URL→scope 반영은 부모 effect라
  // 자식인 여기보다 늦게 돈다 → 딥링크 판별은 appScope 가 아니라 최초 렌더의 URL 로 해야 한다.
  const [searchParams] = useSearchParams();
  const hadScopeParamOnMount = useRef(searchParams.has('class') || searchParams.has('student'));
  const autoScopeDoneRef = useRef(false);

  useEffect(() => {
    if (autoScopeDoneRef.current) return;
    // 딥링크(?class=·?student=)로 들어온 경우 사용자의 선택을 덮어쓰지 않는다
    if (hadScopeParamOnMount.current) {
      autoScopeDoneRef.current = true;
      return;
    }
    // 이미 반/학생 스코프면 그대로 유지
    if (appScope.level !== 'all') {
      autoScopeDoneRef.current = true;
      return;
    }
    // 반 스코프 미지원 메뉴면 1회 기회를 소모하지 않고 보류 (다음 렌더에 재시도)
    if (!currentMenuConfig.class) return;
    autoScopeDoneRef.current = true;
    selectClass(DEFAULT_LESSON_CLASS_ID);
  }, [appScope.level, currentMenuConfig.class, selectClass]);

  const [state, dispatch] = useReducer(reducer, initialState);

  // 스코프 전환 시 리포트 상세에서 이탈 (목업 pickScope)
  useEffect(() => {
    dispatch({ type: 'RESET_REPORT' });
  }, [scope]);

  // ============================================
  // 오버레이 ↔ 브라우저 히스토리
  // 오버레이는 상태로만 떠 있어 히스토리에 아무것도 남지 않는다 → 뒤로가기가 /lesson 자체를 떠나버렸다.
  // 오버레이를 열 때 같은 URL 로 항목을 하나 쌓아, 뒤로가기가 페이지 이탈 대신 오버레이만 닫게 한다.
  // ============================================
  const location = useLocation();
  const navigate = useNavigate();
  const isOverlayEntry = (location.state as { rsOverlay?: boolean } | null)?.rsOverlay === true;
  /** 어떤 오버레이에 대해 항목을 쌓았는지 — StrictMode 이중 실행로 두 번 쌓이는 것 방지 */
  const pushedForRef = useRef<OverlayState | null>(null);
  const onEntryRef = useRef(false);

  useEffect(() => {
    if (!state.overlay) {
      pushedForRef.current = null;
      return;
    }
    // 이미 우리 항목 위에 있으면(저작툴 → 배포처럼 kind 만 바뀐 경우) 더 쌓지 않는다
    if (isOverlayEntry || pushedForRef.current === state.overlay) return;
    pushedForRef.current = state.overlay;
    navigate(`${location.pathname}${location.search}`, { state: { rsOverlay: true } });
    // location/navigate 는 의도적으로 제외 — 오버레이가 열리는 순간만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.overlay]);

  useEffect(() => {
    // 우리 항목에서 벗어났는데(=뒤로가기) 오버레이가 아직 열려 있으면 닫는다
    if (onEntryRef.current && !isOverlayEntry && state.overlay) {
      // 저작툴에서 나가면 방금 편집하던 세트지가 있는 '나의 자료' 로 돌려보낸다
      if (state.overlay.kind === 'editor') dispatch({ type: 'SET_TAB', tab: 'myData' });
      dispatch({ type: 'CLOSE_OVERLAY' });
    }
    onEntryRef.current = isOverlayEntry;
  }, [isOverlayEntry, state.overlay]);

  /** 오버레이를 UI 로 닫을 때는 쌓아둔 히스토리 항목도 함께 되돌린다 */
  const closeOverlay = useCallback(() => {
    dispatch({ type: 'CLOSE_OVERLAY' });
    if (onEntryRef.current) navigate(-1);
  }, [navigate]);

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
      closeOverlay,
      openCapture: (articleId, studentId, axis) =>
        dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'capture', articleId, studentId, axis } }),
      setGrade: (articleId, studentId, errata) =>
        dispatch({ type: 'SET_GRADE', key: gradeKey(articleId, studentId), errata }),
    }),
    [state, scope, isAll, toastMsg, toast, closeOverlay],
  );

  return <ResourcesContext.Provider value={value}>{children}</ResourcesContext.Provider>;
}
