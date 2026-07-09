/**
 * 추출된 학생 데이터 검토 테이블
 *
 * PDF에서 추출된 데이터를 교사가 검토할 수 있도록 표시.
 * 각 학생의 이름, 유형, 요인 수, 검증 상태를 보여줌.
 */

import styled from '@emotion/styled';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { RawData } from '@shared/services/storageService';
import type { ValidationResult } from '@shared/services/pdfExtractionService';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
`;

const StatCard = styled.div<{ $variant?: 'valid' | 'invalid' }>`
  background: ${({ $variant }) =>
    $variant === 'valid' ? '#ecfdf5' : $variant === 'invalid' ? '#fef3c7' : '#f9fafb'};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.75rem;
  text-align: center;
`;

const StatValue = styled.p<{ $variant?: 'valid' | 'invalid' }>`
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $variant }) =>
    $variant === 'valid' ? '#059669' : $variant === 'invalid' ? '#d97706' : '#111827'};
`;

const StatLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const AlertBox = styled.div<{ $severity: 'error' | 'warning' }>`
  background: ${({ $severity }) => ($severity === 'error' ? '#fef2f2' : '#fef3c7')};
  border: 1px solid ${({ $severity }) => ($severity === 'error' ? '#fecaca' : '#fde68a')};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.75rem;
`;

const AlertTitle = styled.p<{ $severity: 'error' | 'warning' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ $severity }) => ($severity === 'error' ? '#b91c1c' : '#b45309')};
  margin-bottom: 0.25rem;
`;

const AlertMessage = styled.p<{ $severity: 'error' | 'warning' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ $severity }) => ($severity === 'error' ? '#dc2626' : '#d97706')};
`;

const AlertExtra = styled.p<{ $severity: 'error' | 'warning' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ $severity }) => ($severity === 'error' ? '#ef4444' : '#f59e0b')};
  margin-top: 0.25rem;
`;

const TableWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const TableHead = styled.thead`
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const TableHeaderCell = styled.th<{ $align?: 'left' | 'center' }>`
  text-align: ${({ $align = 'left' }) => $align};
  padding: 0.625rem 1rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const TableBody = styled.tbody`
  & > tr {
    border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  }
`;

const TableRow = styled.tr`
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const TableCell = styled.td<{ $align?: 'left' | 'center' }>`
  padding: 0.5rem 1rem;
  text-align: ${({ $align = 'left' }) => $align};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const NameCell = styled(TableCell)`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const TypeBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  background: #dbeafe;
  color: #2563eb;
  padding: 0.125rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
`;

const EmptyCell = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface DataReviewTableProps {
  rawData: RawData;
  validation: ValidationResult;
}

export const DataReviewTable: React.FC<DataReviewTableProps> = ({ rawData, validation }) => {
  const allStudents: Array<{
    className: string;
    name: string;
    id: string;
    factorCount: number;
    hasTest1: boolean;
    hasTest2: boolean;
    type: string | null;
  }> = [];

  for (const [className, classData] of Object.entries(rawData.classes)) {
    for (const student of classData.students) {
      const test1Scores = student.test1?.tScores;
      const test2Scores = student.test2?.tScores;
      const factorCount = test1Scores
        ? Object.keys(test1Scores).length
        : test2Scores
          ? Object.keys(test2Scores).length
          : 0;
      const type = student.test1?.type || student.test2?.type || null;

      allStudents.push({
        className,
        name: student.name,
        id: student.id,
        factorCount,
        hasTest1: !!test1Scores,
        hasTest2: !!test2Scores,
        type,
      });
    }
  }

  const getStatusIcon = (factorCount: number) => {
    if (factorCount >= 35)
      return (
        <IconWrapper>
          <CheckCircle className='w-4 h-4 text-emerald-500' />
        </IconWrapper>
      );
    if (factorCount >= 20)
      return (
        <IconWrapper>
          <AlertTriangle className='w-4 h-4 text-amber-500' />
        </IconWrapper>
      );
    return (
      <IconWrapper>
        <XCircle className='w-4 h-4 text-red-500' />
      </IconWrapper>
    );
  };

  return (
    <Container>
      {/* 요약 */}
      <SummaryGrid>
        <StatCard>
          <StatValue>{validation.classCount}</StatValue>
          <StatLabel>학급</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{validation.studentCount}</StatValue>
          <StatLabel>학생</StatLabel>
        </StatCard>
        <StatCard $variant={validation.isValid ? 'valid' : 'invalid'}>
          <StatValue $variant={validation.isValid ? 'valid' : 'invalid'}>
            {validation.isValid ? 'OK' : `${validation.errors.length}`}
          </StatValue>
          <StatLabel>{validation.isValid ? '검증 통과' : '오류'}</StatLabel>
        </StatCard>
      </SummaryGrid>

      {/* 경고/오류 메시지 */}
      {validation.errors.length > 0 && (
        <AlertBox $severity='error'>
          <AlertTitle $severity='error'>오류</AlertTitle>
          {validation.errors.slice(0, 5).map((err, i) => (
            <AlertMessage key={i} $severity='error'>
              {err.message}
            </AlertMessage>
          ))}
          {validation.errors.length > 5 && (
            <AlertExtra $severity='error'>... 외 {validation.errors.length - 5}건</AlertExtra>
          )}
        </AlertBox>
      )}

      {validation.warnings.length > 0 && (
        <AlertBox $severity='warning'>
          <AlertTitle $severity='warning'>주의</AlertTitle>
          {validation.warnings.slice(0, 3).map((warn, i) => (
            <AlertMessage key={i} $severity='warning'>
              {warn.message}
            </AlertMessage>
          ))}
          {validation.warnings.length > 3 && (
            <AlertExtra $severity='warning'>... 외 {validation.warnings.length - 3}건</AlertExtra>
          )}
        </AlertBox>
      )}

      {/* 학생 목록 */}
      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>학급</TableHeaderCell>
              <TableHeaderCell>이름</TableHeaderCell>
              <TableHeaderCell>유형</TableHeaderCell>
              <TableHeaderCell $align='center'>요인수</TableHeaderCell>
              <TableHeaderCell $align='center'>1차</TableHeaderCell>
              <TableHeaderCell $align='center'>2차</TableHeaderCell>
              <TableHeaderCell $align='center'>상태</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {allStudents.map((student, i) => (
              <TableRow key={i}>
                <TableCell>{student.className}</TableCell>
                <NameCell>{student.name}</NameCell>
                <TableCell>
                  {student.type ? <TypeBadge>{student.type}</TypeBadge> : <EmptyCell>-</EmptyCell>}
                </TableCell>
                <TableCell $align='center'>{student.factorCount}/38</TableCell>
                <TableCell $align='center'>
                  {student.hasTest1 ? (
                    <IconWrapper>
                      <CheckCircle className='w-4 h-4 text-emerald-500' />
                    </IconWrapper>
                  ) : (
                    <EmptyCell>-</EmptyCell>
                  )}
                </TableCell>
                <TableCell $align='center'>
                  {student.hasTest2 ? (
                    <IconWrapper>
                      <CheckCircle className='w-4 h-4 text-emerald-500' />
                    </IconWrapper>
                  ) : (
                    <EmptyCell>-</EmptyCell>
                  )}
                </TableCell>
                <TableCell $align='center'>{getStatusIcon(student.factorCount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </Container>
  );
};
