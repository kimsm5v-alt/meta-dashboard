import type { RefObject } from 'react';
import styled from '@emotion/styled';
import { Bot, X, Sparkles } from 'lucide-react';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_TEACHER_DASHBOARD } from '@shared/data/apiDefinitions';
import type { Class, Student } from '@shared/types';
import type { ContextMode } from '@features/ai-room/types';

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  position: relative;
  z-index: 10;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const LogoIconWrapper = styled.div`
  position: relative;
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background-color: ${({ theme }) => theme.colors.primary[500]};
  border-radius: ${({ theme }) => theme.radius.xl};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const SparklesBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background-color: #fbbf24;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoText = styled.div``;

const LogoTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  line-height: 1.25;
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const LogoSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const Divider = styled.div`
  height: 40px;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent,
    ${({ theme }) => theme.colors.gray[300]},
    transparent
  );
`;

const ContextModeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${({ theme }) => theme.colors.gray[100]};
  backdrop-filter: blur(4px);
  padding: 6px;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid rgba(${({ theme }) => theme.colors.gray[200]}, 0.5);
`;

const ModeButton = styled.button<{ $isActive: boolean }>`
  padding: 8px 16px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.lg};
  transition: all ${({ theme }) => theme.transitions.fast};
  border: none;
  cursor: pointer;
  background-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary[500] : 'transparent'};
  color: ${({ $isActive, theme }) => ($isActive ? '#ffffff' : theme.colors.gray[600])};
  box-shadow: ${({ $isActive, theme }) => ($isActive ? theme.shadows.md : 'none')};

  &:hover {
    background-color: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary[500] : 'rgba(255, 255, 255, 0.8)'};
  }
`;

const ClassDropdownWrapper = styled.div`
  position: relative;
`;

const ClassDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  width: 160px;
  background-color: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  padding: 4px 0;
`;

const ClassDropdownItem = styled.button<{ $isSelected: boolean }>`
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  transition: background-color ${({ theme }) => theme.transitions.fast};
  border: none;
  cursor: pointer;
  background-color: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.primary[50] : 'transparent'};
  color: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.primary[600] : theme.colors.gray[700]};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const StudentCountSpan = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-left: 4px;
`;

const StudentTagsDivider = styled.div`
  height: 32px;
  width: 1px;
  background-color: ${({ theme }) => theme.colors.gray[200]};
`;

const StudentTagsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const StudentTag = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[700]};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const StudentTagName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const StudentTagRemoveButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  display: flex;
  align-items: center;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[900]};
  }
`;

const MoreStudentsSpan = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

interface AIRoomHeaderProps {
  mode: ContextMode;
  selectedClass: Class | null;
  selectedStudents: Student[];
  classes: Class[];
  isClassDropdownOpen: boolean;
  setIsClassDropdownOpen: (open: boolean) => void;
  classDropdownRef: RefObject<HTMLDivElement>;
  onModeChange: (mode: ContextMode) => void;
  onClassSelect: (cls: Class) => void;
  onRemoveStudent: (studentId: string) => void;
  onOpenStudentModal: () => void;
}

export const AIRoomHeader = ({
  mode,
  selectedClass,
  selectedStudents,
  classes,
  isClassDropdownOpen,
  setIsClassDropdownOpen,
  classDropdownRef,
  onModeChange,
  onClassSelect,
  onRemoveStudent,
  onOpenStudentModal,
}: AIRoomHeaderProps) => (
  <Header>
    {/* Logo */}
    <LogoContainer>
      <LogoIconWrapper>
        <LogoIcon>
          <Bot size={20} color='#ffffff' />
        </LogoIcon>
        <SparklesBadge>
          <Sparkles size={10} color='#ffffff' />
        </SparklesBadge>
      </LogoIconWrapper>
      <LogoText>
        <LogoTitle>AI 어시스턴트</LogoTitle>
        <LogoSubtitle>학습심리정서검사 분석</LogoSubtitle>
      </LogoText>
    </LogoContainer>

    <Divider />

    {/* Context Mode Buttons */}
    <ApiTooltip {...API_TEACHER_DASHBOARD} position='bottom-left'>
      <ContextModeContainer>
        <ModeButton $isActive={mode === 'all'} onClick={() => onModeChange('all')}>
          전체
        </ModeButton>

        <ClassDropdownWrapper ref={classDropdownRef}>
          <ModeButton
            $isActive={mode === 'class'}
            onClick={() =>
              mode === 'class'
                ? setIsClassDropdownOpen(!isClassDropdownOpen)
                : onModeChange('class')
            }
          >
            {mode === 'class' && selectedClass
              ? `${selectedClass.grade}-${selectedClass.classNumber}반`
              : '반별'}
          </ModeButton>
          {isClassDropdownOpen && (
            <ClassDropdown>
              {classes.map((cls) => (
                <ClassDropdownItem
                  key={cls.id}
                  $isSelected={selectedClass?.id === cls.id}
                  onClick={() => onClassSelect(cls)}
                >
                  {cls.grade}학년 {cls.classNumber}반
                  <StudentCountSpan>({cls.stats?.totalStudents}명)</StudentCountSpan>
                </ClassDropdownItem>
              ))}
            </ClassDropdown>
          )}
        </ClassDropdownWrapper>

        <ModeButton
          $isActive={mode === 'student'}
          onClick={() => (mode === 'student' ? onOpenStudentModal() : onModeChange('student'))}
        >
          {mode === 'student' && selectedStudents.length > 0
            ? `${selectedStudents.length}명 선택`
            : '개별'}
        </ModeButton>
      </ContextModeContainer>
    </ApiTooltip>

    {/* Selected Students Tags */}
    {mode === 'student' && selectedStudents.length > 0 && (
      <>
        <StudentTagsDivider />
        <StudentTagsContainer>
          {selectedStudents.slice(0, 5).map((student) => (
            <StudentTag key={student.id}>
              <StudentTagName>{student.name}</StudentTagName>
              <StudentTagRemoveButton onClick={() => onRemoveStudent(student.id)}>
                <X size={12} />
              </StudentTagRemoveButton>
            </StudentTag>
          ))}
          {selectedStudents.length > 5 && (
            <MoreStudentsSpan>+{selectedStudents.length - 5}명</MoreStudentsSpan>
          )}
        </StudentTagsContainer>
      </>
    )}
  </Header>
);
