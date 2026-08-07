/**
 * 홈 (전체 현황 대시보드)
 * - 상단: 퍼플 브랜드 밴드 + 3열 카드 (진행 중인 검사/수업/바로가기)
 * - 탭: 검사/수업 상세 현황
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyMetrics,
  ActiveExams,
  LessonActivity,
  LearningCharacteristics,
  StudentTypeDistribution,
  RecommendedContents,
  SELCompetencyMatrix,
} from '../components';
import {
  HOME_KEY_METRICS,
  HOME_ACTIVE_EXAMS,
  HOME_LESSON_ACTIVE_SESSION,
  HOME_LESSON_SCHEDULED,
  HOME_LESSON_RECENT,
  HOME_SEL_COMPETENCY_MATRIX,
  HOME_RECOMMENDED_CONTENTS,
  HOME_LEARNING_CHARACTERISTICS,
  HOME_STUDENT_TYPE_DISTRIBUTION,
} from '../mock-data';

type TabType = 'exam' | 'lesson';

// 진행 중인 검사 리스트 데이터 변환 (응시율 낮은 순 정렬)
const getOngoingExamList = () => {
  const list: { className: string; round: 1 | 2; rate: number; submitted: number; total: number }[] = [];

  HOME_ACTIVE_EXAMS.forEach((exam) => {
    if (exam.round1.status === 'in_progress') {
      list.push({
        className: exam.className,
        round: 1,
        rate: exam.round1.submissionRate,
        submitted: exam.round1.submittedCount,
        total: exam.round1.totalCount,
      });
    }
    if (exam.round2.status === 'in_progress') {
      list.push({
        className: exam.className,
        round: 2,
        rate: exam.round2.submissionRate,
        submitted: exam.round2.submittedCount,
        total: exam.round2.totalCount,
      });
    }
  });

  // 응시율 낮은 순 정렬
  return list.sort((a, b) => a.rate - b.rate);
};

// 완료된 검사 수 계산
const getCompletedExamCount = () => {
  let count = 0;
  HOME_ACTIVE_EXAMS.forEach((exam) => {
    if (exam.round1.status === 'completed') count++;
    if (exam.round2.status === 'completed') count++;
  });
  return count;
};

export const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const teacherName = '김선생님';
  const totalClasses = HOME_KEY_METRICS.totalClasses;
  const [activeTab, setActiveTab] = useState<TabType>('exam');

  // 검사 데이터
  const ongoingExams = getOngoingExamList();
  const ongoingExamCount = ongoingExams.length;
  const completedExamCount = getCompletedExamCount();

  // 수업 데이터
  const liveClass = HOME_LESSON_ACTIVE_SESSION;
  const upcomingLessons = HOME_LESSON_SCHEDULED;
  const hasActiveLesson = liveClass !== null;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* 인사말 밴드 (퍼플) */}
      <div className="relative overflow-hidden bg-violet-900" style={{ padding: '28px 32px 66px' }}>
        {/* 장식 원 - 우상단 */}
        <div
          className="absolute bg-violet-800 rounded-full"
          style={{ width: 280, height: 280, right: -60, top: -70 }}
        />
        {/* 장식 원 - 우하단 (옵션) */}
        <div
          className="absolute bg-violet-800 rounded-full opacity-60"
          style={{ width: 200, height: 200, right: 100, bottom: -80 }}
        />

        {/* 텍스트 */}
        <div className="relative z-10 max-w-7xl mx-auto">
          <h1 className="text-[26px] font-bold text-white leading-tight">
            안녕하세요, {teacherName} 👋
          </h1>
          <p className="text-sm text-violet-300 mt-2">
            {totalClasses}개 반의 학습 현황을 한눈에 확인하세요
          </p>
        </div>
      </div>

      {/* 카드 행 (3열) - 밴드 위로 겹침 */}
      <div className="relative z-10 max-w-7xl mx-auto px-8" style={{ marginTop: -46 }}>
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 300px' }}>

          {/* 카드 1: 진행 중인 검사 (무채색) */}
          <div className="bg-white rounded-[14px] border border-gray-200 shadow-md flex flex-col" style={{ padding: '18px 20px' }}>
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-gray-900">진행 중인 검사</span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-semibold bg-gray-200 text-gray-600 rounded-full">
                  진행 {ongoingExamCount}건
                </span>
                <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-400 rounded-full">
                  완료 {completedExamCount}건
                </span>
              </div>
            </div>

            {/* 리스트 or 빈 상태 */}
            {ongoingExamCount === 0 ? (
              // 빈 상태
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm font-semibold text-gray-600 mb-2">진행 중인 검사가 없습니다</p>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  반을 선택해 학습심리정서검사를 시작하면<br />여기에 응시 현황이 표시됩니다
                </p>
                <button
                  onClick={() => navigate('/exam/management')}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                >
                  검사 시작하기
                </button>
              </div>
            ) : ongoingExamCount === 1 ? (
              // 1건일 때 - 크게 표시
              <div className="flex-1 flex flex-col justify-center border-y border-gray-100 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg font-bold text-gray-900">{ongoingExams[0].className}</span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-gray-100 text-gray-600 rounded">
                    {ongoingExams[0].round}차
                  </span>
                  <span className="text-sm text-gray-500">학습심리정서검사 · 08-05 시작</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-500 rounded-full transition-all"
                      style={{ width: `${ongoingExams[0].rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                    {ongoingExams[0].rate}% {ongoingExams[0].submitted}/{ongoingExams[0].total}
                  </span>
                </div>
              </div>
            ) : (
              // 2건 이상 - 리스트
              <div className="flex-1">
                {ongoingExams.slice(0, 3).map((exam, idx) => (
                  <div
                    key={`${exam.className}-${exam.round}`}
                    className={`flex items-center gap-3 py-2.5 ${idx > 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <span className="text-sm font-semibold text-gray-700 w-11">{exam.className}</span>
                    <span className="px-2 py-0.5 text-xs font-bold bg-gray-100 text-gray-600 rounded text-center whitespace-nowrap shrink-0">
                      {exam.round}차
                    </span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${exam.rate >= 90 ? 'bg-gray-600' : 'bg-gray-400'}`}
                        style={{ width: `${exam.rate}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-20 text-right">
                      {exam.rate}% {exam.submitted}/{exam.total}
                    </span>
                  </div>
                ))}

                {/* 모두 보기 링크 */}
                {ongoingExamCount > 1 && (
                  <button
                    onClick={() => {
                      setActiveTab('exam');
                      setTimeout(() => {
                        document.getElementById('exam-status-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-full pt-3 mt-2 border-t border-gray-100 text-xs font-medium text-violet-600 hover:text-violet-700 text-left"
                  >
                    진행 중 검사 {ongoingExamCount}건 모두 보기 →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 카드 2: 진행 중인 수업 */}
          <div className="bg-white rounded-[14px] border border-gray-200 shadow-md flex flex-col" style={{ padding: '18px 20px' }}>
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-gray-900">진행 중인 수업</span>
              {hasActiveLesson ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-violet-100 text-violet-700 rounded-full">
                  <span className="w-1.5 h-1.5 bg-violet-600 rounded-full" />
                  LIVE
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-400 rounded-full">
                  없음
                </span>
              )}
            </div>

            {hasActiveLesson && liveClass ? (
              // 진행 중인 수업 있음
              <>
                {/* 반명 + 수업명 */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl font-bold text-gray-900">{liveClass.className}</span>
                  <span className="text-sm text-gray-500">{liveClass.contentName}</span>
                </div>

                {/* 지표 2박스 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-violet-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-gray-400 mb-0.5">접속 인원</span>
                    <span className="text-xl font-bold text-gray-900">
                      {liveClass.connectedStudents}
                      <span className="text-sm font-medium text-gray-400">/{liveClass.totalStudents}</span>
                    </span>
                  </div>
                  <div className="bg-violet-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-gray-400 mb-0.5">참여 코드</span>
                    <span className="text-xl font-bold text-violet-700 font-mono tracking-wider">
                      {liveClass.participationCode}
                    </span>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/lesson/session/${liveClass.id}`)}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                  >
                    이어서 진행
                  </button>
                  <button
                    onClick={() => alert('세션을 종료합니다.')}
                    className="px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    종료
                  </button>
                </div>
              </>
            ) : upcomingLessons.length > 0 ? (
              // 진행 중 없음 + 예정 수업 있음
              <>
                <p className="text-sm text-gray-500 mb-3">예정된 수업이 있습니다</p>
                <div className="flex-1 space-y-2">
                  {upcomingLessons.slice(0, 2).map((lesson, idx) => {
                    const isToday = lesson.scheduledDate === '2026-08-07';
                    return (
                      <div
                        key={lesson.id}
                        className={`p-3 rounded-lg border ${
                          isToday ? 'bg-violet-50 border-gray-200' : 'bg-white border-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold text-gray-900">{lesson.className}</span>
                            <span className="text-xs text-gray-500 ml-2">{lesson.scheduledDate}</span>
                          </div>
                          {isToday ? (
                            <button className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors">
                              시작하기
                            </button>
                          ) : (
                            <button className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
                              자료 보기
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{lesson.contentName}</p>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => navigate('/lesson')}
                  className="w-full mt-3 py-2.5 text-sm font-medium text-violet-700 border border-violet-300 hover:bg-violet-50 rounded-lg transition-colors"
                >
                  새 수업 만들기
                </button>
              </>
            ) : (
              // 진행 중·예정 모두 없음
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <p className="text-sm font-semibold text-gray-600 mb-2">진행 중인 수업이 없습니다</p>
                <p className="text-xs text-gray-400 mb-4">새 수업을 시작해보세요</p>
                <button
                  onClick={() => navigate('/lesson')}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                >
                  수업 시작하기
                </button>
              </div>
            )}
          </div>

          {/* 카드 3: 바로가기 */}
          <div className="bg-white rounded-[14px] border border-gray-200 shadow-md flex flex-col" style={{ padding: '16px 18px' }}>
            <span className="text-base font-bold text-gray-900 mb-5">바로가기</span>
            <div className="flex flex-col gap-2 flex-1">
              {/* 그룹 관리 - 단독 */}
              <button
                onClick={() => navigate('/group')}
                className="w-full py-3.5 px-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-violet-50 hover:text-violet-700 border border-gray-200 hover:border-violet-200 rounded-lg transition-all text-center"
              >
                그룹 관리
              </button>
              {/* 검사 관리 | 검사 결과 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/exam/management')}
                  className="py-3.5 px-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-violet-50 hover:text-violet-700 border border-gray-200 hover:border-violet-200 rounded-lg transition-all text-center"
                >
                  검사 관리
                </button>
                <button
                  onClick={() => navigate('/exam/result')}
                  className="py-3.5 px-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-violet-50 hover:text-violet-700 border border-gray-200 hover:border-violet-200 rounded-lg transition-all text-center"
                >
                  검사 결과
                </button>
              </div>
              {/* 코칭 | 수업 자료실 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/coaching')}
                  className="py-3.5 px-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-violet-50 hover:text-violet-700 border border-gray-200 hover:border-violet-200 rounded-lg transition-all text-center"
                >
                  코칭
                </button>
                <button
                  onClick={() => navigate('/lesson')}
                  className="py-3.5 px-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-violet-50 hover:text-violet-700 border border-gray-200 hover:border-violet-200 rounded-lg transition-all text-center"
                >
                  수업 자료실
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-xl border border-gray-200 p-1.5 inline-flex gap-1">
          <button
            onClick={() => setActiveTab('exam')}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'exam'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            검사
          </button>
          <button
            onClick={() => setActiveTab('lesson')}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'lesson'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            수업
          </button>
        </div>

        {/* 탭별 KPI */}
        {activeTab === 'exam' && (
          <KeyMetrics
            totalClasses={HOME_KEY_METRICS.totalClasses}
            inProgressExams={HOME_KEY_METRICS.inProgressExams}
            completedExams={HOME_KEY_METRICS.completedExams}
            pendingStudents={HOME_KEY_METRICS.pendingStudents}
          />
        )}

        {/* 탭 컨텐츠 */}
        {activeTab === 'exam' && (
          <div className="space-y-6">
            {/* Section 2: 진행 중 검사 현황 */}
            <div id="exam-status-section">
              <ActiveExams exams={HOME_ACTIVE_EXAMS} />
            </div>

            {/* Section 5: 반별 학습 특성 비교 */}
            <LearningCharacteristics data={HOME_LEARNING_CHARACTERISTICS} />

            {/* Section 6: 학생 유형 분포 */}
            <StudentTypeDistribution data={HOME_STUDENT_TYPE_DISTRIBUTION} />
          </div>
        )}

        {activeTab === 'lesson' && (
          <div className="space-y-6">
            {/* 수업 현황 카드 (완료 + 예정 통합) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">수업 현황</h3>
              <div className="flex gap-6">
                {/* 최근 완료한 수업 */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className="text-base font-bold text-gray-900">최근 완료</h4>
                    <span className="text-sm text-gray-400">{HOME_LESSON_RECENT.length}건</span>
                  </div>
                  <div className="space-y-2">
                    {HOME_LESSON_RECENT.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{lesson.className}</span>
                            <span className="text-xs text-gray-500">{lesson.date}</span>
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            참여율 {lesson.participationRate}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate flex-1">
                            {lesson.contentName}
                          </p>
                          <button
                            onClick={() => navigate(`/lesson/report/${lesson.id}`)}
                            className="ml-2 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors"
                          >
                            리포트 보기
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 구분선 */}
                <div className="w-px bg-gray-200" />

                {/* 예정 수업 */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className="text-base font-bold text-gray-900">예정</h4>
                    <span className="text-sm text-gray-400">{HOME_LESSON_SCHEDULED.length}건</span>
                  </div>
                  <div className="space-y-2">
                    {HOME_LESSON_SCHEDULED.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{lesson.className}</span>
                            <span className="text-xs text-gray-500">{lesson.scheduledDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate flex-1">
                            {lesson.contentName}
                          </p>
                          <div className="flex items-center gap-2 ml-2">
                            <button
                              onClick={() => navigate(`/lesson/edit/${lesson.id}`)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
                            >
                              수정하기
                            </button>
                            <button
                              onClick={() => navigate(`/lesson/start/${lesson.id}`)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                            >
                              시작하기
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3-2: 사회정서역량별 수업 이력 매트릭스 */}
            <SELCompetencyMatrix data={HOME_SEL_COMPETENCY_MATRIX} />

            {/* Section 3-3: 반별 추천 콘텐츠 */}
            <RecommendedContents contents={HOME_RECOMMENDED_CONTENTS} />
          </div>
        )}
      </div>
    </div>
  );
};
