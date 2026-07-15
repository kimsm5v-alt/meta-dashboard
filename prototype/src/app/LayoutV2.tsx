import { ReactNode, useState, useMemo, createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Heart,
  BookOpen,
  Bot,
  Settings2,
  Home,
  PanelLeftClose,
  PanelLeft,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { RaonAvatar } from '@/shared/components';
import serviceLogo from '@/assets/logo_2.png';
import aiOwlIcon from '@/assets/raon/ai-owl.svg';

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
// GNB Configuration (IA 기준)
// - 홈: 로고 클릭 시 진입 (GNB 탭 아님)
// - 검사: 검사관리 · 결과보기 · 학생 상담 · 변화추적
// - 코칭: 학급 코칭 · 개별 코칭 (서비스 특장점 부각)
// - 수업/AI: TBD
// ============================================

const GNB_ITEMS: GNBItem[] = [
  {
    id: 'exam',
    label: '검사',
    icon: ClipboardList,
    path: '/exam',
    subTabs: [
      { id: 'management', label: '검사관리', path: '/exam/management', allowStudentSelect: false },
      { id: 'result', label: '결과보기', path: '/exam/result', allowStudentSelect: true },
      { id: 'counseling', label: '학생 상담', path: '/exam/counseling', allowStudentSelect: true },
      { id: 'tracking', label: '변화추적', path: '/exam/tracking', allowStudentSelect: true },
    ],
  },
  {
    id: 'coaching',
    label: '코칭',
    icon: Heart,
    path: '/coaching',
    subTabs: [
      { id: 'class', label: '학급 코칭', path: '/coaching/class', allowStudentSelect: false },
      { id: 'individual', label: '개별 코칭', path: '/coaching/individual', allowStudentSelect: true },
    ],
  },
  {
    id: 'lesson',
    label: '수업',
    icon: BookOpen,
    path: '/lesson',
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
    // 반/학생 선택 유지, 서브탭만 첫 번째로 설정
    if (item.subTabs && item.subTabs.length > 0) {
      setActiveSubTab(item.subTabs[0].id);
      navigate(item.subTabs[0].path);
    } else {
      setActiveSubTab(null);
      navigate(item.path);
    }
  };

  const handleLogoClick = () => {
    setActiveGNB(''); // GNB 탭 전부 비활성
    setSelectedClass(null);
    setSelectedStudent(null);
    setActiveSubTab(null);
    navigate('/home');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[58px] bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-7">
        {/* Logo - 클릭 시 홈 화면 */}
        <button
          onClick={handleLogoClick}
          className="flex items-center"
        >
          <img src={serviceLogo} alt="학습심리정서검사" className="h-6" />
        </button>

        {/* GNB Tabs - 중앙 정렬, 둥근 테두리 + 화살표 */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[#f2f1fb] rounded-full px-1 py-1">
          {GNB_ITEMS.map((item, index) => {
            const isActive = activeGNB === item.id;
            const isLast = index === GNB_ITEMS.length - 1;
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
                {!isLast && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-0.5" />
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* AI 어시스턴트 버튼 */}
          <button
            onClick={() => {
              setActiveGNB('ai-assistant');
              setActiveSubTab(null);
              navigate('/ai-assistant');
            }}
            className={`transition-all hover:scale-105 ${
              activeGNB === 'ai-assistant' ? 'ring-2 ring-primary-400/50 rounded-xl' : ''
            }`}
            title="AI 어시스턴트"
          >
            <img
              src={aiOwlIcon}
              alt="AI 어시스턴트"
              className="w-11 h-11 rounded-xl object-cover"
            />
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
// LNB (Left Navigation Bar)
// ============================================

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    selectedClass,
    setSelectedClass,
    selectedStudent,
    setSelectedStudent,
    activeGNB,
    setActiveGNB,
    activeSubTab,
    setActiveSubTab,
  } = useLayoutContext();

  // 현재 GNB의 서브탭 정보
  const currentGNB = GNB_ITEMS.find((item) => item.id === activeGNB);
  const currentSubTab = currentGNB?.subTabs?.find((tab) => tab.id === activeSubTab);
  const allowStudentSelect = currentSubTab?.allowStudentSelect ?? false;

  // 홈 클릭 핸들러
  const handleHomeClick = () => {
    setActiveGNB('');
    setSelectedClass(null);
    setSelectedStudent(null);
    setActiveSubTab(null);
    navigate('/home');
  };

  // 반 클릭 핸들러
  const handleClassClick = (cls: ClassInfo) => {
    setSelectedClass(cls);
    setSelectedStudent(null);
    // GNB/서브탭 유지, 서브탭이 없으면 첫 번째로 설정
    if (currentGNB?.subTabs && currentGNB.subTabs.length > 0 && !activeSubTab) {
      const firstTab = currentGNB.subTabs[0];
      setActiveSubTab(firstTab.id);
      navigate(firstTab.path);
    }
  };

  // 반 목록으로 돌아가기
  const handleBackToClassList = () => {
    setSelectedClass(null);
    setSelectedStudent(null);
    // GNB/서브탭 유지
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
    <aside className={`fixed left-0 top-[58px] bottom-0 ${isCollapsed ? 'w-16' : 'w-[210px]'} bg-[#fafafa] border-r border-gray-200 flex flex-col transition-all duration-200`}>
      {/* 상단 영역: 홈 버튼 + 접기 버튼 */}
      <div className="flex items-center justify-between px-3 py-4">
        <button
          onClick={handleHomeClick}
          className={`p-2 rounded-[9px] hover:bg-gray-100 transition-colors ${activeGNB === '' ? 'bg-primary-100 text-primary-600' : 'text-gray-500'}`}
          title="홈"
        >
          <Home className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-[8px] hover:bg-gray-100 text-gray-500"
          title={isCollapsed ? '펼치기' : '접기'}
        >
          {isCollapsed ? <PanelLeft className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
        </button>
      </div>

      {/* 접힌 상태일 때는 내용 숨김 */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {/* 상태 2: 학생 목록 (반 선택됨) */}
          {selectedClass ? (
            <>
              {/* 뒤로가기 */}
              <button
                onClick={handleBackToClassList}
                className="flex items-center gap-2 w-full px-[10px] py-[9px] text-[13.5px] text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-[9px] mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>반 목록</span>
              </button>

              <div className="border-t border-gray-200 my-3" />

              {/* 선택된 반 */}
              <div className="text-[11px] font-bold text-gray-400 tracking-wide px-[10px] mb-1">
                {selectedClass.name}
              </div>

              {/* 반 전체 옵션 */}
              <button
                onClick={handleClassTotalClick}
                className={`flex items-center justify-between w-full px-[10px] py-[9px] text-[13.5px] rounded-[9px] mb-1 ${
                  !selectedStudent
                    ? 'bg-primary-100 text-primary-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-[10px]">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${!selectedStudent ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    <Users className="w-3.5 h-3.5" />
                  </span>
                  <span>반 전체</span>
                </div>
                {!selectedStudent && <span className="w-2 h-2 rounded-full bg-primary-500" />}
              </button>

              <div className="border-t border-gray-200 my-3" />

              {/* 학생 목록 */}
              <div className="text-[11px] font-bold text-gray-400 tracking-wide px-[10px] mb-[6px]">학생</div>
              <ul className="space-y-[2px]">
                {MOCK_STUDENTS.map((student) => {
                  const isSelected = selectedStudent?.id === student.id;
                  const isDisabled = !allowStudentSelect;
                  return (
                    <li key={student.id}>
                      <button
                        onClick={() => handleStudentClick(student)}
                        disabled={isDisabled}
                        className={`flex items-center justify-between w-full px-[10px] py-[9px] text-[13.5px] rounded-[9px] ${
                          isSelected
                            ? 'bg-primary-100 text-primary-600 font-semibold'
                            : isDisabled
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-[10px]">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            <User className="w-3.5 h-3.5" />
                          </span>
                          <span>{student.name}</span>
                        </div>
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
                className="flex items-center gap-[10px] w-full px-[10px] py-[9px] text-[13.5px] font-medium text-gray-600 hover:bg-gray-100 rounded-[9px] mb-2"
              >
                <Settings2 className="w-[18px] h-[18px]" />
                <span>그룹관리</span>
              </button>

              <div className="border-t border-gray-200 my-3" />

              {/* 반 목록 */}
              <div className="text-[11px] font-bold text-gray-400 tracking-wide px-[10px] mb-[6px]">반 목록</div>
              <ul className="space-y-[2px]">
                {MOCK_CLASSES.map((cls) => (
                  <li key={cls.id}>
                    <button
                      onClick={() => handleClassClick(cls)}
                      className="flex items-center gap-[10px] w-full px-[10px] py-[9px] text-left hover:bg-gray-100 rounded-[9px]"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                        <Users className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[13.5px] font-medium text-gray-900">{cls.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
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
    // 반/학생 선택 유지
    navigate(tab.path);
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
      <div className="min-h-screen bg-[#fbfbfc]">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 mt-[58px] ml-[210px] overflow-y-auto">
            <div className="p-[30px_40px_60px]">
              <SubTabs />
              {children}
            </div>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
};

export default LayoutV2;
