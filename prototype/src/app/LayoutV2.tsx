import { ReactNode, useState, useMemo, createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  Settings,
  User,
  LogOut,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  Heart,
  BookOpen,
  Home,
  PanelLeftClose,
  PanelLeft,
  ArrowRightLeft,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { FloatingChatbot } from '@/features/ai-room';
import serviceLogo from '@/assets/allvia_sel_logo.svg';
import aiOwlIcon from '@/assets/raon/ai-owl-icon.png';

// 스코프 관련 임포트
import {
  type Scope,
  type ScopeMemory,
  type MenuScopeConfig,
  INITIAL_SCOPE,
  INITIAL_SCOPE_MEMORY,
  getMenuKeyFromPath,
  getMenuScopeConfig,
  adjustScopeForMenu,
  isScopeEqual,
} from './scope';
import { ScopeTree, type ClassInfo, type StudentInfo } from './components';

// ============================================
// Types
// ============================================

interface LayoutProps {
  children: ReactNode;
}

/** 검사 유형 */
export type ExamType = 'comp' | 'self';

/** 역할 유형 */
export type RoleType = 'teacher' | 'student';

/** 프로토타입 모드 (역할 + 검사 유형 조합) */
export interface PrototypeMode {
  role: RoleType;
  examType: ExamType;
}

const PROTOTYPE_MODE_OPTIONS: { value: PrototypeMode; label: string; color: string }[] = [
  { value: { role: 'teacher', examType: 'comp' }, label: '교사 - 학습종합검사', color: '#9D53E1' },
  { value: { role: 'teacher', examType: 'self' }, label: '교사 - 자기조절학습검사', color: '#009F88' },
  { value: { role: 'student', examType: 'comp' }, label: '학생 - 학습종합검사', color: '#9D53E1' },
  { value: { role: 'student', examType: 'self' }, label: '학생 - 자기조절학습검사', color: '#009F88' },
];

interface GNBItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  subTabs?: SubTab[];
}

interface SubTab {
  id: string;
  label: string;
  path: string;
}

// ============================================
// Context for Layout State
// ============================================

interface LayoutContextType {
  // 기존 호환성 유지 (deprecated, scope 사용 권장)
  selectedClass: ClassInfo | null;
  setSelectedClass: (cls: ClassInfo | null) => void;
  selectedStudent: StudentInfo | null;
  setSelectedStudent: (student: StudentInfo | null) => void;

  // GNB/서브탭 상태
  activeGNB: string;
  setActiveGNB: (gnb: string) => void;
  activeSubTab: string | null;
  setActiveSubTab: (tab: string | null) => void;

  // 신규: 스코프 상태
  scope: Scope;
  setScope: (scope: Scope) => void;
  expandedClassId: string | null;
  setExpandedClassId: (id: string | null) => void;
  currentMenuConfig: MenuScopeConfig;

  // 스코프 액션
  selectAll: () => void;
  selectClass: (classId: string) => void;
  selectStudent: (classId: string, studentId: string) => void;

  // 프로토타입 모드 (역할 + 검사 유형)
  prototypeMode: PrototypeMode;
  setPrototypeMode: (mode: PrototypeMode) => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within LayoutV2');
  }
  return context;
};

// ============================================
// Mock Data (추후 API 연동)
// ============================================

const MOCK_CLASSES: ClassInfo[] = [
  { id: 'group-1', name: '2-3반', status: '응시율 85% · 상담 3' },
  { id: 'group-2', name: '2-4반', status: '검사 배포 가능' },
  { id: 'group-3', name: '2-5반', status: '검사 배포 가능' },
  { id: 'group-4', name: '2-6반', status: '검사 배포 가능' },
];

