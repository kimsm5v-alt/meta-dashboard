/**
 * 공유 자료실 — 반 스코프 큐레이팅 (목업 classCurationHTML).
 * 반 맞춤 가이드 + 강점 TOP3 + 성장 로드맵 + 검사요인 자동추천.
 */
import { CLASS_WEAK, FACTOR_REC } from '../../mock-data';
import { useResources } from '../../store/ResourcesContext';
import { CurationGuide } from './CurationGuide';
import { RecommendTop3 } from './RecommendTop3';
import { GrowthRoadmap } from './GrowthRoadmap';
import { RecommendCarousel } from './RecommendCarousel';
import { SectionHead } from './SectionHead';

export const ClassCurationView = () => {
  const { scope } = useResources();
  const weak = CLASS_WEAK[scope] ?? ['감정인식', '공감', '목표설정'];

  return (
    <div className="mt-5 flex flex-col gap-6">
      <CurationGuide
        icon="🎯"
        title={`${scope} 맞춤형 큐레이팅`}
        desc="상담·검사 결과 기반으로 이 반에 맞는 SEL 도안을 추천합니다."
      />

      <RecommendTop3 />

      <GrowthRoadmap />

      <section className="flex flex-col gap-3">
        <CurationGuide
          tone="blue"
          icon="🧭"
          title="META 검사요인 자동추천"
          desc={
            <>
              이 반 하위 검사요인 <b className="font-bold text-gray-900">{weak.join(' · ')}</b>에 연계된 콘텐츠를 자동 매핑했어요.
            </>
          }
        />
        <SectionHead
          title="검사요인 맞춤 추천"
          desc="검사 결과(META 38요인) 기반으로 자동 연계된 SEL 콘텐츠입니다."
        />
        <RecommendCarousel items={FACTOR_REC} />
      </section>
    </div>
  );
};
