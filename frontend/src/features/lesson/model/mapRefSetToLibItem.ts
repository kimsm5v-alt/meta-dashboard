import type { RefSetItem } from '../api/lmsRefSetService';
import type { LibItem, LibraryColorGroup } from './types';

const COLOR_GROUPS: LibraryColorGroup[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

function pickColorGroup(id: string): LibraryColorGroup {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLOR_GROUPS[code % COLOR_GROUPS.length];
}

/**
 * LMS RefSetItem → LibItem.
 * id←lcmsSetId, refSetId←refSetId, title/thumbnailUrl←options, createdAt←createdAt
 */
export function mapRefSetToLibItem(item: RefSetItem): LibItem {
  return {
    id: item.lcmsSetId,
    refSetId: item.refSetId,
    title: item.options?.title ?? '',
    thumbnailUrl: item.options?.thumbnailUrl,
    createdAt: item.createdAt,
    src: 'internal',
    colorGroup: pickColorGroup(item.refSetId),
  };
}
