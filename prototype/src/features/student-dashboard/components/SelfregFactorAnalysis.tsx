import { useState, useMemo, useRef, useEffect } from 'react';
import {
  SELFREG_DOMAIN_STRUCTURE,
  type SelfregCategory,
} from '@/shared/data/selfregFactors';

interface SelfregFactorAnalysisProps {
  tScores: number[];
  prevTScores?: number[];
  showCompare?: boolean;
}

// 자기조절검사용 20개 요인 목업 T점수 생성 (학습종합검사 38개 데이터를 기반으로 변환)
const generateSelfregScores = (comprehensiveTScores: number[]): number[] => {
  // 학습종합검사 38개 요인에서 자기조절검사 20개 요인으로 매핑
  // 일부 요인은 직접 매핑, 나머지는 관련 요인의 평균 또는 랜덤 변동
  const mapping: Array<number | number[]> = [
    2,           // 성장마인드셋 <- 성장마인드셋(2)
    1,           // 학업효능감 <- 자기효능감(1)
    [19, 20],    // 학습동기 <- 활기(19), 몰두(20) 평균
    25,          // 성적부담조절 <- 성적부담(25) 역산
    26,          // 공부부담조절 <- 공부부담(26) 역산
    [35, 36],    // 실패부담조절 <- 고갈(35), 무능감(36) 평균 역산
    7,           // 계획능력 <- 계획능력(7)
    8,           // 점검능력 <- 점검능력(8)
    9,           // 조절능력 <- 조절능력(9)
    [7, 8, 9],   // 이해기술 <- 메타인지 평균
    [0, 1],      // 기억기술 <- 자아존중감(0), 자기효능감(1) 평균
    [19, 20, 21], // 집중기술 <- 학업열의 평균
    22,          // 자기칭찬 <- 자율성(22)
    [17, 18],    // 도움구하기 <- 친구정서지지(17), 교사정서지지(18) 평균
    [19, 21],    // 학습지속성 <- 활기(19), 의미감(21) 평균
    10,          // 공부환경 <- 공부환경(10)
    11,          // 시간관리 <- 시간관리(11)
    12,          // 수업태도 <- 수업태도(12)
    13,          // 노트하기 <- 노트하기(13)
    14,          // 시험준비 <- 시험준비(14)
  ];

  return mapping.map((source) => {
    if (typeof source === 'number') {
      const val = comprehensiveTScores[source] ?? 50;
      // 부적 요인(25, 26, 35, 36)은 역산 (100 - score)
      if ([25, 26].includes(source)) {
        return Math.round(100 - val);
      }
      return Math.round(val);
    } else {
      // 배열인 경우 평균
      const avg = source.reduce((sum, i) => sum + (comprehensiveTScores[i] ?? 50), 0) / source.length;
      // 부적 요인 포함 시 역산
      if (source.includes(35) || source.includes(36)) {
        return Math.round(100 - avg);
      }
      return Math.round(avg);
    }
  });
};

