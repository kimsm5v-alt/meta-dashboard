/**
 * 홈 > Section 7: 최근 활동 타임라인
 *
 * 검사 + 코칭 + 수업 통합 타임라인
 */

interface Activity {
  id: string;
  type: 'exam' | 'coaching' | 'lesson';
  title: string;
  timestamp: Date;
  className?: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'exam':
      return 'bg-green-500';
    case 'coaching':
      return 'bg-purple-500';
    case 'lesson':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${diffDays}일 전`;
};

export const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  // 최근 5개만 표시
  const recentActivities = activities.slice(0, 5);

  if (recentActivities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">최근 활동이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>

      <div className="space-y-3">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            {/* 타입별 색상 점 */}
            <div className={`flex-none w-2 h-2 rounded-full ${getActivityColor(activity.type)} mt-1.5`} />

            {/* 활동 내용 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                {activity.className && (
                  <span className="font-semibold">{activity.className}</span>
                )}{' '}
                {activity.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatTimeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivities;
