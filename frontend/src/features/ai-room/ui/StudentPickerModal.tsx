import styled from '@emotion/styled';
import { useState } from 'react';
import { Check, X, Users } from 'lucide-react';
import { Modal, Button } from '@shared/components';
import { TYPE_COLORS } from '@shared/data/lpaProfiles';
import type { Class, Student } from '@shared/types';

const Container = styled.div`
  display: flex;
  gap: 1.5rem;
  height: 65vh;
`;

const LeftSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const TabBar = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-bottom: 2px solid;
  margin-bottom: -1px;
  border-color: ${({ $isActive, theme }) => ($isActive ? theme.colors.primary[500] : 'transparent')};
  color: ${({ $isActive, theme }) => ($isActive ? theme.colors.primary[600] : theme.colors.gray[500])};
  background: transparent;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ $isActive, theme }) => ($isActive ? theme.colors.primary[600] : theme.colors.gray[700])};
  }
`;

const TabBadge = styled.span`
  padding: 0.125rem 0.375rem;
  background: ${({ theme }) => theme.colors.primary[100]};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const StudentGrid = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.75rem;
`;

const StudentCard = styled.button<{ $selected: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 2px solid;
  border-color: ${({ $selected, theme }) => ($selected ? theme.colors.primary[500] : theme.colors.gray[200])};
  background: ${({ $selected, theme }) => ($selected ? theme.colors.primary[50] : 'transparent')};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ $selected, theme }) => ($selected ? theme.colors.primary[500] : theme.colors.gray[300])};
    background: ${({ $selected, theme }) => ($selected ? theme.colors.primary[50] : theme.colors.gray[50])};
  }
`;

const CheckMark = styled.div`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[500]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StudentAvatar = styled.div<{ $bgColor: string }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: 0.25rem;
  color: #ffffff;
  background-color: ${({ $bgColor }) => $bgColor};
`;

const StudentName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
`;

const StudentType = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.125rem;
`;

const RightSection = styled.div`
  width: 18rem;
  display: flex;
  flex-direction: column;
  border-left: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding-left: 1.5rem;
`;

const SelectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const SelectionTitle = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ClearButton = styled.button`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: #ef4444;
  }
`;

const SelectionList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ClassGroup = styled.div``;

const ClassGroupHeader = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ClassGroupStudents = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SelectedStudentItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const StudentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

const StudentNumber = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const StudentNameText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RemoveButton = styled.button`
  padding: 0.25rem;
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 0;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

interface StudentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Class[];
  selectedStudents: Student[];
  onConfirm: (students: Student[]) => void;
}

export const StudentPickerModal: React.FC<StudentPickerModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedStudents,
  onConfirm,
}) => {
  const [activeTab, setActiveTab] = useState(classes[0]?.id || '');
  const [localSelection, setLocalSelection] = useState<Student[]>(selectedStudents);

  const activeClass = classes.find((c) => c.id === activeTab);
  const students = activeClass?.students || [];

  const isSelected = (student: Student) => localSelection.some((s) => s.id === student.id);

  const toggleStudent = (student: Student) => {
    if (isSelected(student)) {
      setLocalSelection((prev) => prev.filter((s) => s.id !== student.id));
    } else {
      setLocalSelection((prev) => [...prev, student]);
    }
  };

  const handleConfirm = () => {
    onConfirm(localSelection);
    onClose();
  };

  const handleClear = () => {
    setLocalSelection([]);
  };

  const getStudentType = (student: Student): string => {
    const latestAssessment = student.assessments[student.assessments.length - 1];
    return latestAssessment?.predictedType || '미실시';
  };

  // 선택된 학생들을 반별로 그룹화
  const selectionByClass = localSelection.reduce(
    (acc, student) => {
      const cls = classes.find((c) => c.id === student.classId);
      const key = cls ? `${cls.grade}-${cls.classNumber}반` : '기타';
      if (!acc[key]) acc[key] = [];
      acc[key].push(student);
      return acc;
    },
    {} as Record<string, Student[]>,
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='학생 선택' size='full'>
      <Container>
        {/* 좌측: 반별 탭 + 학생 그리드 */}
        <LeftSection>
          {/* 반 탭 */}
          <TabBar>
            {classes.map((cls) => {
              const isActive = activeTab === cls.id;
              const classSelectedCount = localSelection.filter((s) => s.classId === cls.id).length;
              return (
                <TabButton key={cls.id} onClick={() => setActiveTab(cls.id)} $isActive={isActive}>
                  <span>
                    {cls.grade}-{cls.classNumber}반
                  </span>
                  {classSelectedCount > 0 && <TabBadge>{classSelectedCount}</TabBadge>}
                </TabButton>
              );
            })}
          </TabBar>

          {/* 학생 그리드 */}
          <StudentGrid>
            <GridContainer>
              {students.map((student) => {
                const selected = isSelected(student);
                const type = getStudentType(student);
                const avatarColor = selected ? '#8b5cf6' : TYPE_COLORS[type] || '#9CA3AF';
                return (
                  <StudentCard
                    key={student.id}
                    onClick={() => toggleStudent(student)}
                    $selected={selected}
                  >
                    {selected && (
                      <CheckMark>
                        <Check className='w-3 h-3 text-white' />
                      </CheckMark>
                    )}
                    <StudentAvatar $bgColor={avatarColor}>{student.number}</StudentAvatar>
                    <StudentName>{student.name}</StudentName>
                    <StudentType>
                      {type === '미실시' ? '미실시' : type.slice(0, 4)}
                    </StudentType>
                  </StudentCard>
                );
              })}
            </GridContainer>
          </StudentGrid>
        </LeftSection>

        {/* 우측: 선택된 학생 목록 */}
        <RightSection>
          <SelectionHeader>
            <SelectionTitle>선택됨 ({localSelection.length}명)</SelectionTitle>
            {localSelection.length > 0 && (
              <ClearButton onClick={handleClear}>전체 해제</ClearButton>
            )}
          </SelectionHeader>

          <SelectionList>
            {Object.entries(selectionByClass).map(([className, students]) => (
              <ClassGroup key={className}>
                <ClassGroupHeader>
                  <Users className='w-3 h-3' />
                  {className}
                </ClassGroupHeader>
                <ClassGroupStudents>
                  {students.map((student) => (
                    <SelectedStudentItem key={student.id}>
                      <StudentInfo>
                        <StudentNumber>{student.number}.</StudentNumber>
                        <StudentNameText>{student.name}</StudentNameText>
                      </StudentInfo>
                      <RemoveButton onClick={() => toggleStudent(student)}>
                        <X className='w-3 h-3 text-gray-400' />
                      </RemoveButton>
                    </SelectedStudentItem>
                  ))}
                </ClassGroupStudents>
              </ClassGroup>
            ))}

            {localSelection.length === 0 && (
              <EmptyState>
                <Users className='w-8 h-8 mx-auto mb-2 opacity-50' />
                <EmptyText>학생을 선택하세요</EmptyText>
              </EmptyState>
            )}
          </SelectionList>
        </RightSection>
      </Container>

      {/* 하단 버튼 */}
      <ButtonGroup>
        <Button variant='secondary' onClick={onClose} className='flex-1'>
          취소
        </Button>
        <Button onClick={handleConfirm} disabled={localSelection.length === 0} className='flex-1'>
          {localSelection.length}명 선택 완료
        </Button>
      </ButtonGroup>
    </Modal>
  );
};
