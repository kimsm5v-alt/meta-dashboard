import { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Button } from './Button';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
}

const ALERT_CONFIG: Record<AlertType, {
  icon: typeof AlertCircle;
  iconBg: string;
  iconColor: string;
}> = {
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  warning: {
    icon: AlertCircle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  error: {
    icon: XCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
};

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'warning',
  confirmText = '확인',
}) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          {/* 아이콘 */}
          <div className={`mx-auto w-14 h-14 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}>
            <Icon className={`w-7 h-7 ${config.iconColor}`} />
          </div>

          {/* 제목 */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {title}
          </h3>

          {/* 메시지 */}
          <p className="text-gray-600 text-sm leading-relaxed mb-6 whitespace-pre-line">
            {message}
          </p>

          {/* 버튼 */}
          <Button onClick={onClose} className="w-full">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
