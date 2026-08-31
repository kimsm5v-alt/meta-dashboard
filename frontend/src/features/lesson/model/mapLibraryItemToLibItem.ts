import type { LibraryItem } from '../api/lmsLibraryItemService';
import type { LibItem, LibraryColorGroup } from './types';

const COLOR_GROUPS: LibraryColorGroup[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

function pickColorGroup(id: string): LibraryColorGroup {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLOR_GROUPS[code % COLOR_GROUPS.length];
}

/**
 * LMS LibraryItem → LibItem.
 * id←lcmsSetId, libraryItemId, title←alias, thumbnailUrl←options
 */
export function mapLibraryItemToLibItem(item: LibraryItem): LibItem {
  return {
    id: item.lcmsSetId,
    libraryItemId: item.libraryItemId,
    title: item.alias ?? '',
    thumbnailUrl: item.options?.thumbnailUrl,
    createdAt: item.createdAt,
    src: 'internal',
    colorGroup: pickColorGroup(item.libraryItemId),
  };
}

/** @deprecated mapLibraryItemToLibItem 사용 */
export const mapRefSetToLibItem = mapLibraryItemToLibItem;
