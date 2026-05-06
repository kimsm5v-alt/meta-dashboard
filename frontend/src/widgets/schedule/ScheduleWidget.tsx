import { useState, useMemo, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import { ChevronLeft, ChevronRight, Plus, Link2 } from 'lucide-react';
import { Button } from '@shared/components';
import { ApiTooltip } from '@shared/components/api-tooltip';
import {
  API_COUNSELING_ALL,
  API_COUNSELING_CREATE,
  API_TEACHER_DASHBOARD,
} from '@shared/data/apiDefinitions';
import { formatDateISO } from '@shared/utils/dateUtils';
import type {
  CounselingRecord,
  CounselingStudent,
  CreateCounselingInput,
  UpdateCounselingInput,
} from '@shared/types';
import {
  WeeklyCalendar,
  MonthlyCalendar,
  ScheduleModal,
  DateDetailPanel,
  ClassSummaryCards,
  CalendarIntegrationModal,
} from '@features/schedule/ui';
import type { ScheduleClass } from '@shared/data/mockUnifiedCounseling';
import { counselingService } from '@shared/services/counselingService';
import { useAuth } from '@features/auth/model/AuthContext';
import { groupService } from '@features/groups/api/groupService';

const CLASS_COLOR_PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

// ============================================================
// Types
// ============================================================

type ViewMode = 'weekly' | 'monthly';

// ============================================================
// Styled Components
// ============================================================

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderLeft = styled.div``;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const PageSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const CalendarControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => theme.spacing.md};
`;

const ViewModeToggle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.xs};
`;

const ViewModeButton = styled.button<{ $isActive: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  padding-top: 6px;
  padding-bottom: 6px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: ${({ theme }) => theme.transitions.fast};
  border: none;
  cursor: pointer;
  background: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.background.paper : 'transparent'};
  color: ${({ theme, $isActive }) => ($isActive ? theme.colors.gray[900] : theme.colors.gray[600])};
  box-shadow: ${({ theme, $isActive }) => ($isActive ? theme.shadows.sm : 'none')};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[900]};
  }
`;

const DateNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const NavButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.lg};
  transition: ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const DateDisplay = styled.div`
  text-align: center;
  min-width: 200px;
`;

const DateText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const TodayButton = styled.button`
  padding: ${({ theme }) => `6px ${theme.spacing.md}`};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary[600]};
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary[50]};
  }
`;

const ClassFilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FilterButton = styled.button<{ $isActive: boolean; $activeColor?: string }>`
  padding: ${({ theme }) => `6px ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: ${({ theme }) => theme.transitions.fast};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${({ $isActive, $activeColor, theme }) =>
    $isActive ? $activeColor || theme.colors.gray[900] : theme.colors.gray[100]};
  color: ${({ $isActive, theme }) => ($isActive ? '#ffffff' : theme.colors.gray[600])};

  &:hover {
    background: ${({ $isActive, $activeColor, theme }) =>
      $isActive ? $activeColor || theme.colors.gray[900] : theme.colors.gray[200]};
  }
`;

const FilterDot = styled.span<{ $color: string; $isActive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $color, $isActive }) => ($isActive ? 'rgba(255, 255, 255, 0.5)' : $color)};
`;

const CalendarContainer = styled.div<{ $hasDetailPanel: boolean }>`
  padding-right: ${({ $hasDetailPanel }) => ($hasDetailPanel ? '400px' : '0')};
`;

const ButtonIconWrapper = styled.span`
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  display: inline-flex;
  align-items: center;

  svg {
    width: 100%;
    height: 100%;
  }
