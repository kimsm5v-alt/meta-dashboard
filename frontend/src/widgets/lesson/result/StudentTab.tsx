import { useState } from 'react';
import styled from '@emotion/styled';
import { Clock } from 'lucide-react';
import type { ReportDetailView } from '@features/lesson';
import {
  hasGradedItems,
  pct,
  renderMode,
  responseCell,
  responseOf,
  studentSummary,
  SUBMITTED_STATUS,
  submittedStudentCount,
} from '@features/lesson';
import { StudentStatusBadge } from './reportBadges';
import { ResponseGrid } from './ResponseGrid';
import type { GridItem } from './ResponseGrid';

interface StudentTabProps {
  view: ReportDetailView;
}

const Empty = styled.div`
  margin-top: 20px;
  padding: 64px 0;
  border: 1px dashed ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.gray[50]};
  text-align: center;
`;

const EmptyIcon = styled(Clock)`
  display: block;
  width: 32px;
  height: 32px;
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const EmptyText = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: 20px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 260px 1fr;
  }
`;

const List = styled.div`
  display: flex;
  max-height: 600px;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const ListHead = styled.div`
  padding: 6px ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ListCount = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const StudentBtn = styled.button<{ $on: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.sm};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme, $on }) => ($on ? theme.colors.primary[50] : 'transparent')};
  text-align: left;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme, $on }) => ($on ? theme.colors.primary[50] : theme.colors.gray[50])};
  }
`;

const No = styled.span`
  flex: none;
  width: 20px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

const Name = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Score = styled.span`
  flex: none;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
`;

const DetailCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Card = styled.div`
  padding: 20px;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius['2xl']};
`;

const DetailHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: 12px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
`;

const HeadNo = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const TileGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Tile = styled.div`
  padding: 12px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const TileLabel = styled.div`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const TileValue = styled.div`
  margin-top: 2px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
`;

const TileSub = styled.div`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const SectionTitle = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Count = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

export const StudentTab = ({ view }: StudentTabProps) => {
  const students = view.students;
  const firstDone = students.find((s) => s.statusCd === 5 || s.statusCd === 3);
  const firstSubmitted = firstDone ?? students.find((s) => SUBMITTED_STATUS.includes(s.statusCd));
  const defaultId = firstSubmitted?.studentId ?? students[0]?.studentId ?? '';
  const [selectedId, setSelectedId] = useState(defaultId);

  if (view.participantCount === 0) {
    return (
      <Empty>
        <EmptyIcon />
        <EmptyText>아직 참여한 학생이 없습니다.</EmptyText>
      </Empty>
    );
  }

  const curId = students.some((s) => s.studentId === selectedId) ? selectedId : defaultId;
  const cur = students.find((s) => s.studentId === curId);
  const sum = studentSummary(view, curId);
  const graded = hasGradedItems(view);
  const submittedCount = submittedStudentCount(students);

  const items: GridItem[] = view.articles.map((a) => {
    const resp = responseOf(view, a.id, curId);
    return {
      key: a.id,
      primary: `${a.order}. ${a.title}`,
      nature: a.nature,
      mode: renderMode(a),
      cell: responseCell(a, resp),
      capture: resp?.captureImage,
      showNature: true,
    };
  });

  return (
    <Layout>
      <List>
        <ListHead>
          참여 학생{' '}
          <ListCount>
            ({submittedCount}/{students.length})
          </ListCount>
        </ListHead>
        {students.map((s) => {
          const on = s.studentId === curId;
          return (
            <StudentBtn
              key={s.studentId}
              type='button'
              $on={on}
              onClick={() => setSelectedId(s.studentId)}
            >
              <No>{s.no}</No>
              <Name>{s.studentName}</Name>
              <Score>{s.score != null ? `${s.score}점` : '–'}</Score>
              <StudentStatusBadge statusCd={s.statusCd} />
            </StudentBtn>
          );
        })}
      </List>
      <DetailCol>
        <Card>
          <DetailHead>
            <HeadNo>{cur?.no}.</HeadNo>
            {cur?.studentName}
            {cur ? <StudentStatusBadge statusCd={cur.statusCd} /> : null}
          </DetailHead>
          <TileGrid>
            <Tile>
              <TileLabel>활동 페이지</TileLabel>
              <TileValue>
                {sum.submittedArticles}/{sum.totalArticles} p
              </TileValue>
            </Tile>
            <Tile>
              <TileLabel>정답률 / 맞춘 문제</TileLabel>
              <TileValue>{graded ? `${pct(sum.correctN, sum.gradedN)}%` : '–'}</TileValue>
              {graded ? (
                <TileSub>
                  {sum.correctN}/{sum.gradedN}개
                </TileSub>
              ) : null}
            </Tile>
          </TileGrid>
        </Card>
        <Card>
          <SectionTitle>
            페이지별 상세 <Count>({items.length})</Count>
          </SectionTitle>
          <ResponseGrid items={items} showSummary={false} />
        </Card>
      </DetailCol>
    </Layout>
  );
};
