/**
 * 상담기반 강점 도안 TOP 3 (목업 classCurationHTML 의 strength 섹션).
 */
import { STRENGTH_TOP3 } from '../../mock-data';
import { useResources } from '../../store/ResourcesContext';
import { SectionHead } from './SectionHead';
import { RecommendCarousel } from './RecommendCarousel';

export const RecommendTop3 = () => {
  const { scope, toast } = useResources();
  return (
    <section className="flex flex-col gap-3">
      <SectionHead
        title={`${scope} 상담기반 강점 도안 TOP 3`}
        desc="상담·검사 결과 기반으로 이 반에 맞는 SEL 도안을 추천합니다. 더 자세히 알고 싶으면 상담으로 이동해보세요"
        action={
          <button
            onClick={() => toast('코칭(상담) 화면으로 이동')}
            className="flex-none rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-purple-600"
          >
            상담으로 이동 →
          </button>
        }
      />
      <RecommendCarousel items={STRENGTH_TOP3} />
    </section>
  );
};