const MOCK_STUDENTS: StudentInfo[] = [
  { id: 's1', name: '김민준' },
  { id: 's2', name: '이서연' },
  { id: 's3', name: '박지호' },
  { id: 's4', name: '최수아' },
  { id: 's5', name: '정예준' },
  { id: 's6', name: '강하은' },
  { id: 's7', name: '조민서' },
  { id: 's8', name: '윤시우' },
  { id: 's9', name: '장도윤' },
  { id: 's10', name: '임지아' },
  { id: 's11', name: '한서준' },
  { id: 's12', name: '오하린' },
  { id: 's13', name: '신유나' },
  { id: 's14', name: '권준우' },
  { id: 's15', name: '송지원' },
  { id: 's16', name: '백서윤' },
  { id: 's17', name: '고은우' },
  { id: 's18', name: '문채원' },
  { id: 's19', name: '양시온' },
  { id: 's20', name: '배하율' },
  { id: 's21', name: '허지후' },
  { id: 's22', name: '남윤서' },
  { id: 's23', name: '심현우' },
  { id: 's24', name: '안소율' },
  { id: 's25', name: '유건우' },
  { id: 's26', name: '노이서' },
];

// ============================================
// GNB Configuration (검사 유형별)
// ============================================

/** 학습종합검사용 GNB */
const GNB_ITEMS_COMP: GNBItem[] = [
  {
    id: 'exam',
    label: '검사',
    icon: ClipboardList,
    path: '/exam',
    subTabs: [
      { id: 'management', label: '검사관리', path: '/exam/management' },
      { id: 'result', label: '결과보기', path: '/exam/result' },
      { id: 'tracking', label: '변화추적', path: '/exam/tracking' },
      { id: 'record', label: '생활기록부 작성', path: '/exam/record' },
    ],
  },
  {
    id: 'coaching',
    label: '코칭',
    icon: Heart,
    path: '/coaching',
    subTabs: [
      { id: 'class', label: '학급 코칭', path: '/coaching/class' },
      { id: 'individual', label: '개별 코칭', path: '/coaching/individual' },
    ],
  },
  {
    id: 'lesson',
    label: '수업',
    icon: BookOpen,
    path: '/lesson',
  },
];

/** 자기조절학습검사용 GNB (코칭 메뉴 없음 - LPA 유형 미지원) */
const GNB_ITEMS_SELF: GNBItem[] = [
  {
    id: 'exam',
    label: '검사',
    icon: ClipboardList,
    path: '/exam',
    subTabs: [
      { id: 'management', label: '검사관리', path: '/exam/management' },
      { id: 'result', label: '결과보기', path: '/exam/result' },
      { id: 'tracking', label: '변화추적', path: '/exam/tracking' },
      { id: 'record', label: '생활기록부 작성', path: '/exam/record' },
    ],
  },
  // 자기조절학습검사는 LPA 유형이 없으므로 코칭 메뉴 제외
  {
    id: 'lesson',
    label: '수업',
    icon: BookOpen,
    path: '/lesson',
  },
];

/** 검사 유형에 따른 GNB 반환 */
const getGNBItems = (examType: ExamType): GNBItem[] => {
  return examType === 'comp' ? GNB_ITEMS_COMP : GNB_ITEMS_SELF;
};

