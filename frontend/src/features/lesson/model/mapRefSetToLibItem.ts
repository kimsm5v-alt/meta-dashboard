import type { RefSetItem } from '../api/lmsRefSetService';
import type { LibItem, LibraryColorGroup } from './types';

const COLOR_GROUPS: LibraryColorGroup[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

function pickColorGroup(id: string): LibraryColorGroup {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLOR_GROUPS[code % COLOR_GROUPS.length];
}

/**
 * TODO: subjectCd -> selArea 매핑 테이블 별도 확정 후 교체 (추후 변동 가능)
 * 현재는 subjectCd 값을 selArea에 그대로 전달.
 */
export function mapRefSetToLibItem(item: RefSetItem): LibItem {
  const date = new Date(item.createdAt);
  const updated = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  return {
    id: item.lcmsSetId,
    refSetId: item.refSetId,
    title: item.title,
    src: 'internal',
    selArea: item.subjectCd, // TODO: taxonomy 확정 전 임시. 추후 변동 가능
    colorGroup: pickColorGroup(item.refSetId),
    updated,
  };
}
