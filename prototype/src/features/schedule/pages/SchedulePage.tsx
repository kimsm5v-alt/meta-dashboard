/**
 * 상담·코칭 > 학생 상담
 *
 * 3가지 상태로 구분:
 * - 반 미선택 (화면 7번): 전체 현황 대시보드
 * - 반 전체 (화면 8번): 우선순위 학생, 상담 통계
 * - 학생 선택 (화면 9번): AI 질문, 메모, 상담 이력
 *
 * LayoutV2의 context를 사용하여 LNB와 상태 동기화
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  CounselingSummaryCards,
  RecentCounselingList,
  PriorityStudentsList,
  CounselingStatsCard,
  StudentCounselingSummaryCard,
  AIRecommendedQuestions,
  CounselingMemoEditor,
  CounselingHistoryList,
} from '../components';
import {
  MOCK_COUNSELING_OVERVIEW,
  MOCK_RECENT_RECORDS,
  MOCK_SCHEDULED_RECORDS,
  MOCK_PRIORITY_STUDENTS,
  MOCK_COUNSELING_STATS,
  MOCK_RECOMMENDED_QUESTIONS,
  getStudentCounselingSummary,
} from '../mock-data';
import type { CounselingMemoData } from '../components/CounselingMemoEditor';
import { useLayoutContext } from '@/app/LayoutV2';

export const SchedulePage = () => {
  const location = useLocation();
  // LayoutV2 context 사용
  const { selectedClass, selectedStudent, setSelectedStudent, setActiveSubTab } = useLayoutContext();

  // URL path에 따라 activeSubTab 동기화
  useEffect(() => {
    if (location.pathname === '/counseling/student' || location.pathname === '/counseling' || location.pathname === '/schedule') {
      setActiveSubTab('student');
    }
  }, [location.pathname, setActiveSubTab]);

  // 상담 저장 핸들러
  const handleSaveCounseling = (data: CounselingMemoData) => {
    console.log('상담 저장:', data);
    // 실제 구현에서는 API 호출
  };

  // 학생 선택 핸들러 (우선순위 목록에서 클릭 시)
  const handleStudentSelect = (studentId: string) => {
    // mock 학생 데이터에서 찾기
    const student = MOCK_PRIORITY_STUDENTS.find((s) => s.id === studentId);
    if (student) {
      setSelectedStudent({ id: student.id, name: student.name });
    }
  };

  // 현재 선택된 학생 정보
  const studentSummary = selectedStudent ? getStudentCounselingSummary(selectedStudent.id) : null;

  // 학생의 상담 이력 (실제로는 API에서 가져옴)
  const studentCounselingRecords = selectedStudent
    ? MOCK_RECENT_RECORDS.filter((r) => r.studentId === selectedStudent.id)
    : [];

  // 뷰 상태 결정: 반 미선택 / 반 전체 / 학생 선택
  const viewState = !selectedClass ? 'overview' : !selectedStudent ? 'class' : 'student';

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">학생 상담</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>상담·코칭</span>
            <ChevronRight className="w-4 h-4" />
            <span>학생 상담</span>
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

      {/* 화면 7번: 전체 현황 (반 미선택) */}
      {viewState === 'overview' && (
        <div className="space-y-6">
          {/* 요약 카드 */}
          <CounselingSummaryCards summary={MOCK_COUNSELING_OVERVIEW} />

          {/* 안내 메시지 */}
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 text-center">
            <p className="text-primary-700">
              좌측 메뉴에서 <span className="font-semibold">반을 선택</span>하면 상담 관리를 시작할 수 있습니다.
            </p>
          </div>

          {/* 최근/예정 상담 */}
          <div className="grid grid-cols-2 gap-6">
            <RecentCounselingList
              title="최근 상담"
              records={MOCK_RECENT_RECORDS}
              type="recent"
              onRecordClick={(record) => console.log('상담 기록 클릭:', record.id)}
            />
            <RecentCounselingList
              title="예정 상담"
              records={MOCK_SCHEDULED_RECORDS}
              type="scheduled"
              onRecordClick={(record) => console.log('예정 상담 클릭:', record.id)}
            />
          </div>
        </div>
      )}

      {/* 화면 8번: 반 전체 */}
      {viewState === 'class' && selectedClass && (
        <div className="space-y-6">
          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-blue-700 text-sm">
              좌측 학생 목록에서 <span className="font-semibold">학생을 선택</span>하면 개별 상담 화면으로 이동합니다.
            </p>
          </div>

          {/* 우선 상담 대상 + 통계 */}
          <div className="grid grid-cols-2 gap-6">
            <PriorityStudentsList
              students={MOCK_PRIORITY_STUDENTS}
              onStudentClick={handleStudentSelect}
            />
            <CounselingStatsCard stats={MOCK_COUNSELING_STATS} />
          </div>
        </div>
      )}

      {/* 화면 9번: 학생 선택 */}
      {viewState === 'student' && selectedStudent && studentSummary && (
        <div className="space-y-6">
          {/* 학생 요약 헤더 */}
          <StudentCounselingSummaryCard summary={studentSummary} />

          {/* AI 추천 질문 + 메모 에디터 */}
          <div className="grid grid-cols-2 gap-6">
            <AIRecommendedQuestions
              questions={MOCK_RECOMMENDED_QUESTIONS}
              studentName={selectedStudent.name}
            />
            <CounselingMemoEditor
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              onSave={handleSaveCounseling}
            />
          </div>

          {/* 상담 이력 */}
          <CounselingHistoryList
            records={studentCounselingRecords}
            studentName={selectedStudent.name}
          />
        </div>
      )}
    </div>
  );
};
