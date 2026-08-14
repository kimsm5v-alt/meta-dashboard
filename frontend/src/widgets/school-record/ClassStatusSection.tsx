import { useState } from 'react';
import styled from '@emotion/styled';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Eye,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@features/auth';
import { useSchoolRecordClassData } from '@features/school-record/model/useSchoolRecordClassData';
import { schoolRecordApi } from '@features/school-record/api/schoolRecordApi';
import { buildRecordsCsv, downloadCsv } from '@features/school-record/utils/downloadCsv';
import {
  classSubtitle,
  displayStatus,
  type DisplayStatusKey,
} from '@features/school-record/utils/formatters';
import { RecordPreviewModal, type PreviewStudent } from './RecordPreviewModal';

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.gray[300]};
    border-color: ${({ theme }) => theme.colors.gray[200]};
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(ActionButton)`
  color: white;
  background: ${({ theme }) => theme.colors.primary[500]};
  border: none;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
  }
`;

const TableCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
  overflow: hidden;
`;

const TableHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const TableHeaderTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const TableHeaderCount = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const TableScroll = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const Th = styled.th`
  padding: 12px 16px;
  text-align: left;
  white-space: nowrap;
`;

const SortButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary[600] : theme.colors.text.secondary};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  cursor: pointer;
`;

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const CheckboxTd = styled(Td)`
  width: 48px;
  text-align: center;
`;

const FactorTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const FactorTag = styled.span`
  padding: 2px 8px;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const StatusBadge = styled.span<{ $key: DisplayStatusKey }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  ${({ theme, $key }) =>
    $key === 'done'
      ? `color: ${theme.colors.success.dark}; background: ${theme.colors.success.light};`
      : $key === 'inprogress'
        ? `color: ${theme.colors.warning.dark}; background: ${theme.colors.warning.light};`
        : `color: ${theme.colors.gray[500]}; background: ${theme.colors.gray[100]};`}
`;

