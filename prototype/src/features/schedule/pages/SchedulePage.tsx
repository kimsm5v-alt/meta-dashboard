/**
 * 검사 > 학생 상담
 *
 * 3가지 상태로 구분:
 * - 반 미선택 (화면 6번): 전체 현황 대시보드
 * - 반 전체 (화면 7번): 상담 기준 필터 + 학생 목록
 * - 학생 선택 (화면 8번): 학생 요약, AI 총평, 진단 결과, 추천 질문, 상담 기록
 *
 * LayoutV2의 context를 사용하여 LNB와 상태 동기화
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import {
  CounselingSummaryCards,
  RecentCounselingList,
  ClassCounselingStatusTable,
  StudentCounselingList,
  StudentCounselingHeader,
  AISummaryCard,
  DiagnosisResultCard,
  AIRecommendedQuestions,
  CounselingMemoEditor,
  CounselingHistoryList,
  CounselingWeekCalendar,
} from '../components';
import {
  MOCK_COUNSELING_OVERVIEW,
  MOCK_RECENT_RECORDS,
  MOCK_SCHEDULED_RECORDS,
  MOCK_CLASS_COUNSELING_STATUS,
  MOCK_CLASS_COUNSELING_STUDENTS,
  getStudentCounselingSummary,
} from '../mock-data';
import type { CounselingMemoData } from '../components/CounselingMemoEditor';
import { useLayoutContext } from '@/app/LayoutV2';

// Mock 학교 정보
const MOCK_SCHOOL_INFO = {
  schoolName: '한빛중학교',
  eduLevel: '중학교',
};

export const SchedulePage = () => {
  const location = useLocation();
  const { selectedClass, setSelectedClass, selectedStudent, setSelectedStudent, setActiveSubTab } =
    useLayoutContext();

  // URL path에 따라 activeSubTab 동기화
  useEffect(() => {
    if (
      location.pathname === '/exam/counseling' ||
      location.pathname === '/counseling/student' ||
      location.pathname === '/counseling' ||
      location.pathname === '/schedule'
    ) {
      setActiveSubTab('counseling');
    }
  }, [location.pathname, setActiveSubTab]);

  // 상담 저장 핸들러
  const handleSaveCounseling = (data: CounselingMemoData) => {
    console.log('상담 저장:', data);
    // 실제 구현에서는 API 호출
  };

  // 학생 선택 핸들러
  const handleStudentSelect = (studentId: string) => {
    const student = MOCK_CLASS_COUNSELING_STUDENTS.find((s) => s.id === studentId);
    if (student) {
      setSelectedStudent({ id: student.id, name: student.name });
    }
  };

  // 반 선택 핸들러 (전체 현황에서)
  const handleClassSelect = (classId: string) => {
    const cls = MOCK_CLASS_COUNSELING_STATUS.find((c) => c.classId === classId);
    if (cls) {
      setSelectedClass({ id: cls.classId, name: cls.className, status: `총 ${cls.totalStudents}명 · 상담 ${cls.counseledThisMonth}` });
    }
  };

  // 뒤로가기 핸들러
  const handleBackToOverview = () => {
    setSelectedClass(null);
    setSelectedStudent(null);
  };

  const handleBackToClass = () => {
    setSelectedStudent(null);
  };

  // 현재 선택된 학생 정보
  const studentSummary = selectedStudent ? getStudentCounselingSummary(selectedStudent.id) : null;

  // 학생의 상담 이력
  const studentCounselingRecords = selectedStudent
    ? MOCK_RECENT_RECORDS.filter((r) => r.studentId === selectedStudent.id)
    : [];

  // 뷰 상태 결정
  const viewState = !selectedClass ? 'overview' : !selectedStudent ? 'class' : 'student';

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      {viewState === 'overview' && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900">학생 상담</h1>
          <p className="text-sm text-gray-500 mt-1">
            담당 학급 {MOCK_CLASS_COUNSELING_STATUS.length}개 반 · 총 학생{' '}
            {MOCK_CLASS_COUNSELING_STATUS.reduce((sum, c) => sum + c.totalStudents, 0)}명
          </p>
        </div>
      )}

      {viewState === 'class' && selectedClass && (
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToOverview}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedClass.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {MOCK_SCHOOL_INFO.schoolName} · {MOCK_SCHOOL_INFO.eduLevel} 2학년 {selectedClass.name.split('-')[1]}
            </p>
          </div>
        </div>
      )}

      {viewState === 'student' && selectedStudent && selectedClass && (
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToClass}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedStudent.name} 학생 상담</h1>
            <p className="text-sm text-gray-500 mt-1">
              {selectedClass.name} · 결과를 확인하며 상담을 준비합니다
            </p>
          </div>
        </div>
      )}

      {/* 화면 6번: 전체 현황 (반 미선택) */}
      {viewState === 'overview' && (
        <>
          {/* 요약 카드 */}
          <CounselingSummaryCards summary={MOCK_COUNSELING_OVERVIEW} />

          {/* 주간 상담 캘린더 */}
          <CounselingWeekCalendar
            records={[...MOCK_RECENT_RECORDS, ...MOCK_SCHEDULED_RECORDS]}
            onRecordClick={(record) => console.log('캘린더 상담 클릭:', record.id)}
          />

          {/* 반별 상담 현황 */}
          <ClassCounselingStatusTable
            classes={MOCK_CLASS_COUNSELING_STATUS}
            onClassClick={handleClassSelect}
          />

          {/* 최근/예정 상담 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </>
      )}

      {/* 화면 7번: 반 전체 */}
      {viewState === 'class' && selectedClass && (
        <>
          {/* 반 요약 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-500 mb-1">총 학생</p>
              <p className="text-3xl font-bold text-gray-900">
                {MOCK_CLASS_COUNSELING_STUDENTS.length}
                <span className="text-lg font-medium text-gray-400 ml-1">명</span>
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-500 mb-1">상담 우선</p>
              <p className="text-3xl font-bold text-red-600">
                {MOCK_CLASS_COUNSELING_STUDENTS.filter((s) => s.tags.includes('burden')).length}
                <span className="text-lg font-medium text-gray-400 ml-1">명</span>
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-500 mb-1">강점 활용 가능</p>
              <p className="text-3xl font-bold text-green-600">
                {MOCK_CLASS_COUNSELING_STUDENTS.filter((s) => s.tags.includes('strength')).length}
                <span className="text-lg font-medium text-gray-400 ml-1">명</span>
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-500 mb-1">신뢰도 확인 필요</p>
              <p className="text-3xl font-bold text-yellow-600">
                {MOCK_CLASS_COUNSELING_STUDENTS.filter((s) => s.tags.includes('reliability')).length}
                <span className="text-lg font-medium text-gray-400 ml-1">명</span>
              </p>
            </div>
          </div>

          {/* 주간 상담 캘린더 */}
          <CounselingWeekCalendar
            records={MOCK_RECENT_RECORDS.filter((r) => r.classId === selectedClass.id || r.className === selectedClass.name)}
            onRecordClick={(record) => console.log('캘린더 상담 클릭:', record.id)}
          />

          {/* 학생 목록 (필터) + 이 반 최근 상담 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StudentCounselingList
              students={MOCK_CLASS_COUNSELING_STUDENTS}
              onStudentClick={handleStudentSelect}
            />
            <RecentCounselingList
              title="이 반 최근 상담"
              records={MOCK_RECENT_RECORDS.filter((r) => r.classId === selectedClass.id || r.className === selectedClass.name)}
              type="recent"
              onRecordClick={(record) => console.log('상담 기록 클릭:', record.id)}
            />
          </div>
        </>
      )}

      {/* 화면 8번: 학생 선택 */}
      {viewState === 'student' && selectedStudent && studentSummary && (
        <>
          {/* 1. 학생 요약 (상단) */}
          <StudentCounselingHeader summary={studentSummary} />

          {/* 2. AI 분석 총평 */}
          <AISummaryCard summary={studentSummary} />

          {/* 3. 진단 검사 결과 확인 */}
          <DiagnosisResultCard summary={studentSummary} />

          {/* 4. 확인할 사항 안내 + 상담 기록 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIRecommendedQuestions
              questions={studentSummary.recommendedQuestions}
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

          {/* 코칭 연결 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                // 코칭 페이지로 이동 (실제 구현 시 라우팅)
                console.log('코칭 연결:', selectedStudent.id);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              <span>코칭 연결</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
