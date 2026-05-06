import { UserCircle, LogOut } from 'lucide-react';
import { BellWithPanel } from './BellWithPanel';

/**
 * 학생 헤더 Mock — frontend/src/widgets/layout/StudentLayout.tsx 의 StudentHeader 구조 반영
 * - "학습심리정서검사" 타이틀 / (신규) Bell(+뱃지+패널) / 사용자 이름 + 역할 + 아바타 + 로그아웃
 * - 현재 frontend에는 Bell이 없지만, 알림 기능 추가를 위해 mock에서는 포함
 */
export const StudentMockHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-8">
        <button className="text-lg font-bold text-primary-600">학습심리정서검사</button>

        <div className="flex items-center gap-4">
          <BellWithPanel role="student" />

          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">김학생</p>
              <p className="text-xs text-gray-500">학생</p>
            </div>
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-blue-600" />
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

export default StudentMockHeader;
