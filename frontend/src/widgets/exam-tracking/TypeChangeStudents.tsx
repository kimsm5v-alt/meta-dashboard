import styled from '@emotion/styled';
import { ArrowRight } from 'lucide-react';
import { Card } from '@shared/components';
import { useAuth } from '@features/auth';
import { useGroupMembersQuery } from '@features/groups';
import { TYPE_COLORS } from '@features/class-dashboard/lib/typeUtils';
import type { Class } from '@shared/types';
import { useLayoutContext } from '@widgets/layout/v2/LayoutContext';

const Title = styled.h3`
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const Subtitle = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const GroupList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Group = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: 48px;
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.md};

  @media (max-width: 900px) {
    flex-wrap: wrap;
  }
`;

const Flow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Type = styled.span<{ $color: string }>`
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}16`};
  border-radius: ${({ theme }) => theme.radius.full};
  padding: 4px 8px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const StudentList = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 6px;
`;

const StudentButton = styled.button`
  padding: 4px 8px;
  color: ${({ theme }) => theme.colors.gray[600]};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
    background: ${({ theme }) => theme.colors.primary[50]};
    border-color: ${({ theme }) => theme.colors.primary[200]};
  }
`;

const Count = styled.span`
  flex-shrink: 0;
  margin-left: auto;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const EmptyText = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg} 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

interface TypeChangeStudentsProps {
  classData: Class;
}

export const TypeChangeStudents = ({ classData }: TypeChangeStudentsProps) => {
  const { user } = useAuth();
  const { selectStudent } = useLayoutContext();
  const { data: members = [] } = useGroupMembersQuery(classData.id, user?.id);
  const memberIdByStudentId = new Map(members.map((member) => [member.stdtId, member.id]));
  const groups = new Map<string, typeof classData.students>();

  classData.students.forEach((student) => {
    const round1 = student.assessments.find((assessment) => assessment.round === 1);
    const round2 = student.assessments.find((assessment) => assessment.round === 2);
    if (!round1 || !round2 || round1.predictedType === round2.predictedType) return;
    const key = `${round1.predictedType}\u0000${round2.predictedType}`;
    groups.set(key, [...(groups.get(key) ?? []), student]);
  });

  const changedCount = [...groups.values()].reduce((count, students) => count + students.length, 0);

  return (
    <Card>
      <Title>유형 변화 학생</Title>
      <Subtitle>1차 → 2차 검사에서 LPA 유형이 변화한 학생 {changedCount}명</Subtitle>
      {groups.size === 0 ? (
        <EmptyText>유형이 변화한 학생이 없습니다.</EmptyText>
      ) : (
        <GroupList>
          {[...groups.entries()].map(([key, students]) => {
            const [from, to] = key.split('\u0000');
            return (
              <Group key={key}>
                <Flow>
                  <Type $color={TYPE_COLORS[from] ?? '#6B7280'}>{from}</Type>
                  <ArrowRight size={15} />
                  <Type $color={TYPE_COLORS[to] ?? '#6B7280'}>{to}</Type>
                </Flow>
                <StudentList>
                  {students.map((student) => {
                    const memberId = memberIdByStudentId.get(student.id);
                    return (
                      <StudentButton
                        key={student.id}
                        disabled={!memberId}
                        onClick={() => memberId && selectStudent(classData.id, memberId)}
                      >
                        {student.number}번 {student.name}
                      </StudentButton>
                    );
                  })}
                </StudentList>
                <Count>{students.length}명</Count>
              </Group>
            );
          })}
        </GroupList>
      )}
    </Card>
  );
};
