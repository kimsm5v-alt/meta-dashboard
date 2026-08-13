import type { CmsSetItem } from '../api/cmsSetService';
import type { LibItem, LibraryColorGroup } from './types';

const COLOR_GROUPS: LibraryColorGroup[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

function pickColorGroup(id: string): LibraryColorGroup {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLOR_GROUPS[code % COLOR_GROUPS.length];
}

/**
 * CMS Set → LibItem 최소 매핑.
 * 호환 확정: setId→id, title→title, thumbnailUrl→thumbnailUrl
 * 그 외 필수 필드는 임시값 (**TO FIX**)
 */
export function mapCmsSetToLibItem(item: CmsSetItem): LibItem {
  return {
    id: item.setId,
    title: item.title,
    thumbnailUrl: item.thumbnailUrl,
    // ---- TO FIX: CMS 스펙/taxonomy 매핑 확정 전 임시값 ----
    src: 'verified', // TO FIX
    selArea: item.metas?.[0]?.val ?? '', // TO FIX
    colorGroup: pickColorGroup(item.setId), // TO FIX (썸네일 없을 때 fallback용)
    // -------------------------------------------------------
  };
}
