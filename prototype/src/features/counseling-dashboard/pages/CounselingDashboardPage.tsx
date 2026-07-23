/**
 * 상담·코칭 > 코칭
 *
 * 화면 10번: 코칭 - 반 전체
 * - 반 특성 분석
 * - SEL 콘텐츠 추천
 * - 반 운영 전략
 * - 코칭 진행 현황
 *
 * LayoutV2의 context를 사용하여 LNB와 상태 동기화
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  ClassCharacteristicsCard,
  SELContentList,
  ClassStrategyCard,
  CoachingProgressList,
} from '../components';
import {
  MOCK_CLASS_CHARACTERISTICS,
  MOCK_SEL_CONTENTS,
  MOCK_CLASS_STRATEGIES,
  MOCK_COACHING_PROGRESS,
} from '../mock-data';
import { useLayoutContext } from '@/app/LayoutV2';

export const CounselingDashboardPage = () => {
  const location = useLocation();
  // LayoutV2 context 사용
  const { selectedClass, selectedStudent, setSelectedStudent, setActiveSubTab } = useLayoutContext();

  // URL path에 따라 activeSubTab 동기화
  useEffect(() => {
    if (location.pathname === '/counseling/coaching' || location.pathname === '/counseling-dashboard') {
      setActiveSubTab('coaching');
    }
  }, [location.pathname, setActiveSubTab]);

  // 학생 클릭 핸들러
  const handleStudentClick = (studentId: string) => {
    // 코칭 진행 목록에서 학생 클릭 시
    const progress = MOCK_COACHING_PROGRESS.find((p) => p.studentId === studentId);
    if (progress) {
      setSelectedStudent({ id: progress.studentId, name: progress.studentName });
    }
  };

  // 콘텐츠 클릭 핸들러
  const handleContentClick = (contentId: string) => {
    console.log('콘텐츠 클릭:', contentId);
    // 콘텐츠 상세 모달 - 추후 구현
  };

  // 뷰 상태 결정: 반 미선택 / 반 전체 / 학생 선택
  const viewState = !selectedClass ? 'overview' : !selectedStudent ? 'class' : 'student';

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">코칭</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>상담·코칭</span>
            <ChevronRight className="w-4 h-4" />
            <span>코칭</span>
            {selectedClass && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span>{selectedClass.name}</span>
              </>
            )}
            {selectedStudent && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span>{selectedStudent.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 반 미선택: 안내 + 전체 현황 */}
      {viewState === 'overview' && (
        <div className="space-y-6">
          {/* 안내 메시지 */}
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 text-center">
            <p className="text-primary-700">
              좌측 메뉴에서 <span className="font-semibold">반을 선택</span>하면 코칭 전략을 확인할 수 있습니다.
            </p>
          </div>

          {/* 전체 코칭 진행 현황 */}
          <CoachingProgressList
            progressList={MOCK_COACHING_PROGRESS}
            onStudentClick={handleStudentClick}
          />
        </div>
      )}

      {/* 화면 10번: 반 전체 */}
      {viewState === 'class' && selectedClass && (
        <div className="space-y-6">
          {/* 반 특성 분석 */}
          <ClassCharacteristicsCard characteristics={MOCK_CLASS_CHARACTERISTICS} />

          {/* SEL 콘텐츠 + 운영 전략 */}
          <div className="grid grid-cols-2 gap-6">
            <SELContentList
              contents={MOCK_SEL_CONTENTS}
              onContentClick={handleContentClick}
            />
            <ClassStrategyCard strategies={MOCK_CLASS_STRATEGIES} />
          </div>

          {/* 코칭 진행 현황 */}
          <CoachingProgressList
            progressList={MOCK_COACHING_PROGRESS}
            onStudentClick={handleStudentClick}
          />
        </div>
      )}

      {/* 화면 11번: 학생 선택 (추후 구현) */}
      {viewState === 'student' && selectedStudent && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-center">
            <p className="text-amber-700">
              <span className="font-semibold">{selectedStudent.name}</span> 학생의 개별 코칭 전략 화면은 추후 구현 예정입니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
