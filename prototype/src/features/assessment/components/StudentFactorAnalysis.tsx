/**
 * 결과보기 > 학생 - 38개 요인 분석 차트
 *
 * 5대 영역(자아강점, 학습디딤돌, 긍정적공부마음, 학습걸림돌, 부정적공부마음)별
 * 요인 T점수를 바 차트로 시각화
 *
 * @see prototype-legacy/src/features/student-dashboard/components/StudentFactorAnalysis.tsx
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { FACTOR_DEFINITIONS, MAIN_CATEGORIES } from '@/shared/data/factors';
import type { FactorCategory } from '@/shared/types';

// 대분류별 색상 정의
const DOMAIN_COLORS: Record<FactorCategory, string> = {
  '자아강점': '#00D282',
  '학습디딤돌': '#4BC1FF',
  '긍정적공부마음': '#67A7FF',
  '학습걸림돌': '#FF849F',
  '부정적공부마음': '#FF87D4',
};

const DOMAIN_SOFT_COLORS: Record<FactorCategory, string> = {
  '자아강점': '#DFF8EC',
  '학습디딤돌': '#E2F4FF',
  '긍정적공부마음': '#E4EFFF',
  '학습걸림돌': '#FFE7EC',
  '부정적공부마음': '#FFE6F4',
};

// 대분류별 polarity (정적/부적)
const DOMAIN_POLARITY: Record<FactorCategory, 'positive' | 'negative'> = {
  '자아강점': 'positive',
  '학습디딤돌': 'positive',
  '긍정적공부마음': 'positive',
  '학습걸림돌': 'negative',
  '부정적공부마음': 'negative',
};

// 대분류별 중분류 및 요인 그룹 계산
const DOMAIN_STRUCTURE = MAIN_CATEGORIES.map(domain => {
  const factors = FACTOR_DEFINITIONS.filter(f => f.category === domain);
  const subCatsSet = new Set(factors.map(f => f.subCategory));
  const subCategories = Array.from(subCatsSet).map(subCat => ({
    name: subCat,
    factors: factors.filter(f => f.subCategory === subCat),
  }));
  return {
    id: domain,
    name: domain,
    color: DOMAIN_COLORS[domain],
    softColor: DOMAIN_SOFT_COLORS[domain],
    polarity: DOMAIN_POLARITY[domain],
    subCategories,
    factorCount: factors.length,
  };
});

interface StudentFactorAnalysisProps {
  tScores: number[];
  prevTScores?: number[];
  showCompare?: boolean;
}

export const StudentFactorAnalysis: React.FC<StudentFactorAnalysisProps> = ({
  tScores,
  prevTScores,
  showCompare = false,
}) => {
  const [activeTab, setActiveTab] = useState<FactorCategory>('자아강점');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 40);
      }
    };
    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
      resizeObserver.disconnect();
    };
  }, []);

  const activeDomain = useMemo(() => {
    return DOMAIN_STRUCTURE.find(d => d.id === activeTab)!;
  }, [activeTab]);

  // T점수 레벨 판정
  const getGrade = (t: number): { label: string; isTwoLine: boolean } => {
    if (t >= 70) return { label: '매우높음', isTwoLine: true };
    if (t >= 60) return { label: '높음', isTwoLine: false };
    if (t >= 40) return { label: '보통', isTwoLine: false };
    if (t >= 30) return { label: '낮음', isTwoLine: false };
    return { label: '매우낮음', isTwoLine: true };
  };

  // 막대 색상 결정 (polarity 고려)
  const getBarTone = (t: number, polarity: 'positive' | 'negative') => {
    const isNormal = t >= 40 && t < 60;
    if (isNormal) {
      return { fill: '#EDEDF0', stroke: '#D4D4D8', labelColor: '#71717A' };
    }
    const isHigh = t >= 60;
    const isGood = polarity === 'negative' ? !isHigh : isHigh;
    if (isGood) {
      return { fill: '#E3F4E9', stroke: '#A9DCBC', labelColor: '#16A34A' };
    }
    return { fill: '#FDE7E4', stroke: '#F0B5AC', labelColor: '#DC2626' };
  };

  // 차트 계산
  const chartHeight = 260;
  const baseY = 320;
  const yOf = (t: number) => 40 + (1 - t / 100) * chartHeight;

  // 막대 크기 계산
  const subCatCount = activeDomain.subCategories.length;
  const groupGap = 24;
  const usableWidth = containerWidth - 20;
  const barsAreaWidth = usableWidth - (subCatCount - 1) * groupGap;
  const barSlotWidth = barsAreaWidth / activeDomain.factorCount;
  const barWidth = showCompare
    ? Math.max(Math.min(barSlotWidth * 0.95, 80), 32)
    : Math.max(Math.min(barSlotWidth * 0.7, 48), 20);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">38개 요인 분석</h3>
      </div>

      {/* 영역 탭 */}
      <div className="px-5 py-3 border-b border-gray-100 flex gap-2 flex-wrap">
        {DOMAIN_STRUCTURE.map(domain => {
          const isActive = activeTab === domain.id;
          return (
            <button
              key={domain.id}
              onClick={() => setActiveTab(domain.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all
                ${isActive
                  ? 'text-white shadow-md'
                  : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                }
              `}
              style={{
                backgroundColor: isActive ? domain.color : undefined,
              }}
            >
              <span>{domain.name}</span>
              <span
                className={`
                  px-1.5 py-0.5 rounded text-[10px] font-bold
                  ${isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-500'}
                `}
              >
                {domain.factorCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Polarity 안내 */}
      <div
        className={`mx-5 mt-4 px-3 py-2 rounded-lg text-sm font-medium border ${
          activeDomain.polarity === 'negative'
            ? 'bg-red-50 border-red-300 text-red-700'
            : 'bg-green-50 border-green-300 text-green-700'
        }`}
      >
        {activeDomain.polarity === 'negative'
          ? '부적 요인 · 점수가 낮을수록 학습에 긍정적인 영향을 의미합니다.'
          : '정적 요인 · 점수가 높을수록 학습에 긍정적인 영향을 의미합니다.'}
      </div>

      {/* 컬럼 차트 영역 */}
      <div ref={containerRef} className="p-5 pb-3">
        <svg
          width={containerWidth}
          height={380}
          style={{ display: 'block' }}
        >
          {/* T점수 구간 경계선 */}
          {[30, 40, 50, 60, 70].map(t => (
            <line
              key={t}
              x1={10}
              y1={yOf(t)}
              x2={containerWidth - 10}
              y2={yOf(t)}
              stroke={t === 50 ? '#C9A4ED' : '#E5E7EB'}
              strokeWidth={t === 50 ? 1.3 : 1}
              strokeDasharray={t === 50 ? '5 5' : '3 3'}
            />
          ))}

          {/* 구간 라벨 (왼쪽) */}
          <text x={20} y={yOf(85) + 5} fontSize="10" fill="#A1A1A8" fontWeight="600">매우높음</text>
          <text x={20} y={yOf(65) + 5} fontSize="10" fill="#A1A1A8" fontWeight="600">높음</text>
          <text x={20} y={yOf(50) + 5} fontSize="10" fill="#A1A1A8" fontWeight="600">보통</text>
          <text x={20} y={yOf(35) + 5} fontSize="10" fill="#A1A1A8" fontWeight="600">낮음</text>
          <text x={20} y={yOf(15) + 5} fontSize="10" fill="#A1A1A8" fontWeight="600">매우낮음</text>

          <text
            x={containerWidth - 10}
            y={20}
            textAnchor="end"
            fontSize={11}
            fill="#9CA3AF"
          >
            점선: T=50 (전국 평균)
          </text>

          {/* 차수 비교 범례 */}
          {showCompare && prevTScores && (
            <g>
              <rect x={10} y={8} width={12} height={12} rx={2} fill="#F0F0F2" stroke="#DADADE" />
              <text x={28} y={18} fontSize={11} fill="#52525B">1차</text>
              <rect x={60} y={8} width={12} height={12} rx={2} fill="#D6D6DC" stroke="#B6B6BE" />
              <text x={78} y={18} fontSize={11} fill="#52525B">2차</text>
            </g>
          )}

          {/* 요인별 막대 */}
          {(() => {
            let xOffset = 10;
            const elements: JSX.Element[] = [];

            activeDomain.subCategories.forEach((subCat, subIdx) => {
              const subStart = xOffset;

              subCat.factors.forEach((factor) => {
                const t = Math.round(tScores[factor.index] ?? 50);
                const prevT = prevTScores ? Math.round(prevTScores[factor.index] ?? 50) : null;
                const tone = getBarTone(t, activeDomain.polarity);
                const barH = (t / 100) * chartHeight;
                const y = yOf(t);
                const centerX = xOffset + barSlotWidth / 2;

                if (showCompare && prevT !== null) {
                  // 차수 비교 모드
                  const pairWidth = Math.max(barWidth * 0.48, 28);
                  const pairGap = Math.max(barSlotWidth * 0.05, 4);
                  const pairStartX = centerX - pairWidth - pairGap / 2;
                  const prevTone = getBarTone(prevT, activeDomain.polarity);
                  const prevBarH = (prevT / 100) * chartHeight;
                  const prevY = yOf(prevT);
                  const prevGrade = getGrade(prevT);
                  const currGrade = getGrade(t);

                  // 1차 막대
                  elements.push(
                    <g key={`${factor.index}-prev`}>
                      <text x={pairStartX + pairWidth / 2} y={prevY - 5} textAnchor="middle" fontSize={10} fontWeight={700} fill={prevTone.labelColor}>
                        {prevT}
                      </text>
                      <rect
                        x={pairStartX}
                        y={prevY}
                        width={pairWidth}
                        height={prevBarH}
                        rx={3}
                        fill={prevTone.fill}
                        stroke={prevTone.stroke}
                        strokeWidth={1}
                      />
                      {prevBarH > 32 && (
                        prevGrade.isTwoLine ? (
                          <>
                            <text x={pairStartX + pairWidth / 2} y={prevY + Math.min(prevBarH / 2 - 2, prevBarH - 18)} textAnchor="middle" fontSize={9} fontWeight={600} fill={prevTone.labelColor}>
                              {prevGrade.label.slice(0, 2)}
                            </text>
                            <text x={pairStartX + pairWidth / 2} y={prevY + Math.min(prevBarH / 2 + 10, prevBarH - 6)} textAnchor="middle" fontSize={9} fontWeight={600} fill={prevTone.labelColor}>
                              {prevGrade.label.slice(2)}
                            </text>
                          </>
                        ) : (
                          <text x={pairStartX + pairWidth / 2} y={prevY + Math.min(prevBarH / 2 + 4, prevBarH - 8)} textAnchor="middle" fontSize={9} fontWeight={600} fill={prevTone.labelColor}>
                            {prevGrade.label}
                          </text>
                        )
                      )}
                    </g>
                  );

                  // 2차 막대
                  const currBarX = centerX + pairGap / 2;
                  elements.push(
                    <g key={`${factor.index}-curr`}>
                      <text x={currBarX + pairWidth / 2} y={y - 5} textAnchor="middle" fontSize={10} fontWeight={700} fill={tone.labelColor}>
                        {t}
                      </text>
                      <rect
                        x={currBarX}
                        y={y}
                        width={pairWidth}
                        height={barH}
                        rx={3}
                        fill={tone.fill}
                        stroke={tone.stroke}
                        strokeWidth={1}
                      />
                      {barH > 32 && (
                        currGrade.isTwoLine ? (
                          <>
                            <text x={currBarX + pairWidth / 2} y={y + Math.min(barH / 2 - 2, barH - 18)} textAnchor="middle" fontSize={9} fontWeight={600} fill={tone.labelColor}>
                              {currGrade.label.slice(0, 2)}
                            </text>
                            <text x={currBarX + pairWidth / 2} y={y + Math.min(barH / 2 + 10, barH - 6)} textAnchor="middle" fontSize={9} fontWeight={600} fill={tone.labelColor}>
                              {currGrade.label.slice(2)}
                            </text>
                          </>
                        ) : (
                          <text x={currBarX + pairWidth / 2} y={y + Math.min(barH / 2 + 4, barH - 8)} textAnchor="middle" fontSize={9} fontWeight={600} fill={tone.labelColor}>
                            {currGrade.label}
                          </text>
                        )
                      )}
                    </g>
                  );

                  // 요인명
                  elements.push(
                    <text
                      key={`${factor.index}-label`}
                      x={centerX}
                      y={baseY + 14}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#52525B"
                    >
                      {factor.name}
                    </text>
                  );
                } else {
                  // 단일 막대
                  const bx = centerX - barWidth / 2;
                  const grade = getGrade(t);

                  elements.push(
                    <g key={factor.index}>
                      <text x={centerX} y={y - 6} textAnchor="middle" fontSize={12} fontWeight={700} fill={tone.labelColor}>
                        {t}
                      </text>
                      <rect
                        x={bx}
                        y={y}
                        width={barWidth}
                        height={barH}
                        rx={5}
                        fill={tone.fill}
                        stroke={tone.stroke}
                        strokeWidth={1}
                      />
                      {barH > 28 && (
                        grade.isTwoLine ? (
                          <>
                            <text x={centerX} y={y + Math.min(barH / 2 - 2, barH - 18)} textAnchor="middle" fontSize={10} fontWeight={600} fill={tone.labelColor}>
                              {grade.label.slice(0, 2)}
                            </text>
                            <text x={centerX} y={y + Math.min(barH / 2 + 10, barH - 6)} textAnchor="middle" fontSize={10} fontWeight={600} fill={tone.labelColor}>
                              {grade.label.slice(2)}
                            </text>
                          </>
                        ) : (
                          <text x={centerX} y={y + Math.min(barH / 2 + 4, barH - 8)} textAnchor="middle" fontSize={10} fontWeight={600} fill={tone.labelColor}>
                            {grade.label}
                          </text>
                        )
                      )}
                      <text x={centerX} y={baseY + 14} textAnchor="middle" fontSize={11} fill="#52525B">
                        {factor.name}
                      </text>
                    </g>
                  );
                }

                xOffset += barSlotWidth;
              });

              // 중분류 구분선 및 라벨
              const subEnd = xOffset - barSlotWidth * 0.1;
              elements.push(
                <g key={`sub-${subIdx}`}>
                  <line x1={subStart} y1={baseY + 24} x2={subEnd} y2={baseY + 24} stroke={activeDomain.color} strokeWidth={2} />
                  <text
                    x={(subStart + subEnd) / 2}
                    y={baseY + 44}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={800}
                    fill={activeDomain.color}
                  >
                    {subCat.name}
                  </text>
                </g>
              );

              // 그룹 사이 간격
              if (subIdx < activeDomain.subCategories.length - 1) {
                const sepX = xOffset + groupGap / 2;
                elements.push(
                  <line
                    key={`sep-${subIdx}`}
                    x1={sepX}
                    y1={40}
                    x2={sepX}
                    y2={baseY + 18}
                    stroke="#E5E5E7"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                );
                xOffset += groupGap;
              }
            });

            return elements;
          })()}
        </svg>
      </div>
    </div>
  );
};

export default StudentFactorAnalysis;
