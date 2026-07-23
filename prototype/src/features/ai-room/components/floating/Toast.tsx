import { useEffect } from 'react';

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

/** 하단 중앙 토스트 - 3초 후 자동 소멸 (A-6) */
export const Toast: React.FC<ToastProps> = ({ message, actionLabel, onAction, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[90] flex items-center gap-3 bg-[#1a1a2e] text-white text-[13px] px-4 py-2.5 rounded-full shadow-lg animate-[airoom-toast_0.25s_ease]">
      <span>{message}</span>
      {actionLabel && (
        <button onClick={onAction} className="text-primary-300 font-semibold hover:text-primary-200">
          {actionLabel}
        </button>
      )}
    </div>
  );
};
