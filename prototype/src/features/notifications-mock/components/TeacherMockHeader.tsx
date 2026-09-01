import { Settings, User, LogOut } from 'lucide-react';
import serviceLogo from '@/assets/allvia_sel_logo.svg';
import { BellWithPanel } from './BellWithPanel';

/**
 * 교사 헤더 Mock — frontend/src/widgets/layout/MainLayout.tsx 의 Header 구조 반영
 * - 로고 / Bell(+뱃지+패널) / Settings / 사용자 이름 + 아바타 + 로그아웃
 * - 실제 auth, navigate 대신 목업 상태 사용
 */
export const TeacherMockHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <button className="flex items-center">
          <img src={serviceLogo} alt="AllviA SEL" className="h-10" />
        </button>

        <div className="flex items-center gap-4">
          <BellWithPanel role="teacher" />

          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            aria-label="설정"
          >
            <Settings className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <p className="text-sm font-medium text-gray-900">홍선생</p>
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <button
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

export default TeacherMockHeader;
