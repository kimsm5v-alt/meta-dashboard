import styled from '@emotion/styled';
import { X, Plus, User, Users, Phone, Video, AlertCircle, Clock } from 'lucide-react';
import type { CounselingRecord } from '@shared/types';
import { COUNSELING_AREA_LABELS, COUNSELING_METHOD_LABELS } from '@shared/types';
import { Button } from '@shared/components';
import { SCHEDULE_CLASSES, CLASS_COLORS } from '@shared/data/mockUnifiedCounseling';

const Panel = styled.div`
  position: fixed;
  right: 0;
  top: 4rem;
  bottom: 0;
  width: 24rem;
  background: ${({ theme }) => theme.colors.background.paper};
  border-left: 1px solid ${({ theme }) => theme.colors.gray[200]};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  z-index: 40;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const HeaderInfo = styled.div``;

const HeaderTitle = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const HeaderSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.125rem;
`;

const CloseButton = styled.button`
  padding: 0.5rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  transition: background-color 0.15s ease;
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const ScheduleList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 0;
`;

const EmptyIconCircle = styled.div`
  width: 4rem;
  height: 4rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 1rem;
`;

const ScheduleCard = styled.button`
  width: 100%;
  text-align: left;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  cursor: pointer;
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const ScheduleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const ScheduleTimeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ScheduleTime = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const UrgentBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: #fee2e2;
  color: #dc2626;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const ClassBadge = styled.span<{ $bgColor: string; $textColor: string }>`
  padding: 0.125rem 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ $bgColor }) => $bgColor};
  color: ${({ $textColor }) => $textColor};
`;

const StudentSection = styled.div`
  margin-bottom: 0.5rem;
`;

const StudentName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const StudentTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
`;

const StudentTag = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  background: ${({ theme }) => theme.colors.gray[100]};
  padding: 0.125rem 0.375rem;
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const StudentTagCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const CounselingInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  flex-wrap: wrap;
`;

const AreaBadge = styled.span<{ $bgColor: string; $textColor: string }>`
  padding: 0.125rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background-color: ${({ $bgColor }) => $bgColor};
  color: ${({ $textColor }) => $textColor};
`;

const MethodInfo = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const MethodText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const Reason = styled.p`
  margin-top: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Footer = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

interface DateDetailPanelProps {
  date: Date;
  schedules: CounselingRecord[];
  onClose: () => void;
  onAddClick: () => void;
  onScheduleClick: (schedule: CounselingRecord) => void;
}

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };
  return date.toLocaleDateString('ko-KR', options);
};

export const DateDetailPanel: React.FC<DateDetailPanelProps> = ({
  date,
  schedules,
  onClose,
  onAddClick,
  onScheduleClick,
}) => {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'phone':
        return <Phone className='w-4 h-4' />;
      case 'video':
        return <Video className='w-4 h-4' />;
      case 'group':
        return <Users className='w-4 h-4' />;
      default:
        return <User className='w-4 h-4' />;
    }
  };

  const getClassLabel = (classId: string) => {
    const cls = SCHEDULE_CLASSES.find((c) => c.id === classId);
    return cls?.label || classId;
  };

  return (
    <Panel>
      {/* 헤더 */}
      <Header>
        <HeaderInfo>
          <HeaderTitle>{formatDate(date)}</HeaderTitle>
          <HeaderSubtitle>{schedules.length}건의 상담 일정</HeaderSubtitle>
        </HeaderInfo>
        <CloseButton onClick={onClose}>
          <X className='w-5 h-5 text-gray-500' />
        </CloseButton>
      </Header>

      {/* 일정 목록 */}
      <ScheduleList>
        {schedules.length === 0 ? (
          <EmptyState>
            <EmptyIconCircle>
              <Clock className='w-8 h-8 text-gray-400' />
            </EmptyIconCircle>
            <EmptyText>이 날짜에 예정된 상담이 없습니다</EmptyText>
          </EmptyState>
        ) : (
          schedules
            .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
            .map((schedule) => {
              const scheduleTime = schedule.scheduledAt.split(' ')[1] || '09:00';
              return (
                <ScheduleCard key={schedule.id} onClick={() => onScheduleClick(schedule)}>
                  {/* 상단: 시간 + 긴급 + 유형 */}
                  <ScheduleHeader>
                    <ScheduleTimeGroup>
                      <ScheduleTime>{scheduleTime}</ScheduleTime>
                      {schedule.types.includes('urgent') && (
                        <UrgentBadge>
                          <AlertCircle className='w-3 h-3' />
                          긴급
                        </UrgentBadge>
                      )}
                    </ScheduleTimeGroup>
                    <ClassBadge
                      $bgColor={`${CLASS_COLORS[schedule.classId]}15`}
                      $textColor={CLASS_COLORS[schedule.classId]}
                    >
                      {getClassLabel(schedule.classId)}
                    </ClassBadge>
                  </ScheduleHeader>

                  {/* 학생명 */}
                  <StudentSection>
                    <StudentName>
                      {schedule.students.length === 1
                        ? schedule.students[0].name
                        : `${schedule.students[0].name} 외 ${schedule.students.length - 1}명`}
                    </StudentName>
                    {schedule.students.length > 1 && (
                      <StudentTagList>
                        {schedule.students.slice(1, 4).map((s) => (
                          <StudentTag key={s.id}>{s.name}</StudentTag>
                        ))}
                        {schedule.students.length > 4 && (
                          <StudentTagCount>+{schedule.students.length - 4}</StudentTagCount>
                        )}
                      </StudentTagList>
                    )}
                  </StudentSection>

                  {/* 상담 정보 */}
                  <CounselingInfo>
                    {schedule.areas.map((area, i) => (
                      <AreaBadge
                        key={i}
                        $bgColor={`${CLASS_COLORS[schedule.classId]}15`}
                        $textColor={CLASS_COLORS[schedule.classId]}
                      >
                        {COUNSELING_AREA_LABELS[area]}
                      </AreaBadge>
                    ))}
                    <MethodInfo>
                      {getMethodIcon(schedule.methods[0])}
                      <MethodText>
                        {schedule.methods.map((m) => COUNSELING_METHOD_LABELS[m]).join(', ')}
                      </MethodText>
                    </MethodInfo>
                  </CounselingInfo>

                  {/* 사유 */}
                  {schedule.reason && <Reason>{schedule.reason}</Reason>}
                </ScheduleCard>
              );
            })
        )}
      </ScheduleList>

      {/* 하단 버튼 */}
      <Footer>
        <Button onClick={onAddClick} className='w-full'>
          <Plus className='w-4 h-4 mr-2' />이 날짜에 상담 등록
        </Button>
      </Footer>
    </Panel>
  );
};
