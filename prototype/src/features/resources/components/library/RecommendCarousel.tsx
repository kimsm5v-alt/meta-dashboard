/**
 * 추천 캐러셀 (목업 caroSection / caroMove).
 * 한 페이지 4개, 4개 초과 시에만 좌우 화살표·도트. 각 인스턴스가 자체 page 상태.
 */
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ResourceCard } from './ResourceCard';
import type { LibItem } from '../../types';

const arrowCls = (disabled: boolean) =>
  `flex h-9 w-9 flex-none items-center justify-center rounded-full border bg-white shadow-sm transition-all ${
    disabled
      ? 'cursor-not-allowed border-gray-100 text-gray-300'
      : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 hover:shadow-md'
  }`;

export const RecommendCarousel = ({ items }: { items: LibItem[] }) => {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / 4));
  const cur = Math.min(page, pages - 1);
  const slice = items.slice(cur * 4, cur * 4 + 4);
  const paged = items.length > 4;

  return (
    <div>
      <div className="flex items-stretch gap-3">
        {paged && (
          <button className={arrowCls(cur === 0)} disabled={cur === 0} onClick={() => setPage(cur - 1)} aria-label="이전">
            <ChevronLeft size={18} />
          </button>
        )}
        <div className="grid flex-1 grid-cols-1 content-start gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {slice.map((i) => (
            <ResourceCard key={i.id} item={i} />
          ))}
        </div>
        {paged && (
          <button className={arrowCls(cur >= pages - 1)} disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} aria-label="다음">
            <ChevronRight size={18} />
          </button>
        )}
      </div>
      {paged && (
        <div className="mt-2.5 flex justify-center gap-0.5">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-label={`${i + 1}페이지`}
              className="flex items-center p-1"
            >
              <span className={`h-1.5 rounded-full transition-all ${i === cur ? 'w-4 bg-primary-500' : 'w-1.5 bg-gray-300'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
