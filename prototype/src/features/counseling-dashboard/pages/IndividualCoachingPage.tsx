/**
 * 개별 코칭 페이지 (/coaching/individual)
 *
 * 개별 학생 대상 코칭 정보
 * - 반 미선택: 코칭 Overview (철학/배경 소개)
 * - 반 선택 + 학생 미선택: 코칭 Overview (철학/배경 소개)
 * - 반 선택 + 학생 선택: 학생 코칭 뷰 (StudentCoachingView)
 *
 * Note: 학생 목록은 LNB에서 제공하므로 별도 구현 불필요
 */

import { useLayoutContext } from '@/app/LayoutV2';
import { StudentCoachingView, CoachingOverviewView } from '../components';
import { getStudentCoachingData } from '../mock-data';

export const IndividualCoachingPage: React.FC = () => {
  const { selectedClass, selectedStudent } = useLayoutContext();

  // 학생 코칭 데이터
  const studentCoachingData = selectedStudent
    ? getStudentCoachingData(selectedStudent.id)
    : null;

  // 반 미선택 또는 학생 미선택 시 코칭 Overview 표시
  if (!selectedClass || !selectedStudent || !studentCoachingData) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">개별 코칭</h1>
        <CoachingOverviewView />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">개별 코칭</h1>
      <StudentCoachingView data={studentCoachingData} />
    </div>
  );
};

export default IndividualCoachingPage;
