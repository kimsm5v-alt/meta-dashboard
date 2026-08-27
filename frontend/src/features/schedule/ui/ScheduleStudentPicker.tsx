import { useState, useMemo, useEffect } from 'react';
import styled from '@emotion/styled';
import { Check, X, Search, Users } from 'lucide-react';
import { Modal, Button } from '@shared/components';
import type { CounselingStudent } from '@shared/types';
import type { ScheduleClass } from '@shared/data/mockUnifiedCounseling';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_CLASS_ALL_STUDENTS } from '@shared/data/apiDefinitions';
import { matchesNameSearch } from '@shared/utils/koreanNameSearch';

interface ScheduleStudentPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: CounselingStudent[];
  onConfirm: (students: CounselingStudent[]) => void;
  classes: ScheduleClass[];
  studentsMap: Record<string, CounselingStudent[]>;
  classColors: Record<string, string>;
}

// ============================================================
// Styled Components
// ============================================================

const Container = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  height: 60vh;
`;

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const TabContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-bottom: 2px solid
    ${({ $isActive, theme }) => ($isActive ? theme.colors.primary[500] : 'transparent')};
  margin-bottom: -1px;
  transition: color ${({ theme }) => theme.transitions.fast};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary[600] : theme.colors.gray[500]};
  background: transparent;
  border-top: none;
  border-left: none;
  border-right: none;
  cursor: pointer;

  &:hover {
    color: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary[600] : theme.colors.gray[700]};
  }
`;

const ColorDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ $color }) => $color};
`;

const SelectedCountBadge = styled.span`
  padding: 2px 6px;
  background-color: ${({ theme }) => theme.colors.primary[100]};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  padding-left: 36px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]};
    border-color: transparent;
  }
`;

const StudentGrid = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StudentButton = styled.button<{ $isSelected: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 2px solid
    ${({ $isSelected, theme }) =>
      $isSelected ? theme.colors.primary[500] : theme.colors.gray[200]};
  background-color: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.primary[50] : 'transparent'};
  transition: all ${({ theme }) => theme.transitions.fast};
  cursor: pointer;

  &:hover {
    border-color: ${({ $isSelected, theme }) =>
      $isSelected ? theme.colors.primary[500] : theme.colors.gray[300]};
    background-color: ${({ $isSelected, theme }) =>
      $isSelected ? theme.colors.primary[50] : theme.colors.gray[50]};
  }
`;

const SelectedCheck = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme }) => theme.colors.primary[500]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CheckIcon = styled(Check)`
  width: 10px;
  height: 10px;
  color: white;
`;

const StudentAvatar = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: white;
  flex-shrink: 0;
  background-color: ${({ $color }) => $color};
`;

const StudentName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const EmptyIcon = styled(Users)`
  width: 32px;
  height: 32px;
  margin: 0 auto ${({ theme }) => theme.spacing.sm};
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const RightPanel = styled.div`
  width: 224px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding-left: ${({ theme }) => theme.spacing.md};
`;

const RightPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SelectedTitle = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ClearButton = styled.button`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.error.main};
  }
`;

const SelectedList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ClassGroup = styled.div``;

const ClassLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ClassUsersIcon = styled(Users)`
  width: 12px;
  height: 12px;
`;

const StudentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const SelectedStudentItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px;
  background-color: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const StudentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const StudentNumber = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const StudentNameSmall = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RemoveButton = styled.button`
  padding: 2px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const RemoveIcon = styled(X)`
  width: 12px;
  height: 12px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const FooterButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const FooterButton = styled(Button)`
  flex: 1;
`;

// ============================================================
// Component
// ============================================================

