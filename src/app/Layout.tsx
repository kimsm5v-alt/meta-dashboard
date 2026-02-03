import { ReactNode } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { MOCK_CLASSES } from '@/shared/data/mockData';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: ClipboardList, label: '검사하기', path: '/assessment' },
  { icon: LayoutDashboard, label: '대시보드', path: '/dashboard' },
  { icon: Calendar, label: '상담일정', path: '/schedule' },
  { icon: MessageSquare, label: 'AI 어시스턴트', path: '/ai-room' },
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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">META</h1>
            <p className="text-xs text-gray-500">학습심리정서검사</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name || '사용자'}</p>
              <p className="text-xs text-gray-500">
                {user?.memberType === 'vivasam' ? '비바샘 회원' : '일반 회원'}
              </p>
            </div>
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

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
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
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4" />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase">
            담당 학급
          </h3>
          <ul className="mt-2 space-y-1">
            {MOCK_CLASSES.map((cls) => (
              <li key={cls.id}>
                <button
                  onClick={() => navigate(`/dashboard/class/${cls.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Users className="w-4 h-4" />
                  <span>{`${cls.grade}-${cls.classNumber}반`}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 mt-16 p-6">{children}</main>
    </div>
  </div>
);

export default Layout;
