import styled from '@emotion/styled';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@shared/components';
import { buildScopeQueryString } from '@shared/scope';
import { useStudentCounselingRecordsQuery } from '@features/student-dashboard/api/counselingQueries';

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const TotalBadge = styled.span`
  padding: 0.125rem 0.5rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 0.25rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const HelpText = styled.span`
  margin-left: auto;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
`;

const Column = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const ColumnTitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ColumnCount = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const ColumnDescription = styled.p`
  margin: -0.5rem 0 0.75rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: 0.625rem;
`;

const EntryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 12.5rem;
  overflow-y: auto;
`;

const EntryCard = styled.button`
  position: relative;
  padding: 0.75rem;
  overflow: hidden;
  color: inherit;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[200]};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const EntryTitle = styled.p`
  margin: 0 0 0.25rem;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const EntryDescription = styled.p`
  margin: 0 0 0.5rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: 1.5;
`;

const EntryDate = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const EntryOverlay = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  color: ${({ theme }) => theme.colors.primary[700]};
  background: rgb(245 243 255 / 0.94);
  border-radius: inherit;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  opacity: 0;
  transition: opacity 0.15s;

  ${EntryCard}:hover & {
    opacity: 1;
  }
`;

const LinkButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.75rem;
  color: ${({ theme }) => theme.colors.primary[600]};
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
    background: ${({ theme }) => theme.colors.primary[50]};
    border-color: ${({ theme }) => theme.colors.primary[300]};
  }
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 7.5rem;
`;

interface TimelineEntry {
  id: string;
  kind: 'counseling' | 'lesson';
  date: string;
  title: string;
  description: string;
}

const TEMP_INTERVENTIONS: TimelineEntry[] = [
  {
    id: 'temp-counseling-1',
    kind: 'counseling',
    date: '2026-06-08',
    title: '1차 검사 결과 상담',
    description: '1차 검사 결과 기반 학급 전체 상담',
  },
  {
    id: 'temp-counseling-2',
    kind: 'counseling',
    date: '2026-07-05',
    title: '학습 동기 상담',
    description: '학습 동기 저하 학생 대상 개별 상담',
  },
  {
    id: 'temp-lesson-1',
    kind: 'lesson',
    date: '2026-06-22',
    title: 'SEL 수업 - 자기이해',
    description: '자기정서인식 및 자기이해 역량 수업',
  },
];

interface InterventionTimelineProps {
  studentId: string;
  classId: string;
}

export const InterventionTimeline = ({ studentId, classId }: InterventionTimelineProps) => {
  const navigate = useNavigate();
  const { data: counselingRecords = [], isLoading } = useStudentCounselingRecordsQuery(studentId);

  if (isLoading) {
    return (
      <Card>
        <Title>개입 이력</Title>
        <CenterBox>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </CenterBox>
      </Card>
    );
  }

  const apiEntries: TimelineEntry[] = counselingRecords.map((record) => ({
    id: record.id,
    kind: 'counseling',
    date: record.scheduledAt,
    title: record.summary || record.reason || '상담 기록',
    description: record.reason || record.summary || '상담 기록',
  }));
  // TODO: 수업/개입 이력 API가 연결되면 임시 데이터를 제거한다.
  const entries = apiEntries.length > 0 ? apiEntries : TEMP_INTERVENTIONS;
  const counselingEntries = entries.filter(({ kind }) => kind === 'counseling');
  const lessonEntries = entries.filter(({ kind }) => kind === 'lesson');

  const goToResult = () =>
    navigate(`/exam/result${buildScopeQueryString({ level: 'student', classId, studentId })}`);

  return (
    <Card>
      <Header>
        <Title>개입 이력</Title>
        <TotalBadge>총 {entries.length}건</TotalBadge>
        <HelpText>각 항목에 마우스를 올리면 바로가기 링크가 표시됩니다</HelpText>
      </Header>
      <Grid>
        <Column>
          <ColumnHeader>
            <ColumnTitle>상담</ColumnTitle>
            <ColumnCount>{counselingEntries.length}회</ColumnCount>
          </ColumnHeader>
          <EntryList>
            {counselingEntries.map((entry) => (
              <EntryCard key={entry.id} onClick={goToResult}>
                <EntryTitle>{entry.title}</EntryTitle>
                <EntryDescription>{entry.description}</EntryDescription>
                <EntryDate>{entry.date}</EntryDate>
                <EntryOverlay>
                  <ExternalLink size={14} /> 상담 기록 보기
                </EntryOverlay>
              </EntryCard>
            ))}
          </EntryList>
        </Column>
        <Column>
          <ColumnHeader>
            <ColumnTitle>수업</ColumnTitle>
            <ColumnCount>{lessonEntries.length}회</ColumnCount>
          </ColumnHeader>
          <EntryList>
            {lessonEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                onClick={() => navigate(`/lesson?class=${classId}&tab=result`)}
              >
                <EntryTitle>{entry.title}</EntryTitle>
                <EntryDescription>{entry.description}</EntryDescription>
                <EntryDate>{entry.date}</EntryDate>
                <EntryOverlay>
                  <ExternalLink size={14} /> 수업 리포트 보기
                </EntryOverlay>
              </EntryCard>
            ))}
          </EntryList>
        </Column>
        <Column>
          <ColumnHeader>
            <ColumnTitle>학급 코칭</ColumnTitle>
          </ColumnHeader>
          <ColumnDescription>학급 대표 전략 코칭</ColumnDescription>
          <LinkButton onClick={() => navigate(`/coaching/class?class=${classId}`)}>
            <ExternalLink size={14} /> 학급 코칭 보기
          </LinkButton>
        </Column>
        <Column>
          <ColumnHeader>
            <ColumnTitle>개별 코칭</ColumnTitle>
          </ColumnHeader>
          <ColumnDescription>유형 강점 확인, 맞춤 코칭 제안</ColumnDescription>
          <LinkButton
            onClick={() => navigate(`/coaching/individual?class=${classId}&student=${studentId}`)}
          >
            <ExternalLink size={14} /> 개별 코칭 보기
          </LinkButton>
        </Column>
      </Grid>
    </Card>
  );
};
