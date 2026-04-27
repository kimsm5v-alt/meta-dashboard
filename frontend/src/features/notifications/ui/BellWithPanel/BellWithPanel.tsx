import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../api/queries';
import { NotificationPanel } from '../NotificationPanel/NotificationPanel';
import * as S from './BellWithPanel.styles';

interface BellWithPanelProps {
  role: 'teacher' | 'student';
}

export const BellWithPanel = ({ role }: BellWithPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications } = useNotifications(role);
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // ESC 키 감지
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <S.Container ref={panelRef}>
      <S.BellButton onClick={() => setIsOpen(!isOpen)} aria-label='알림'>
        <Bell size={20} />
        {unreadCount > 0 && <S.Badge>{unreadCount >= 100 ? '99+' : unreadCount}</S.Badge>}
      </S.BellButton>

      {isOpen && (
        <NotificationPanel
          notifications={notifications ?? []}
          role={role}
          onClose={() => setIsOpen(false)}
        />
      )}
    </S.Container>
  );
};
