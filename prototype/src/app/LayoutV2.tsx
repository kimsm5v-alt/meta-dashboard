import { ReactNode, useState, useMemo, createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  Home,
  ClipboardList,
  Heart,
  BookOpen,
  Bot,
  Settings2,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/features/auth';

// ============================================
// Types
// ============================================

interface LayoutProps {
  children: ReactNode;
}

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
  allowStudentSelect: boolean; // ◀ 표시 (학생 선택 가능 여부)
}

interface ClassInfo {
  id: string;
  name: string;
  status: string; // 예: "응시율 85% · 상담 3"
}

interface StudentInfo {
  id: string;
  name: string;
}

// ============================================
// Context for Layout State
// ============================================

interface LayoutContextType {
  selectedClass: ClassInfo | null;
  setSelectedClass: (cls: ClassInfo | null) => void;
  selectedStudent: StudentInfo | null;
  setSelectedStudent: (student: StudentInfo | null) => void;
  activeGNB: string;
  setActiveGNB: (gnb: string) => void;
  activeSubTab: string | null;
  setActiveSubTab: (tab: string | null) => void;
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
];

const MOCK_STUDENTS: StudentInfo[] = [
  { id: '1', name: '김채미' },
  { id: '2', name: '문순민' },
  { id: '3', name: '임지영' },
  { id: '4', name: '이리사' },
  { id: '5', name: '김다영' },
];

// ============================================
// GNB Configuration (IA 기준)
// ============================================

const GNB_ITEMS: GNBItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: Home,
    path: '/home',
  },
  {
    id: 'exam',
    label: '검사',
    icon: ClipboardList,
    path: '/exam',
    subTabs: [
      { id: 'management', label: '검사관리', path: '/exam/management', allowStudentSelect: false },
      { id: 'result', label: '결과보기', path: '/exam/result', allowStudentSelect: true },
      { id: 'tracking', label: '변화추적', path: '/exam/tracking', allowStudentSelect: true },
    ],
  },
  {
    id: 'counseling',
    label: '상담·코칭',
    icon: Heart,
    path: '/counseling',
    subTabs: [
      { id: 'student', label: '학생 상담', path: '/counseling/student', allowStudentSelect: true },
      { id: 'coaching', label: '코칭', path: '/counseling/coaching', allowStudentSelect: true },
    ],
  },
  {
    id: 'lesson',
    label: '수업',
    icon: BookOpen,
    path: '/lesson',
    subTabs: [
      { id: 'resources', label: '수업 자료실', path: '/lesson/resources', allowStudentSelect: false },
      { id: 'my-lesson', label: '나의 수업', path: '/lesson/my-lesson', allowStudentSelect: true },
    ],
  },
  {
    id: 'ai-assistant',
    label: 'AI어시스턴트',
    icon: Bot,
    path: '/ai-assistant',
  },
];

