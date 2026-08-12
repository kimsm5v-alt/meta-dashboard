/**
 * 카드 상단 썸네일.
 * 실제 콘텐츠 이미지(public/lesson/…)를 16:9 로 채운다. 원본 활동지가 960×540 이라 비율이 맞다.
 * thumb 가 없는 데이터는 GROUP_BG 파스텔 톤으로 fallback.
 * 3개 카드(ResourceCard·MyLessonCard·ReportCard) 공용.
 */
import type { ReactNode } from 'react';
import { GROUP_BG } from '../../mock-data';
import type { ColorGroup } from '../../types';

interface CardThumbProps {
  g: ColorGroup;
  /** 콘텐츠 썸네일 이미지 경로 */
  thumb?: string;
  /** 이미지 대체 텍스트 (콘텐츠 제목) */
  alt: string;
  /** 썸네일 위에 겹칠 요소 (예: 나의 자료 삭제 버튼) */
  overlay?: ReactNode;
}

export const CardThumb = ({ g, thumb, alt, overlay }: CardThumbProps) => (
  <div className="relative aspect-[16/9] overflow-hidden" style={{ background: GROUP_BG[g] }}>
    {thumb && <img src={thumb} alt={alt} loading="lazy" className="h-full w-full object-cover" />}
    {overlay}
  </div>
);
