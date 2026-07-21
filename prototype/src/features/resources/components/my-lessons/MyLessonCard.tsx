/**
 * 나의 자료 세트지 카드 (목업 renderMyData 카드 + statusBadge + deleteMy).
 * 편집 잠금: 배포됨/완료는 원본 보호 → 복제만.
 */
import { useResources } from '../../store/ResourcesContext';
import type { MyLesson, MyStatus } from '../../types';
import { CardThumb } from '../common/CardThumb';
import { CARD_SHELL } from '../common/cardStyles';

const STATUS_STYLE: Record<MyStatus, string> = {
  배포됨: 'bg-emerald-50 text-emerald-600',
  임시저장: 'bg-amber-50 text-amber-600',
  완료: 'bg-gray-100 text-gray-600',
};

export const MyLessonCard = ({ item }: { item: MyLesson }) => {
  const { toast, deleteMy, openOverlay } = useResources();
  const locked = item.status === '배포됨' || item.status === '완료';

  return (
    <div className={CARD_SHELL}>
      <CardThumb
        g={item.g}
        em={item.em}
        title={item.title}
        overlay={
          <button
            onClick={() => {
              deleteMy(item.id);
              toast('삭제되었습니다');
            }}
            title="삭제"
            aria-label="세트지 삭제"
            className="absolute right-2 top-2 rounded-md bg-white/70 px-1.5 py-1 text-sm text-red-500 transition-colors hover:bg-white"
          >
            🗑️
          </button>
        }
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[item.status]}`}>{item.status}</span>
          {locked && <span className="text-xs text-gray-400" title="원본 보호 · 복제만 가능">🔒</span>}
        </div>
        <div className="text-xs text-gray-500">
          {item.cls ? `👥 ${item.cls}` : '미배포'} · 수정 {item.updated}
        </div>
        <div className="mt-auto flex gap-2 pt-1">
          <button
            onClick={() => {
              if (locked) toast('배포/완료된 세트지는 원본 보호를 위해 복제본으로 편집해요');
              openOverlay({ kind: 'editor', contentId: item.id, locked });
            }}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {locked ? '복제하기' : '수정하기'}
          </button>
          <button
            onClick={() => openOverlay({ kind: 'deploy', contentId: item.id })}
            className="flex-1 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
};
