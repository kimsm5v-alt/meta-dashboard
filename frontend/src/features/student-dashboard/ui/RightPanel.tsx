import type React from 'react';
import { useEffect } from 'react';
import styled from '@emotion/styled';
import { X, FileText, MessageSquare, Eye } from 'lucide-react';
import { SchoolRecordPanel } from './SchoolRecordPanel';
import { CounselingRecordPanel } from './counseling';
import { ObservationMemoPanel } from './ObservationMemoPanel';
import type { Student, Assessment } from '@shared/types';

export type PanelTab = 'schoolRecord' | 'counseling' | 'observation' | null;

interface RightPanelProps {
  isOpen: boolean;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  onClose: () => void;
  studentId: string;
  classId: string;
  student: Student;
  assessment: Assessment;
}

const TABS = [
  { key: 'schoolRecord' as const, label: '생기부', icon: FileText },
  { key: 'counseling' as const, label: '상담', icon: MessageSquare },
  { key: 'observation' as const, label: '관찰', icon: Eye },
];

const PanelContainer = styled.div`
  width: 24rem;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  align-self: stretch;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.md}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.gray[50]};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const TabGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: ${({ theme }) => theme.transitions.fast};
  border: ${({ $isActive, theme }) => ($isActive ? 'none' : `1px solid ${theme.colors.gray[200]}`)};
  cursor: pointer;
  background: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary[500] : theme.colors.background.paper};
  color: ${({ $isActive, theme }) => ($isActive ? '#ffffff' : theme.colors.gray[600])};

  &:hover {
    background: ${({ $isActive, theme }) => ($isActive ? theme.colors.primary[500] : theme.colors.gray[100])};
  }
`;

const IconWrapper = styled.span`
  width: 1rem;
  height: 1rem;
  display: inline-flex;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const CloseButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[400]};
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[600]};
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const CloseIconWrapper = styled.span`
  width: 1.25rem;
  height: 1.25rem;
  display: inline-flex;

  svg {
    width: 100%;
    height: 100%;
  }
`;

export const RightPanel: React.FC<RightPanelProps> = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  studentId,
  classId,
  student,
  assessment,
}) => {
  // ESC 키로 패널 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <PanelContainer>
      {/* 패널 헤더 */}
      <Header>
        <TabGroup>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TabButton key={tab.key} onClick={() => onTabChange(tab.key)} $isActive={isActive}>
                <IconWrapper>
                  <Icon />
                </IconWrapper>
                {tab.label}
              </TabButton>
            );
          })}
        </TabGroup>
        <CloseButton onClick={onClose}>
          <CloseIconWrapper>
            <X />
          </CloseIconWrapper>
        </CloseButton>
      </Header>

      {/* 패널 콘텐츠 */}
      <div>
        {activeTab === 'schoolRecord' && (
          <SchoolRecordPanel student={student} assessment={assessment} />
        )}
        {activeTab === 'counseling' && (
          <CounselingRecordPanel studentId={studentId} classId={classId} />
        )}
        {activeTab === 'observation' && (
          <ObservationMemoPanel studentId={studentId} classId={classId} />
        )}
      </div>
    </PanelContainer>
  );
};
