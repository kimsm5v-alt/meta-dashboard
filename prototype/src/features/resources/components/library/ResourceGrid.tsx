/**
 * 콘텐츠 카드 그리드 (목업 renderLibGrid). 0건이면 빈 상태.
 */
import { ResourceCard } from './ResourceCard';
import type { LibItem } from '../../types';

export const ResourceGrid = ({ items }: { items: LibItem[] }) => {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <div className="text-3xl">🗂️</div>
        <div className="mt-2 text-sm font-medium text-gray-500">조건에 맞는 콘텐츠가 없습니다.</div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <ResourceCard key={item.id} item={item} />
      ))}
    </div>
  );
};
