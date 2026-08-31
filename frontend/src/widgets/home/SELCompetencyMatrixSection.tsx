import styled from '@emotion/styled';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card } from '@shared/components';
import { useHomeExamStats } from '@features/home/model/useHomeExamStats';

const Title = styled.h3`
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Subtitle = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const TableScroll = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;

  th,
  td {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
    text-align: center;
  }

  th {
    color: ${({ theme }) => theme.colors.gray[500]};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  }

  th:first-of-type,
  td:first-of-type {
    text-align: left;
  }
`;

const ClassName = styled.span`
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const CountCell = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const TotalCell = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: 6px 12px;
  color: ${({ theme }) => theme.colors.primary[700]};
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
`;

const SEL_COMPETENCIES = [
  '자기인식',
  '자기관리',
  '사회적 인식',
  '관계기술',
  '책임있는 의사결정',
  '마음 건강',
];

/**
 * 수업 이력 데이터는 별도 담당(타 팀) 소관 — 반 목록만 실데이터로 채우고
 * 역량별 수업 횟수는 아직 집계할 데이터가 없어 프로토타입과 동일한 표 구조로 0회를 표시한다.
 */
export const SELCompetencyMatrixSection = () => {
  const { groups, isLoading, error, refetch } = useHomeExamStats();

  if (isLoading) {
    return (
      <Card>
        <CenterBox>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </CenterBox>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CenterBox style={{ flexDirection: 'column' }}>
          <p style={{ margin: 0 }}>사회정서역량별 수업 이력을 불러오지 못했습니다.</p>
          <RetryButton onClick={refetch}>
            <RefreshCw size={14} /> 다시 시도
          </RetryButton>
        </CenterBox>
      </Card>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <Card>
      <Title>사회정서역량별 수업 이력</Title>
      <Subtitle>반별 SEL 역량 수업 실행 횟수</Subtitle>
      <TableScroll>
        <Table>
          <thead>
            <tr>
              <th>반</th>
              {SEL_COMPETENCIES.map((label) => (
                <th key={label}>{label}</th>
              ))}
              <th>합계</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id}>
                <td>
                  <ClassName>{group.name}</ClassName>
                </td>
                {SEL_COMPETENCIES.map((label) => (
                  <td key={label}>
                    <CountCell>0</CountCell>
                  </td>
                ))}
                <td>
                  <TotalCell>0회</TotalCell>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableScroll>
    </Card>
  );
};
