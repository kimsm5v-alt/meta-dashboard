import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import type { UnifiedCounselingRecord } from '@/shared/types';
import { CLASS_COLORS } from '@/shared/data/mockUnifiedCounseling';

interface MonthlyCalendarProps {
  currentDate: Date;
  schedules: UnifiedCounselingRecord[];
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  schedules: UnifiedCounselingRecord[];
}

// 월간 달력 날짜 배열 생성
const getMonthDays = (date: Date): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const year = date.getFullYear();
  const month = date.getMonth();

  // 해당 월의 첫째 날
  const firstDay = new Date(year, month, 1);
  // 해당 월의 마지막 날
  const lastDay = new Date(year, month + 1, 0);

  // 시작 요일 (0=일요일)
  const startDayOfWeek = firstDay.getDay();
  // 이전 월의 날짜 채우기
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // 이전 월 날짜들
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: d.toISOString().split('T')[0] === todayStr,
      schedules: [],
    });
  }

  // 현재 월 날짜들
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: d.toISOString().split('T')[0] === todayStr,
      schedules: [],
    });
  }

  // 다음 월 날짜들 (6주 채우기)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: d.toISOString().split('T')[0] === todayStr,
      schedules: [],
    });
  }

  return days;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  currentDate,
  schedules,
  selectedDate,
  onDateClick,
}) => {
  const calendarDays = useMemo(() => {
    const days = getMonthDays(currentDate);

    // 스케줄 매핑
    schedules.forEach(schedule => {
      const scheduleDate = schedule.scheduledAt.split(' ')[0];
      const dayIndex = days.findIndex(
        d => formatDate(d.date) === scheduleDate
      );
      if (dayIndex !== -1) {
        days[dayIndex].schedules.push(schedule);
      }
    });

    // 시간순 정렬
    days.forEach(day => {
      day.schedules.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    });

    return days;
  }, [currentDate, schedules]);

  const selectedDateStr = selectedDate ? formatDate(selectedDate) : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {DAY_NAMES.map((day, idx) => (
          <div
            key={idx}
            className={`p-2 text-center text-sm font-medium ${
              idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const isSelected = selectedDateStr === formatDate(day.date);
          const displaySchedules = day.schedules.slice(0, 2);
          const moreCount = day.schedules.length - 2;
          const hasUrgent = day.schedules.some(s => s.types.includes('urgent'));

          return (
            <button
              key={idx}
              onClick={() => onDateClick(day.date)}
              className={`min-h-[100px] p-1 border-b border-r border-gray-100 text-left transition-colors ${
                !day.isCurrentMonth ? 'bg-gray-50' : ''
              } ${isSelected ? 'bg-primary-50 ring-2 ring-inset ring-primary-500' : 'hover:bg-gray-50'}`}
            >
              {/* 날짜 숫자 */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 text-sm rounded-full ${
                    day.isToday
                      ? 'bg-amber-400 text-white font-bold'
                      : day.isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {day.date.getDate()}
                </span>
                {hasUrgent && (
                  <AlertCircle className="w-3 h-3 text-red-500" />
                )}
              </div>

              {/* 스케줄 표시 */}
              <div className="space-y-0.5">
                {displaySchedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className="text-[10px] px-1 py-0.5 rounded truncate text-white"
                    style={{ backgroundColor: CLASS_COLORS[schedule.classId] || '#9CA3AF' }}
                  >
                    {schedule.students[0].name}
                    {schedule.students.length > 1 && ` +${schedule.students.length - 1}`}
                  </div>
                ))}
                {moreCount > 0 && (
                  <div className="text-[10px] text-gray-500 px-1">
                    +{moreCount}건
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
