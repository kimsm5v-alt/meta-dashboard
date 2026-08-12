/**
 * 추천 캐러셀 (목업 caroSection / caroMove).
 * 한 페이지 PER_PAGE 개, 초과 시에만 좌우 화살표·도트. 각 인스턴스가 자체 page 상태.
 * 열 수·간격은 자료실 그리드(ResourceGrid)와 동일하게 맞추고, 화살표는 흐름을 차지하지 않도록
 * 카드 가장자리에 절대배치한다 — 화살표 유무로 카드 폭이 달라지지 않게 하기 위함.
 */
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ResourceCard } from './ResourceCard';
import type { LibItem } from '../../types';

/** 한 페이지에 보여줄 카드 수 — ResourceGrid 의 xl 열 수와 동일 */
const PER_PAGE = 5;

/** 카드 썸네일(16:9) 세로 중앙에 오도록 위쪽에서 고정 오프셋 */
const arrowCls = (disabled: boolean) =>
  `absolute top-[22%] z-10 flex h-9 w-9 items-center justify-center rounded-full border bg-white shadow-md transition-all ${
    disabled
      ? 'cursor-not-allowed border-gray-100 text-gray-300'
      : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 hover:shadow-lg'
  }`;

export const RecommendCarousel = ({ items }: { items: LibItem[] }) => {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const cur = Math.min(page, pages - 1);
  const slice = items.slice(cur * PER_PAGE, cur * PER_PAGE + PER_PAGE);
  const paged = items.length > PER_PAGE;

  return (
    <div>
      <div className="relative">
        <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {slice.map((i) => (
            <ResourceCard key={i.id} item={i} />
          ))}
        </div>
        {paged && (
          <>
            <button className={`${arrowCls(cur === 0)} -left-3`} disabled={cur === 0} onClick={() => setPage(cur - 1)} aria-label="이전">
              <ChevronLeft size={18} />
            </button>
            <button className={`${arrowCls(cur >= pages - 1)} -right-3`} disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} aria-label="다음">
              <ChevronRight size={18} />
            </button>
          </>
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
