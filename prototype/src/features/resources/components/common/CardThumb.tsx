/**
 * 카드 상단 썸네일 (placeholder).
 * 실제 이미지 자산이 없어 GROUP_BG 파스텔 톤 위에 제목을 얹어 이미지 영역을 대체.
 * 고정 비율(aspect-[16/9])로 카드 간 비율을 통일한다.
 * 3개 카드(ResourceCard·MyLessonCard·ReportCard) 공용.
 */
import type { ReactNode } from 'react';
import { GROUP_BG } from '../../mock-data';
import type { ColorGroup } from '../../types';

interface CardThumbProps {
  g: ColorGroup;
  em: string;
  title: string;
  /** 썸네일 위에 겹칠 요소 (예: 나의 자료 삭제 버튼) */
  overlay?: ReactNode;
}

export const CardThumb = ({ g, em, title, overlay }: CardThumbProps) => (
  <div
    className="relative flex aspect-[16/9] items-center justify-center overflow-hidden"
    style={{ background: GROUP_BG[g] }}
  >
    <span className="absolute left-2 top-2 rounded-md bg-white/70 px-1.5 py-0.5 text-base leading-none">
      {em}
    </span>
    <div className="line-clamp-2 px-4 text-center text-sm font-bold leading-snug text-gray-800">
      {title}
    </div>
    {overlay}
  </div>
);
