import { useMemo } from 'react';
import { Plus, User, Users, Phone, Video, AlertCircle } from 'lucide-react';
import type { UnifiedCounselingRecord } from '@/shared/types';
import { COUNSELING_AREA_LABELS } from '@/shared/types';
import { CLASS_COLORS } from '@/shared/data/mockUnifiedCounseling';

interface WeeklyCalendarProps {
  currentDate: Date;
  schedules: UnifiedCounselingRecord[];
  onDateClick?: (date: Date) => void;
  onScheduleClick: (schedule: UnifiedCounselingRecord) => void;
  onAddClick: (date: Date) => void;
}

// 주간 날짜 배열 생성 (월~금)
const getWeekDays = (date: Date): Date[] => {
  const days: Date[] = [];
  const current = new Date(date);
  const dayOfWeek = current.getDay();
  const monday = new Date(current);
  monday.setDate(current.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  for (let i = 0; i < 5; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }

  return days;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return formatDate(date) === formatDate(today);
};

const DAY_NAMES = ['월', '화', '수', '목', '금'];

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  currentDate,
  schedules,
  onScheduleClick,
  onAddClick,
}) => {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // 날짜별 스케줄 그룹화
  const schedulesByDate = useMemo(() => {
    const map: Record<string, UnifiedCounselingRecord[]> = {};
    weekDays.forEach(day => {
      map[formatDate(day)] = [];
    });
    schedules.forEach(schedule => {
      const scheduleDate = schedule.scheduledAt.split(' ')[0];
      if (map[scheduleDate]) {
        map[scheduleDate].push(schedule);
      }
    });
    // 시간순 정렬
    Object.keys(map).forEach(date => {
      map[date].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    });
    return map;
  }, [weekDays, schedules]);

  // 시간 추출 헬퍼
  const getTime = (scheduledAt: string) => scheduledAt.split(' ')[1] || '09:00';

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'phone':
        return <Phone className="w-3 h-3" />;
      case 'video':
        return <Video className="w-3 h-3" />;
      case 'group':
        return <Users className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-5 border-b border-gray-200">
        {weekDays.map((day, idx) => {
          const today = isToday(day);
          return (
            <div
              key={idx}
              className={`p-3 text-center border-r last:border-r-0 border-gray-200 ${
                today ? 'bg-amber-50' : 'bg-gray-50'
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">{DAY_NAMES[idx]}</div>
              <div
                className={`text-lg font-semibold ${
                  today ? 'text-amber-600' : 'text-gray-900'
                }`}
              >
                {day.getDate()}
              </div>
              <div className="text-xs text-gray-400">
                {day.getMonth() + 1}월
              </div>
            </div>
          );
        })}
      </div>

      {/* 일정 영역 */}
      <div className="grid grid-cols-5 min-h-[500px]">
        {weekDays.map((day, idx) => {
          const dateStr = formatDate(day);
          const daySchedules = schedulesByDate[dateStr] || [];
          const today = isToday(day);

          return (
            <div
              key={idx}
              className={`border-r last:border-r-0 border-gray-200 p-2 ${
                today ? 'bg-amber-50/30' : ''
              }`}
            >
              <div className="space-y-2">
                {daySchedules.map(schedule => (
                  <button
                    key={schedule.id}
                    onClick={() => onScheduleClick(schedule)}
                    className="w-full text-left p-2 rounded-lg border-l-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                    style={{ borderLeftColor: CLASS_COLORS[schedule.classId] || '#9CA3AF' }}
                  >
                    {/* 시간 + 긴급 표시 */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {getTime(schedule.scheduledAt)}
                      </span>
                      {schedule.types.includes('urgent') && (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                    </div>

                    {/* 학생명 */}
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {schedule.students.length === 1
                        ? schedule.students[0].name
                        : `${schedule.students[0].name} 외 ${schedule.students.length - 1}명`}
                    </div>

                    {/* 상담 영역 + 방법 */}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {schedule.areas.slice(0, 2).map((area, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                          style={{
                            backgroundColor: `${CLASS_COLORS[schedule.classId]}20`,
                            color: CLASS_COLORS[schedule.classId],
                          }}
                        >
                          {COUNSELING_AREA_LABELS[area]}
                        </span>
                      ))}
                      {schedule.areas.length > 2 && (
                        <span className="text-[10px] text-gray-400">+{schedule.areas.length - 2}</span>
                      )}
                      <span className="text-gray-400">
                        {getMethodIcon(schedule.methods[0])}
                      </span>
                    </div>
                  </button>
                ))}

                {/* 빈 날짜 추가 버튼 */}
                {daySchedules.length === 0 && (
                  <button
                    onClick={() => onAddClick(day)}
                    className="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/50 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* 일정이 있는 날에도 추가 버튼 */}
              {daySchedules.length > 0 && (
                <button
                  onClick={() => onAddClick(day)}
                  className="w-full mt-2 py-1.5 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  추가
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
