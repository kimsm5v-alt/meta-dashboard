import styled from '@emotion/styled';
import { useMemo } from 'react';
import { Plus, User, Users, Phone, Video, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { UnifiedCounselingRecord } from '@shared/types';
import { COUNSELING_AREA_LABELS } from '@shared/types';
import { CLASS_COLORS } from '@shared/data/mockUnifiedCounseling';

const Container = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const DayHeaderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const DayHeaderCell = styled.div<{ $isToday: boolean }>`
  padding: 0.75rem;
  text-align: center;
  border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ $isToday, theme }) => ($isToday ? '#fffbeb' : theme.colors.gray[50])};

  &:last-of-type {
    border-right: none;
  }
`;

const DayName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.25rem;
`;

const DayNumber = styled.div<{ $isToday: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ $isToday }) => ($isToday ? '#d97706' : '#111827')};
`;

const MonthText = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const ScheduleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  min-height: 500px;
`;

const DayCell = styled.div<{ $isToday: boolean }>`
  border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: 0.5rem;
  background: ${({ $isToday }) => ($isToday ? 'rgba(255, 251, 235, 0.3)' : 'transparent')};

  &:last-of-type {
    border-right: none;
  }
`;

const ScheduleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ScheduleCard = styled.button<{ $isCompleted: boolean; $borderColor: string }>`
  width: 100%;
  text-align: left;
  padding: 0.5rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border-left: 4px solid ${({ $borderColor }) => $borderColor};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  background: ${({ $isCompleted, theme }) =>
    $isCompleted ? theme.colors.gray[50] : theme.colors.background.paper};
  border-top: none;
  border-right: none;
  border-bottom: none;
  cursor: pointer;
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const TimeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const TimeText = styled.span<{ $isCompleted: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ $isCompleted, theme }) => ($isCompleted ? theme.colors.gray[400] : theme.colors.gray[600])};
`;

const StatusIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const StudentName = styled.div<{ $isCompleted: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ $isCompleted, theme }) => ($isCompleted ? theme.colors.gray[500] : theme.colors.gray[900])};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TagRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
`;

const AreaBadge = styled.span<{ $bgColor: string; $textColor: string }>`
  padding: 0.125rem 0.375rem;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.sm};
  background-color: ${({ $bgColor }) => $bgColor};
  color: ${({ $textColor }) => $textColor};
`;

const MoreCount = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const MethodIconWrapper = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  display: inline-flex;
`;

const AddButton = styled.button`
  width: 100%;
  height: 5rem;
  border: 2px dashed ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[300]};
    color: ${({ theme }) => theme.colors.primary[500]};
    background: rgba(147, 51, 234, 0.05);
  }
`;

const AddMoreButton = styled.button`
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.375rem;
  border: 1px dashed ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[300]};
    color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

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
    weekDays.forEach((day) => {
      map[formatDate(day)] = [];
    });
    schedules.forEach((schedule) => {
      const scheduleDate = schedule.scheduledAt.split(' ')[0];
      if (map[scheduleDate]) {
        map[scheduleDate].push(schedule);
      }
    });
    // 시간순 정렬
    Object.keys(map).forEach((date) => {
      map[date].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    });
    return map;
  }, [weekDays, schedules]);

  // 시간 추출 헬퍼
  const getTime = (scheduledAt: string) => scheduledAt.split(' ')[1] || '09:00';

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'phone':
        return <Phone className='w-3 h-3' />;
      case 'video':
        return <Video className='w-3 h-3' />;
      case 'group':
        return <Users className='w-3 h-3' />;
      default:
        return <User className='w-3 h-3' />;
    }
  };

  return (
    <Container>
      {/* 요일 헤더 */}
      <DayHeaderGrid>
        {weekDays.map((day, idx) => {
          const today = isToday(day);
          return (
            <DayHeaderCell key={idx} $isToday={today}>
              <DayName>{DAY_NAMES[idx]}</DayName>
              <DayNumber $isToday={today}>{day.getDate()}</DayNumber>
              <MonthText>{day.getMonth() + 1}월</MonthText>
            </DayHeaderCell>
          );
        })}
      </DayHeaderGrid>

      {/* 일정 영역 */}
      <ScheduleGrid>
        {weekDays.map((day, idx) => {
          const dateStr = formatDate(day);
          const daySchedules = schedulesByDate[dateStr] || [];
          const today = isToday(day);

          return (
            <DayCell key={idx} $isToday={today}>
              <ScheduleList>
                {daySchedules.map((schedule) => {
                  const isCompleted = schedule.status === 'completed';
                  const borderColor = CLASS_COLORS[schedule.classId] || '#9CA3AF';
                  return (
                    <ScheduleCard
                      key={schedule.id}
                      onClick={() => onScheduleClick(schedule)}
                      $isCompleted={isCompleted}
                      $borderColor={borderColor}
                    >
                      {/* 시간 + 완료/긴급 표시 */}
                      <TimeRow>
                        <TimeText $isCompleted={isCompleted}>
                          {getTime(schedule.scheduledAt)}
                        </TimeText>
                        <StatusIcons>
                          {isCompleted && <CheckCircle2 className='w-3 h-3 text-emerald-500' />}
                          {schedule.types.includes('urgent') && !isCompleted && (
                            <AlertCircle className='w-3 h-3 text-red-500' />
                          )}
                        </StatusIcons>
                      </TimeRow>

                      {/* 학생명 */}
                      <StudentName $isCompleted={isCompleted}>
                        {schedule.students.length === 1
                          ? schedule.students[0].name
                          : `${schedule.students[0].name} 외 ${schedule.students.length - 1}명`}
                      </StudentName>

                      {/* 상담 영역 + 방법 */}
                      <TagRow>
                        {schedule.areas.slice(0, 2).map((area, i) => (
                          <AreaBadge
                            key={i}
                            $bgColor={`${CLASS_COLORS[schedule.classId]}20`}
                            $textColor={CLASS_COLORS[schedule.classId]}
                          >
                            {COUNSELING_AREA_LABELS[area]}
                          </AreaBadge>
                        ))}
                        {schedule.areas.length > 2 && (
                          <MoreCount>+{schedule.areas.length - 2}</MoreCount>
                        )}
                        <MethodIconWrapper>{getMethodIcon(schedule.methods[0])}</MethodIconWrapper>
                      </TagRow>
                    </ScheduleCard>
                  );
                })}

                {/* 빈 날짜 추가 버튼 */}
                {daySchedules.length === 0 && (
                  <AddButton onClick={() => onAddClick(day)}>
                    <Plus className='w-5 h-5' />
                  </AddButton>
                )}
              </ScheduleList>

              {/* 일정이 있는 날에도 추가 버튼 */}
              {daySchedules.length > 0 && (
                <AddMoreButton onClick={() => onAddClick(day)}>
                  <Plus className='w-3 h-3' style={{ marginRight: '0.25rem' }} />
                  추가
                </AddMoreButton>
              )}
            </DayCell>
          );
        })}
      </ScheduleGrid>
    </Container>
  );
};
