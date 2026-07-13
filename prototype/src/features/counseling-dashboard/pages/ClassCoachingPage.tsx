/**
 * 학급 코칭 페이지 (/coaching/class)
 *
 * 학급 전체 대상 코칭 정보
 * - 반 미선택: 반 선택 안내 메시지
 * - 반 선택: 학급 코칭 뷰 (ClassCoachingView)
 */

import { Info } from 'lucide-react';
import { useLayoutContext } from '@/app/LayoutV2';
import { ClassCoachingView } from '../components';
import { MOCK_CLASS_COACHING_DATA } from '../mock-data';

export const ClassCoachingPage: React.FC = () => {
  const { selectedClass } = useLayoutContext();

  // 반 미선택 시 안내 메시지
  if (!selectedClass) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">학급 코칭</h1>
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            좌측 메뉴에서 반을 선택하면 학급 코칭 정보를 확인할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">학급 코칭</h1>
      <ClassCoachingView data={MOCK_CLASS_COACHING_DATA} />
    </div>
  );
};

export default ClassCoachingPage;
