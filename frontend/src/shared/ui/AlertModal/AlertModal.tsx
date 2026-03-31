import styled from '@emotion/styled';
import { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Button } from '../Button';
import type { LucideIcon } from 'lucide-react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
}

interface AlertConfig {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const ALERT_CONFIG: Record<AlertType, AlertConfig> = {
  info: {
    icon: Info,
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
  },
  success: {
    icon: CheckCircle,
    iconBg: '#d1fae5',
    iconColor: '#059669',
  },
  warning: {
    icon: AlertCircle,
    iconBg: '#fef3c7',
    iconColor: '#d97706',
  },
  error: {
    icon: XCircle,
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
  },
};

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
  backdrop-filter: blur(4px);
  transition: opacity ${({ theme }) => theme.transitions.normal};
`;

const Container = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
  width: 100%;
  max-width: 384px;
  margin: 0 ${({ theme }) => theme.spacing.md};
  overflow: hidden;
`;

const Content = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const IconWrapper = styled.div<{ $bg: string }>`
  margin: 0 auto ${({ theme }) => theme.spacing.md};
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledIcon = styled.div<{ $color: string }>`
  color: ${({ $color }) => $color};
  width: 28px;
  height: 28px;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Message = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  white-space: pre-line;
`;

export const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'warning',
  confirmText = '확인',
}: AlertModalProps) => {
  const config = ALERT_CONFIG[type];
  const Icon = config.icon;

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
      <Container>
        <Content>
          <IconWrapper $bg={config.iconBg}>
            <StyledIcon $color={config.iconColor}>
              <Icon size={28} />
            </StyledIcon>
          </IconWrapper>
          <Title>{title}</Title>
          <Message>{message}</Message>
          <Button onClick={onClose} variant='primary' style={{ width: '100%' }}>
            {confirmText}
          </Button>
        </Content>
      </Container>
    </Overlay>
  );
};
