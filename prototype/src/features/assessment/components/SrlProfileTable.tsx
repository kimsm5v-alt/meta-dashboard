/**
 * 자기조절학습검사 프로파일 테이블
 *
 * - T점수 10~90 선형 눈금 (탭 테이블의 5등급 균등분할과 다름)
 * - 대분류 종합 행: 가로 막대
 * - 소소분류 행: 점 + 연결선 (대분류 단위로 끊김)
 * - 보통 구간(T 41~59) 세로 밴드 배경
 *
 * @see 첨부 디자인 이미지
 */

import { useMemo, useRef, useEffect, useState } from 'react';
import {
  SELFREG_FACTOR_DEFINITIONS,
  SELFREG_DOMAIN_COLORS,
  type SelfregCategory,
} from '@/shared/data/selfregFactors';

// ============================================================================
// 타입 정의
// ============================================================================

interface SessionData {
  round: number;
  scores: number[];
}

type ViewMode = 'round1' | 'round2';

interface SrlProfileTableProps {
  /** 20개 요인 T점수 (현재 회차) */
  selfregScores: number[];
  /** 회차별 점수 배열 (1차, 2차, ...) */
  sessions?: SessionData[];
  /** 보기 모드: round1 = 1차만, round2 = 1차 회색선 + 2차 막대/숫자 */
  viewMode?: ViewMode;
}

// ============================================================================
// 상수 정의
// ============================================================================

/** 대분류 정보 */
const DOMAIN_INFO: Record<SelfregCategory, {
  label: string;
  color: string;
  /** 소속 소소분류 인덱스 (종합 행 제외) */
  factorIndices: number[];
}> = {
  '동기전략': {
    label: '동기전략',
    color: SELFREG_DOMAIN_COLORS['동기전략'],
    factorIndices: [0, 1, 2, 3, 4, 5],
  },
  '인지전략': {
    label: '인지전략',
    color: SELFREG_DOMAIN_COLORS['인지전략'],
    factorIndices: [6, 7, 8, 9, 10, 11],
  },
  '행동전략': {
    label: '행동전략',
    color: SELFREG_DOMAIN_COLORS['행동전략'],
    factorIndices: [12, 13, 14, 15, 16, 17, 18, 19],
  },
};

/** 행 순서 정의 */
const ROW_ORDER: Array<{
  type: 'summary' | 'factor';
  domain: SelfregCategory;
  factorIndex?: number;
  label: string;
}> = [
  // 동기전략
  { type: 'summary', domain: '동기전략', label: '종합' },
  { type: 'factor', domain: '동기전략', factorIndex: 0, label: '성장마인드셋' },
  { type: 'factor', domain: '동기전략', factorIndex: 1, label: '학업효능감' },
  { type: 'factor', domain: '동기전략', factorIndex: 2, label: '학습동기' },
  { type: 'factor', domain: '동기전략', factorIndex: 3, label: '성적부담조절' },
  { type: 'factor', domain: '동기전략', factorIndex: 4, label: '공부부담조절' },
  { type: 'factor', domain: '동기전략', factorIndex: 5, label: '실패부담조절' },
  // 인지전략
  { type: 'summary', domain: '인지전략', label: '종합' },
  { type: 'factor', domain: '인지전략', factorIndex: 6, label: '계획능력' },
  { type: 'factor', domain: '인지전략', factorIndex: 7, label: '점검능력' },
  { type: 'factor', domain: '인지전략', factorIndex: 8, label: '조절능력' },
  { type: 'factor', domain: '인지전략', factorIndex: 9, label: '이해기술' },
  { type: 'factor', domain: '인지전략', factorIndex: 10, label: '기억기술' },
  { type: 'factor', domain: '인지전략', factorIndex: 11, label: '집중기술' },
  // 행동전략
  { type: 'summary', domain: '행동전략', label: '종합' },
  { type: 'factor', domain: '행동전략', factorIndex: 12, label: '자기칭찬' },
  { type: 'factor', domain: '행동전략', factorIndex: 13, label: '도움구하기' },
  { type: 'factor', domain: '행동전략', factorIndex: 14, label: '학습지속성' },
  { type: 'factor', domain: '행동전략', factorIndex: 15, label: '공부환경' },
  { type: 'factor', domain: '행동전략', factorIndex: 16, label: '시간관리' },
  { type: 'factor', domain: '행동전략', factorIndex: 17, label: '수업태도' },
  { type: 'factor', domain: '행동전략', factorIndex: 18, label: '노트하기' },
  { type: 'factor', domain: '행동전략', factorIndex: 19, label: '시험준비' },
];

