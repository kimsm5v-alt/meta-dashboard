import type { NotificationCategory } from '../../model/types';
import * as S from './NotificationEmpty.styles';

interface NotificationEmptyProps {
  category: 'all' | NotificationCategory;
}

const categoryLabels: Record<'all' | NotificationCategory, string> = {
  all: '알림',
  EXAM: '검사 알림',
  GROUP: '그룹 알림',
  NOTICE: '공지 알림',
};

export const NotificationEmpty = ({ category }: NotificationEmptyProps) => {
  return (
    <S.Container>
      <S.Message>새로운 {categoryLabels[category]}이 없습니다.</S.Message>
    </S.Container>
  );
};
