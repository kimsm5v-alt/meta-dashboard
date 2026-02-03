import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Link2,
} from 'lucide-react';
import { Button } from '@/shared/components';
import type { Schedule, CreateScheduleInput } from '@/shared/types';
import { CLASS_COLORS } from '@/shared/types';
import {
  WeeklyCalendar,
  MonthlyCalendar,
  ScheduleModal,
  DateDetailPanel,
  ClassSummaryCards,
  CalendarIntegrationModal,
} from '../components';
import { MOCK_SCHEDULES, SCHEDULE_CLASSES } from '../data/mockSchedules';

// ============================================================
// Types
// ============================================================

type ViewMode = 'weekly' | 'monthly';

// ============================================================
// Utils
// ============================================================

const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
};

const formatWeekRange = (date: Date): string => {
  const dayOfWeek = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const monthStart = monday.getMonth() + 1;
  const monthEnd = friday.getMonth() + 1;

  if (monthStart === monthEnd) {
    return `${monday.getFullYear()}년 ${monthStart}월 ${monday.getDate()}일 - ${friday.getDate()}일`;
  }
  return `${monthStart}월 ${monday.getDate()}일 - ${monthEnd}월 ${friday.getDate()}일`;
};

// ============================================================
// Component
// ============================================================

export const SchedulePage: React.FC = () => {
  // 뷰 모드
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  // 현재 날짜
  const [currentDate, setCurrentDate] = useState(new Date());

  // 선택된 날짜 (월간 뷰)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 반별 필터
  const [classFilter, setClassFilter] = useState<string | null>(null);

  // 모달 상태
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>();

  // 상담 일정 데이터 (로컬 상태)
  const [schedules, setSchedules] = useState<Schedule[]>(MOCK_SCHEDULES);

  // 필터된 스케줄
  const filteredSchedules = useMemo(() => {
    if (!classFilter) return schedules;
    return schedules.filter(s => s.classId === classFilter);
  }, [schedules, classFilter]);

  // 선택된 날짜의 스케줄 (월간 뷰 상세 패널)
  const selectedDateSchedules = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return filteredSchedules
      .filter(s => s.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, filteredSchedules]);

  // 이전/다음 네비게이션
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'weekly') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'weekly') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    if (viewMode === 'monthly') {
      setSelectedDate(date);
    }
  };

  // 일정 추가 클릭
  const handleAddClick = (date?: Date) => {
    setModalInitialDate(date);
    setShowScheduleModal(true);
  };

  // 스케줄 클릭
  const handleScheduleClick = (schedule: Schedule) => {
    // TODO: 상세 보기 또는 수정 모달
    void schedule;
  };

  // 새 일정 등록
  const handleCreateSchedule = (input: CreateScheduleInput) => {
    const newSchedule: Schedule = {
      id: `sch-${Date.now()}`,
      ...input,
      createdAt: new Date(),
    };
    setSchedules(prev => [...prev, newSchedule]);
  };

  // 반 필터 클릭
  const handleClassFilterClick = (classId: string) => {
    setClassFilter(prev => (prev === classId ? null : classId));
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">상담일정</h1>
          <p className="text-sm text-gray-500 mt-1">
            학생 상담 일정을 관리하고 캘린더에서 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowIntegrationModal(true)}
          >
            <Link2 className="w-4 h-4 mr-2" />
            캘린더 연동
          </Button>
          <Button onClick={() => handleAddClick()}>
            <Plus className="w-4 h-4 mr-2" />
            상담 일정 등록
          </Button>
        </div>
      </div>

      {/* 캘린더 컨트롤 */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        {/* 좌측: 뷰 모드 토글 */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setViewMode('weekly');
              setSelectedDate(null);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'weekly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            주간
          </button>
          <button
            onClick={() => {
              setViewMode('monthly');
              setSelectedDate(null);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            월간
          </button>
        </div>

        {/* 중앙: 날짜 네비게이션 */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center min-w-[200px]">
            <span className="text-lg font-semibold text-gray-900">
              {viewMode === 'weekly'
                ? formatWeekRange(currentDate)
                : formatMonthYear(currentDate)}
            </span>
          </div>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            오늘
          </button>
        </div>

        {/* 우측: 반별 필터 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setClassFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              classFilter === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {SCHEDULE_CLASSES.map(cls => (
            <button
              key={cls.id}
              onClick={() => handleClassFilterClick(cls.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                classFilter === cls.id
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor:
                  classFilter === cls.id ? CLASS_COLORS[cls.id] : undefined,
              }}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  classFilter === cls.id ? 'bg-white/50' : ''
                }`}
                style={{
                  backgroundColor:
                    classFilter !== cls.id ? CLASS_COLORS[cls.id] : undefined,
                }}
              />
              {cls.label}
            </button>
          ))}
        </div>
      </div>

      {/* 캘린더 뷰 */}
      <div className={`${viewMode === 'monthly' && selectedDate ? 'pr-[400px]' : ''}`}>
        {viewMode === 'weekly' ? (
          <WeeklyCalendar
            currentDate={currentDate}
            schedules={filteredSchedules}
            onDateClick={handleDateClick}
            onScheduleClick={handleScheduleClick}
            onAddClick={handleAddClick}
          />
        ) : (
          <MonthlyCalendar
            currentDate={currentDate}
            schedules={filteredSchedules}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
          />
        )}
      </div>

      {/* 학급별 요약 카드 */}
      <ClassSummaryCards
        schedules={schedules}
        onClassClick={handleClassFilterClick}
        selectedClassFilter={classFilter}
      />

      {/* 날짜 상세 패널 (월간 뷰) */}
      {viewMode === 'monthly' && selectedDate && (
        <DateDetailPanel
          date={selectedDate}
          schedules={selectedDateSchedules}
          onClose={() => setSelectedDate(null)}
          onAddClick={() => handleAddClick(selectedDate)}
          onScheduleClick={handleScheduleClick}
        />
      )}

      {/* 상담 일정 등록 모달 */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setModalInitialDate(undefined);
        }}
        onSubmit={handleCreateSchedule}
        initialDate={modalInitialDate}
      />

      {/* 캘린더 연동 모달 */}
      <CalendarIntegrationModal
        isOpen={showIntegrationModal}
        onClose={() => setShowIntegrationModal(false)}
      />
    </div>
  );
};
