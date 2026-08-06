import styled from '@emotion/styled';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, Users } from 'lucide-react';
import { Modal, Button } from '@shared/components';
import type { Class, Student } from '@shared/types';

/** 부분 선택 시 indeterminate(가로선) 표시가 필요한 체크박스 — DOM API로만 설정 가능해 ref로 처리 */
const IndeterminateCheckbox: React.FC<{
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  className?: string;
  'aria-label'?: string;
}> = ({ checked, indeterminate, onChange, ...rest }) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type='checkbox'
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      {...rest}
    />
  );
};

const Container = styled.div`
  display: flex;
  gap: 1.25rem;
  height: 55vh;
`;

// ── 좌측: 학급 목록(체크박스 세로 리스트) ─────────────────────────────
const ClassListSection = styled.div`
  width: 11rem;
  flex-shrink: 0;
  overflow-y: auto;
`;

const ClassListLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-bottom: 0.375rem;
`;

/* label이 아닌 div — label로 두면 텍스트 클릭(탭 전환)이 내부 체크박스도 함께
   토글시켜버린다(네이티브 label-for-input 동작). 체크박스 토글은 체크박스 자체
   클릭(stopPropagation 처리됨)에서만 일어나야 한다 */
const ClassRow = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem;
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
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  flex: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  outline: none;

  &:focus {
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
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem 1rem;
`;

const StudentRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.25rem;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
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
  const [activeClassId, setActiveClassId] = useState(classes[0]?.id || '');
  const [localSelection, setLocalSelection] = useState<Student[]>(selectedStudents);
  const [search, setSearch] = useState('');

  const activeClass = classes.find((c) => c.id === activeClassId);
  const students = useMemo(() => activeClass?.students ?? [], [activeClass]);
  const filteredStudents = useMemo(() => {
    const q = search.trim();
    if (!q) return students;
    return students.filter((s) => s.name.includes(q));
  }, [students, search]);

  const allStudentsAcrossClasses = useMemo(() => classes.flatMap((c) => c.students), [classes]);

  const isSelected = (student: Student) => localSelection.some((s) => s.id === student.id);

  const toggleStudent = (student: Student) => {
    if (isSelected(student)) {
      setLocalSelection((prev) => prev.filter((s) => s.id !== student.id));
    } else {
      setLocalSelection((prev) => [...prev, student]);
    }
  };

  // 전체 학급 — 일괄 선택/해제 (모든 반의 모든 학생)
  const isAllClassesSelected =
    allStudentsAcrossClasses.length > 0 && allStudentsAcrossClasses.every((s) => isSelected(s));
  const isAllClassesIndeterminate = !isAllClassesSelected && localSelection.length > 0;
  const toggleAllClasses = () => {
    setLocalSelection(isAllClassesSelected ? [] : allStudentsAcrossClasses);
  };

  // 반 전체 선택/해제 (indeterminate 반영)
  const getClassSelectionState = (cls: Class) => {
    const classStudentIds = new Set(cls.students.map((s) => s.id));
    const selectedCount = localSelection.filter((s) => classStudentIds.has(s.id)).length;
    return {
      count: selectedCount,
      isFull: cls.students.length > 0 && selectedCount === cls.students.length,
      isIndeterminate: selectedCount > 0 && selectedCount < cls.students.length,
    };
  };
  const toggleClass = (cls: Class) => {
    const { isFull } = getClassSelectionState(cls);
    const classStudentIds = new Set(cls.students.map((s) => s.id));
    if (isFull) {
      setLocalSelection((prev) => prev.filter((s) => !classStudentIds.has(s.id)));
    } else {
      setLocalSelection((prev) => [
        ...prev.filter((s) => !classStudentIds.has(s.id)),
        ...cls.students,
      ]);
    }
  };

  // 검색/필터 결과 전체 선택 ↔ 해제 토글
  const isFilteredAllSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => isSelected(s));
  const toggleFilteredAll = () => {
    if (isFilteredAllSelected) {
      const filteredIds = new Set(filteredStudents.map((s) => s.id));
      setLocalSelection((prev) => prev.filter((s) => !filteredIds.has(s.id)));
    } else {
      setLocalSelection((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const toAdd = filteredStudents.filter((s) => !existingIds.has(s.id));
        return [...prev, ...toAdd];
      });
    }
  };

  const handleConfirm = () => {
    onConfirm(localSelection);
    onClose();
  };

  const handleClear = () => setLocalSelection([]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='대상 선택' size='lg'>
      <Container>
        {/* 좌측: 학급 목록 */}
        <ClassListSection>
          <ClassListLabel>학급</ClassListLabel>
          <ClassRow $isActive={false} onClick={toggleAllClasses}>
            <IndeterminateCheckbox
              checked={isAllClassesSelected}
              indeterminate={isAllClassesIndeterminate}
              onChange={toggleAllClasses}
              aria-label='전체 학급 일괄 선택'
            />
            <ClassRowLabel>전체 학급</ClassRowLabel>
            <ClassRowCount>{allStudentsAcrossClasses.length}</ClassRowCount>
          </ClassRow>
          {classes.map((cls) => {
            const isActive = activeClassId === cls.id;
            const { count, isFull, isIndeterminate } = getClassSelectionState(cls);
            return (
              <ClassRow key={cls.id} $isActive={isActive} onClick={() => setActiveClassId(cls.id)}>
                <IndeterminateCheckbox
                  checked={isFull}
                  indeterminate={isIndeterminate}
                  onChange={() => toggleClass(cls)}
                  aria-label={`${cls.grade}-${cls.classNumber}반 전체 선택`}
                />
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
                    <StudentRow key={student.id}>
                      <IndeterminateCheckbox
                        checked={selected}
                        indeterminate={false}
                        onChange={() => toggleStudent(student)}
                        aria-label={`${student.name} 선택`}
                      />
                      <StudentNumberBadge>{student.number}</StudentNumberBadge>
                      <StudentRowName>{student.name}</StudentRowName>
                    </StudentRow>
                  );
                })}
              </GridContainer>
            ) : (
              <EmptyState>
                <Users className='w-8 h-8 mx-auto mb-2 opacity-50' />
                <EmptyText>학생이 없습니다</EmptyText>
              </EmptyState>
            )}
          </StudentGrid>
        </RightSection>
      </Container>

      {/* 하단 푸터 */}
      <Footer>
        <FooterCount>
          <Users className='w-4 h-4' />
          {localSelection.length > 0 ? `선택 ${localSelection.length}명` : '선택된 대상 없음'}
        </FooterCount>
        <FooterActions>
          {localSelection.length > 0 && <ClearLink onClick={handleClear}>전체 해제</ClearLink>}
          <Button onClick={handleConfirm} disabled={localSelection.length === 0}>
            <Check className='w-4 h-4' />
            완료
          </Button>
        </FooterActions>
      </Footer>
    </Modal>
  );
};
