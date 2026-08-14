import type { RefSetItem } from '../api/lmsRefSetService';
import type { LibItem, LibraryColorGroup } from './types';

const COLOR_GROUPS: LibraryColorGroup[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

function pickColorGroup(id: string): LibraryColorGroup {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLOR_GROUPS[code % COLOR_GROUPS.length];
}

/**
 * LMS RefSetItem → LibItem.
 * 카드 제목·썸네일은 `options`(meta-dashboard 계약)에서 읽는다.
 */
export function mapRefSetToLibItem(item: RefSetItem): LibItem {
  const date = new Date(item.createdAt);
  const updated = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  return {
    id: item.lcmsSetId,
    refSetId: item.refSetId,
    title: item.options?.title ?? '',
    thumbnailUrl: item.options?.thumbnailUrl,
    src: 'internal',
    colorGroup: pickColorGroup(item.refSetId),
    updated,
  };
}
