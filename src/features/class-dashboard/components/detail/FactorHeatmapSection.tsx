import { useState, useMemo } from 'react';
import type { DomainData, SubCategoryData } from '../../hooks/useClassDetailData';
import { LevelBadge } from './LevelBadge';
import { lightenColor } from '@/shared/utils/colorUtils';
import { PREV_COLOR } from '@/shared/utils/chartUtils';

// ============================================================
// 상수
// ============================================================

const CHART_H = 240; // 차트 영역 높이 (px)
const T_MIN = 20;
const T_MAX = 80;
const T_RANGE = T_MAX - T_MIN; // 60
const BAR_W = 36;
const BAR_W_CMP = 30;

/** T점수 → 막대 높이(px) */
const toH = (t: number) => Math.max(0, Math.min(CHART_H, ((t - T_MIN) / T_RANGE) * CHART_H));

/** T=50 기준선의 bottom 위치(px) */
const REF_BOTTOM = toH(50);

// ============================================================
// DeltaBadge
// ============================================================

const DeltaBadge: React.FC<{ delta: number; isPositive: boolean }> = ({ delta, isPositive }) => {
  const isGood = isPositive ? delta > 0 : delta < 0;
  const isBad = isPositive ? delta < 0 : delta > 0;
  const absDelta = Math.abs(delta);

  if (absDelta < 0.5) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-400">
        0
      </span>
    );
  }
  if (isGood) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-600">
        +{absDelta.toFixed(0)}
      </span>
    );
  }
  if (isBad) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-600">
        -{absDelta.toFixed(0)}
      </span>
    );
  }
  return null;
};

// ============================================================
// 단일 막대
// ============================================================

const SingleBar: React.FC<{
  score: number;
  color: string;
  width: number;
}> = ({ score, color, width }) => (
  <div className="flex flex-col items-center justify-end" style={{ width, height: CHART_H }}>
    <span className="text-xs font-bold text-gray-700 mb-0.5 shrink-0 relative z-10">{Math.round(score)}</span>
    <div
      className="rounded-t transition-all duration-300 ease-out shrink-0"
      style={{ width, height: toH(score), backgroundColor: color }}
    />
  </div>
);

// ============================================================
// 비교 쌍 막대 (1차 + 2차)
// ============================================================

/** D3용 연한 회색 (1차 막대) */
const PREV_COLOR_LIGHT = '#D1D5DB';

