/**
 * 성장 로드맵 세트지 · 피어나다 (목업 classCurationHTML 의 ROADMAP 섹션).
 * 3단계, 각 단계는 tone 색 + 캐러셀.
 */
import { ROADMAP } from '../../mock-data';
import { SectionHead } from './SectionHead';
import { RecommendCarousel } from './RecommendCarousel';
import type { RoadmapStage } from '../../types';

const TONE: Record<RoadmapStage['tone'], string> = {
  green: 'border-emerald-200 bg-emerald-50/60',
  blue: 'border-blue-200 bg-blue-50/60',
  pink: 'border-pink-200 bg-pink-50/60',
};

export const GrowthRoadmap = () => (
  <section className="flex flex-col gap-3">
    <SectionHead
      title="성장 로드맵 세트지 · 피어나다"
      desc="3단계 12개월 커리큘럼 — 월별 세트지를 담아 우리 반 수업에 바로 활용하세요."
    />
    <div className="flex flex-col gap-4">
      {ROADMAP.map((s) => (
        <div key={s.stage} className={`rounded-xl border p-4 ${TONE[s.tone]}`}>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex-none rounded-md bg-white px-2 py-1 text-xs font-bold text-gray-700 shadow-sm">{s.stage}</span>
            <div className="text-sm text-gray-700">
              <b className="font-bold text-gray-900">{s.tier}</b> · {s.title}
              <small className="ml-1 text-gray-500">{s.months}</small>
            </div>
          </div>
          <RecommendCarousel items={s.items} />
        </div>
      ))}
    </div>
  </section>
);