// ============================================
// Header (GNB)
// ============================================

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeGNB, setActiveGNB, setActiveSubTab, selectAll, prototypeMode, setPrototypeMode } = useLayoutContext();
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 현재 스코프 파라미터를 유지하면서 이동
  const navigateWithScope = (path: string) => {
    const params = new URLSearchParams(searchParams);
    const queryString = params.toString();
    navigate(queryString ? `${path}?${queryString}` : path);
  };

  // 현재 검사 유형에 맞는 GNB 아이템
  const gnbItems = getGNBItems(prototypeMode.examType);

  const handleGNBClick = (item: GNBItem) => {
    setActiveGNB(item.id);
    if (item.subTabs && item.subTabs.length > 0) {
      setActiveSubTab(item.subTabs[0].id);
      navigateWithScope(item.subTabs[0].path);
    } else {
      setActiveSubTab(null);
      navigateWithScope(item.path);
    }
  };

  const handleLogoClick = () => {
    setActiveGNB('');
    selectAll();
    setActiveSubTab(null);
    navigate('/home');
  };

  const handleModeChange = (mode: PrototypeMode) => {
    setPrototypeMode(mode);
    setIsModeDropdownOpen(false);

    // 역할 변경 시 적절한 페이지로 이동
    if (mode.role === 'student') {
      navigate('/student/exams');
    } else {
      navigate('/home');
    }
  };

  // 현재 선택된 모드 라벨
  const currentModeOption = PROTOTYPE_MODE_OPTIONS.find(
    opt => opt.value.role === prototypeMode.role && opt.value.examType === prototypeMode.examType
  );

  return (
    <header className="fixed top-0 left-0 right-0 h-[58px] bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-7">
        {/* Logo */}
        <button onClick={handleLogoClick} className="flex items-center">
          <img src={serviceLogo} alt="AllviA SEL" className="h-9" />
        </button>

        {/* GNB Tabs */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[#f2f1fb] rounded-full px-1 py-1">
          {gnbItems.map((item, index) => {
            const isActive = activeGNB === item.id;
            const isLast = index === gnbItems.length - 1;
            return (
              <div key={item.id} className="flex items-center">
                <button
                  onClick={() => handleGNBClick(item)}
                  className={`px-5 py-[7px] rounded-full text-[15px] font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
                {!isLast && <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-0.5" />}
              </div>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* [PROTOTYPE] 역할/검사 유형 선택 드롭다운 */}
          <div className="relative" ref={modeDropdownRef}>
            <button
              onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors border"
              style={{
                color: currentModeOption?.color,
                backgroundColor: `${currentModeOption?.color}10`,
                borderColor: `${currentModeOption?.color}30`,
              }}
              title="프로토타입 모드 전환"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{currentModeOption?.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isModeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isModeDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {PROTOTYPE_MODE_OPTIONS.map((option, idx) => {
                  const isSelected = option.value.role === prototypeMode.role && option.value.examType === prototypeMode.examType;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleModeChange(option.value)}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                        isSelected ? 'bg-gray-50 font-semibold' : 'hover:bg-gray-50'
                      } ${idx > 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                      <span style={{ color: isSelected ? option.color : '#374151' }}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI 어시스턴트 버튼 - 전체 페이지(B)로 이동 */}
          <button
            onClick={() => {
              setActiveGNB('ai-assistant');
              setActiveSubTab(null);
              navigateWithScope('/ai-assistant');
            }}
            className={`transition-all hover:scale-105 ${
              activeGNB === 'ai-assistant' ? 'ring-2 ring-primary-400/50 rounded-xl' : ''
            }`}
            title="AI 어시스턴트"
          >
            <img src={aiOwlIcon} alt="AI 어시스턴트" className="w-11 h-11 rounded-xl object-cover" />
          </button>

          <div className="w-px h-5 bg-gray-200" />

          <button className="relative w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-gray-500 hover:bg-gray-100">
            <Bell className="w-5 h-5" />
          </button>
          <button className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-gray-500 hover:bg-gray-100">
            <Settings className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <span className="text-sm font-semibold text-gray-900">{user?.name || '김민지'}</span>
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-[30px] h-[30px] rounded-full object-cover"
              />
            ) : (
              <div className="w-[30px] h-[30px] bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// ============================================
// LNB (Left Navigation Bar) - 아코디언 트리
// ============================================

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    scope,
    expandedClassId,
    setExpandedClassId,
    currentMenuConfig,
    activeGNB,
    setActiveGNB,
    setActiveSubTab,
    selectAll,
    selectClass,
    selectStudent,
  } = useLayoutContext();

  // 홈 클릭 핸들러
  const handleHomeClick = () => {
    setActiveGNB('');
    selectAll();
    setActiveSubTab(null);
    navigate('/home');
  };

  // 반 펼침/접힘 토글
  const handleToggleExpand = (classId: string) => {
    if (expandedClassId === classId) {
      setExpandedClassId(null);
    } else {
      setExpandedClassId(classId);
    }
  };

  return (
    <aside
      className={`fixed left-0 top-[58px] bottom-0 ${
        isCollapsed ? 'w-16' : 'w-[210px]'
      } bg-[#fafafa] border-r border-gray-200 flex flex-col transition-all duration-200`}
    >
      {/* 상단 영역: 홈 버튼 + 접기 버튼 */}
      <div className="flex items-center justify-between px-3 py-4">
        <button
          onClick={handleHomeClick}
          className={`p-2 rounded-[9px] hover:bg-gray-100 transition-colors ${
            activeGNB === '' ? 'bg-primary-100 text-primary-600' : 'text-gray-500'
          }`}
          title="홈"
        >
          <Home className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-[8px] hover:bg-gray-100 text-gray-500"
          title={isCollapsed ? '펼치기' : '접기'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-[18px] h-[18px]" />
          ) : (
            <PanelLeftClose className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>

      {/* 접힌 상태일 때는 트리 숨김 */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden px-3 pb-4">
          <ScopeTree
            classes={MOCK_CLASSES}
            students={MOCK_STUDENTS}
            scope={scope}
            menuConfig={currentMenuConfig}
            expandedClassId={expandedClassId}
            currentPath={location.pathname}
            onSelectAll={selectAll}
            onSelectClass={selectClass}
            onSelectStudent={selectStudent}
            onToggleExpand={handleToggleExpand}
          />
        </div>
      )}
    </aside>
  );
};

// ============================================
// Sub Tabs
// ============================================

const SubTabs: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeGNB, activeSubTab, setActiveSubTab, prototypeMode } = useLayoutContext();

  // 검사 유형에 맞는 GNB 아이템에서 현재 GNB 찾기
  const gnbItems = getGNBItems(prototypeMode.examType);
  const currentGNB = gnbItems.find((item) => item.id === activeGNB);

  if (!currentGNB?.subTabs) {
    return null;
  }

  const handleSubTabClick = (tab: SubTab) => {
    setActiveSubTab(tab.id);
    // 현재 스코프 파라미터를 유지하면서 이동
    const params = new URLSearchParams(searchParams);
    const queryString = params.toString();
    navigate(queryString ? `${tab.path}?${queryString}` : tab.path);
  };

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
      {currentGNB.subTabs.map((tab) => {
        const isActive = activeSubTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleSubTabClick(tab)}
            className={`px-4 py-[11px] text-[14.5px] font-semibold transition-colors border-b-2 -mb-px ${
              isActive
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// Main Layout
// ============================================

export const LayoutV2: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // GNB/서브탭 상태
  const [activeGNB, setActiveGNB] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);

  // 프로토타입 모드 (역할 + 검사 유형)
  const [prototypeMode, setPrototypeMode] = useState<PrototypeMode>({ role: 'teacher', examType: 'comp' });

  // 스코프 상태
  const [scope, setScopeState] = useState<Scope>(INITIAL_SCOPE);
  const [scopeMemory, setScopeMemory] = useState<ScopeMemory>(INITIAL_SCOPE_MEMORY);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  // 현재 메뉴의 스코프 설정
  const currentMenuKey = useMemo(() => getMenuKeyFromPath(location.pathname), [location.pathname]);
  const currentMenuConfig = useMemo(() => getMenuScopeConfig(currentMenuKey), [currentMenuKey]);

  // URL 동기화 플래그
  const isSyncingRef = useRef(false);
  const lastScopeRef = useRef<Scope>(scope);
  const lastPathRef = useRef<string>(location.pathname);

  // ============================================
  // URL에서 스코프 파싱
  // ============================================
  const parseScopeFromURL = useCallback((): Scope => {
    const classId = searchParams.get('class');
    const studentId = searchParams.get('student');

    if (studentId && classId) {
      return { level: 'student', classId, studentId };
    }
    if (classId) {
      return { level: 'class', classId };
    }
    return { level: 'all' };
  }, [searchParams]);

  // ============================================
  // 스코프를 URL에 반영
  // ============================================
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

      const newSearch = params.toString();
      const currentSearch = searchParams.toString();

      if (newSearch !== currentSearch) {
        isSyncingRef.current = true;
        setSearchParams(params, { replace: true });
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 0);
      }
    },
    [searchParams, setSearchParams]
  );

  // ============================================
  // 스코프 설정 (URL 동기화 포함)
  // ============================================
  const setScope = useCallback(
    (newScope: Scope) => {
      if (!isScopeEqual(newScope, scope)) {
        setScopeState(newScope);
        lastScopeRef.current = newScope;
        updateURL(newScope);
      }
    },
    [scope, updateURL]
  );

  // ============================================
  // 스코프 액션
  // ============================================
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
    [setScope, currentMenuConfig]
  );

  const selectStudent = useCallback(
    (classId: string, studentId: string) => {
      if (currentMenuConfig.student) {
        setScope({ level: 'student', classId, studentId });
        // 메모리에 저장
        setScopeMemory((prev) => ({
          ...prev,
          lastStudentId: studentId,
          lastClassId: classId,
        }));
      }
    },
    [setScope, currentMenuConfig]
  );

  // ============================================
  // 기존 호환성 유지: selectedClass, selectedStudent
  // ============================================
  const selectedClass = useMemo((): ClassInfo | null => {
    if (scope.classId) {
      return MOCK_CLASSES.find((c) => c.id === scope.classId) || null;
    }
    return null;
  }, [scope.classId]);

  const selectedStudent = useMemo((): StudentInfo | null => {
    if (scope.studentId) {
      return MOCK_STUDENTS.find((s) => s.id === scope.studentId) || null;
    }
    return null;
  }, [scope.studentId]);

  const setSelectedClass = useCallback(
    (cls: ClassInfo | null) => {
      if (cls) {
        selectClass(cls.id);
      } else {
        selectAll();
      }
    },
    [selectClass, selectAll]
  );

  const setSelectedStudent = useCallback(
    (student: StudentInfo | null) => {
      if (student && scope.classId) {
        selectStudent(scope.classId, student.id);
      } else if (scope.classId) {
        selectClass(scope.classId);
      }
    },
    [selectStudent, selectClass, scope.classId]
  );

  // ============================================
  // URL 변경 감지 → 스코프 업데이트 (직접 URL 입력 시에만)
  // ============================================
  useEffect(() => {
    if (isSyncingRef.current) return;

    const urlScope = parseScopeFromURL();

    // URL에 스코프 파라미터가 있고, 현재 스코프와 다른 경우에만 업데이트
    // (URL 직접 입력 또는 브라우저 뒤로가기 대응)
    const hasClassParam = searchParams.has('class');
    const hasStudentParam = searchParams.has('student');

    if (hasClassParam || hasStudentParam) {
      if (!isScopeEqual(urlScope, lastScopeRef.current)) {
        lastScopeRef.current = urlScope;
        setScopeState(urlScope);

        // 반이 선택되면 자동 펼침
        if (urlScope.classId && currentMenuConfig.student) {
          setExpandedClassId(urlScope.classId);
        }
      }
    }
  }, [parseScopeFromURL, currentMenuConfig.student, searchParams]);

  // ============================================
  // 메뉴 변경 시 스코프 자동 조정
  // ============================================
  useEffect(() => {
    // pathname 변경 시에만 실행
    if (lastPathRef.current === location.pathname) {
      return;
    }
    lastPathRef.current = location.pathname;

    const menuKey = getMenuKeyFromPath(location.pathname);
    const menuConfig = getMenuScopeConfig(menuKey);

    // URL 파라미터가 있으면 그것을 우선 사용 (navigate로 이동한 경우)
    const urlScope = parseScopeFromURL();
    const hasUrlParams = searchParams.has('class') || searchParams.has('student');
    const baseScope = hasUrlParams ? urlScope : scope;

    // 현재 스코프가 새 메뉴에서 지원되지 않으면 조정
    const { adjustedScope, updatedMemory } = adjustScopeForMenu(baseScope, menuConfig, scopeMemory);

    // URL 파라미터가 있으면 항상 스코프 업데이트 (navigate로 이동한 경우)
    if (hasUrlParams || !isScopeEqual(adjustedScope, scope)) {
      setScopeState(adjustedScope);
      setScopeMemory(updatedMemory);
      lastScopeRef.current = adjustedScope;
      // URL 파라미터가 이미 있는 경우에는 URL 업데이트 불필요
      if (!hasUrlParams) {
        updateURL(adjustedScope);
      }
    }

    // 학생 지원 메뉴에서 반이 선택되어 있으면 자동 펼침
    if (adjustedScope.classId && menuConfig.student) {
      setExpandedClassId(adjustedScope.classId);
    } else if (!menuConfig.student) {
      // 학생 미지원 메뉴에서는 펼침 해제
      setExpandedClassId(null);
    }
  }, [location.pathname, scope, scopeMemory, updateURL, parseScopeFromURL, searchParams]);

  // ============================================
  // URL 변경 시 GNB 상태 동기화
  // ============================================
  useEffect(() => {
    const path = location.pathname;
    const gnbItems = getGNBItems(prototypeMode.examType);
    const matchedGNB = gnbItems.find(
      (item) => path === item.path || path.startsWith(item.path + '/')
    );
    if (matchedGNB) {
      setActiveGNB(matchedGNB.id);
      // 서브탭 동기화
      if (matchedGNB.subTabs) {
        const matchedSubTab = matchedGNB.subTabs.find(
          (tab) => path === tab.path || path.startsWith(tab.path + '/')
        );
        if (matchedSubTab) {
          setActiveSubTab(matchedSubTab.id);
        }
      }
    }
  }, [location.pathname, prototypeMode.examType]);

  // ============================================
  // Context Value
  // ============================================
  const contextValue: LayoutContextType = {
    // 기존 호환성
    selectedClass,
    setSelectedClass,
    selectedStudent,
    setSelectedStudent,
    // GNB/서브탭
    activeGNB,
    setActiveGNB,
    activeSubTab,
    setActiveSubTab,
    // 스코프
    scope,
    setScope,
    expandedClassId,
    setExpandedClassId,
    currentMenuConfig,
    // 스코프 액션
    selectAll,
    selectClass,
    selectStudent,
    // 프로토타입 모드
    prototypeMode,
    setPrototypeMode,
  };

  // AI 어시스턴트 화면: GNB는 유지하되 좌측 스코프 사이드바/서브탭을 숨기고 전체폭으로 렌더
  const isAssistant = location.pathname.startsWith('/ai-assistant');
  // 홈 화면: GNB는 유지하되 좌측 LNB/서브탭을 숨기고 전체폭으로 렌더
  const isHome = location.pathname === '/home' || location.pathname === '/HOME';
  const isFullWidth = isAssistant || isHome;

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className="min-h-screen bg-[#fbfbfc]">
        <Header />
        {isFullWidth ? (
          <main className="fixed top-[58px] left-0 right-0 bottom-0 overflow-hidden bg-white">
            {children}
          </main>
        ) : (
          <div className="flex">
            <Sidebar />
            <main className="flex-1 mt-[58px] ml-[210px] overflow-y-auto">
              <div className="p-[30px_40px_60px]">
                <SubTabs />
                {children}
              </div>
            </main>
          </div>
        )}

        {/* 플로팅 AI 챗봇 - 어시스턴트 전용 화면 제외한 모든 화면에 오버레이 */}
        {!isAssistant && <FloatingChatbot studentSelected={!!selectedStudent} />}
      </div>
    </LayoutContext.Provider>
  );
};

export default LayoutV2;
