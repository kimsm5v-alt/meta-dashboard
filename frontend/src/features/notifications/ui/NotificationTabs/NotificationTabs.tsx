import type { NotificationCategory, Notification } from '../../model/types';
import * as S from './NotificationTabs.styles';

interface NotificationTabsProps {
  activeCategory: 'all' | NotificationCategory;
  onCategoryChange: (category: 'all' | NotificationCategory) => void;
  notifications: Notification[];
}

export const NotificationTabs = ({
  activeCategory,
  onCategoryChange,
  notifications,
}: NotificationTabsProps) => {
  const allCount = notifications.filter((n) => !n.isRead).length;
  const examCount = notifications.filter((n) => n.category === 'exam' && !n.isRead).length;
  const groupCount = notifications.filter((n) => n.category === 'group' && !n.isRead).length;

  return (
    <S.TabContainer>
      <S.Tab $isActive={activeCategory === 'all'} onClick={() => onCategoryChange('all')}>
        전체
        {allCount > 0 && <S.TabBadge>{allCount}</S.TabBadge>}
      </S.Tab>
      <S.Tab $isActive={activeCategory === 'exam'} onClick={() => onCategoryChange('exam')}>
        검사
        {examCount > 0 && <S.TabBadge>{examCount}</S.TabBadge>}
      </S.Tab>
      <S.Tab $isActive={activeCategory === 'group'} onClick={() => onCategoryChange('group')}>
        그룹
        {groupCount > 0 && <S.TabBadge>{groupCount}</S.TabBadge>}
      </S.Tab>
    </S.TabContainer>
  );
};
