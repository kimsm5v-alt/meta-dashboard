/**
 * 자료실 히어로 배너 (목업 heroBannerHTML + heroGo).
 * 3장 · 도트 클릭으로 전환. CTA 는 토스트.
 */
import { useState } from 'react';
import { HERO } from '../../mock-data';
import { useResources } from '../../store/ResourcesContext';

export const HeroBanner = () => {
  const { toast } = useResources();
  const [idx, setIdx] = useState(0);
  const h = HERO[idx];
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 p-7 text-white">
      <h2 className="max-w-2xl text-xl font-extrabold leading-snug tracking-tight text-balance">{h.t}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{h.d}</p>
      <div className="mt-4">
        <button
          onClick={() => toast(h.cta)}
          className="rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-white"
        >
          {h.cta} →
        </button>
      </div>
      <div className="mt-4 flex gap-1.5">
        {HERO.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`배너 ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'}`}
          />
        ))}
      </div>
    </div>
  );
};
