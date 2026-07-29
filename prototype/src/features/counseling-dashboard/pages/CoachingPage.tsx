/**
 * 통합 코칭 페이지 (/coaching)
 *
 * 반/학생 선택 상태에 따라 자동 전환:
 * - 반 미선택: 코칭 Overview (철학/배경 소개)
 * - 반 선택: 학급 코칭 뷰
 * - 반 + 학생 선택: 개별 코칭 뷰
 */

import { useLayoutContext } from '@/app/LayoutV2';
import { CoachingOverviewView, ClassCoachingView, StudentCoachingView } from '../components';
import { MOCK_CLASS_COACHING_DATA, getStudentCoachingData } from '../mock-data';

export const CoachingPage: React.FC = () => {
  const { selectedClass, selectedStudent } = useLayoutContext();

  // 학생 코칭 데이터
  const studentCoachingData = selectedStudent
    ? getStudentCoachingData(selectedStudent.id)
    : null;

  // 반 + 학생 선택 시: 개별 코칭
  if (selectedClass && selectedStudent && studentCoachingData) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">개별 코칭</h1>
        <StudentCoachingView data={studentCoachingData} />
      </div>
    );
  }

  // 반만 선택 시: 학급 코칭
  if (selectedClass) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">학급 코칭</h1>
        <ClassCoachingView data={MOCK_CLASS_COACHING_DATA} />
      </div>
    );
  }

  // 반 미선택 시: 코칭 Overview
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">코칭</h1>
      <CoachingOverviewView />
    </div>
  );
};

export default CoachingPage;