`;

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

export const ScheduleWidget: React.FC = () => {
  const { user } = useAuth();

  // 반 및 학생 데이터
  const [scheduleClasses, setScheduleClasses] = useState<ScheduleClass[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, CounselingStudent[]>>({});
  const [classColors, setClassColors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const groups = await groupService.getMyGroups(user.id);
        const ownerGroups = groups.filter((g) => g.myRole === 'owner');

        const classes: ScheduleClass[] = ownerGroups.map((g) => ({
          id: g.claId,
          grade: g.grade,
          classNumber: g.classNumber,
          label: `${g.grade}학년 ${g.classNumber}반`,
        }));

        const colors: Record<string, string> = {};
        classes.forEach((cls, i) => {
          colors[cls.id] = CLASS_COLOR_PALETTE[i % CLASS_COLOR_PALETTE.length];
        });

        const studentEntries = await Promise.all(
          ownerGroups.map(async (g) => {
            const members = await groupService.getGroupMembers(g.claId, user.id);
            const students: CounselingStudent[] = members
              .filter((m) => m.status === 'active')
              .map((m, idx) => ({
                id: m.stdtId || m.id,
                name: m.name,
                number: m.memberNo ?? idx + 1,
                classId: g.claId,
              }));
            return [g.claId, students] as [string, CounselingStudent[]];
          }),
        );

        setScheduleClasses(classes);
        setClassColors(colors);
        setStudentsMap(Object.fromEntries(studentEntries));
      } catch {
        // 에러 시 빈 목록 유지
      }
    })();
  }, [user]);

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
  const [editingSchedule, setEditingSchedule] = useState<CounselingRecord | null>(null);

  // 상담 일정 데이터 (통합 서비스에서 로드)
  const [records, setRecords] = useState<CounselingRecord[]>([]);

  // 데이터 로드
  const loadRecords = useCallback(async () => {
    try {
      const data = await counselingService.getAll();
      setRecords(data);
    } catch {
      // 에러 시 빈 목록 유지
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // 취소되지 않은 모든 상담 (예정 + 완료)
  const activeRecords = useMemo(() => {
    return records.filter((r) => r.status !== 'cancelled');
  }, [records]);

  // 필터된 스케줄
  const filteredSchedules = useMemo(() => {
    if (!classFilter) return activeRecords;
    return activeRecords.filter((s) => s.classId === classFilter);
  }, [activeRecords, classFilter]);

  // 선택된 날짜의 스케줄 (월간 뷰 상세 패널)
  const selectedDateSchedules = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = formatDateISO(selectedDate);
    return filteredSchedules
      .filter((s) => s.scheduledAt.startsWith(dateStr))
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
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
    setEditingSchedule(null);
    setModalInitialDate(date);
    setShowScheduleModal(true);
  };

  // 스케줄 클릭 (상세/수정)
  const handleScheduleClick = (schedule: CounselingRecord) => {
    setEditingSchedule(schedule);
    setModalInitialDate(undefined);
    setShowScheduleModal(true);
  };

  // 새 일정 등록
  const handleCreateSchedule = async (input: CreateCounselingInput) => {
    try {
      await counselingService.create(input);
      await loadRecords();
    } catch {
      // 등록 실패 시 무시
    }
  };

  // 일정 수정
  const handleUpdateSchedule = async (id: string, input: UpdateCounselingInput) => {
    try {
      await counselingService.update(id, input);
      await loadRecords();
    } catch {
      // 수정 실패 시 무시
    }
  };

  // 일정 삭제
  const handleDeleteSchedule = async (id: string) => {
    try {
      await counselingService.delete(id);
      await loadRecords();
    } catch {
      // 삭제 실패 시 무시
    }
  };

  // 반 필터 클릭
  const handleClassFilterClick = (classId: string) => {
    setClassFilter((prev) => (prev === classId ? null : classId));
  };

  return (
    <PageContainer>
      {/* 헤더 */}
      <Header>
        <HeaderLeft>
          <ApiTooltip {...API_COUNSELING_ALL} position='bottom-left'>
            <PageTitle>상담일정</PageTitle>
          </ApiTooltip>
          <PageSubtitle>학생 상담 일정을 관리하고 캘린더에서 확인하세요</PageSubtitle>
        </HeaderLeft>
        <HeaderActions>
          <Button variant='secondary' onClick={() => setShowIntegrationModal(true)}>
            <ButtonIconWrapper>
              <Link2 />
            </ButtonIconWrapper>
            캘린더 연동
          </Button>
          <ApiTooltip {...API_COUNSELING_CREATE} position='bottom-right'>
            <Button onClick={() => handleAddClick()}>
              <ButtonIconWrapper>
                <Plus />
              </ButtonIconWrapper>
              상담 일정 등록
            </Button>
          </ApiTooltip>
        </HeaderActions>
      </Header>

      {/* 캘린더 컨트롤 */}
      <CalendarControls>
        {/* 좌측: 뷰 모드 토글 */}
        <ViewModeToggle>
          <ViewModeButton
            $isActive={viewMode === 'weekly'}
            onClick={() => {
              setViewMode('weekly');
              setSelectedDate(null);
            }}
          >
            주간
          </ViewModeButton>
          <ViewModeButton
            $isActive={viewMode === 'monthly'}
            onClick={() => {
              setViewMode('monthly');
              setSelectedDate(null);
            }}
          >
            월간
          </ViewModeButton>
        </ViewModeToggle>

        {/* 중앙: 날짜 네비게이션 */}
        <DateNavigation>
          <NavButton onClick={handlePrev}>
            <ChevronLeft />
          </NavButton>
          <DateDisplay>
            <DateText>
              {viewMode === 'weekly' ? formatWeekRange(currentDate) : formatMonthYear(currentDate)}
            </DateText>
          </DateDisplay>
          <NavButton onClick={handleNext}>
            <ChevronRight />
          </NavButton>
          <TodayButton onClick={handleToday}>오늘</TodayButton>
        </DateNavigation>

        {/* 우측: 반별 필터 */}
        <ApiTooltip {...API_TEACHER_DASHBOARD} position='bottom-right'>
          <ClassFilterContainer>
            <FilterButton $isActive={classFilter === null} onClick={() => setClassFilter(null)}>
              전체
            </FilterButton>
            {scheduleClasses.map((cls) => (
              <FilterButton
                key={cls.id}
                $isActive={classFilter === cls.id}
                $activeColor={classColors[cls.id]}
                onClick={() => handleClassFilterClick(cls.id)}
              >
                <FilterDot $color={classColors[cls.id] ?? '#9CA3AF'} $isActive={classFilter === cls.id} />
                {cls.label}
              </FilterButton>
            ))}
          </ClassFilterContainer>
        </ApiTooltip>
      </CalendarControls>

      {/* 캘린더 뷰 */}
      <CalendarContainer $hasDetailPanel={viewMode === 'monthly' && selectedDate !== null}>
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
      </CalendarContainer>

      {/* 학급별 요약 카드 */}
      <ClassSummaryCards
        schedules={activeRecords}
        onClassClick={handleClassFilterClick}
        selectedClassFilter={classFilter}
        classes={scheduleClasses}
        classColors={classColors}
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

      {/* 상담 일정 등록/수정 모달 */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setModalInitialDate(undefined);
          setEditingSchedule(null);
        }}
        onSubmit={handleCreateSchedule}
        onUpdate={handleUpdateSchedule}
        onDelete={handleDeleteSchedule}
        initialDate={modalInitialDate}
        editingSchedule={editingSchedule}
        classes={scheduleClasses}
        studentsMap={studentsMap}
        classColors={classColors}
      />

      {/* 캘린더 연동 모달 */}
      <CalendarIntegrationModal
        isOpen={showIntegrationModal}
        onClose={() => setShowIntegrationModal(false)}
      />
    </PageContainer>
  );
};