export const SelfregFactorAnalysis: React.FC<SelfregFactorAnalysisProps> = ({
  tScores: rawTScores,
  prevTScores: rawPrevTScores,
  showCompare = false,
}) => {
  // 학습종합검사 38개 데이터를 자기조절검사 20개 요인으로 변환
  const tScores = useMemo(() => generateSelfregScores(rawTScores), [rawTScores]);
  const prevTScores = useMemo(
    () => rawPrevTScores ? generateSelfregScores(rawPrevTScores) : undefined,
    [rawPrevTScores]
  );

  const [activeTab, setActiveTab] = useState<SelfregCategory>('동기전략');
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
    return SELFREG_DOMAIN_STRUCTURE.find(d => d.id === activeTab)!;
  }, [activeTab]);

  // T점수 레벨 판정 (2줄 여부 포함)
  const getGrade = (t: number): { label: string; isTwoLine: boolean } => {
    if (t >= 70) return { label: '매우높음', isTwoLine: true };
    if (t >= 60) return { label: '높음', isTwoLine: false };
    if (t >= 40) return { label: '보통', isTwoLine: false };
    if (t >= 30) return { label: '낮음', isTwoLine: false };
    return { label: '매우낮음', isTwoLine: true };
  };

  // 막대 색상 결정 (자기조절검사는 모두 positive - 높을수록 좋음)
  const getBarTone = (t: number) => {
    const isNormal = t >= 40 && t < 60;
    if (isNormal) {
      return { fill: '#EDEDF0', stroke: '#D4D4D8', labelColor: '#71717A' };
    }
    const isHigh = t >= 60;
    if (isHigh) {
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              20개 요인 분석
            </h3>
          </div>
        </div>
      </div>

      {/* 영역 탭 - 둥근 모서리 버튼 */}
      <div className="px-5 py-3 border-b border-gray-100 flex gap-2 flex-wrap">
        {SELFREG_DOMAIN_STRUCTURE.map(domain => {
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

      {/* 영역 설명 안내 */}
      <div
        className="mx-5 mt-4 px-3 py-2 rounded-lg text-sm font-medium border bg-green-50 border-green-300 text-green-700"
      >
        {activeDomain.description}
      </div>

      {/* 컬럼 차트 영역 */}
      <div ref={containerRef} className="p-5 pb-3">
        <svg
          width={containerWidth}
          height={380}
          style={{ display: 'block' }}
        >
          {/* 전국 평균선 (T=50) */}
          <line
            x1={10}
            y1={yOf(50)}
            x2={containerWidth - 10}
            y2={yOf(50)}
            stroke="#C9A4ED"
            strokeWidth={1.3}
            strokeDasharray="5 5"
          />
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
                const tone = getBarTone(t);
                const barH = (t / 100) * chartHeight;
                const y = yOf(t);
                const centerX = xOffset + barSlotWidth / 2;

                if (showCompare && prevT !== null) {
                  const pairWidth = Math.max(barWidth * 0.48, 28);
                  const pairGap = Math.max(barSlotWidth * 0.05, 4);
                  const pairStartX = centerX - pairWidth - pairGap / 2;
                  const prevTone = getBarTone(prevT);
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
                      {/* 1차 막대 등급 라벨 */}
                      {prevBarH > 32 && (
                        prevGrade.isTwoLine ? (
                          <>
                            <text
                              x={pairStartX + pairWidth / 2}
                              y={prevY + Math.min(prevBarH / 2 - 2, prevBarH - 18)}
                              textAnchor="middle"
                              fontSize={9}
                              fontWeight={600}
                              fill={prevTone.labelColor}
                            >
                              {prevGrade.label.slice(0, 2)}
                            </text>
                            <text
                              x={pairStartX + pairWidth / 2}
                              y={prevY + Math.min(prevBarH / 2 + 10, prevBarH - 6)}
                              textAnchor="middle"
                              fontSize={9}
                              fontWeight={600}
                              fill={prevTone.labelColor}
                            >
                              {prevGrade.label.slice(2)}
                            </text>
                          </>
                        ) : (
                          <text
                            x={pairStartX + pairWidth / 2}
                            y={prevY + Math.min(prevBarH / 2 + 4, prevBarH - 8)}
                            textAnchor="middle"
                            fontSize={9}
                            fontWeight={600}
                            fill={prevTone.labelColor}
                          >
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
                      {/* 2차 막대 등급 라벨 */}
                      {barH > 32 && (
                        currGrade.isTwoLine ? (
                          <>
                            <text
                              x={currBarX + pairWidth / 2}
                              y={y + Math.min(barH / 2 - 2, barH - 18)}
                              textAnchor="middle"
                              fontSize={9}
                              fontWeight={600}
                              fill={tone.labelColor}
                            >
                              {currGrade.label.slice(0, 2)}
                            </text>
                            <text
                              x={currBarX + pairWidth / 2}
                              y={y + Math.min(barH / 2 + 10, barH - 6)}
                              textAnchor="middle"
                              fontSize={9}
                              fontWeight={600}
                              fill={tone.labelColor}
                            >
                              {currGrade.label.slice(2)}
                            </text>
                          </>
                        ) : (
                          <text
                            x={currBarX + pairWidth / 2}
                            y={y + Math.min(barH / 2 + 4, barH - 8)}
                            textAnchor="middle"
                            fontSize={9}
                            fontWeight={600}
                            fill={tone.labelColor}
                          >
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
                            <text
                              x={centerX}
                              y={y + Math.min(barH / 2 - 2, barH - 18)}
                              textAnchor="middle"
                              fontSize={10}
                              fontWeight={600}
                              fill={tone.labelColor}
                            >
                              {grade.label.slice(0, 2)}
                            </text>
                            <text
                              x={centerX}
                              y={y + Math.min(barH / 2 + 10, barH - 6)}
                              textAnchor="middle"
                              fontSize={10}
                              fontWeight={600}
                              fill={tone.labelColor}
                            >
                              {grade.label.slice(2)}
                            </text>
                          </>
                        ) : (
                          <text
                            x={centerX}
                            y={y + Math.min(barH / 2 + 4, barH - 8)}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight={600}
                            fill={tone.labelColor}
                          >
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

export default SelfregFactorAnalysis;
