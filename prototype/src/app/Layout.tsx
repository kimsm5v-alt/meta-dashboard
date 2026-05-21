import { ReactNode, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Bell,
  Settings,
  User,
  ChevronRight,
  LogOut,
  ClipboardList,
  Calendar,
  PanelLeftClose,
  PanelLeft,
  Loader2,
  BarChart3,
  BookOpen,
  Bot,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useTeacherClasses } from '@/shared/hooks/useApiData';
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

const navGroups: NavGroup[] = [
  {
    title: '검사',
    items: [
      // 그룹 관리 + 검사하기 통합 → 검사하기 단일 메뉴
      { icon: ClipboardList, label: '검사하기', path: '/assessment', feature: 'ASSESSMENT' },
      { icon: LayoutDashboard, label: '대시보드', path: '/dashboard', feature: 'DASHBOARD' },
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

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <button onClick={() => navigate('/')} className="flex items-center">
          <img src={serviceLogo} alt="학습심리정서검사" className="h-5" />
        </button>
        <div className="flex items-center gap-4">
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
  const { classes, isLoading, examStatus } = useTeacherClasses();
  const isActive = (path: string) => location.pathname.startsWith(path);

  // Feature Flag에 따라 네비게이션 필터링
  const filteredNavGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.feature || FEATURES[item.feature]),
      }))
      .filter((group) => group.items.length > 0);
  }, []);

  // 담당 학급 섹션 렌더링
  const renderClassList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          {!isCollapsed && <span className="ml-2 text-xs text-gray-400">로딩 중...</span>}
        </div>
      );
    }

    if (examStatus === 'no-exams') {
      if (isCollapsed) return null;
      return (
        <p className="px-3 py-2 text-xs text-gray-400">
          생성된 검사가 없습니다
        </p>
      );
    }

    if (examStatus === 'in-progress') {
      if (isCollapsed) return null;
      return (
        <p className="px-3 py-2 text-xs text-gray-400">
          진행 중인 검사만 있습니다
        </p>
      );
    }

    if (classes.length === 0) {
      if (isCollapsed) return null;
      return (
        <p className="px-3 py-2 text-xs text-gray-400">
          종료된 검사가 없습니다
        </p>
      );
    }

    return (
      <ul className={isCollapsed ? 'space-y-1' : 'mt-2 space-y-1'}>
        {classes.map((cls) => (
          <li key={cls.id}>
            <button
              onClick={() => navigate(`/dashboard/class/${cls.id}`)}
              className={
                isCollapsed
                  ? 'w-full flex items-center justify-center py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50'
                  : 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50'
              }
              title={`${cls.grade}-${cls.classNumber}반`}
            >
              {isCollapsed ? (
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                  {cls.classNumber}
                </span>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>{`${cls.grade}-${cls.classNumber}반`}</span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    );
  };

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
                return (
                  <li key={item.path}>
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
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* 담당 학급 섹션 */}
        {!isCollapsed ? (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              담당 학급
            </h3>
            {renderClassList()}
          </div>
        ) : (
          <div className="mt-4 border-t border-gray-200 pt-4">
            {renderClassList()}
          </div>
        )}
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
          className={`flex-1 mt-16 p-6 transition-all duration-300 ${
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
