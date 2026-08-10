import styled from '@emotion/styled';
import { useEffect, useMemo, useState } from 'react';
import { Check, Minus, Search, Users, X } from 'lucide-react';
import type { Class, Student } from '@shared/types';
import { getStudentSelectionKey } from '../utils/studentSelectionKey';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.4);
`;

const Dialog = styled.div`
  position: relative;
  width: 720px;
  max-width: 100%;
  height: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
`;

const Header = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const HeaderTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: 15px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const CloseButton = styled.button`
  display: flex;
  padding: 0.375rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const Container = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
`;

// ── 좌측: 학급 목록(체크박스 세로 리스트) ─────────────────────────────
const ClassListSection = styled.div`
  width: 210px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 0.5rem 0;
  border-right: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const ClassListLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[400]};
  padding: 0 1rem;
  margin-bottom: 0.25rem;
`;

/* label이 아닌 div — label로 두면 텍스트 클릭(탭 전환)이 내부 체크박스도 함께
   토글시켜버린다(네이티브 label-for-input 동작). 체크박스 토글은 체크박스 자체
   클릭(stopPropagation 처리됨)에서만 일어나야 한다 */
const ClassRow = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin: 0 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ $isActive, theme }) =>
    $isActive ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary[700] : theme.colors.gray[700]};
  background: ${({ $isActive, theme }) => ($isActive ? theme.colors.primary[50] : 'transparent')};
  cursor: pointer;

  &:hover {
    background: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary[50] : theme.colors.gray[50]};
  }
`;

const ClassRowLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CheckboxButton = styled.button`
  flex-shrink: 0;
  display: flex;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
`;

const CheckboxMark = styled.span<{ $checked: boolean; $indeterminate?: boolean }>`
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
  background: ${({ $checked, $indeterminate, theme }) =>
    $checked || $indeterminate ? theme.colors.primary[500] : theme.colors.background.paper};
  border: 1px solid
    ${({ $checked, $indeterminate, theme }) =>
      $checked || $indeterminate ? theme.colors.primary[500] : theme.colors.gray[300]};
  border-radius: 5px;
`;

const ClassRowCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  flex-shrink: 0;
`;

// ── 우측: 검색 + 학생 체크 그리드 ─────────────────────────────
const RightSection = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const SearchRow = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const SearchInputWrapper = styled.div`
  position: relative;
  flex: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.375rem 0.75rem 0.375rem 2rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.lg};
  outline: none;

  &:focus {
    background: ${({ theme }) => theme.colors.background.paper};
    border-color: ${({ theme }) => theme.colors.primary[400]};
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const SelectAllLink = styled.button`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary[600]};
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`;

const StudentGrid = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.375rem;
`;

const StudentRow = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  text-align: left;
  background: ${({ $selected, theme }) => ($selected ? theme.colors.primary[50] : 'transparent')};
  border: 1px solid
    ${({ $selected, theme }) => ($selected ? theme.colors.primary[200] : 'transparent')};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[800]};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const StudentNumberBadge = styled.span`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  width: 1rem;
`;

const StudentRowName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 0;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

// ── 하단 푸터 ─────────────────────────────
const Footer = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const FooterCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const FooterActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ClearLink = styled.button`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    color: #ef4444;
  }
