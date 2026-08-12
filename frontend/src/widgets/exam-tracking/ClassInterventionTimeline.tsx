import { useQuery } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { CalendarDays, MessageSquare } from 'lucide-react';
import { Card } from '@shared/components';
import { counselingService } from '@shared/services/counselingService';
import { counselingKeys } from '@features/student-dashboard/api/queryKeys';

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const Timeline = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};

  &::before {
    position: absolute;
    top: 16px;
    bottom: 16px;
    left: 16px;
    width: 1px;
    content: '';
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const Entry = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Icon = styled.span`
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: ${({ theme }) => theme.colors.info.main};
  background: ${({ theme }) => theme.colors.info.light};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const EntryBody = styled.div`
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.info.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Date = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const EntryTitle = styled.p`
  margin: 5px 0 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const EntryDescription = styled.p`
  margin: 3px 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const EmptyText = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg} 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

interface ClassInterventionTimelineProps {
  classId: string;
}

export const ClassInterventionTimeline = ({ classId }: ClassInterventionTimelineProps) => {
  const { data: records = [], isLoading } = useQuery({
    queryKey: counselingKeys.byClass(classId),
    queryFn: () => counselingService.getByClassId(classId),
  });

  if (isLoading) {
    return (
      <Card>
        <Title>개입 이력</Title>
        <EmptyText>개입 이력을 불러오는 중입니다.</EmptyText>
      </Card>
    );
  }

  return (
    <Card>
      <Title>개입 이력</Title>
      {records.length === 0 ? (
        <EmptyText>학급 개입 이력이 없습니다.</EmptyText>
      ) : (
        <Timeline>
          {records
            .slice()
            .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
            .map((record) => (
              <Entry key={record.id}>
                <Icon>
                  <MessageSquare size={16} />
                </Icon>
                <EntryBody>
                  <Meta>
                    <span>상담</span>
                    <Date>
                      <CalendarDays size={12} />
                      {record.scheduledAt}
                    </Date>
                  </Meta>
                  <EntryTitle>{record.summary || record.reason || '상담 기록'}</EntryTitle>
                  {record.nextSteps && record.nextSteps !== '-' && (
                    <EntryDescription>{record.nextSteps}</EntryDescription>
                  )}
                </EntryBody>
              </Entry>
            ))}
        </Timeline>
      )}
    </Card>
  );
};
