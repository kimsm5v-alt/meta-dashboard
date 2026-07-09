/**
 * 검사 목록 빈 상태 컴포넌트
 */

import { ClipboardList } from 'lucide-react';

export const EmptyExamList: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <ClipboardList className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        아직 검사가 없습니다
      </h3>
      <p className="text-gray-500 text-center max-w-sm">
        선생님이 검사를 시작하면 이곳에 표시됩니다.
        <br />
        잠시 후 다시 확인해주세요.
      </p>
    </div>
  );
};
