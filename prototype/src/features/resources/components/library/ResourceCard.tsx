/**
 * 공유 자료실 콘텐츠 카드 (목업 libCard + srcBadge).
 * 추천/로드맵 카드(reason 있음)도 이 카드로 렌더.
 */
import { GROUP_BG } from '../../mock-data';
import { useResources } from '../../store/ResourcesContext';
import type { LibItem, Src } from '../../types';

const SRC_STYLE: Record<Src, string> = {
  검증: 'bg-emerald-50 text-emerald-600',
  비검증: 'bg-amber-50 text-amber-600',
  외부: 'bg-blue-50 text-blue-600',
  내부: 'bg-gray-100 text-gray-600',
};

export const ResourceCard = ({ item }: { item: LibItem }) => {
  const { openOverlay } = useResources();
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-24 items-center justify-center text-4xl" style={{ background: GROUP_BG[item.g] }}>
        {item.em}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SRC_STYLE[item.src]}`}>{item.src}</span>
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-600">{item.sel}</span>
        </div>
        <div className="text-sm font-bold leading-snug text-gray-900">{item.title}</div>
        {item.reason && <div className="text-xs leading-relaxed text-gray-500">💡 {item.reason}</div>}
        <div className="mt-auto flex gap-2 pt-1">
          <button
            onClick={() => openOverlay({ kind: 'editor', contentId: item.id })}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            수정하기
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
