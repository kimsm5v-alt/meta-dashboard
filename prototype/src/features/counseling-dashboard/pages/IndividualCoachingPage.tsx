/**
 * 개별 코칭 페이지 (/coaching/individual)
 *
 * 개별 학생 대상 코칭 정보
 * - 반 미선택: 반 선택 안내 메시지
 * - 반 선택 + 학생 미선택: 학생 선택 안내 메시지
 * - 반 선택 + 학생 선택: 학생 코칭 뷰 (StudentCoachingView)
 *
 * Note: 학생 목록은 LNB에서 제공하므로 별도 구현 불필요
 */

import { Info, User } from 'lucide-react';
import { useLayoutContext } from '@/app/LayoutV2';
import { StudentCoachingView } from '../components';
import { getStudentCoachingData } from '../mock-data';

export const IndividualCoachingPage: React.FC = () => {
  const { selectedClass, selectedStudent } = useLayoutContext();

  // 반 미선택 시 안내 메시지
  if (!selectedClass) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">개별 코칭</h1>
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            좌측 메뉴에서 반을 선택하면 개별 코칭 정보를 확인할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  // 학생 코칭 데이터
  const studentCoachingData = selectedStudent
    ? getStudentCoachingData(selectedStudent.id)
    : null;

  // 학생 미선택 시 안내 메시지
  if (!selectedStudent || !studentCoachingData) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">개별 코칭</h1>
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            좌측 메뉴에서 학생을 선택하면 개별 코칭 정보를 확인할 수 있습니다.
          </p>
        </div>
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
