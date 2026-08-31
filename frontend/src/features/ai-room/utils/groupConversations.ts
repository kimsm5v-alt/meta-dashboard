import type { Conversation } from '@features/ai-room/types';

export type ConversationGroupLabel = '오늘' | '지난 7일' | '이전';

const GROUP_ORDER: ConversationGroupLabel[] = ['오늘', '지난 7일', '이전'];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getGroupLabel = (createdAt: Date, now: Date): ConversationGroupLabel => {
  if (isSameDay(createdAt, now)) return '오늘';
  const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays < 7 ? '지난 7일' : '이전';
};

export interface ConversationGroup {
  group: ConversationGroupLabel;
  items: Conversation[];
}

export const groupConversationsByDate = (conversations: Conversation[]): ConversationGroup[] => {
  const now = new Date();
  const buckets: Record<ConversationGroupLabel, Conversation[]> = {
    오늘: [],
    '지난 7일': [],
    이전: [],
  };
  for (const conv of conversations) {
    buckets[getGroupLabel(conv.createdAt, now)].push(conv);
  }
  return GROUP_ORDER.map((group) => ({ group, items: buckets[group] })).filter(
    (g) => g.items.length > 0,
  );
};