`;

const CompleteButton = styled.button`
  padding: 0.375rem 1rem;
  color: #ffffff;
  background: ${({ theme }) => theme.colors.primary[500]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const CheckboxView = ({
  checked,
  indeterminate = false,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) => (
  <CheckboxMark $checked={checked} $indeterminate={indeterminate}>
    {checked ? <Check size={12} strokeWidth={3} /> : indeterminate ? <Minus size={12} /> : null}
  </CheckboxMark>
);

interface StudentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Class[];
  selectedStudents: Student[];
  onChange: (students: Student[]) => void;
}

export const StudentPickerModal: React.FC<StudentPickerModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedStudents,
  onChange,
}) => {
  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => a.grade - b.grade || a.classNumber - b.classNumber),
    [classes],
  );
  const [activeClassId, setActiveClassId] = useState(sortedClasses[0]?.id || '');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 학급 데이터가 모달 마운트 이후 도착해도 첫 학급을 즉시 표시한다.
  const activeClass = sortedClasses.find((c) => c.id === activeClassId) ?? sortedClasses[0];
  const resolvedActiveClassId = activeClass?.id ?? '';
  const students = useMemo(() => activeClass?.students ?? [], [activeClass]);
  const filteredStudents = useMemo(() => {
    const q = search.trim();
    if (!q) return students;
    return students.filter((s) => s.name.includes(q));
  }, [students, search]);

  const allStudentsAcrossClasses = useMemo(
    () => sortedClasses.flatMap((c) => c.students),
    [sortedClasses],
  );
  const selectedStudentKeys = useMemo(
    () => new Set(selectedStudents.map(getStudentSelectionKey)),
    [selectedStudents],
  );

  const isSelected = (student: Student) => selectedStudentKeys.has(getStudentSelectionKey(student));

  const toggleStudent = (student: Student) => {
    const studentKey = getStudentSelectionKey(student);
    if (isSelected(student)) {
      onChange(
        selectedStudents.filter((selected) => getStudentSelectionKey(selected) !== studentKey),
      );
    } else {
      onChange([...selectedStudents, student]);
    }
  };

  // 전체 학급 — 일괄 선택/해제 (모든 반의 모든 학생)
  const isAllClassesSelected =
    allStudentsAcrossClasses.length > 0 && allStudentsAcrossClasses.every((s) => isSelected(s));
  const isAllClassesIndeterminate = !isAllClassesSelected && selectedStudents.length > 0;
  const toggleAllClasses = () => {
    onChange(isAllClassesSelected ? [] : allStudentsAcrossClasses);
  };

  // 반 전체 선택/해제 (indeterminate 반영)
  const getClassSelectionState = (cls: Class) => {
    const selectedCount = cls.students.filter((student) =>
      selectedStudentKeys.has(getStudentSelectionKey(student)),
    ).length;
    return {
      count: selectedCount,
      isFull: cls.students.length > 0 && selectedCount === cls.students.length,
      isIndeterminate: selectedCount > 0 && selectedCount < cls.students.length,
    };
  };
  const toggleClass = (cls: Class) => {
    const { isFull } = getClassSelectionState(cls);
    const classStudentKeys = new Set(cls.students.map(getStudentSelectionKey));
    if (isFull) {
      onChange(
        selectedStudents.filter(
          (student) => !classStudentKeys.has(getStudentSelectionKey(student)),
        ),
      );
    } else {
      onChange([
        ...selectedStudents.filter(
          (student) => !classStudentKeys.has(getStudentSelectionKey(student)),
        ),
        ...cls.students,
      ]);
    }
  };

  // 검색/필터 결과 전체 선택 ↔ 해제 토글
  const isFilteredAllSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => isSelected(s));
  const toggleFilteredAll = () => {
    if (isFilteredAllSelected) {
      const filteredKeys = new Set(filteredStudents.map(getStudentSelectionKey));
      onChange(
        selectedStudents.filter((student) => !filteredKeys.has(getStudentSelectionKey(student))),
      );
    } else {
      const toAdd = filteredStudents.filter(
        (student) => !selectedStudentKeys.has(getStudentSelectionKey(student)),
      );
      onChange([...selectedStudents, ...toAdd]);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <Dialog role='dialog' aria-modal='true' aria-labelledby='target-picker-title'>
        <Header>
          <HeaderTitle id='target-picker-title'>대상 선택</HeaderTitle>
          <CloseButton type='button' onClick={onClose} aria-label='닫기'>
            <X size={18} />
          </CloseButton>
        </Header>

        <Container>
          {/* 좌측: 학급 목록 */}
          <ClassListSection>
            <ClassListLabel>학급</ClassListLabel>
            <ClassRow
              $isActive={false}
              onClick={toggleAllClasses}
              role='checkbox'
              aria-checked={isAllClassesIndeterminate ? 'mixed' : isAllClassesSelected}
            >
              <CheckboxView
                checked={isAllClassesSelected}
                indeterminate={isAllClassesIndeterminate}
              />
              <ClassRowLabel>전체 학급</ClassRowLabel>
              <ClassRowCount>{allStudentsAcrossClasses.length}</ClassRowCount>
            </ClassRow>
            {sortedClasses.map((cls) => {
              const isActive = resolvedActiveClassId === cls.id;
              const { count, isFull, isIndeterminate } = getClassSelectionState(cls);
              return (
                <ClassRow
                  key={cls.id}
                  $isActive={isActive}
                  onClick={() => setActiveClassId(cls.id)}
                >
                  <CheckboxButton
                    type='button'
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleClass(cls);
                    }}
                    role='checkbox'
                    aria-checked={isIndeterminate ? 'mixed' : isFull}
                    aria-label={`${cls.grade}-${cls.classNumber}반 전체 선택`}
                  >
                    <CheckboxView checked={isFull} indeterminate={isIndeterminate} />
                  </CheckboxButton>
                  <ClassRowLabel>
                    {cls.grade}학년 {cls.classNumber}반
                  </ClassRowLabel>
                  <ClassRowCount>
                    {count > 0 ? `${count}/${cls.students.length}` : cls.students.length}
                  </ClassRowCount>
                </ClassRow>
              );
            })}
          </ClassListSection>

          {/* 우측: 검색 + 학생 체크 그리드 */}
          <RightSection>
            <SearchRow>
              <SearchInputWrapper>
                <SearchIcon />
                <SearchInput
                  type='text'
                  placeholder={
                    activeClass
                      ? `${activeClass.grade}학년 ${activeClass.classNumber}반 학생 검색`
                      : '학생 검색'
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </SearchInputWrapper>
              {filteredStudents.length > 0 && (
                <SelectAllLink onClick={toggleFilteredAll}>
                  {isFilteredAllSelected ? '전체 해제' : '전체 선택'}
                </SelectAllLink>
              )}
            </SearchRow>

            <StudentGrid>
              {filteredStudents.length > 0 ? (
                <GridContainer>
                  {filteredStudents.map((student) => {
                    const selected = isSelected(student);
                    return (
                      <StudentRow
                        key={getStudentSelectionKey(student)}
                        type='button'
                        $selected={selected}
                        onClick={() => toggleStudent(student)}
                        role='checkbox'
                        aria-checked={selected}
                        aria-label={`${student.name} 선택`}
                      >
                        <CheckboxView checked={selected} />
                        <StudentNumberBadge>{student.number}</StudentNumberBadge>
                        <StudentRowName>{student.name}</StudentRowName>
                      </StudentRow>
                    );
                  })}
                </GridContainer>
              ) : (
                <EmptyState>
                  <Users size={32} opacity={0.5} />
                  <EmptyText>검색 결과가 없습니다</EmptyText>
                </EmptyState>
              )}
            </StudentGrid>
          </RightSection>
        </Container>

        <Footer>
          <FooterCount>
            <Users size={14} />
            {selectedStudents.length > 0 ? `선택 ${selectedStudents.length}명` : '선택된 대상 없음'}
          </FooterCount>
          <FooterActions>
            {selectedStudents.length > 0 && (
              <ClearLink type='button' onClick={() => onChange([])}>
                전체 해제
              </ClearLink>
            )}
            <CompleteButton type='button' onClick={onClose}>
              완료
            </CompleteButton>
          </FooterActions>
        </Footer>
      </Dialog>
    </Overlay>
  );
};
