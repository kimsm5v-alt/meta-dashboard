import styled from '@emotion/styled';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  showCloseButton?: boolean;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Background = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity ${({ theme }) => theme.transitions.normal};
`;

const Container = styled.div<{ $size: ModalProps['size'] }>`
  position: relative;
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
  width: 100%;
  max-width: ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return '448px';
      case 'lg':
        return '576px';
      case 'xl':
        return '672px';
      case '2xl':
        return '768px';
      case '3xl':
        return '896px';
      case '4xl':
        return '1024px';
      case '5xl':
        return '1152px';
      case 'full':
        return '1280px';
      default:
        return '512px';
    }
  }};
  margin: 0 ${({ theme }) => theme.spacing.md};
  max-height: 90vh;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.lg}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.md};
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};
  color: ${({ theme }) => theme.colors.text.secondary};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const Content = styled.div`
  overflow-y: auto;
  max-height: calc(90vh - 80px);
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) => {
  // ESC 키로 닫기 + 스크롤 방지
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Overlay>
      <Background onClick={onClose} />
      <Container $size={size}>
        {title && (
          <Header>
            <Title>{title}</Title>
            {showCloseButton && (
              <CloseButton onClick={onClose}>
                <X size={20} />
              </CloseButton>
            )}
          </Header>
        )}
        <Content>{children}</Content>
      </Container>
    </Overlay>
  );
};
