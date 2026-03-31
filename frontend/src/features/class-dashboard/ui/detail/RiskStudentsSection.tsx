import styled from '@emotion/styled';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, ExternalLink, ArrowRight } from 'lucide-react';
import type { RiskStudent } from '../../model/useClassDetailData';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ChangeSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(238, 242, 255, 0.5);
  border: 1px solid #c7d2fe;
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const ChangeSummaryContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ChangeStat = styled.span`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const StatBold = styled.b`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ResolvedStat = styled.span`
  color: #059669;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const SectionWrapper = styled.div``;

const SectionHeader = styled.div<{ $variant: 'critical' | 'watch' | 'resolved' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  ${({ $variant }) => {
    switch ($variant) {
      case 'critical':
        return 'background: rgba(254, 242, 242, 0.5); border: 1px solid #fecaca;';
      case 'watch':
        return 'background: rgba(254, 243, 199, 0.5); border: 1px solid #fde68a;';
      case 'resolved':
        return 'background: rgba(236, 253, 245, 0.5); border: 1px solid #a7f3d0;';
    }
  }}
`;

const SectionHeaderContent = styled.div``;

const SectionTitle = styled.h3<{ $variant: 'critical' | 'watch' | 'resolved' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $variant }) => {
    switch ($variant) {
      case 'critical':
        return '#b91c1c';
      case 'watch':
        return '#b45309';
      case 'resolved':
        return '#047857';
    }
  }};
`;

const SectionDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const EmptyMessage = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[400]};
  padding: 1rem 0;
  text-align: center;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const TableHead = styled.thead``;

const TableHeaderRow = styled.tr`
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray[200]};
  background: rgba(249, 250, 251, 0.5);
`;

const TableHeaderCell = styled.th<{ $width?: string }>`
  padding: 0.75rem;
  text-align: left;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[600]};
  ${({ $width }) => $width && `width: ${$width};`}
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr<{ $accent?: 'red' | 'amber' | 'emerald' }>`
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ $accent }) => {
      switch ($accent) {
        case 'red':
          return 'rgba(254, 242, 242, 0.3)';
        case 'amber':
          return 'rgba(254, 243, 199, 0.3)';
        case 'emerald':
          return 'rgba(236, 253, 245, 0.3)';
        default:
          return '#f9fafb';
      }
    }};
  }
`;

const TableCell = styled.td`
  padding: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const NameCell = styled(TableCell)`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const TypeCell = styled(TableCell)`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ReasonBadge = styled.span`
  display: inline-block;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  padding: 0.125rem 0.375rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
`;

const SevereBadge = styled.span`
  display: inline-block;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  background: #fef2f2;
  color: #dc2626;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  padding: 0.125rem 0.375rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
`;

const EmptyBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const ChangeBadge = styled.span<{ $status: 'new' | 'persistent' | 'resolved' | 'escalated' | 'deescalated' }>`
  display: inline-block;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  padding: 0.125rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  ${({ $status }) => {
    switch ($status) {
      case 'new':
        return 'background: #fee2e2; color: #b91c1c;';
      case 'persistent':
        return 'background: #fef3c7; color: #b45309;';
      case 'resolved':
        return 'background: #d1fae5; color: #047857;';
      case 'escalated':
        return 'background: #fee2e2; color: #b91c1c;';
      case 'deescalated':
        return 'background: #dbeafe; color: #1e40af;';
    }
  }}
