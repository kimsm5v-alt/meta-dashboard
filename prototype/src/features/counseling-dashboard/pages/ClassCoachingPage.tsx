/**
 * 학급 코칭 페이지 (/coaching/class)
 *
 * 학급 전체 대상 코칭 정보
 * - 반 미선택: 코칭 Overview (철학/배경 소개)
 * - 반 선택: 학급 코칭 뷰 (ClassCoachingView)
 */

import { useLayoutContext } from '@/app/LayoutV2';
import { ClassCoachingView, CoachingOverviewView } from '../components';
import { MOCK_CLASS_COACHING_DATA } from '../mock-data';

export const ClassCoachingPage: React.FC = () => {
  const { selectedClass } = useLayoutContext();

  // 반 미선택 시 코칭 Overview 표시
  if (!selectedClass) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">학급 코칭</h1>
        <CoachingOverviewView />
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