const CompareBar: React.FC<{
  score: number;
  prevScore: number;
  color: string;
  prevColor?: string;
  isPositive: boolean;
}> = ({ score, prevScore, color, prevColor = PREV_COLOR, isPositive }) => {
  const delta = Math.round(score - prevScore);
  return (
    <div className="relative flex flex-col items-center justify-end" style={{ width: BAR_W_CMP * 2 + 4, height: CHART_H }}>
      <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
        <DeltaBadge delta={delta} isPositive={isPositive} />
      </div>
      <div className="flex items-end gap-px shrink-0">
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-gray-400 mb-0.5 relative z-10">{Math.round(prevScore)}</span>
          <div
            className="rounded-t transition-all duration-300 ease-out"
            style={{ width: BAR_W_CMP, height: toH(prevScore), backgroundColor: prevColor }}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-gray-700 mb-0.5 relative z-10">{Math.round(score)}</span>
          <div
            className="rounded-t transition-all duration-300 ease-out"
            style={{ width: BAR_W_CMP, height: toH(score), backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// D2 그룹 (중분류 평균 + D3 요인들)
// ============================================================

const SubCatGroup: React.FC<{
  subCat: SubCategoryData;
  isCompare: boolean;
  prevSubCatT?: number;
  prevFactorLookup: Record<number, number>;
}> = ({ subCat, isCompare, prevSubCatT, prevFactorLookup }) => {
  const color = subCat.color;
  const lightColor = lightenColor(color, 0.55);
  const colW = isCompare ? BAR_W_CMP * 2 + 4 : BAR_W;

  return (
    <div className="flex flex-col">
      {/* 막대 영역 */}
      <div className="flex items-end gap-12">
        {/* D2 평균 막대 */}
        {isCompare && prevSubCatT != null ? (
          <CompareBar score={subCat.avgTScore} prevScore={prevSubCatT} color={color} isPositive={subCat.isPositive} />
        ) : (
          <SingleBar score={subCat.avgTScore} color={color} width={BAR_W} />
        )}

        {/* D3 요인 막대들 */}
        {subCat.factors.map((f) => {
          const prevT = prevFactorLookup[f.index];
          return isCompare && prevT != null ? (
            <CompareBar key={f.index} score={f.avgTScore} prevScore={prevT} color={lightColor} prevColor={PREV_COLOR_LIGHT} isPositive={f.isPositive} />
          ) : (
            <SingleBar key={f.index} score={f.avgTScore} color={lightColor} width={BAR_W} />
          );
        })}
      </div>

      {/* 라벨 행 */}
      <div className="flex gap-12 mt-2">
        {/* D2 라벨 */}
        <div className="flex flex-col items-center gap-1.5" style={{ width: colW }}>
          <span className="text-base font-bold text-center leading-tight break-keep" style={{ color }}>
            {subCat.displayName}
          </span>
          <LevelBadge level={subCat.level} isPositive={subCat.isPositive} size="sm" />
        </div>

        {/* D3 라벨 */}
        {subCat.factors.map((f) => (
          <div key={f.index} className="flex flex-col items-center" style={{ width: colW }}>
            <span className="text-sm text-gray-600 text-center leading-tight break-keep">{f.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// Props
// ============================================================

interface FactorHeatmapSectionProps {
  domainData: DomainData[];
  prevDomainData?: DomainData[];
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export const FactorHeatmapSection: React.FC<FactorHeatmapSectionProps> = ({ domainData, prevDomainData }) => {
  const [selectedDomain, setSelectedDomain] = useState(0);
  const isCompare = !!prevDomainData;

  const prevFactorLookup = useMemo(() => {
    if (!prevDomainData) return {} as Record<number, number>;
    const lookup: Record<number, number> = {};
    for (const d of prevDomainData)
      for (const sc of d.subCategories)
        for (const f of sc.factors) lookup[f.index] = f.avgTScore;
    return lookup;
  }, [prevDomainData]);

  const prevSubCatLookup = useMemo(() => {
    if (!prevDomainData) return {} as Record<string, number>;
    const lookup: Record<string, number> = {};
    for (const d of prevDomainData)
      for (const sc of d.subCategories) lookup[sc.name] = sc.avgTScore;
    return lookup;
  }, [prevDomainData]);

  const domain = domainData[selectedDomain];

  return (
    <div className="space-y-4">
      {/* ===== Depth 1 탭 ===== */}
      <div className="flex gap-1.5 flex-wrap">
        {domainData.map((d, i) => (
          <button
            key={d.category}
            onClick={() => setSelectedDomain(i)}
            className={`px-4 py-2 rounded-lg text-base font-semibold transition-colors ${
              selectedDomain === i
                ? 'text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={selectedDomain === i ? { backgroundColor: d.subCategories[0]?.color ?? '#6B7280' } : undefined}
          >
            {d.icon} {d.category}
          </button>
        ))}
      </div>

      {/* ===== 요인 유형 배지 ===== */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
          domain.isPositive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}
      >
        <span>{domain.isPositive ? '정적요인' : '부적요인'}</span>
        <span className="text-gray-400">·</span>
        <span className="font-normal">
          {domain.isPositive ? '높을수록 긍정 영향' : '낮을수록 긍정 영향'}
        </span>
      </div>

      {/* ===== 범례 ===== */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>점선: T=50 (전국 평균)</span>
        {isCompare && (
          <>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: PREV_COLOR }} /> 1차
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: domain.subCategories[0]?.color }} /> 2차
            </span>
          </>
        )}
      </div>

      {/* ===== 차트 영역 ===== */}
      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <div className="relative px-12 pt-6 pb-4">
          {/* T=50 기준선 */}
          <div
            className="absolute left-4 right-4 border-t border-dashed border-gray-300 pointer-events-none"
            style={{ top: `calc(1.5rem + ${CHART_H - REF_BOTTOM}px)` }}
          />

          {/* 막대 그룹 */}
          <div className="flex gap-10 min-w-max">
            {domain.subCategories.map((sc, i) => (
              <div key={sc.name} className="flex gap-10">
                <SubCatGroup
                  subCat={sc}
                  isCompare={isCompare}
                  prevSubCatT={prevSubCatLookup[sc.name]}
                  prevFactorLookup={prevFactorLookup}
                />
                {i < domain.subCategories.length - 1 && (
                  <div className="w-px bg-gray-200 self-stretch" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
