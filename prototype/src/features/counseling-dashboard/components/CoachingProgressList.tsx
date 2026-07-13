/**
 * 코칭 - 반 전체 - 코칭 진행 현황
 *
 * 현재 코칭 중인 학생 목록 및 진행 상황
 */

import { Activity, Calendar, ChevronRight } from 'lucide-react';
import type { CoachingProgress } from '../types';
import { LPA_TYPE_COLORS } from '../types';

interface CoachingProgressListProps {
  progressList: CoachingProgress[];
  onStudentClick?: (studentId: string) => void;
}

export const CoachingProgressList: React.FC<CoachingProgressListProps> = ({
  progressList,
  onStudentClick,
}) => {
  // 날짜 포맷팅
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // D-day 계산
  const getDaysUntil = (date: Date): number => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600" />
          <h3 className="text-base font-semibold text-gray-900">코칭 진행 현황</h3>
        </div>
        <span className="text-sm text-gray-500">{progressList.length}명 진행 중</span>
      </div>

      {progressList.length > 0 ? (
        <div className="space-y-3">
          {progressList.map((progress) => {
            const completionRate = (progress.completedActivities / progress.totalActivities) * 100;
            const daysUntil = getDaysUntil(progress.nextActivityDue);
            const lpaColor = LPA_TYPE_COLORS[progress.lpaType];

            return (
              <button
                key={progress.studentId}
                onClick={() => onStudentClick?.(progress.studentId)}
                className="w-full p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
                      {progress.studentNumber}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{progress.studentName}</span>
                      <span
                        className="ml-2 px-2 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: lpaColor }}
                      >
                        {progress.lpaType}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                {/* 현재 단계 */}
                <div className="mb-3">
                  <span className="text-xs text-gray-500">현재 단계: </span>
                  <span className="text-xs font-medium text-primary-700">{progress.currentPhase}</span>
                </div>

                {/* 진행률 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">진행률</span>
                    <span className="text-xs font-medium text-gray-700">
                      {progress.completedActivities}/{progress.totalActivities} 활동
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${completionRate}%`,
                        backgroundColor: lpaColor,
                      }}
                    />
                  </div>
                </div>

                {/* 일정 */}
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    마지막 활동: {formatDate(progress.lastActivityDate)}
                  </span>
                  <span className={`font-medium ${daysUntil <= 3 ? 'text-amber-600' : 'text-gray-600'}`}>
                    다음 활동: D{daysUntil > 0 ? `-${daysUntil}` : `+${Math.abs(daysUntil)}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">진행 중인 코칭이 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default CoachingProgressList;
