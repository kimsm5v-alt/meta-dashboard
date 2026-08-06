/**
 * 홈 (전체 현황 대시보드)
 * - Section 1: 주요 지표 (KPI 카드 4개)
 * - Section 2: 진행 중 검사 현황
 * - Section 3: 수업 활동 현황
 * - Section 4: 반별 현황 요약 테이블
 * - Section 5: 반별 학습 특성 비교 차트
 * - Section 6: 학생 유형 분포 스택바
 * - Section 7: 최근 활동 타임라인
 * - Section 8: 빠른 접근 버튼
 */
import { useState } from 'react';
import {
  KeyMetrics,
  ActiveExams,
  LessonActivity,
  LearningCharacteristics,
  StudentTypeDistribution,
  QuickActions,
  RecommendedContents,
  SELCompetencyMatrix,
} from '../components';
import {
  HOME_KEY_METRICS,
  HOME_ACTIVE_EXAMS,
  HOME_LESSON_ACTIVE_SESSION,
  HOME_LESSON_SCHEDULED,
  HOME_LESSON_RECENT,
  HOME_LESSON_CLASSES_WITHOUT,
  HOME_SEL_COMPETENCY_MATRIX,
  HOME_RECOMMENDED_CONTENTS,
  HOME_LEARNING_CHARACTERISTICS,
  HOME_STUDENT_TYPE_DISTRIBUTION,
} from '../mock-data';

type TabType = 'exam' | 'lesson';

export const TeacherDashboardPage = () => {
  const teacherName = '김선생님';
  const totalClasses = HOME_KEY_METRICS.totalClasses;
  const [activeTab, setActiveTab] = useState<TabType>('exam');

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              안녕하세요, {teacherName} 👋
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {totalClasses}개 반의 학습 현황을 한눈에 확인하세요
            </p>
          </div>

          {/* Section 0: 빠른 접근 */}
          <QuickActions />

          {/* 탭 네비게이션 */}
            <div className="bg-white rounded-xl border border-gray-200 p-1.5 inline-flex gap-1">
              <button
                onClick={() => setActiveTab('exam')}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === 'exam'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                검사
              </button>
              <button
                onClick={() => setActiveTab('lesson')}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === 'lesson'
                    ? 'bg-primary-600 text-white shadow-sm'
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
                <ActiveExams exams={HOME_ACTIVE_EXAMS} />

                {/* Section 5: 반별 학습 특성 비교 */}
                <LearningCharacteristics data={HOME_LEARNING_CHARACTERISTICS} />

                {/* Section 6: 학생 유형 분포 */}
                <StudentTypeDistribution data={HOME_STUDENT_TYPE_DISTRIBUTION} />
              </div>
            )}

            {activeTab === 'lesson' && (
              <div className="space-y-6">
                {/* 수업 현황: 진행중, 예정, 완료 3개 카드 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">수업 현황</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 최근 완료한 수업 */}
                    <LessonActivity
                      activeSession={null}
                      scheduledLessons={[]}
                      recentLessons={HOME_LESSON_RECENT}
                      classesWithoutLesson={[]}
                    />

                    {/* 진행 중인 수업 */}
                    <LessonActivity
                      activeSession={HOME_LESSON_ACTIVE_SESSION}
                      scheduledLessons={[]}
                      recentLessons={[]}
                      classesWithoutLesson={[]}
                    />

                    {/* 예정 수업 */}
                    <LessonActivity
                      activeSession={null}
                      scheduledLessons={HOME_LESSON_SCHEDULED}
                      recentLessons={[]}
                      classesWithoutLesson={[]}
                    />
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
    </div>
  );
};
