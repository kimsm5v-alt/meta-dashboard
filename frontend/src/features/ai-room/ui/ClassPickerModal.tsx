import type React from 'react';
import styled from '@emotion/styled';
import { Check, Users } from 'lucide-react';
import { Modal, Button } from '@shared/components';
import type { Class } from '@shared/types';

const ClassList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ClassButton = styled.button<{ $isSelected: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 2px solid
    ${({ $isSelected, theme }) =>
      $isSelected ? theme.colors.primary[500] : theme.colors.gray[200]};
  background: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.primary[50] : theme.colors.background.paper};
  transition: all 0.15s ease;
  cursor: pointer;

  &:hover {
    border-color: ${({ $isSelected, theme }) =>
      $isSelected ? theme.colors.primary[500] : theme.colors.gray[300]};
    background: ${({ $isSelected, theme }) =>
      $isSelected ? theme.colors.primary[50] : theme.colors.gray[50]};
  }
`;

const IconWrapper = styled.div<{ $isSelected: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.primary[500] : theme.colors.gray[100]};
  color: ${({ $isSelected }) => ($isSelected ? '#ffffff' : '#4b5563')};
`;

const UsersIcon = styled(Users)`
  width: 1.25rem;
  height: 1.25rem;
`;

const ClassInfo = styled.div`
  flex: 1;
  text-align: left;
`;

const ClassName = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const StudentCount = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const CheckIconWrapper = styled.div`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[500]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CheckIcon = styled(Check)`
  width: 1rem;
  height: 1rem;
  color: #ffffff;
`;

const Footer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const CloseButton = styled(Button)`
  width: 100%;
  justify-content: center;
`;

interface ClassPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Class[];
  selectedClass: Class | null;
  onSelect: (cls: Class) => void;
}

export const ClassPickerModal: React.FC<ClassPickerModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClass,
  onSelect,
}) => {
  const handleSelect = (cls: Class) => {
    onSelect(cls);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='반 선택' size='sm'>
      <ClassList>
        {classes.map((cls) => {
          const isSelected = selectedClass?.id === cls.id;
          const stats = cls.stats;
          return (
            <ClassButton key={cls.id} onClick={() => handleSelect(cls)} $isSelected={isSelected}>
              <IconWrapper $isSelected={isSelected}>
                <UsersIcon />
              </IconWrapper>
              <ClassInfo>
                <ClassName>
                  {cls.grade}학년 {cls.classNumber}반
                </ClassName>
                <StudentCount>학생 {stats?.totalStudents || 0}명</StudentCount>
              </ClassInfo>
              {isSelected && (
                <CheckIconWrapper>
                  <CheckIcon />
                </CheckIconWrapper>
              )}
            </ClassButton>
          );
        })}
      </ClassList>
      <Footer>
        <CloseButton variant='secondary' onClick={onClose}>
          닫기
        </CloseButton>
      </Footer>
    </Modal>
  );
};