// ============================================
// Header (GNB)
// ============================================

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { activeGNB, setActiveGNB, setSelectedClass, setSelectedStudent, setActiveSubTab } = useLayoutContext();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleGNBClick = (item: GNBItem) => {
    setActiveGNB(item.id);
    setSelectedClass(null); // 반 선택 해제
    setSelectedStudent(null); // 학생 선택 해제
    setActiveSubTab(null); // 서브탭 해제
    navigate(item.path);
  };

  const handleLogoClick = () => {
    setActiveGNB('home');
    setSelectedClass(null);
    setSelectedStudent(null);
    setActiveSubTab(null);
    navigate('/home');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo + GNB */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 text-lg font-bold text-primary-600"
          >
            <span className="text-xl">📚</span>
            <span>학급 성장 관리</span>
          </button>

          {/* GNB Tabs */}
          <nav className="flex items-center gap-1">
            {GNB_ITEMS.map((item) => {
              const isActive = activeGNB === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleGNBClick(item)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* AI 도우미 바로가기 */}
          <button
            onClick={() => navigate('/ai-assistant')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <Bot className="w-4 h-4" />
            <span>AI도우미</span>
          </button>

          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <p className="text-sm font-medium text-gray-900">{user?.name || '사용자'}</p>
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
// LNB (Left Navigation Bar)
// ============================================

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedClass,
    setSelectedClass,
    selectedStudent,
    setSelectedStudent,
    activeGNB,
    activeSubTab,
    setActiveSubTab,
  } = useLayoutContext();

  // 현재 GNB의 서브탭 정보
  const currentGNB = GNB_ITEMS.find((item) => item.id === activeGNB);
  const currentSubTab = currentGNB?.subTabs?.find((tab) => tab.id === activeSubTab);
  const allowStudentSelect = currentSubTab?.allowStudentSelect ?? false;

  // 반 클릭 핸들러
  const handleClassClick = (cls: ClassInfo) => {
    setSelectedClass(cls);
    setSelectedStudent(null);
    // 첫 번째 서브탭 자동 선택
    if (currentGNB?.subTabs && currentGNB.subTabs.length > 0) {
      const firstTab = currentGNB.subTabs[0];
      setActiveSubTab(firstTab.id);
      navigate(firstTab.path);
    }
  };

  // 반 목록으로 돌아가기
  const handleBackToClassList = () => {
    setSelectedClass(null);
    setSelectedStudent(null);
    setActiveSubTab(null);
    if (currentGNB) {
      navigate(currentGNB.path);
    }
  };

  // 학생 클릭 핸들러
  const handleStudentClick = (student: StudentInfo) => {
    if (allowStudentSelect) {
      setSelectedStudent(student);
    }
  };

  // 반 전체 클릭 핸들러
  const handleClassTotalClick = () => {
    setSelectedStudent(null);
  };

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* 보기 기준 */}
        <div className="text-xs font-medium text-gray-400 mb-3">보기 기준</div>

        {/* 상태 2: 학생 목록 (반 선택됨) */}
        {selectedClass ? (
          <>
            {/* 뒤로가기 */}
            <button
              onClick={handleBackToClassList}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg mb-3"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>반 목록</span>
            </button>

            <div className="border-t border-gray-200 my-3" />

            {/* 선택된 반 */}
            <div className="px-3 py-2 text-sm font-medium text-gray-900 mb-2">
              {selectedClass.name}
            </div>

            {/* 반 전체 옵션 */}
            <button
              onClick={handleClassTotalClick}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg mb-1 ${
                !selectedStudent
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>반 전체</span>
              {!selectedStudent && <span className="w-2 h-2 rounded-full bg-primary-500" />}
            </button>

            <div className="border-t border-gray-200 my-3" />

            {/* 학생 목록 */}
            <div className="text-xs font-medium text-gray-400 mb-2">학생</div>
            <ul className="space-y-1">
              {MOCK_STUDENTS.map((student) => {
                const isSelected = selectedStudent?.id === student.id;
                const isDisabled = !allowStudentSelect;
                return (
                  <li key={student.id}>
                    <button
                      onClick={() => handleStudentClick(student)}
                      disabled={isDisabled}
                      className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg ${
                        isSelected
                          ? 'bg-primary-50 text-primary-600 font-medium'
                          : isDisabled
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{student.name}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          /* 상태 1: 반 목록 (기본) */
          <>
            {/* 그룹관리 */}
            <button
              onClick={() => navigate('/group-management')}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg mb-3"
            >
              <Settings2 className="w-4 h-4" />
              <span>그룹관리</span>
            </button>

            <div className="border-t border-gray-200 my-3" />

            {/* 내 반 */}
            <div className="text-xs font-medium text-gray-400 mb-2">내 반</div>
            <ul className="space-y-1">
              {MOCK_CLASSES.map((cls) => (
                <li key={cls.id}>
                  <button
                    onClick={() => handleClassClick(cls)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary-500" />
                      <span className="text-sm font-medium text-gray-900">{cls.name}</span>
                    </div>
                    <div className="ml-4 text-xs text-gray-500 mt-0.5">{cls.status}</div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
};

// ============================================
// Sub Tabs (서브탭이 있는 GNB에서 항상 노출)
// ============================================

const SubTabs: React.FC = () => {
  const navigate = useNavigate();
  const { activeGNB, activeSubTab, setActiveSubTab, setSelectedStudent } = useLayoutContext();

  const currentGNB = GNB_ITEMS.find((item) => item.id === activeGNB);

  // 서브탭이 없으면 렌더링하지 않음 (반 선택 여부와 무관하게 표시)
  if (!currentGNB?.subTabs) {
    return null;
  }

  const handleSubTabClick = (tab: SubTab) => {
    setActiveSubTab(tab.id);
    setSelectedStudent(null); // 서브탭 전환 시 학생 선택 초기화
    navigate(tab.path);
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      {currentGNB.subTabs.map((tab) => {
        const isActive = activeSubTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleSubTabClick(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              isActive
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {tab.allowStudentSelect && <span className="ml-1 text-xs">◀</span>}
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
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [activeGNB, setActiveGNB] = useState<string>('home');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);

  // URL 변경 시 GNB 상태 동기화
  useMemo(() => {
    const path = location.pathname;
    const matchedGNB = GNB_ITEMS.find(
      (item) => path === item.path || path.startsWith(item.path + '/')
    );
    if (matchedGNB) {
      setActiveGNB(matchedGNB.id);
    }
  }, [location.pathname]);

  const contextValue: LayoutContextType = {
    selectedClass,
    setSelectedClass,
    selectedStudent,
    setSelectedStudent,
    activeGNB,
    setActiveGNB,
    activeSubTab,
    setActiveSubTab,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 mt-14 ml-56 p-6">
            <SubTabs />
            {children}
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
};

export default LayoutV2;
