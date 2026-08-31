/**
 * 공유 자료실 콘텐츠 카드 (목업 libCard).
 * 썸네일 → 제목 → 액션 버튼. 추천 카드도 같은 카드로 렌더한다.
 */
import { useResources } from '../../store/ResourcesContext';
import type { LibItem } from '../../types';
import { CardThumb } from '../common/CardThumb';
import { CARD_SHELL, CARD_BTN_PRIMARY, CARD_BTN_SECONDARY } from '../common/cardStyles';

export const ResourceCard = ({ item }: { item: LibItem }) => {
  const { openOverlay } = useResources();
  return (
    <div className={CARD_SHELL}>
      <CardThumb g={item.g} thumb={item.thumb} alt={item.title} />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="line-clamp-1 text-sm font-bold text-gray-900" title={item.title}>
          {item.title}
        </div>
        <div className="mt-auto flex gap-1.5">
          <button
            onClick={() => openOverlay({ kind: 'editor', contentId: item.id })}
            className={`flex-1 ${CARD_BTN_SECONDARY}`}
          >
            수정하기
          </button>
          <button
            onClick={() => openOverlay({ kind: 'deploy', contentId: item.id })}
            className={`flex-1 ${CARD_BTN_PRIMARY}`}
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
};
