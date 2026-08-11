import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card } from '@shared/components';
import { buildScopeQueryString } from '@shared/scope';
import { useStudentCounselingRecordsQuery } from '@features/student-dashboard/api/counselingQueries';
import { useStudentMemosQuery } from '@features/student-dashboard/api/memoQueries';

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const LinkButton = styled.button`
  padding: 0;
  color: ${({ theme }) => theme.colors.primary[600]};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.li`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};

  &:first-of-type {
    border-top: none;
  }
`;

const Badge = styled.span<{ $kind: 'counseling' | 'memo' }>`
  flex-shrink: 0;
  padding: 2px 8px;
  color: ${({ theme, $kind }) =>
    $kind === 'counseling' ? theme.colors.info.dark : theme.colors.gray[600]};
  background: ${({ theme, $kind }) =>
    $kind === 'counseling' ? theme.colors.info.light : theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const RowDate = styled.span`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const RowTitle = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
`;

const EmptyText = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg} 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

interface TimelineEntry {
  kind: 'counseling' | 'memo';
  id: string;
  date: string;
  title: string;
}

interface InterventionTimelineProps {
  studentId: string;
  classId: string;
}

export const InterventionTimeline = ({ studentId, classId }: InterventionTimelineProps) => {
  const navigate = useNavigate();
  const { data: counselingRecords = [], isLoading: counselingLoading } =
    useStudentCounselingRecordsQuery(studentId);
  const { data: memos = [], isLoading: memosLoading } = useStudentMemosQuery(studentId);

  const goToResult = () =>
    navigate(`/exam/result${buildScopeQueryString({ level: 'student', classId, studentId })}`);

  if (counselingLoading || memosLoading) {
    return (
      <Card>
        <Title>개입이력</Title>
        <CenterBox>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </CenterBox>
      </Card>
    );
  }

  const entries: TimelineEntry[] = [
    ...counselingRecords.map((r) => ({
      kind: 'counseling' as const,
      id: r.id,
      date: r.scheduledAt,
      title: r.summary || r.reason || '상담 기록',
    })),
    ...memos.map((m) => ({
      kind: 'memo' as const,
      id: m.id,
      date: m.date,
      title: m.content,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <Card>
      <Header>
        <Title>개입이력</Title>
        <LinkButton onClick={goToResult}>결과보기에서 전체 기록 보기 →</LinkButton>
      </Header>
      {entries.length === 0 ? (
        <EmptyText>상담·관찰 기록이 없습니다.</EmptyText>
      ) : (
        <List>
          {entries.map((entry) => (
            <Row key={`${entry.kind}-${entry.id}`}>
              <Badge $kind={entry.kind}>{entry.kind === 'counseling' ? '상담' : '관찰'}</Badge>
              <RowDate>{entry.date}</RowDate>
              <RowTitle>{entry.title}</RowTitle>
            </Row>
          ))}
        </List>
      )}
    </Card>
  );
};
