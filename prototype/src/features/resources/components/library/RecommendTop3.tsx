/**
 * 상담기반 강점 도안 TOP 3 (목업 classCurationHTML 의 strength 섹션).
 */
import { STRENGTH_TOP3 } from '../../mock-data';
import { useResources } from '../../store/ResourcesContext';
import { SectionHead } from './SectionHead';
import { RecommendCarousel } from './RecommendCarousel';

export const RecommendTop3 = () => {
  const { toast } = useResources();
  return (
    <section className="flex flex-col gap-3">
      <SectionHead
        title="상담기반 강점 도안 TOP 3"
        desc="상담·검사 결과로 선택된 강점 도안이에요."
        action={
          <button
            onClick={() => toast('코칭(상담) 화면으로 이동')}
            className="flex-none rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-purple-600"
          >
            상담으로 이동 →
          </button>
        }
      />
      <RecommendCarousel items={STRENGTH_TOP3} />
    </section>
  );
};