export const ScheduleStudentPicker: React.FC<ScheduleStudentPickerProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  onConfirm,
  classes,
  studentsMap,
  classColors,
}) => {
  const [activeTab, setActiveTab] = useState(classes[0]?.id ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelection, setLocalSelection] = useState<CounselingStudent[]>(selectedStudents);

  // Re-sync localSelection when modal opens with new selectedStudents
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalSelection(selectedStudents);
      if (!activeTab && classes[0]?.id) {
        setActiveTab(classes[0].id);
      }
    }
  }, [isOpen, selectedStudents, classes, activeTab]);

  const students = studentsMap[activeTab] || [];

  // 검색 필터링
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(
      (s) => matchesNameSearch(s.name.toLowerCase(), query) || s.number.toString().includes(query),
    );
  }, [students, searchQuery]);

  const isSelected = (student: CounselingStudent) =>
    localSelection.some((s) => s.id === student.id);

  const toggleStudent = (student: CounselingStudent) => {
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

  // 선택된 학생들을 반별로 그룹화
  const selectionByClass = useMemo(() => {
    return localSelection.reduce(
      (acc, student) => {
        const cls = classes.find((c) => c.id === student.classId);
        const key = cls ? cls.label : '기타';
        if (!acc[key]) acc[key] = [];
        acc[key].push(student);
        return acc;
      },
      {} as Record<string, CounselingStudent[]>,
    );
  }, [localSelection, classes]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='학생 선택' size='3xl'>
      <Container>
        {/* 좌측: 반별 탭 + 검색 + 학생 그리드 */}
        <LeftPanel>
          {/* 반 탭 */}
          <ApiTooltip {...API_CLASS_ALL_STUDENTS} position='bottom-left'>
            <TabContainer>
              {classes.map((cls) => {
                const isActive = activeTab === cls.id;
                const classSelectedCount = localSelection.filter(
                  (s) => s.classId === cls.id,
                ).length;
                return (
                  <TabButton key={cls.id} onClick={() => setActiveTab(cls.id)} $isActive={isActive}>
                    <ColorDot $color={classColors[cls.id] ?? '#9CA3AF'} />
                    <span>{cls.label}</span>
                    {classSelectedCount > 0 && (
                      <SelectedCountBadge>{classSelectedCount}</SelectedCountBadge>
                    )}
                  </TabButton>
                );
              })}
            </TabContainer>
          </ApiTooltip>

          {/* 검색 */}
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='이름 또는 번호로 검색'
            />
          </SearchContainer>

          {/* 학생 그리드 */}
          <StudentGrid>
            <GridContainer>
              {filteredStudents.map((student) => {
                const selected = isSelected(student);
                return (
                  <StudentButton
                    key={student.id}
                    onClick={() => toggleStudent(student)}
                    $isSelected={selected}
                  >
                    {selected && (
                      <SelectedCheck>
                        <CheckIcon />
                      </SelectedCheck>
                    )}
                    <StudentAvatar
                      $color={selected ? '#8b5cf6' : (classColors[student.classId] ?? '#9CA3AF')}
                    >
                      {student.number}
                    </StudentAvatar>
                    <StudentName>{student.name}</StudentName>
                  </StudentButton>
                );
              })}
            </GridContainer>

            {filteredStudents.length === 0 && (
              <EmptyState>
                <EmptyIcon />
                <EmptyText>검색 결과가 없습니다</EmptyText>
              </EmptyState>
            )}
          </StudentGrid>
        </LeftPanel>

        {/* 우측: 선택된 학생 목록 */}
        <RightPanel>
          <RightPanelHeader>
            <SelectedTitle>선택됨 ({localSelection.length}명)</SelectedTitle>
            {localSelection.length > 0 && (
              <ClearButton onClick={handleClear}>전체 해제</ClearButton>
            )}
          </RightPanelHeader>

          <SelectedList>
            {Object.entries(selectionByClass).map(([className, students]) => (
              <ClassGroup key={className}>
                <ClassLabel>
                  <ClassUsersIcon />
                  {className}
                </ClassLabel>
                <StudentList>
                  {students.map((student) => (
                    <SelectedStudentItem key={student.id}>
                      <StudentInfo>
                        <StudentNumber>{student.number}.</StudentNumber>
                        <StudentNameSmall>{student.name}</StudentNameSmall>
                      </StudentInfo>
                      <RemoveButton onClick={() => toggleStudent(student)}>
                        <RemoveIcon />
                      </RemoveButton>
                    </SelectedStudentItem>
                  ))}
                </StudentList>
              </ClassGroup>
            ))}

            {localSelection.length === 0 && (
              <EmptyState>
                <EmptyIcon />
                <EmptyText>학생을 선택하세요</EmptyText>
              </EmptyState>
            )}
          </SelectedList>
        </RightPanel>
      </Container>

      {/* 하단 버튼 */}
      <FooterButtons>
        <FooterButton variant='secondary' onClick={onClose}>
          취소
        </FooterButton>
        <FooterButton onClick={handleConfirm} disabled={localSelection.length === 0}>
          {localSelection.length}명 선택 완료
        </FooterButton>
      </FooterButtons>
    </Modal>
  );
};
