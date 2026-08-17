import type { CmsSetDetail, CmsSetItem } from '../api/cmsSetService';
import type { LibItem, LibraryColorGroup } from './types';

const COLOR_GROUPS: LibraryColorGroup[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

function pickColorGroup(id: string): LibraryColorGroup {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLOR_GROUPS[code % COLOR_GROUPS.length];
}

/** 목록·단건 공통 최소 필드 */
type CmsSetLike = Pick<CmsSetItem, 'setId' | 'title'> &
  Pick<CmsSetDetail, 'thumbnailUrl' | 'createdAt'>;

/**
 * CMS Set → LibItem 최소 매핑.
 * 호환 확정: setId→id, title→title, thumbnailUrl→thumbnailUrl, createdAt→createdAt
 * 그 외는 임시값 (**TO FIX**) — 실측 응답에 metas 없음
 */
export function mapCmsSetToLibItem(item: CmsSetLike): LibItem {
  return {
    id: item.setId,
    title: item.title,
    thumbnailUrl: item.thumbnailUrl,
    createdAt: item.createdAt,
    // ---- TO FIX: CMS 스펙/taxonomy 매핑 확정 전 임시값 ----
    src: 'verified', // TO FIX
    selArea: undefined, // TO FIX — 실측 list 아이템에 metas 없음
    colorGroup: pickColorGroup(item.setId), // TO FIX (썸네일 없을 때 fallback용)
    // -------------------------------------------------------
  };
}
