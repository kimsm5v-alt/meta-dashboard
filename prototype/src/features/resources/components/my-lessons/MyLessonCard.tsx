/**
 * 나의 자료 세트지 카드 — 수업 자료실 카드와 동일 구조.
 * 모두 배포 전 초안 → [수정하기][시작하기]. 상태 배지·편집 잠금 없음.
 */
import { Trash2 } from 'lucide-react';
import { useResources } from '../../store/ResourcesContext';
import type { MyLesson } from '../../types';
import { CardThumb } from '../common/CardThumb';
import { CARD_SHELL, CARD_BTN_PRIMARY, CARD_BTN_SECONDARY } from '../common/cardStyles';

export const MyLessonCard = ({ item }: { item: MyLesson }) => {
  const { toast, deleteMy, openOverlay } = useResources();

  return (
    <div className={CARD_SHELL}>
      <CardThumb
        g={item.g}
        thumb={item.thumb}
        alt={item.title}
        overlay={
          <button
            onClick={() => {
              deleteMy(item.id);
              toast('삭제되었습니다');
            }}
            title="삭제"
            aria-label="세트지 삭제"
            className="absolute right-2 top-2 rounded-md bg-white/80 p-1 text-red-500 transition-colors hover:bg-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        }
      />
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="line-clamp-1 text-sm font-bold text-gray-900" title={item.title}>
          {item.title}
        </div>
        <div className="text-xs text-gray-500">수정 {item.updated}</div>
        <div className="mt-auto flex gap-1.5 pt-1">
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
