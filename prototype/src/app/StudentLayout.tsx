/**
 * 학생용 레이아웃
 *
 * 교사용 Layout과 다른 점:
 * - 간단한 메뉴 (검사하기, 대시보드)
 * - 담당 학급 섹션 없음
 * - 학생 정보 표시
 */

import { ReactNode, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  BarChart3,
  Users,
  Bell,
  Settings,
  User,
  ChevronRight,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  UserCircle,
  ArrowRightLeft,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import serviceLogo from '@/assets/logo_2.png';

interface StudentLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  hasSubMenu?: boolean;
}

// 결과보기 하위 메뉴 (검사 종류)
interface ResultSubItem {
  label: string;
  path: string;
  testId: string;
}

const RESULT_SUB_ITEMS: ResultSubItem[] = [
  { label: '학습종합검사', path: '/student/result/comprehensive', testId: 'comprehensive' },
  { label: '자기조절학습검사', path: '/student/result/selfreg', testId: 'selfreg' },
];

const studentNavItems: NavItem[] = [
  { icon: Users, label: '나의 그룹', path: '/student/groups' },
  { icon: ClipboardList, label: '검사하기', path: '/student/exams' },
  { icon: BarChart3, label: '결과보기', path: '/student/result', hasSubMenu: true },
];

const StudentHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // [PROTOTYPE MOCK] 교사 계정으로 전환
  const handleSwitchToTeacher = () => {
    navigate('/home');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <button onClick={() => navigate('/student/exams')} className="flex items-center">
          <img src={serviceLogo} alt="학습심리정서검사" className="h-5" />
        </button>
        <div className="flex items-center gap-4">
          {/* [PROTOTYPE MOCK] 계정 전환 버튼 */}
          <button
            onClick={handleSwitchToTeacher}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            title="교사 계정으로 전환 (목업)"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>교사 전환</span>
          </button>
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name || '학생'}</p>
              <p className="text-xs text-gray-500">학생</p>
            </div>
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
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

interface StudentSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isResultsOpen, setIsResultsOpen] = useState(true); // 결과보기 하위 메뉴 펼침 상태

  const isActive = (path: string) => location.pathname.startsWith(path);
  const isResultActive = location.pathname.startsWith('/student/result');

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <nav className={`flex-1 overflow-y-auto p-4 ${isCollapsed ? 'px-2' : ''}`}>
        {/* 학생 프로필 카드 */}
        {!isCollapsed && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name || '학생'}</p>
                <p className="text-xs text-gray-500">학습심리정서검사</p>
              </div>
            </div>
          </div>
        )}

        {/* 메뉴 제목 */}
        {!isCollapsed && (
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            메뉴
          </h3>
        )}

        {/* 네비게이션 */}
        <ul className="space-y-1">
          {studentNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isResultItem = item.hasSubMenu;

            return (
              <li key={item.path}>
                {isResultItem ? (
                  // 결과보기 메뉴 (하위 메뉴 포함)
                  <>
                    <button
                      onClick={() => !isCollapsed && setIsResultsOpen(!isResultsOpen)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isResultActive
                          ? 'bg-blue-50 text-blue-600'
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
                                    ? 'bg-blue-50 text-blue-600 font-medium'
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
                        ? 'bg-blue-50 text-blue-600'
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
      </nav>

      {/* 접기/펼치기 버튼 */}
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

export const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, updateUser } = useAuth();

  // 학생 그룹 정보 로드 (classId 설정)
  // [PROTOTYPE MOCK] 목업 환경에서는 그룹 로드 스킵
  useEffect(() => {
    // 목업 환경에서는 classId가 없어도 동작하도록 처리
    if (user?.roleCode === 'STUDENT' && user?.stdtId && !user?.classId) {
      // 목업 데이터로 대체 - 실제 API 호출 없이 mock classId 설정
      updateUser({ classId: 'mock-class-id' });
      console.info('[StudentLayout] 목업 모드: mock classId 설정 완료');
    }
  }, [user?.roleCode, user?.stdtId, user?.classId, updateUser]);

  const handleToggle = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader />
      <div className="flex">
        <StudentSidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
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

export default StudentLayout;
