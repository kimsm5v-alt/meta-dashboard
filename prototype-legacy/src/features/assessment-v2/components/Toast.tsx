/**
 * 토스트 메시지 컴포넌트 - vj 디자인
 */

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    info: <AlertCircle size={20} />,
  };

  const colors = {
    success: {
      bg: 'rgba(31, 41, 55, 0.95)',
      border: 'rgba(75, 85, 99, 0.5)',
      text: '#F9FAFB',
      icon: '#D1D5DB',
    },
    error: {
      bg: 'rgba(31, 41, 55, 0.95)',
      border: 'rgba(75, 85, 99, 0.5)',
      text: '#F9FAFB',
      icon: '#D1D5DB',
    },
    info: {
      bg: 'rgba(31, 41, 55, 0.95)',
      border: 'rgba(75, 85, 99, 0.5)',
      text: '#F9FAFB',
      icon: '#D1D5DB',
    },
  };

  const color = colors[type];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        minWidth: '320px',
        maxWidth: '480px',
        padding: '16px 20px',
        background: color.bg,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${color.border}`,
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideInBottom 0.3s ease-out',
      }}
    >
      <div style={{ color: color.icon, flexShrink: 0 }}>
        {icons[type]}
      </div>
      <div
        style={{
          flex: 1,
          color: color.text,
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: 1.5,
        }}
      >
        {message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: color.text,
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.6,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        aria-label="닫기"
      >
        <X size={16} />
      </button>

      <style>
        {`
          @keyframes slideInBottom {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Toast;
