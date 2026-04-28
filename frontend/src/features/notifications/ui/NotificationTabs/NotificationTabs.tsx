import type { NotificationCategory, Notification } from '../../model/types';
import * as S from './NotificationTabs.styles';

interface NotificationTabsProps {
  activeCategory: 'all' | NotificationCategory;
  onCategoryChange: (category: 'all' | NotificationCategory) => void;
  allNotifications: Notification[];
}

export const NotificationTabs = ({
  activeCategory,
  onCategoryChange,
  allNotifications,
}: NotificationTabsProps) => {
  const allCount = allNotifications.filter((n) => !n.read).length;
  const examCount = allNotifications.filter((n) => n.category === 'EXAM' && !n.read).length;
  const groupCount = allNotifications.filter((n) => n.category === 'GROUP' && !n.read).length;

  return (
    <S.TabContainer>
      <S.Tab $isActive={activeCategory === 'all'} onClick={() => onCategoryChange('all')}>
        전체
        {allCount > 0 && <S.TabBadge>{allCount}</S.TabBadge>}
      </S.Tab>
      <S.Tab $isActive={activeCategory === 'EXAM'} onClick={() => onCategoryChange('EXAM')}>
        검사
        {examCount > 0 && <S.TabBadge>{examCount}</S.TabBadge>}
      </S.Tab>
      <S.Tab $isActive={activeCategory === 'GROUP'} onClick={() => onCategoryChange('GROUP')}>
        그룹
        {groupCount > 0 && <S.TabBadge>{groupCount}</S.TabBadge>}
      </S.Tab>
    </S.TabContainer>
  );
};
