/**
 * API 개발자 모드 토글 버튼 (FAB)
 *
 * 화면 우하단에 플로팅 버튼으로 표시되며,
 * 클릭 시 API 개발자 모드를 ON/OFF 합니다.
 */

import { Code2 } from 'lucide-react';
import { useApiDevMode } from '@/shared/contexts/ApiDevModeContext';

export const ApiDevToggle: React.FC = () => {
  const { isApiDevMode, toggleApiDevMode } = useApiDevMode();

  return (
    <button
      type="button"
      onClick={toggleApiDevMode}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        flex items-center justify-center
        shadow-lg transition-all duration-200
        ${
          isApiDevMode
            ? 'bg-violet-600 text-white hover:bg-violet-700 ring-4 ring-violet-200'
            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
        }
      `}
      title={isApiDevMode ? 'API 개발자 모드 끄기' : 'API 개발자 모드 켜기'}
    >
      <Code2 className="w-6 h-6" />
      <span
        className={`
          absolute -top-1 -right-1
          w-5 h-5 rounded-full text-[10px] font-bold
          flex items-center justify-center
          ${isApiDevMode ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}
        `}
      >
        {isApiDevMode ? 'ON' : ''}
      </span>
    </button>
  );
};

export default ApiDevToggle;