`;

const ViewButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: white;
  background: ${({ theme }) => theme.colors.primary[500]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: background-color 0.15s ease;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const PrevLevelText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

interface RiskStudentsSectionProps {
  criticalStudents: RiskStudent[];
  watchListStudents: RiskStudent[];
  classId: string;
  isCompare?: boolean;
  prevCriticalStudents?: RiskStudent[];
  prevWatchListStudents?: RiskStudent[];
}

type ChangeStatus = 'new' | 'persistent' | 'resolved' | 'escalated' | 'deescalated';

const DIRECTION_LABEL: Record<string, string> = {
  low: '낮음',
  high: '높음',
};

const CHANGE_LABEL: Record<ChangeStatus, string> = {
  new: '신규',
  persistent: '지속',
  resolved: '해소',
  escalated: '악화',
  deescalated: '완화',
};

export const RiskStudentsSection: React.FC<RiskStudentsSectionProps> = ({
  criticalStudents,
  watchListStudents,
  classId,
  isCompare = false,
  prevCriticalStudents,
  prevWatchListStudents,
}) => {
  const navigate = useNavigate();

  // 1차 위험학생 ID → 수준 매핑
  const prevRiskMap = useMemo(() => {
    const map = new Map<string, 'critical' | 'watch'>();
    if (prevCriticalStudents) {
      for (const rs of prevCriticalStudents) map.set(rs.student.id, 'critical');
    }
    if (prevWatchListStudents) {
      for (const rs of prevWatchListStudents) map.set(rs.student.id, 'watch');
    }
    return map;
  }, [prevCriticalStudents, prevWatchListStudents]);

  const getChangeStatus = (
    studentId: string,
    currentLevel: 'critical' | 'watch',
  ): ChangeStatus | null => {
    if (!isCompare) return null;
    const prevLevel = prevRiskMap.get(studentId);
    if (!prevLevel) return 'new';
    if (prevLevel === 'watch' && currentLevel === 'critical') return 'escalated';
    if (prevLevel === 'critical' && currentLevel === 'watch') return 'deescalated';
    return 'persistent';
  };

  // 1차에는 있었지만 2차에서 해소된 학생
  const resolvedStudents = useMemo(() => {
    if (!isCompare) return [];
    const current2Ids = new Set([
      ...criticalStudents.map((rs) => rs.student.id),
      ...watchListStudents.map((rs) => rs.student.id),
    ]);
    const resolved: Array<{ student: RiskStudent['student']; prevLevel: 'critical' | 'watch' }> =
      [];
    if (prevCriticalStudents) {
      for (const rs of prevCriticalStudents) {
        if (!current2Ids.has(rs.student.id)) {
          resolved.push({ student: rs.student, prevLevel: 'critical' });
        }
      }
    }
    if (prevWatchListStudents) {
      for (const rs of prevWatchListStudents) {
        if (!current2Ids.has(rs.student.id)) {
          resolved.push({ student: rs.student, prevLevel: 'watch' });
        }
      }
    }
    return resolved;
  }, [isCompare, criticalStudents, watchListStudents, prevCriticalStudents, prevWatchListStudents]);

  const goToStudent = (studentId: string) => {
    navigate(`/dashboard/class/${classId}/student/${studentId}`);
  };

  const renderReasons = (rs: RiskStudent) => {
    return rs.reasons.map((r, i) => (
      <ReasonBadge key={i}>
        {r.category} {DIRECTION_LABEL[r.direction]}
      </ReasonBadge>
    ));
  };

  const renderSevereFactors = (rs: RiskStudent) => {
    if (rs.severeFactors.length === 0) return <EmptyBadge>-</EmptyBadge>;
    return rs.severeFactors.map((f, i) => (
      <SevereBadge key={i}>
        {f.name} T={f.score}
      </SevereBadge>
    ));
  };

  const StudentTable: React.FC<{
    students: RiskStudent[];
    accent: 'red' | 'amber';
    level: 'critical' | 'watch';
  }> = ({ students, accent, level }) => {
    if (students.length === 0) {
      return <EmptyMessage>해당하는 학생이 없습니다.</EmptyMessage>;
    }

    return (
      <TableWrapper>
        <Table>
          <TableHead>
            <TableHeaderRow>
              <TableHeaderCell $width='4rem'>번호</TableHeaderCell>
              <TableHeaderCell $width='6rem'>이름</TableHeaderCell>
              <TableHeaderCell $width='9rem'>유형</TableHeaderCell>
              <TableHeaderCell>관심 사유</TableHeaderCell>
              <TableHeaderCell>심각 요인</TableHeaderCell>
              {isCompare && <TableHeaderCell $width='5rem'>변화</TableHeaderCell>}
              <TableHeaderCell $width='6rem'>상세</TableHeaderCell>
            </TableHeaderRow>
          </TableHead>
          <TableBody>
            {students.map((rs) => {
              const changeStatus = getChangeStatus(rs.student.id, level);
              return (
                <TableRow key={rs.student.id} $accent={accent}>
                  <TableCell>{rs.student.number}</TableCell>
                  <NameCell>{rs.student.name}</NameCell>
                  <TypeCell>{rs.assessment.predictedType}</TypeCell>
                  <TableCell>{renderReasons(rs)}</TableCell>
                  <TableCell>{renderSevereFactors(rs)}</TableCell>
                  {isCompare && changeStatus && (
                    <TableCell>
                      <ChangeBadge $status={changeStatus}>{CHANGE_LABEL[changeStatus]}</ChangeBadge>
                    </TableCell>
                  )}
                  <TableCell>
                    <ViewButton onClick={() => goToStudent(rs.student.id)}>
                      보기
                      <ExternalLink className='w-3 h-3' />
                    </ViewButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrapper>
    );
  };

  return (
    <Container>
      {/* 변화 요약 (compare 모드) */}
      {isCompare && (
        <ChangeSummary>
          <ArrowRight className='w-4 h-4 text-indigo-500 shrink-0' />
          <ChangeSummaryContent>
            <ChangeStat>
              1차 위험군{' '}
              <StatBold>{(prevCriticalStudents?.length ?? 0) + (prevWatchListStudents?.length ?? 0)}</StatBold>명
            </ChangeStat>
            <ArrowRight className='w-3.5 h-3.5 text-gray-400' />
            <ChangeStat>
              2차 위험군 <StatBold>{criticalStudents.length + watchListStudents.length}</StatBold>명
            </ChangeStat>
            {resolvedStudents.length > 0 && (
              <ResolvedStat>(해소 {resolvedStudents.length}명)</ResolvedStat>
            )}
          </ChangeSummaryContent>
        </ChangeSummary>
      )}

      {/* 긴급 관심 */}
      <SectionWrapper>
        <SectionHeader $variant='critical'>
          <AlertTriangle className='w-4 h-4 text-red-500 shrink-0' />
          <SectionHeaderContent>
            <SectionTitle $variant='critical'>
              긴급 관심 필요 ({criticalStudents.length}명)
            </SectionTitle>
            <SectionDescription>
              복합 위험 요인 보유 또는 극단적 T점수 (부적 ≥70 / 정적 ≤29)
            </SectionDescription>
          </SectionHeaderContent>
        </SectionHeader>
        <StudentTable students={criticalStudents} accent='red' level='critical' />
      </SectionWrapper>

      {/* 관찰 필요 */}
      <SectionWrapper>
        <SectionHeader $variant='watch'>
          <Eye className='w-4 h-4 text-amber-500 shrink-0' />
          <SectionHeaderContent>
            <SectionTitle $variant='watch'>관찰 필요 ({watchListStudents.length}명)</SectionTitle>
            <SectionDescription>단일 영역 관심 필요 학생</SectionDescription>
          </SectionHeaderContent>
        </SectionHeader>
        <StudentTable students={watchListStudents} accent='amber' level='watch' />
      </SectionWrapper>

      {/* 해소된 학생 (compare 모드) */}
      {isCompare && resolvedStudents.length > 0 && (
        <SectionWrapper>
          <SectionHeader $variant='resolved'>
            <Eye className='w-4 h-4 text-emerald-500 shrink-0' />
            <SectionHeaderContent>
              <SectionTitle $variant='resolved'>
                위험 해소 ({resolvedStudents.length}명)
              </SectionTitle>
              <SectionDescription>
                1차에서 관심 필요였으나 2차에서 해소된 학생
              </SectionDescription>
            </SectionHeaderContent>
          </SectionHeader>
          <TableWrapper>
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell $width='4rem'>번호</TableHeaderCell>
                  <TableHeaderCell $width='6rem'>이름</TableHeaderCell>
                  <TableHeaderCell $width='9rem'>1차 상태</TableHeaderCell>
                  <TableHeaderCell>변화</TableHeaderCell>
                  <TableHeaderCell $width='6rem'>상세</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {resolvedStudents.map((rs) => (
                  <TableRow key={rs.student.id} $accent='emerald'>
                    <TableCell>{rs.student.number}</TableCell>
                    <NameCell>{rs.student.name}</NameCell>
                    <TableCell>
                      <PrevLevelText>
                        {rs.prevLevel === 'critical' ? '긴급 관심' : '관찰 필요'}
                      </PrevLevelText>
                    </TableCell>
                    <TableCell>
                      <ChangeBadge $status='resolved'>{CHANGE_LABEL.resolved}</ChangeBadge>
                    </TableCell>
                    <TableCell>
                      <ViewButton onClick={() => goToStudent(rs.student.id)}>
                        보기
                        <ExternalLink className='w-3 h-3' />
                      </ViewButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        </SectionWrapper>
      )}
    </Container>
  );
};
