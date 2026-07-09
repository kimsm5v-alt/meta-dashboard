import { ReactNode, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  Settings,
  User,
  ChevronRight,
  ChevronDown,
  LogOut,
  ClipboardList,
  Calendar,
  PanelLeftClose,
  PanelLeft,
  BarChart3,
  BookOpen,
  Bot,
  ArrowRightLeft,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { FEATURES, type FeatureKey } from '@/shared/config/features';
import serviceLogo from '@/assets/logo_2.png';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  feature?: FeatureKey; // Feature Flag 연동
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// 결과보기 하위 메뉴 (검사 종류)
interface ResultSubItem {
  label: string;
  path: string;
  testId: string;
}

const RESULT_SUB_ITEMS: ResultSubItem[] = [
  { label: '학습종합검사', path: '/dashboard/comprehensive', testId: 'comprehensive' },
  { label: '자기조절학습검사', path: '/dashboard/selfreg', testId: 'selfreg' },
];

const navGroups: NavGroup[] = [
  {
    title: '검사',
    items: [
      // 그룹 관리 + 검사하기 통합 → 검사하기 단일 메뉴
      { icon: ClipboardList, label: '검사하기', path: '/assessment', feature: 'ASSESSMENT' },
      { icon: LayoutDashboard, label: '결과보기', path: '/dashboard', feature: 'DASHBOARD' },
    ],
  },
  {
    title: '상담',
    items: [
      { icon: Calendar, label: '상담일정', path: '/schedule', feature: 'SCHEDULE' },
      { icon: BarChart3, label: '상담 대시보드', path: '/counseling-dashboard', feature: 'COUNSELING_DASHBOARD' },
    ],
  },
  {
    title: '콘텐츠',
    items: [
      { icon: BookOpen, label: '교육 자료실', path: '/resources', feature: 'RESOURCES' },
      { icon: MessageSquare, label: '교사 커뮤니티', path: '/community', feature: 'COMMUNITY' },
    ],
  },
  {
    title: 'AI',
    items: [
      { icon: Bot, label: 'AI 어시스턴트', path: '/ai-room', feature: 'AI_ROOM' },
    ],
  },
];

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // [PROTOTYPE MOCK] 학생 계정으로 전환
  const handleSwitchToStudent = () => {
    navigate('/student/exams');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <button onClick={() => navigate('/')} className="flex items-center">
          <img src={serviceLogo} alt="학습심리정서검사" className="h-5" />
        </button>
        <div className="flex items-center gap-4">
          {/* [PROTOTYPE MOCK] 계정 전환 버튼 */}
          <button
            onClick={handleSwitchToStudent}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            title="학생 계정으로 전환 (목업)"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>학생 전환</span>
          </button>
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <p className="text-sm font-medium text-gray-900">{user?.name || '사용자'}</p>
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isResultsOpen, setIsResultsOpen] = useState(true); // 결과보기 하위 메뉴 펼침 상태
  const isActive = (path: string) => location.pathname.startsWith(path);
  const isResultActive = location.pathname.startsWith('/dashboard');

  // Feature Flag에 따라 네비게이션 필터링
  const filteredNavGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.feature || FEATURES[item.feature]),
      }))
      .filter((group) => group.items.length > 0);
  }, []);

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <nav className={`flex-1 overflow-y-auto p-4 ${isCollapsed ? 'px-2' : ''}`}>
        {filteredNavGroups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? 'mt-4' : ''}>
            {/* 그룹 구분선 (첫 번째 그룹 제외) */}
            {groupIndex > 0 && (
              <div className={`border-t border-gray-200 ${isCollapsed ? 'mx-1' : 'mx-2'} mb-4`} />
            )}

            {/* 그룹 제목 (Collapsed 상태에서는 숨김) */}
            {!isCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.title}
              </h3>
            )}

            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const isResultItem = item.label === '결과보기';

                return (
                  <li key={item.path}>
                    {isResultItem ? (
                      // 결과보기 메뉴 (하위 메뉴 포함)
                      <>
                        <button
                          onClick={() => !isCollapsed && setIsResultsOpen(!isResultsOpen)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isResultActive
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-600 hover:bg-gray-50'
                          } ${isCollapsed ? 'justify-center px-0' : ''}`}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 text-left">{item.label}</span>
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${isResultsOpen ? 'rotate-180' : ''}`}
                              />
                            </>
                          )}
                        </button>
                        {/* 결과보기 하위 메뉴 */}
                        {!isCollapsed && isResultsOpen && (
                          <ul className="mt-1 ml-4 space-y-1">
                            {RESULT_SUB_ITEMS.map((subItem) => {
                              const subActive = location.pathname.startsWith(subItem.path);
                              return (
                                <li key={subItem.path}>
                                  <button
                                    onClick={() => navigate(subItem.path)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                      subActive
                                        ? 'bg-primary-50 text-primary-600 font-medium'
                                        : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    <span>{subItem.label}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </>
                    ) : (
                      // 일반 메뉴
                      <button
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            {active && <ChevronRight className="w-4 h-4" />}
                          </>
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

      </nav>

      {/* 접기/펼치기 버튼 - 하단 고정 */}
      <div className="border-t border-gray-200 p-2">
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title={isCollapsed ? '메뉴 펼치기' : '메뉴 접기'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5" />
              <span>메뉴 접기</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
        <main
          className={`flex-1 mt-16 p-6 transition-all duration-300 overflow-x-hidden ${
            isCollapsed ? 'ml-16' : 'ml-64'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
