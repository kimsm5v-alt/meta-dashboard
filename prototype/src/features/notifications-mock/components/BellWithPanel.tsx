import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import type { Notification } from '../types/notification';
import {
  teacherMockNotifications,
  studentMockNotifications,
} from '../data/mockNotifications';
import { NotificationPanel } from './NotificationPanel';

interface BellWithPanelProps {
  role: 'teacher' | 'student';
}

function formatBadge(count: number): string {
  if (count >= 100) return '99+';
  return String(count);
}

export const BellWithPanel: React.FC<BellWithPanelProps> = ({ role }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    role === 'teacher' ? teacherMockNotifications : studentMockNotifications,
  );
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  // 외부 클릭 → 닫힘
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  // ESC → 닫힘
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        aria-label="알림"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-[5px] bg-red-500 text-white text-[10px] font-medium rounded-full border-2 border-white flex items-center justify-center leading-none">
            {formatBadge(unreadCount)}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          role={role}
          notifications={notifications}
          onNotificationsChange={setNotifications}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default BellWithPanel;
