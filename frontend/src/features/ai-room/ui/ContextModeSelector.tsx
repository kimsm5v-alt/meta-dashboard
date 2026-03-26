import type React from 'react';
import styled from '@emotion/styled';
import { Users, School, UserCheck } from 'lucide-react';
import type { ContextMode } from '../types';

interface ContextModeSelectorProps {
  mode: ContextMode;
  onChange: (mode: ContextMode) => void;
}

const MODES: { value: ContextMode; label: string; icon: React.ElementType; description: string }[] =
  [
    { value: 'all', label: '전체', icon: School, description: '모든 담당 학급' },
    { value: 'class', label: '반 선택', icon: Users, description: '특정 반 선택' },
    { value: 'student', label: '학생 선택', icon: UserCheck, description: '학생 복수 선택' },
  ];

const Container = styled.div`
  display: flex;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.xs};
`;

const ModeButton = styled.button<{ $isActive: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: all 0.15s ease;
  border: none;
  cursor: pointer;
  background: ${({ $isActive, theme }) => ($isActive ? theme.colors.background.paper : 'transparent')};
  color: ${({ $isActive, theme }) => ($isActive ? theme.colors.primary[600] : theme.colors.gray[600])};
  box-shadow: ${({ $isActive, theme }) => ($isActive ? theme.shadows.sm : 'none')};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[900]};
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

export const ContextModeSelector: React.FC<ContextModeSelectorProps> = ({ mode, onChange }) => {
  return (
    <Container>
      {MODES.map(({ value, label, icon: Icon }) => {
        const isActive = mode === value;
        return (
          <ModeButton key={value} onClick={() => onChange(value)} $isActive={isActive}>
            <IconWrapper>
              <Icon />
            </IconWrapper>
            <span>{label}</span>
          </ModeButton>
        );
      })}
    </Container>
  );
};
