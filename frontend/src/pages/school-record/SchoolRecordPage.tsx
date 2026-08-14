import { useState } from 'react';
import styled from '@emotion/styled';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@features/auth';
import { useGroupMembersQuery } from '@features/groups';
import { useSchoolRecordClassData } from '@features/school-record/model/useSchoolRecordClassData';
import {
  BulkGenerateSection,
  ClassStatusSection,
  RecordEmptyState,
  StudentWritingSection,
} from '@widgets/school-record';
import { useLayoutContext } from '@widgets/layout/v2/LayoutContext';

const StatusBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const StatusButton = styled.button`
  padding: 7px 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
`;

const SchoolRecordScopeContent = () => {
  const { scope, selectClass, selectStudent } = useLayoutContext();
  const { user } = useAuth();
  const [bulkIds, setBulkIds] = useState<string[]>([]);

  const {
    data: members = [],
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useGroupMembersQuery(scope.classId, user?.id);

  const {
    rows: classRows,
    isLoading: classRowsLoading,
    error: classRowsError,
    refetch: refetchClassRows,
  } = useSchoolRecordClassData(bulkIds.length > 1 ? scope.classId : undefined);

  if (!scope.classId) {
    return <RecordEmptyState />;
  }

  const classId = scope.classId;
  const memberIdByStudentId = new Map(members.map((member) => [member.stdtId, member.id]));

  const openStudent = async (studentId: string) => {
    let memberId = memberIdByStudentId.get(studentId);
    let retryFailed = false;
    if (!memberId && membersError) {
      const result = await refetchMembers();
      retryFailed = result.isError;
      memberId = result.data?.find((member) => member.stdtId === studentId)?.id;
    }

    if (!memberId) {
      toast.error(
        retryFailed
          ? '학생 정보를 다시 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
          : membersLoading
            ? '학생 정보를 연결하는 중입니다. 잠시 후 다시 시도해 주세요.'
            : '선택한 학생 정보를 연결할 수 없습니다.',
      );
      return;
    }

    setBulkIds([]);
    selectStudent(classId, memberId);
  };

  if (scope.level === 'student' && scope.studentId) {
    if (membersLoading) {
      return (
        <StatusBox role='status'>
          <Loader2 size={24} aria-hidden='true' />
          학생 정보를 불러오는 중입니다.
        </StatusBox>
      );
    }

    if (membersError) {
      return (
        <StatusBox role='alert'>
          학생 정보를 불러오지 못했습니다.
          <StatusButton type='button' onClick={() => void refetchMembers()}>
            다시 시도
          </StatusButton>
        </StatusBox>
      );
    }

    const studentId = members.find((member) => member.id === scope.studentId)?.stdtId;
    if (!studentId) {
      return (
        <StatusBox role='alert'>
          선택한 학생 정보를 연결할 수 없습니다.
          <StatusButton type='button' onClick={() => selectClass(classId)}>
            반 목록으로 돌아가기
          </StatusButton>
        </StatusBox>
      );
    }

    return (
      <StudentWritingSection
        key={studentId}
        classId={classId}
        studentId={studentId}
        onBack={() => selectClass(classId)}
      />
    );
  }

  if (bulkIds.length > 1) {
    if (classRowsLoading) {
      return (
        <StatusBox role='status'>
          <Loader2 size={24} aria-hidden='true' />
          학생 목록을 불러오는 중입니다.
        </StatusBox>
      );
    }

    if (classRowsError) {
      return (
        <StatusBox role='alert'>
          학생 목록을 불러오지 못했습니다.
          <StatusButton type='button' onClick={refetchClassRows}>
            다시 시도
          </StatusButton>
        </StatusBox>
      );
    }

    const bulkStudents = classRows
      .filter((row) => bulkIds.includes(row.studentId))
      .map((row) => ({ studentId: row.studentId, no: row.no, name: row.name }));

    if (bulkStudents.length !== bulkIds.length) {
      return (
        <StatusBox role='alert'>
          선택한 학생 정보를 찾을 수 없습니다.
          <StatusButton type='button' onClick={() => setBulkIds([])}>
            반 목록으로 돌아가기
          </StatusButton>
        </StatusBox>
      );
    }

    return <BulkGenerateSection students={bulkStudents} onBack={() => setBulkIds([])} />;
  }

  return (
    <ClassStatusSection
      classId={classId}
      onOpenStudent={(studentId) => void openStudent(studentId)}
      onBulk={(studentIds) => {
        if (studentIds.length <= 1) {
          if (studentIds[0]) void openStudent(studentIds[0]);
          return;
        }
        setBulkIds(studentIds);
      }}
    />
  );
};

export const SchoolRecordPage = () => {
  const { scope } = useLayoutContext();
  const scopeKey =
    scope.level === 'student'
      ? `${scope.classId}:student:${scope.studentId}`
      : `${scope.classId ?? 'all'}:${scope.level}`;

  return <SchoolRecordScopeContent key={scopeKey} />;
};

export default SchoolRecordPage;
