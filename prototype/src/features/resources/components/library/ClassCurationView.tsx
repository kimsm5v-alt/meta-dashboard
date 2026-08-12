/**
 * 공유 자료실 — 반 스코프 맞춤 추천 패널 (목업 classCurationHTML).
 * 상담기반 강점 도안 TOP 3.
 * 하단 전체 자료실(LibraryView)과 구분되도록 tint 패널로 묶는다 — 조립은 ResourceListPage.
 */
import { RecommendTop3 } from './RecommendTop3';

export const ClassCurationView = () => (
  <div className="mt-4 mb-1 rounded-2xl border border-primary-100 bg-primary-50/40 p-4">
    <RecommendTop3 />
  </div>
);
