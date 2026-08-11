/**
 * 홈 > Section 3: 수업 슬롯 카드
 *
 * 3가지 상태를 각각 카드로 표시:
 * 1. 진행 중 - 열려 있는 2view 세션
 * 2. 예정 - 예정된 수업 목록
 * 3. 최근 - 최근 진행한 수업 리포트
 */

import { useNavigate } from 'react-router-dom';

// 진행 중인 세션
interface ActiveSession {
  id: string;
  contentName: string;
  className: string;
  startTime: string;
  connectedStudents: number;
  totalStudents: number;
  participationCode: string;
}

// 예정된 수업
interface ScheduledLesson {
  id: string;
  scheduledDate: string; // yyyy-mm-dd
  className: string;
  contentName: string;
  isPrepared: boolean;
}

// 최근 수업 기록
interface RecentLesson {
  id: string;
  className: string;
  contentName: string;
  date: string;
  participationRate: number;
}

// 수업 미진행 반
interface ClassWithoutLesson {
  className: string;
}

interface LessonActivityProps {
  activeSession?: ActiveSession | null;
  scheduledLessons?: ScheduledLesson[];
  recentLessons?: RecentLesson[];
  classesWithoutLesson?: ClassWithoutLesson[];
}

export const LessonActivity: React.FC<LessonActivityProps> = ({
  activeSession = null,
  scheduledLessons = [],
  recentLessons = [],
  classesWithoutLesson = [],
}) => {
  const navigate = useNavigate();

  // 어떤 카드 타입인지 결정
  const isActiveCard = activeSession !== null;
  const isScheduledCard = !isActiveCard && scheduledLessons.length > 0;
  const isRecentCard = !isActiveCard && !isScheduledCard;

  // 진행 중 카드
  if (isActiveCard && activeSession) {
    return (
      <div className="bg-white rounded-xl border border-blue-200 p-5 h-full">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
            진행 중인 수업
          </span>
          <span className="text-xs text-gray-500">
            {activeSession.startTime} 시작
          </span>
        </div>

        <div className="mb-4">
          <h4 className="text-base font-bold text-gray-900">
            {activeSession.contentName}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {activeSession.className}
          </p>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              접속 <span className="font-bold text-blue-600">{activeSession.connectedStudents}</span>/{activeSession.totalStudents}명
            </span>
            <span className="text-xs text-gray-500">
              코드: <span className="font-mono font-bold text-primary-600">{activeSession.participationCode}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/lesson/session/${activeSession.id}`)}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            이어서 진행
          </button>
          <button
            onClick={() => alert('세션을 종료합니다.')}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
          >
            종료
          </button>
        </div>
      </div>
    );
  }

  // 예정 카드
  if (isScheduledCard) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5 h-full">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
            예정 수업
          </span>
          <span className="text-xs text-gray-500">이번 주</span>
        </div>

        <div className="space-y-2">
          {scheduledLessons.slice(0, 3).map((lesson) => (
            <div
              key={lesson.id}
              className="p-2.5 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">{lesson.className}</span>
                  <span className="text-xs text-gray-500">{lesson.scheduledDate}</span>
                </div>
                {lesson.isPrepared ? (
                  <span className="text-xs text-green-600">준비 완료</span>
                ) : (
                  <span className="text-xs text-amber-600">준비 필요</span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 truncate">
                {lesson.contentName}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/lesson')}
          className="w-full mt-3 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
        >
          수업 시작하기
        </button>
      </div>
    );
  }

  // 최근 수업 카드
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
          최근 완료한 수업
        </span>
      </div>

      {recentLessons.length > 0 ? (
        <div className="space-y-2">
          {recentLessons.slice(0, 2).map((lesson) => (
            <div
              key={lesson.id}
              className="p-2.5 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">{lesson.className}</span>
                  <span className="text-xs text-gray-500">{lesson.date}</span>
                </div>
                <span className="text-xs font-medium text-gray-700">
                  참여율 {lesson.participationRate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate flex-1">
                  {lesson.contentName}
                </p>
                <button
                  onClick={() => navigate(`/lesson/report/${lesson.id}`)}
                  className="ml-2 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
                >
                  리포트
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-gray-400">
          <p className="text-sm">아직 진행한 수업이 없습니다</p>
        </div>
      )}

    </div>
  );
};

export default LessonActivity;