/** 등급 구간 (상단 라벨용) - T점수 0~100 기준, 연속 구간으로 표시 */
const LEVEL_BANDS = [
  { label: '매우 낮음', min: 0, max: 30 },
  { label: '낮음', min: 30, max: 40 },
  { label: '보통', min: 40, max: 60 },
  { label: '높음', min: 60, max: 70 },
  { label: '매우 높음', min: 70, max: 100 },
];

/** 눈금 값 (표시 범위 0~100, 0과 100은 표시 안 함) */
const TICK_VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90];

/** 행 높이 (px) - 고정값 (SVG 오버레이 계산용) */
const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 56; // 헤더 2줄 높이

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * T점수 → 선형 위치(%) 변환
 * 0~100 범위를 0~100%로 매핑
 */
const getLinearPosition = (t: number): number => {
  const clamped = Math.max(0, Math.min(100, t));
  return clamped;
};

/** 보통 구간 (T점수 40~60) */
const NORMAL_BAND = { min: 40, max: 60 };

/**
 * 대분류별 종합 점수 계산
 * ⚠️ 실제로는 백엔드에서 제공하는 값을 사용해야 함 (평균 아님)
 * 여기서는 Mock으로 하위 요인 평균 사용
 */
const calculateDomainSummary = (scores: number[], domain: SelfregCategory): number => {
  const indices = DOMAIN_INFO[domain].factorIndices;
  const sum = indices.reduce((acc, idx) => acc + (scores[idx] ?? 50), 0);
  return Math.round(sum / indices.length);
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export const SrlProfileTable: React.FC<SrlProfileTableProps> = ({
  selfregScores,
  sessions = [],
  viewMode = 'round1',
}) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [chartAreaWidth, setChartAreaWidth] = useState(0);

  // 차트 영역 너비 측정
  useEffect(() => {
    const updateWidth = () => {
      if (chartAreaRef.current) {
        setChartAreaWidth(chartAreaRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 1차 점수
  const round1Scores = sessions.length > 0 ? sessions[0].scores : selfregScores;
  // 2차 점수 (있으면)
  const round2Scores = sessions.length > 1 ? sessions[1].scores : undefined;

  // viewMode에 따른 표시 데이터 결정
  // round1: 1차 데이터만 표시
  // round2: 1차 프로파일 라인(회색) + 2차 막대/숫자 표시
  const displayScores = viewMode === 'round2' && round2Scores ? round2Scores : round1Scores;
  const showRound2Data = viewMode === 'round2' && round2Scores;

  // 대분류별 종합 점수 (현재 표시 기준)
  const domainSummaries = useMemo(() => ({
    '동기전략': calculateDomainSummary(displayScores, '동기전략'),
    '인지전략': calculateDomainSummary(displayScores, '인지전략'),
    '행동전략': calculateDomainSummary(displayScores, '행동전략'),
  }), [displayScores]);

  // 1차 대분류별 종합 점수 (변화 계산용)
  const round1DomainSummaries = useMemo(() => ({
    '동기전략': calculateDomainSummary(round1Scores, '동기전략'),
    '인지전략': calculateDomainSummary(round1Scores, '인지전략'),
    '행동전략': calculateDomainSummary(round1Scores, '행동전략'),
  }), [round1Scores]);

  // 대분류별 행 범위 계산 (세로 병합용)
  const domainRowSpans = useMemo(() => {
    const spans: Record<SelfregCategory, { start: number; count: number }> = {
      '동기전략': { start: 0, count: 0 },
      '인지전략': { start: 0, count: 0 },
      '행동전략': { start: 0, count: 0 },
    };
    let currentDomain: SelfregCategory | null = null;
    ROW_ORDER.forEach((row, idx) => {
      if (row.domain !== currentDomain) {
        currentDomain = row.domain;
        spans[row.domain].start = idx;
      }
      spans[row.domain].count++;
    });
    return spans;
  }, []);

  // 소분류별 행 범위 계산 (세로 병합용)
  const subCategorySpans = useMemo(() => {
    // 동기전략: 학습원동력(3) + 정서조절(3)
    // 인지전략: 메타인지(3) + 인지적학습기술(3)
    // 행동전략: 행동조절(3) + 행동적학습기술(5)
    return {
      '동기전략': [
        { label: '학습 원동력', count: 3 },
        { label: '정서조절', count: 3 },
      ],
      '인지전략': [
        { label: '메타 인지', count: 3 },
        { label: '인지적 학습기술', count: 3 },
      ],
      '행동전략': [
        { label: '행동 조절', count: 3 },
        { label: '행동적 학습기술', count: 5 },
      ],
    };
  }, []);

  // 프로파일 라인 생성 함수
  const generateProfileLines = (scores: number[]) => {
    const lines: Array<{
      domain: SelfregCategory;
      points: Array<{ x: number; y: number; t: number }>;
    }> = [];

    (['동기전략', '인지전략', '행동전략'] as SelfregCategory[]).forEach(domain => {
      const factorRows = ROW_ORDER
        .map((row, idx) => ({ ...row, rowIndex: idx }))
        .filter(row => row.domain === domain && row.type === 'factor');

      const points = factorRows.map(row => {
        const t = scores[row.factorIndex!] ?? 50;
        const x = getLinearPosition(t);
        // y = 행 중앙 위치 (헤더 높이 + 행 인덱스 * 행 높이 + 행 높이/2)
        const y = HEADER_HEIGHT + row.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
        return { x, y, t };
      });

      lines.push({ domain, points });
    });

    return lines;
  };

  // 1차 프로파일 라인 (round2 모드에서 회색으로 표시)
  const round1ProfileLines = useMemo(() => generateProfileLines(round1Scores), [round1Scores]);

  // 2차 프로파일 라인 (round2 모드에서 컬러로 표시)
  const round2ProfileLines = useMemo(() => {
    if (!round2Scores) return [];
    return generateProfileLines(round2Scores);
  }, [round2Scores]);

  // 프로파일 라인 (표시용 - round1에서는 1차 컬러, round2에서는 2차 컬러)
  const profileLines = useMemo(() => {
    if (viewMode === 'round1') {
      return round1ProfileLines;
    }
    // round2 모드에서는 2차 데이터로 컬러 라인 표시
    return round2ProfileLines;
  }, [viewMode, round1ProfileLines, round2ProfileLines]);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div ref={tableRef} className="relative">
        {/* 테이블 */}
        <table className="w-full border-collapse">
          <thead>
            {/* 헤더 1: 등급 라벨 */}
            <tr className="border-b border-gray-200">
              {/* 영역 열 (3열 병합 + 2행 병합) */}
              <th
                colSpan={3}
                rowSpan={2}
                className="px-2 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 text-center align-middle"
              >
                영역
              </th>
              {/* 등급 라벨 구간 - 표시 범위 0~100 */}
              <th className="bg-gray-50 border-r border-gray-200 p-0">
                <div className="flex h-7">
                  {LEVEL_BANDS.map((band, idx) => {
                    // 0~100 범위에서 각 등급이 차지하는 비율 계산
                    const width = band.max - band.min;

                    return (
                      <div
                        key={band.label}
                        className={`flex items-center justify-center text-[10px] text-gray-500 ${
                          idx < LEVEL_BANDS.length - 1 ? 'border-r border-gray-100' : ''
                        }`}
                        style={{ width: `${width}%` }}
                      >
                        {band.label}
                      </div>
                    );
                  })}
                </div>
              </th>
              {/* 회차 열 (2행 병합) */}
              <th rowSpan={2} className="w-14 px-2 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 text-center align-middle">
                1차
              </th>
              <th rowSpan={2} className="w-14 px-2 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 text-center align-middle">
                2차
              </th>
              <th rowSpan={2} className="w-14 px-2 py-2 text-xs font-semibold text-gray-700 bg-gray-50 text-center align-middle">
                변화
              </th>
            </tr>
            {/* 헤더 2: 눈금 숫자 - 경계선 위치에 배치 */}
            <tr className="border-b border-gray-200">
              <th className="bg-gray-50 border-r border-gray-200 p-0">
                <div className="relative h-5">
                  {TICK_VALUES.map((tick) => (
                    <div
                      key={tick}
                      className="absolute top-0 bottom-0 flex items-center justify-center text-[10px] text-gray-400"
                      style={{
                        left: `${getLinearPosition(tick)}%`,
                        transform: 'translateX(-50%)',
                      }}
                    >
                      {tick}
                    </div>
                  ))}
                </div>
              </th>
            </tr>
          </thead>

          {/* 바디 */}
          <tbody>
            {ROW_ORDER.map((row, rowIdx) => {
              const domainInfo = DOMAIN_INFO[row.domain];
              const isFirstOfDomain = domainRowSpans[row.domain].start === rowIdx;
              const isSummaryRow = row.type === 'summary';

              // 소분류 세로 병합 계산
              let showSubCategory = false;
              let subCategoryRowSpan = 0;
              let subCategoryLabel = '';

              if (!isSummaryRow) {
                const subCats = subCategorySpans[row.domain];
                let offset = 1; // 종합 행 다음부터
                for (const sc of subCats) {
                  const startIdx = domainRowSpans[row.domain].start + offset;
                  if (rowIdx === startIdx) {
                    showSubCategory = true;
                    subCategoryRowSpan = sc.count;
                    subCategoryLabel = sc.label;
                    break;
                  }
                  offset += sc.count;
                }
              }

              // T점수 (현재 표시 데이터 기준)
              const tScore = isSummaryRow
                ? domainSummaries[row.domain]
                : (displayScores[row.factorIndex!] ?? 50);

              // 1차 T점수 (변화 계산용)
              const round1TScore = isSummaryRow
                ? round1DomainSummaries[row.domain]
                : (round1Scores[row.factorIndex!] ?? 50);

              // 2차 T점수
              const round2TScore = round2Scores
                ? (isSummaryRow
                    ? calculateDomainSummary(round2Scores, row.domain)
                    : (round2Scores[row.factorIndex!] ?? 0))
                : undefined;

              return (
                <tr
                  key={rowIdx}
                  className={`border-b border-gray-200 ${isSummaryRow ? 'bg-gray-50' : ''}`}
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* 대분류 열 (세로 병합) - w-20(80px) * 1.2 = w-24(96px) */}
                  {isFirstOfDomain && (
                    <td
                      rowSpan={domainRowSpans[row.domain].count}
                      className="w-24 px-2 py-1 text-xs font-bold text-white text-center border-r border-gray-200 align-middle"
                      style={{ backgroundColor: domainInfo.color }}
                    >
                      {domainInfo.label}
                    </td>
                  )}

                  {/* 소분류 열 (세로 병합) / 종합 행은 2열 병합 */}
                  {isSummaryRow ? (
                    <td
                      colSpan={2}
                      className="px-2 py-1 text-xs font-semibold text-gray-700 bg-white border-r border-gray-200 text-center"
                    >
                      종합
                    </td>
                  ) : (
                    <>
                      {/* 소분류 열 - w-20(80px) * 1.5 = w-[120px], 폰트 +2pt = text-[13px] */}
                      {showSubCategory && (
                        <td
                          rowSpan={subCategoryRowSpan}
                          className="w-[120px] px-2 py-1 text-[13px] text-gray-600 bg-white border-r border-gray-200 text-center align-middle"
                        >
                          {subCategoryLabel}
                        </td>
                      )}
                      {/* 소소분류 열 - w-20(80px) * 1.3 = w-[104px] */}
                      <td className="w-[104px] px-2 py-1 text-xs text-gray-700 bg-white border-r border-gray-200 text-center">
                        {row.label}
                      </td>
                    </>
                  )}

                  {/* 차트 영역 */}
                  <td
                    ref={rowIdx === 0 ? chartAreaRef : undefined}
                    className="relative border-r border-gray-200 p-0"
                  >
                    {/* 보통 구간 배경 (종합 행 제외) */}
                    {!isSummaryRow && (
                      <div
                        className="absolute top-0 bottom-0 bg-gray-200/60"
                        style={{
                          left: `${getLinearPosition(NORMAL_BAND.min)}%`,
                          width: `${getLinearPosition(NORMAL_BAND.max) - getLinearPosition(NORMAL_BAND.min)}%`,
                        }}
                      />
                    )}

                    {/* 종합 행: 가로 막대 */}
                    {isSummaryRow && (
                      <div className="absolute inset-y-1 left-0" style={{ width: `${getLinearPosition(tScore)}%` }}>
                        <div
                          className="h-full rounded-r"
                          style={{ backgroundColor: domainInfo.color }}
                        />
                      </div>
                    )}
                  </td>

                  {/* 1차 점수 */}
                  <td className="w-14 px-2 py-1 text-xs text-center border-r border-gray-200">
                    <span className={isSummaryRow ? 'font-bold' : ''}>{round1TScore}</span>
                  </td>

                  {/* 2차 점수 */}
                  <td className="w-14 px-2 py-1 text-xs text-center border-r border-gray-200">
                    {showRound2Data && round2TScore !== undefined ? (
                      <span className={isSummaryRow ? 'font-bold text-gray-900' : 'text-gray-900'}>
                        {round2TScore}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  {/* 변화 */}
                  <td className="w-14 px-2 py-1 text-xs text-center">
                    {showRound2Data && round2TScore !== undefined ? (
                      (() => {
                        const diff = round2TScore - round1TScore;
                        if (diff === 0) return <span className="text-gray-400">-</span>;
                        return (
                          <span className={diff > 0 ? 'text-blue-600 font-medium' : 'text-red-500 font-medium'}>
                            {diff > 0 ? '▲' : '▼'}{diff > 0 ? '+' : ''}{diff}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 프로파일 라인 SVG 오버레이 */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            // 3열 너비: 대분류(96px) + 소분류(120px) + 소소분류(104px) = 320px
            left: 320,
            top: HEADER_HEIGHT,
            width: chartAreaWidth,
            height: ROW_ORDER.length * ROW_HEIGHT,
          }}
        >
          {/* round2 모드: 1차 프로파일 라인을 진한 회색으로 표시 */}
          {viewMode === 'round2' && round1ProfileLines.map(({ domain, points }) => {
            if (points.length === 0) return null;

            // 연결선 경로
            const pathD = points
              .map((p, idx) => {
                const x = (p.x / 100) * chartAreaWidth;
                const y = p.y - HEADER_HEIGHT;
                return idx === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              })
              .join(' ');

            return (
              <g key={`round1-${domain}`}>
                {/* 연결선 (연한 회색 실선) */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 점 마커 (연한 회색) */}
                {points.map((p, idx) => {
                  const x = (p.x / 100) * chartAreaWidth;
                  const y = p.y - HEADER_HEIGHT;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r={3.5}
                      fill="#D1D5DB"
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* round1 모드: 컬러 프로파일 라인 표시 */}
          {profileLines.map(({ domain, points }) => {
            const color = DOMAIN_INFO[domain].color;
            if (points.length === 0) return null;

            // 연결선 경로
            const pathD = points
              .map((p, idx) => {
                const x = (p.x / 100) * chartAreaWidth;
                const y = p.y - HEADER_HEIGHT;
                return idx === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              })
              .join(' ');

            return (
              <g key={domain}>
                {/* 연결선 */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 점 마커 */}
                {points.map((p, idx) => {
                  const x = (p.x / 100) * chartAreaWidth;
                  const y = p.y - HEADER_HEIGHT;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r={5}
                      fill={color}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default SrlProfileTable;
