import styled from '@emotion/styled';
import { useMemo } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CounselingRecord } from '@shared/types';

const Container = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const DayHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const DayName = styled.div<{ $dayIndex: number }>`
  padding: 0.5rem;
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ $dayIndex, theme }) =>
    $dayIndex === 0 ? '#ef4444' : $dayIndex === 6 ? '#3b82f6' : theme.colors.gray[600]};
`;

const DateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
`;

const DateButton = styled.button<{ $isCurrentMonth: boolean; $isSelected: boolean }>`
  min-height: 100px;
  padding: 0.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-right: 1px solid ${({ theme }) => theme.colors.gray[100]};
  text-align: left;
  background: ${({ $isCurrentMonth, $isSelected, theme }) =>
    $isSelected
      ? theme.colors.primary[50]
      : !$isCurrentMonth
        ? theme.colors.gray[50]
        : 'transparent'};
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  ${({ $isSelected, theme }) =>
    $isSelected &&
    `
    box-shadow: inset 0 0 0 2px ${theme.colors.primary[500]};
  `}

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const DateHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const DateNumber = styled.span<{ $isToday: boolean; $isCurrentMonth: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $isToday }) => ($isToday ? '#fbbf24' : 'transparent')};
  color: ${({ $isToday, $isCurrentMonth, theme }) =>
    $isToday ? '#ffffff' : $isCurrentMonth ? theme.colors.gray[900] : theme.colors.gray[400]};
  font-weight: ${({ $isToday, theme }) =>
    $isToday ? theme.typography.fontWeight.bold : theme.typography.fontWeight.normal};
`;

const ScheduleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const ScheduleItem = styled.div<{ $isCompleted: boolean; $backgroundColor: string }>`
  font-size: 10px;
  padding: 0.125rem 0.25rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ $isCompleted }) => ($isCompleted ? 'rgba(255, 255, 255, 0.8)' : '#ffffff')};
  background-color: ${({ $backgroundColor }) => $backgroundColor};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.125rem;
`;

const MoreCount = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.gray[500]};
  padding: 0 0.25rem;
`;

interface MonthlyCalendarProps {
  currentDate: Date;
  schedules: CounselingRecord[];
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
  classColors: Record<string, string>;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  schedules: CounselingRecord[];
}

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

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

  const todayStr = formatDate(new Date());

  // 이전 월 날짜들
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: formatDate(d) === todayStr,
      schedules: [],
    });
  }

  // 현재 월 날짜들
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: formatDate(d) === todayStr,
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
      isToday: formatDate(d) === todayStr,
      schedules: [],
    });
  }

  return days;
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  currentDate,
  schedules,
  selectedDate,
  onDateClick,
  classColors,
}) => {
  const calendarDays = useMemo(() => {
    const days = getMonthDays(currentDate);

    // 스케줄 매핑
    schedules.forEach((schedule) => {
      const scheduleDate = schedule.scheduledAt.split(' ')[0];
      const dayIndex = days.findIndex((d) => formatDate(d.date) === scheduleDate);
      if (dayIndex !== -1) {
        days[dayIndex].schedules.push(schedule);
      }
    });

    // 시간순 정렬
    days.forEach((day) => {
      day.schedules.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    });

    return days;
  }, [currentDate, schedules]);

  const selectedDateStr = selectedDate ? formatDate(selectedDate) : null;

  return (
    <Container>
      {/* 요일 헤더 */}
      <DayHeader>
        {DAY_NAMES.map((day, idx) => (
          <DayName key={idx} $dayIndex={idx}>
            {day}
          </DayName>
        ))}
      </DayHeader>

      {/* 날짜 그리드 */}
      <DateGrid>
        {calendarDays.map((day, idx) => {
          const isSelected = selectedDateStr === formatDate(day.date);
          const displaySchedules = day.schedules.slice(0, 2);
          const moreCount = day.schedules.length - 2;
          const hasUrgent = day.schedules.some(
            (s) => s.types.includes('urgent') && s.status !== 'completed',
          );

          return (
            <DateButton
              key={idx}
              onClick={() => onDateClick(day.date)}
              $isCurrentMonth={day.isCurrentMonth}
              $isSelected={isSelected}
            >
              {/* 날짜 숫자 */}
              <DateHeader>
                <DateNumber $isToday={day.isToday} $isCurrentMonth={day.isCurrentMonth}>
                  {day.date.getDate()}
                </DateNumber>
                {hasUrgent && <AlertCircle className='w-3 h-3 text-red-500' />}
              </DateHeader>

              {/* 스케줄 표시 */}
              <ScheduleList>
                {displaySchedules.map((schedule) => {
                  const isCompleted = schedule.status === 'completed';
                  const baseColor = classColors[schedule.classId] || '#9CA3AF';
                  const backgroundColor = isCompleted ? `${baseColor}99` : baseColor;
                  return (
                    <ScheduleItem
                      key={schedule.id}
                      $isCompleted={isCompleted}
                      $backgroundColor={backgroundColor}
                    >
                      {isCompleted && <CheckCircle2 className='w-2.5 h-2.5 flex-shrink-0' />}
                      <span className='truncate'>
                        {schedule.students[0].name}
                        {schedule.students.length > 1 && ` +${schedule.students.length - 1}`}
                      </span>
                    </ScheduleItem>
                  );
                })}
                {moreCount > 0 && <MoreCount>+{moreCount}건</MoreCount>}
              </ScheduleList>
            </DateButton>
          );
        })}
      </DateGrid>
    </Container>
  );
};
