/**
 * 큐레이팅 섹션 헤더 (목업 .sec-head).
 */
import type { ReactNode } from 'react';

export const SectionHead = ({ title, desc, action }: { title: string; desc?: ReactNode; action?: ReactNode }) => (
  <div className="flex items-end justify-between gap-3">
    <div>
      <h2 className="text-lg font-extrabold tracking-tight text-gray-900">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-gray-500">{desc}</p>}
    </div>
    {action}
  </div>
);