const NameButton = styled.button`
  color: ${({ theme }) => theme.colors.text.primary};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const EditButton = styled.button`
  padding: 6px 12px;
  color: ${({ theme }) => theme.colors.primary[600]};
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[100]};
  }
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
`;

type SortKey = 'no' | 'name' | 'strength' | 'improvement' | 'status' | 'updated';
interface SortState {
  key: SortKey;
  dir: 'asc' | 'desc';
}
const STATUS_ORDER: Record<DisplayStatusKey, number> = { empty: 0, inprogress: 1, done: 2 };

export interface ClassStatusSectionProps {
  classId: string;
  onOpenStudent: (studentId: string) => void;
  onBulk: (studentIds: string[]) => void;
}

export const ClassStatusSection = ({ classId, onOpenStudent, onBulk }: ClassStatusSectionProps) => {
  const { user } = useAuth();
  const { classData, rows, isLoading } = useSchoolRecordClassData(classId);
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState>({ key: 'no', dir: 'asc' });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<PreviewStudent[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );

  if (isLoading) {
    return (
      <Wrapper>
        <CenterBox>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </CenterBox>
      </Wrapper>
    );
  }

  if (!classData) {
    return (
      <Wrapper>
        <CenterBox>학급 정보를 찾을 수 없습니다.</CenterBox>
      </Wrapper>
    );
  }

  const sortVal = (row: (typeof rows)[number]): string | number => {
    switch (sort.key) {
      case 'no':
        return row.no;
      case 'name':
        return row.name;
      case 'strength':
        return row.strengths[0] ?? '';
      case 'improvement':
        return row.improvements[0] ?? '';
      case 'status':
        return STATUS_ORDER[displayStatus(row.status).key];
      case 'updated':
        return row.savedAt ?? '';
    }
  };
  const sorted = [...rows].sort((a, b) => {
    const va = sortVal(a);
    const vb = sortVal(b);
    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'ko');
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(row.studentId));
  const toggleAll = () => setSelected(allSelected ? [] : rows.map((row) => row.studentId));
  const toggleOne = (studentId: string) =>
    setSelected((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    );

  const doneStudentIds = rows
    .filter((row) => displayStatus(row.status).key === 'done')
    .map((row) => row.studentId);
  const selectedDoneIds = selected.filter((id) => doneStudentIds.includes(id));
  const downloadTargetIds = selected.length > 0 ? selectedDoneIds : doneStudentIds;
  const canPreview = downloadTargetIds.length > 0;

  const loadPreviewTargets = async (studentIds: string[]) => {
    setPreviewLoading(true);
    const details = await Promise.all(studentIds.map((id) => schoolRecordApi.getStudentDraft(id)));
    const students: PreviewStudent[] = studentIds
      .map((studentId, index) => {
        const row = rows.find((r) => r.studentId === studentId);
        const detail = details[index];
        if (!row || !detail?.content) return null;
        return {
          studentId,
          no: row.no,
          name: row.name,
          savedAt: row.savedAt,
          content: detail.content,
        };
      })
      .filter((item): item is PreviewStudent => item !== null);
    setPreviewStudents(students);
    setPreviewLoading(false);
  };

  const openPreview = () => {
    setPreviewOpen(true);
    void loadPreviewTargets(downloadTargetIds);
  };

  const classLabel = `${classData.grade}-${classData.classNumber}반`;

  const download = (rowIds: string[]) => {
    const targets = previewStudents.filter((s) => rowIds.includes(s.studentId));
    if (targets.length === 0) return;
    const csvRows = targets.map((student) => {
      const row = rows.find((r) => r.studentId === student.studentId);
      return {
        no: student.no,
        name: student.name,
        strengths: row?.strengths ?? [],
        improvements: row?.improvements ?? [],
        statusLabel: displayStatus(row?.status ?? 'EMPTY').label,
        content: student.content,
      };
    });
    downloadCsv(`생활기록부_문구_${classLabel.replace(/\s/g, '')}.csv`, buildRecordsCsv(csvRows));
  };

  return (
    <Wrapper>
      <HeaderRow>
        <div>
          <Title>{classLabel}</Title>
          <Subtitle>
            {classSubtitle(
              user?.schoolName,
              classData.schoolLevel,
              classData.grade,
              classData.classNumber,
            )}
          </Subtitle>
        </div>
        <Actions>
          <ActionButton onClick={openPreview} disabled={!canPreview || previewLoading}>
            <Eye size={16} /> 문구 미리보기
          </ActionButton>
          <ActionButton
            onClick={() => download(downloadTargetIds)}
            disabled={downloadTargetIds.length === 0}
          >
            <Download size={16} /> 문구 다운로드
            {downloadTargetIds.length > 0 ? ` (${downloadTargetIds.length})` : ''}
          </ActionButton>
          <PrimaryButton onClick={() => onBulk(selected)} disabled={selected.length === 0}>
            <Sparkles size={16} /> 선택 학생 문구 만들기
          </PrimaryButton>
        </Actions>
      </HeaderRow>

      <TableCard>
        <TableHeaderRow>
          <TableHeaderTitle>학생 목록</TableHeaderTitle>
          <TableHeaderCount>{rows.length}명</TableHeaderCount>
        </TableHeaderRow>
        <TableScroll>
          <Table>
            <Thead>
              <tr>
                <Th style={{ width: 48, textAlign: 'center' }}>
                  <input type='checkbox' checked={allSelected} onChange={toggleAll} />
                </Th>
                {(
                  [
                    ['no', '번호'],
                    ['name', '이름'],
                    ['strength', '강점 요인 TOP 3'],
                    ['improvement', '보완 요인 TOP 3'],
                    ['status', '작성 상태'],
                    ['updated', '최근 수정일'],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <Th key={key}>
                    <SortButton $active={sort.key === key} onClick={() => toggleSort(key)}>
                      {label}
                      {sort.key === key ? (
                        sort.dir === 'asc' ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )
                      ) : (
                        <ChevronsUpDown size={12} />
                      )}
                    </SortButton>
                  </Th>
                ))}
                <Th style={{ textAlign: 'center' }}>편집</Th>
              </tr>
            </Thead>
            <tbody>
              {sorted.map((row) => {
                const status = displayStatus(row.status);
                return (
                  <tr key={row.studentId}>
                    <CheckboxTd>
                      <input
                        type='checkbox'
                        checked={selected.includes(row.studentId)}
                        onChange={() => toggleOne(row.studentId)}
                      />
                    </CheckboxTd>
                    <Td>{row.no}번</Td>
                    <Td>
                      <NameButton onClick={() => onOpenStudent(row.studentId)}>
                        {row.name}
                      </NameButton>
                    </Td>
                    <Td>
                      <FactorTags>
                        {row.strengths.map((f) => (
                          <FactorTag key={f}>{f}</FactorTag>
                        ))}
                      </FactorTags>
                    </Td>
                    <Td>
                      <FactorTags>
                        {row.improvements.map((f) => (
                          <FactorTag key={f}>{f}</FactorTag>
                        ))}
                      </FactorTags>
                    </Td>
                    <Td>
                      <StatusBadge $key={status.key}>{status.label}</StatusBadge>
                    </Td>
                    <Td>{row.savedAt ?? '-'}</Td>
                    <Td style={{ textAlign: 'center' }}>
                      <EditButton onClick={() => onOpenStudent(row.studentId)}>
                        {status.action}
                      </EditButton>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableScroll>
      </TableCard>

      {previewOpen && (
        <RecordPreviewModal
          classLabel={classLabel}
          hasSelection={selected.length > 0}
          students={previewStudents}
          onClose={() => setPreviewOpen(false)}
          onDownloadAll={() => download(previewStudents.map((s) => s.studentId))}
        />
      )}
    </Wrapper>
  );
};
