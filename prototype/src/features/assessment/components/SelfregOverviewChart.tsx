/**
 * 자기조절학습검사 종합결과 차트 (v2 - 탭 기반 레이아웃)
 *
 * - 탭: 동기전략 | 인지전략 | 행동전략 | 종합 해석
 * - 좌측: 6축 레이더 차트 (탭 전환해도 6축 전부 유지)
 * - 우측 상단: 대분류 설명 + 강점/보완 요인
 * - 우측 하단: 척도 테이블 (소분류 + 소소분류 막대 차트)
 *
 * @see 첨부 디자인 이미지 3장
 */

import { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { getDefinition } from './constants/srlDefinitions';

// ============================================================================
// 타입 정의
// ============================================================================

type Score = { t: number; percentile: number };

interface SubscaleData extends Score {
  items: Record<string, Score>;
}

interface DomainData extends Score {
  description: string;
  strengths: string[];
  weaknesses: string[];
  subscales: Record<string, SubscaleData>;
}

interface SrlReportData {
  studentName: string;
  domains: {
    motivation: DomainData;
    cognitive: DomainData;
    behavioral: DomainData;
  };
}

type DomainKey = 'motivation' | 'cognitive' | 'behavioral';

interface SelfregOverviewChartProps {
  /** 학생 이름 또는 반 이름 */
  studentName: string;
  /** 20개 요인 T점수 */
  selfregScores: number[];
  /** 반 결과 뷰인지 여부 (기본: false) */
  isClassView?: boolean;
  /** 2차 검사 데이터 있는지 여부 */
  hasRound2?: boolean;
  /** 2차 검사 점수 (있는 경우) */
  round2Scores?: number[];
  /** 외부에서 제어하는 선택된 회차 */
  selectedRound?: 1 | 2;
  /** 회차 변경 콜백 */
  onRoundChange?: (round: 1 | 2) => void;
}

// ============================================================================
// 상수 정의
// ============================================================================

/** 대분류 색상 세트 */
const DOMAIN_COLORS: Record<DomainKey, {
  primary: string;      // 진한 원색 (선택 시)
  light: string;        // 연한 톤 (비선택 시)
  veryLight: string;    // 매우 연한 배경
}> = {
  motivation: {
    primary: '#9F91F8',
    light: 'rgba(159, 145, 248, 0.35)',
    veryLight: 'rgba(159, 145, 248, 0.1)',
  },
  cognitive: {
    primary: '#4BC1FF',
    light: 'rgba(75, 193, 255, 0.35)',
    veryLight: 'rgba(75, 193, 255, 0.1)',
  },
  behavioral: {
    primary: '#FF8A94',
    light: 'rgba(255, 138, 148, 0.35)',
    veryLight: 'rgba(255, 138, 148, 0.1)',
  },
};

/** 대분류 정보 */
const DOMAIN_INFO: Record<DomainKey, {
  label: string;
  description: string;
  subscales: Array<{
    key: string;
    label: string;
    items: string[];
  }>;
}> = {
  motivation: {
    label: '동기전략',
    description: '학습하는 이유와 목적을 발견하여, 학습 지속성을 갖게 하는 마음가짐 전략입니다.',
    subscales: [
      { key: 'learningDrive', label: '학습 원동력', items: ['성장마인드셋', '학업효능감', '학습동기'] },
      { key: 'emotionRegulation', label: '정서조절', items: ['성적부담조절', '공부부담조절', '실패부담조절'] },
    ],
  },
  cognitive: {
    label: '인지전략',
    description: '학습 내용을 효과적으로 파악하고, 체계적으로 습득하도록 돕는 전략입니다.',
    subscales: [
      { key: 'metacognition', label: '메타 인지', items: ['계획능력', '점검능력', '조절능력'] },
      { key: 'cognitiveSkill', label: '인지적 학습기술', items: ['이해기술', '기억기술', '집중기술'] },
    ],
  },
  behavioral: {
    label: '행동전략',
    description: '학습 활동을 최적화될 수 있게 하는 학습기술 및 실행력 향상 전략입니다.',
    subscales: [
      { key: 'behaviorRegulation', label: '행동 조절', items: ['자기칭찬', '도움구하기', '학습지속성'] },
      { key: 'behavioralSkill', label: '행동적 학습기술', items: ['공부환경', '시간관리', '수업태도', '노트하기', '시험준비'] },
    ],
  },
};

/** 소분류 정보 (레이더 차트용) */
const SUBSCALES = {
  behaviorRegulation: { label: '행동 조절', domain: 'behavioral' as DomainKey, angle: 0 },
  behavioralSkill: { label: '행동적\n학습기술', domain: 'behavioral' as DomainKey, angle: 60 },
  learningDrive: { label: '학습 원동력', domain: 'motivation' as DomainKey, angle: 120 },
  emotionRegulation: { label: '정서조절', domain: 'motivation' as DomainKey, angle: 180 },
  metacognition: { label: '메타 인지', domain: 'cognitive' as DomainKey, angle: 240 },
  cognitiveSkill: { label: '인지적\n학습기술', domain: 'cognitive' as DomainKey, angle: 300 },
} as const;

type SubscaleKey = keyof typeof SUBSCALES;

const SUBSCALE_ORDER: SubscaleKey[] = [
  'behaviorRegulation', 'behavioralSkill', 'learningDrive',
  'emotionRegulation', 'metacognition', 'cognitiveSkill',
];

/** 외곽 링 세그먼트 */
const RING_SEGMENTS: { domain: DomainKey; startAngle: number; endAngle: number }[] = [
  { domain: 'behavioral', startAngle: 330, endAngle: 90 },
  { domain: 'motivation', startAngle: 90, endAngle: 210 },
  { domain: 'cognitive', startAngle: 210, endAngle: 330 },
];

/** 등급 구간 (T점수 기준) - 5열 균등 분할 표시용 */
const LEVEL_BANDS = [
  { label: '매우 낮음', min: 20, max: 30 },  // t <= 30 (하한 20으로 clamp)
  { label: '낮음', min: 31, max: 40 },        // 31 <= t <= 40
  { label: '보통', min: 41, max: 59 },        // 41 <= t <= 59
  { label: '높음', min: 60, max: 69 },        // 60 <= t <= 69
  { label: '매우 높음', min: 70, max: 80 },   // t >= 70 (상한 80으로 clamp)
];

/**
 * T점수 → 막대 너비 비율(0~1) 변환
 *
 * 표의 5개 등급 열은 화면에서 각각 20% 폭으로 균등 분할됨.
 * T점수 구간 폭은 균등하지 않으므로 "열 내부 비례" 방식으로 계산:
 *
 * 1) T점수가 속한 등급 밴드를 찾는다 → 그 밴드의 열 인덱스 i (0~4)
 * 2) 밴드 내부 진행률 r = (t - band.min) / (band.max - band.min + 1)
 *    - +1을 해서 경계값(30/31, 40/41 등)이 서로 다른 비율을 갖도록 함
 * 3) 막대 끝점 비율 = (i + r) / 5
 *
 * 검증 (경계값 구분):
 * - t=30 → 매우 낮음(i=0), r=10/11=0.909 → 18.2%
 * - t=31 → 낮음(i=1), r=0/10=0 → 20.0%  ← 구분됨
 * - t=50 → 보통(i=2), r=9/19=0.474 → 49.5%
 * - t=59 → 보통(i=2), r=18/19=0.947 → 58.9%
 * - t=60 → 높음(i=3), r=0/10=0 → 60.0%  ← 구분됨
 */
const getBarRatio = (t: number): number => {
  // 최소 폭 보장 (2%)
  const MIN_RATIO = 0.02;

  // T점수 clamp (20~80)
  const clampedT = Math.max(20, Math.min(80, t));

  // 등급 밴드 찾기
  for (let i = 0; i < LEVEL_BANDS.length; i++) {
    const band = LEVEL_BANDS[i];
    if (clampedT <= band.max) {
      // 밴드 내부 진행률 (0~1)
      // +1을 해서 t=max일 때 r<1이 되어 다음 밴드 r=0과 구분됨
      const bandWidth = band.max - band.min + 1;
      const r = bandWidth > 0
        ? Math.max(0, Math.min(1, (clampedT - band.min) / bandWidth))
        : 0;
      // 막대 끝점 비율
      const ratio = (i + r) / 5;
      return Math.max(MIN_RATIO, ratio);
    }
  }

  // fallback (t > 80)
  return 1;
};

/** 막대 너비(%) 반환 - getBarRatio의 wrapper */
const getBarWidth = (t: number): number => getBarRatio(t) * 100;

/** 레이더 차트 설정 */
const RADAR_CONFIG = {
  maxValue: 80,
  polygonStroke: '#F5A623',
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

const degToRad = (deg: number) => (deg * Math.PI) / 180;

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = degToRad(angleDeg);
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
};

/** 20개 요인 점수에서 소분류별 평균 계산 */
const calculateSubscaleScores = (selfregScores: number[]): Record<SubscaleKey, number> => {
  const indices: Record<SubscaleKey, number[]> = {
    learningDrive: [0, 1, 2],
    emotionRegulation: [3, 4, 5],
    metacognition: [6, 7, 8],
    cognitiveSkill: [9, 10, 11],
    behaviorRegulation: [12, 13, 14],
    behavioralSkill: [15, 16, 17, 18, 19],
  };

  const result = {} as Record<SubscaleKey, number>;
  for (const key of SUBSCALE_ORDER) {
    const idxs = indices[key];
    const sum = idxs.reduce((acc, i) => acc + (selfregScores[i] ?? 50), 0);
    result[key] = Math.round(sum / idxs.length);
  }
  return result;
};

/** T점수 → 백분위 (간이 변환) */
const tToPercentile = (t: number): number => {
  if (t >= 70) return 98;
  if (t >= 60) return 84;
  if (t >= 50) return 50;
  if (t >= 40) return 16;
  return 2;
};

/** T점수(백분위) 툴팁 콘텐츠 */
const TScoreTooltipContent = () => (
  <div className="space-y-2">
    {/* 제목 */}
    <h4 className="text-sm font-bold text-white border-b border-slate-600 pb-2">
      심리검사 점수 값 해석
    </h4>

    {/* 설명 */}
    <div className="text-xs leading-relaxed space-y-1.5">
      <p>· 심리검사 결과는 T점수와 백분위로 제공됩니다.</p>
      <p>
        1) <span className="font-semibold">T점수</span>: 평균이 50, 표준편차가 10인 점수로 전체 평균에서 어느 정도 높고 낮은지를 상대적으로 비교할 수 있습니다.
      </p>
      <p>
        2) <span className="font-semibold">백분위</span>: 전체를 100으로 볼 때, 한 개인의 점수가 아래부터 몇 번째에 해당하는지를 나타내는 수치입니다.
      </p>
      <p className="text-slate-300">
        (예: 백분위 80 : 본인보다 점수 낮은 학생이 79명, 높은 학생이 20명 있다는 것을 의미합니다.)
      </p>
    </div>
  </div>
);

/** Mock 데이터 생성 (실제는 백엔드에서 받음) */
const generateMockReportData = (studentName: string, selfregScores: number[]): SrlReportData => {
  const subscaleScores = calculateSubscaleScores(selfregScores);

  const createDomainData = (domainKey: DomainKey): DomainData => {
    const info = DOMAIN_INFO[domainKey];
    const subscaleKeys = info.subscales.map(s => s.key);

    // 대분류 점수 = 소속 소분류 평균
    const domainT = Math.round(
      subscaleKeys.reduce((sum, k) => sum + (subscaleScores[k as SubscaleKey] ?? 50), 0) / subscaleKeys.length
    );

    // 소분류 데이터 생성
    const subscalesData: Record<string, SubscaleData> = {};
    for (const sub of info.subscales) {
      const subT = subscaleScores[sub.key as SubscaleKey] ?? 50;
      const items: Record<string, Score> = {};

      // 소소분류 점수 (Mock: 소분류 점수 기반 ±10 랜덤)
      for (const itemName of sub.items) {
        const itemT = Math.max(20, Math.min(80, subT + Math.floor(Math.random() * 21) - 10));
        items[itemName] = { t: itemT, percentile: tToPercentile(itemT) };
      }

      subscalesData[sub.key] = {
        t: subT,
        percentile: tToPercentile(subT),
        items,
      };
    }

    // 강점/보완 요인 판정 (Mock: T점수 기준)
    const allItems: Array<{ name: string; t: number }> = [];
    for (const sub of info.subscales) {
      for (const itemName of sub.items) {
        allItems.push({
          name: itemName,
          t: subscalesData[sub.key].items[itemName]?.t ?? 50,
        });
      }
    }
    allItems.sort((a, b) => b.t - a.t);

    const strengths = allItems.filter(i => i.t >= 60).slice(0, 3).map(i => i.name);
    const weaknesses = allItems.filter(i => i.t < 40).slice(0, 3).map(i => i.name);

    return {
      t: domainT,
      percentile: tToPercentile(domainT),
      description: info.description,
      strengths,
      weaknesses,
      subscales: subscalesData,
    };
  };

  return {
    studentName,
    domains: {
      motivation: createDomainData('motivation'),
      cognitive: createDomainData('cognitive'),
      behavioral: createDomainData('behavioral'),
    },
  };
};

// ============================================================================
// 서브 컴포넌트
// ============================================================================

/** 탭 버튼 */
const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  color: string;
  onClick: () => void;
}> = ({ label, isActive, color, onClick }) => (
  <button
    onClick={onClick}
    className={`
      relative px-4 py-2 text-sm font-medium transition-colors
      ${isActive ? 'font-bold' : 'text-gray-400 hover:text-gray-600'}
    `}
    style={{ color: isActive ? color : undefined }}
  >
    {isActive && (
      <Check className="absolute -top-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5" style={{ color }} />
    )}
    {label}
  </button>
);

/** 레이더 차트 */
const RadarChart: React.FC<{
  subscaleScores: Record<SubscaleKey, number>;
  activeDomain: DomainKey | null;
  size?: number;
}> = ({ subscaleScores, activeDomain, size = 420 }) => {
  const center = size / 2;

  // 반지름 비율 조정: 라벨이 링 안쪽에 충분한 여백을 두고 배치되도록
  const RADIUS = {
    ringOuter: size * 0.48,
    ringInner: size * 0.43,
    label: size * 0.30,      // 라벨을 더 안쪽으로 (링과 여백 확보)
    data: size * 0.24,
  };

  // 대분류 경계 각도
  const DOMAIN_BOUNDARY_ANGLES = [90, 210, 330];

  // 데이터 폴리곤 점
  const polygonPoints = SUBSCALE_ORDER.map((key) => {
    const score = subscaleScores[key] ?? 50;
    const clampedScore = Math.max(0, Math.min(score, RADAR_CONFIG.maxValue));
    const radius = (clampedScore / RADAR_CONFIG.maxValue) * RADIUS.data;
    const point = polarToCartesian(center, center, radius, SUBSCALES[key].angle);
    return `${point.x},${point.y}`;
  }).join(' ');

  // 동심원 밴드 색상
  const RING_BANDS = [
    { min: 60, max: 80, fill: '#FFFFFF' },
    { min: 40, max: 60, fill: '#F9F9F9' },
    { min: 20, max: 40, fill: '#FFFFFF' },
    { min: 0, max: 20, fill: '#FFFFFF' },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* 배경 */}
      <circle cx={center} cy={center} r={RADIUS.ringInner} fill="#FFFFFF" />

      {/* 동심원 밴드 */}
      {RING_BANDS.map((band) => {
        const outerR = (band.max / RADAR_CONFIG.maxValue) * RADIUS.data;
        return (
          <circle
            key={`band-${band.min}-${band.max}`}
            cx={center}
            cy={center}
            r={outerR}
            fill={band.fill}
          />
        );
      })}

      {/* 동심원 경계선 */}
      {[20, 40, 60, 80].map((tick) => {
        const r = (tick / RADAR_CONFIG.maxValue) * RADIUS.data;
        return (
          <circle
            key={`grid-${tick}`}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="#E8E8E8"
            strokeWidth={1}
          />
        );
      })}

      {/* 소분류 축 라인 (연한 회색 점선) */}
      {SUBSCALE_ORDER.map((key) => {
        const info = SUBSCALES[key];
        const endPoint = polarToCartesian(center, center, RADIUS.data, info.angle);
        return (
          <line
            key={key}
            x1={center}
            y1={center}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="#E0E0E0"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        );
      })}

      {/* 대분류 경계선 (연한 회색 점선) */}
      {DOMAIN_BOUNDARY_ANGLES.map((angle) => {
        const endPoint = polarToCartesian(center, center, RADIUS.ringInner, angle);
        return (
          <line
            key={`boundary-${angle}`}
            x1={center}
            y1={center}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="#D0D0D0"
            strokeWidth={1}
            strokeDasharray="4,3"
          />
        );
      })}

      {/* 데이터 폴리곤 (채움 없음, 주황 실선) */}
      <polygon
        points={polygonPoints}
        fill="none"
        stroke={RADAR_CONFIG.polygonStroke}
        strokeWidth={2}
      />

      {/* 데이터 꼭짓점 */}
      {SUBSCALE_ORDER.map((key) => {
        const score = subscaleScores[key] ?? 50;
        const clampedScore = Math.max(0, Math.min(score, RADAR_CONFIG.maxValue));
        const radius = (clampedScore / RADAR_CONFIG.maxValue) * RADIUS.data;
        const point = polarToCartesian(center, center, radius, SUBSCALES[key].angle);
        return (
          <circle
            key={key}
            cx={point.x}
            cy={point.y}
            r={5}
            fill={RADAR_CONFIG.polygonStroke}
            stroke="#FFF"
            strokeWidth={2}
          />
        );
      })}

      {/* 외곽 링 (얇은 도넛, 선택 탭에 따라 색상 강조) */}
      {RING_SEGMENTS.map((seg) => {
        const colors = DOMAIN_COLORS[seg.domain];
        const isActive = activeDomain === seg.domain;
        const fillColor = isActive ? colors.primary : colors.light;

        const outerStart = polarToCartesian(center, center, RADIUS.ringOuter, seg.startAngle);
        const outerEnd = polarToCartesian(center, center, RADIUS.ringOuter, seg.endAngle);
        const innerStart = polarToCartesian(center, center, RADIUS.ringInner, seg.startAngle);
        const innerEnd = polarToCartesian(center, center, RADIUS.ringInner, seg.endAngle);

        const d = `
          M ${outerStart.x} ${outerStart.y}
          A ${RADIUS.ringOuter} ${RADIUS.ringOuter} 0 0 0 ${outerEnd.x} ${outerEnd.y}
          L ${innerEnd.x} ${innerEnd.y}
          A ${RADIUS.ringInner} ${RADIUS.ringInner} 0 0 1 ${innerStart.x} ${innerStart.y}
          Z
        `;
        return <path key={seg.domain} d={d} fill={fillColor} />;
      })}

      {/* 소분류 축 라벨 */}
      {SUBSCALE_ORDER.map((key) => {
        const info = SUBSCALES[key];
        const colors = DOMAIN_COLORS[info.domain];
        const isActive = activeDomain === info.domain;
        const point = polarToCartesian(center, center, RADIUS.label, info.angle);
        const lines = info.label.split('\n');

        return (
          <g key={`label-${key}`}>
            {lines.map((line, idx) => (
              <text
                key={idx}
                x={point.x}
                y={point.y + (idx - (lines.length - 1) / 2) * 14}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={15}
                fontWeight={isActive ? 700 : 500}
                fill={isActive ? colors.primary : colors.light}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
};

/** 설명 영역 */
const DescriptionSection: React.FC<{
  domainKey: DomainKey;
  domainData: DomainData;
  studentName: string;
  isClassView?: boolean;
}> = ({ domainKey, domainData, studentName, isClassView = false }) => {
  const info = DOMAIN_INFO[domainKey];
  const colors = DOMAIN_COLORS[domainKey];

  // 반 결과 뷰: "2-3반의", 학생 결과 뷰: "홍길동 학생의"
  const subjectText = isClassView ? `${studentName}의` : `${studentName}의`;

  return (
    <div className="mb-4">
      <h4 className="text-base font-bold mb-1" style={{ color: colors.primary }}>
        {info.label}이란
      </h4>
      <p className="text-sm text-gray-700 mb-2">{domainData.description}</p>

      {domainData.strengths.length > 0 && (
        <p className="text-sm text-gray-700 leading-tight">
          {subjectText} 강점 요인은{' '}
          <span className="font-semibold text-blue-600">
            {domainData.strengths.join(', ')}
          </span>{' '}
          입니다.
        </p>
      )}

      {domainData.weaknesses.length > 0 && (
        <p className="text-sm text-gray-700 leading-tight">
          {subjectText} 보완 요인은{' '}
          <span className="font-semibold text-red-500">
            {domainData.weaknesses.join(', ')}
          </span>{' '}
          입니다.
        </p>
      )}
    </div>
  );
};

/** 척도 테이블 */
const ScaleTable: React.FC<{
  domainKey: DomainKey;
  domainData: DomainData;
}> = ({ domainKey, domainData }) => {
  const info = DOMAIN_INFO[domainKey];
  const colors = DOMAIN_COLORS[domainKey];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        <div className="w-36 px-3 py-3 text-xs font-semibold text-gray-700 border-r border-gray-200">
          척도
        </div>
        <div className="flex-1 px-3 py-3 text-xs font-semibold text-gray-700 flex items-center gap-1">
          T점수(백분위)
          <InfoTooltip
            content={<TScoreTooltipContent />}
            iconSize={14}
            maxWidth={360}
          />
        </div>
      </div>

      {/* 서브헤더 (등급 구간) */}
      <div className="flex border-b border-gray-200">
        <div className="w-36 border-r border-gray-200" />
        <div className="flex-1 flex">
          {LEVEL_BANDS.map((band, idx) => (
            <div
              key={band.label}
              className={`flex-1 px-1 py-1 text-[10px] text-center text-gray-500 ${
                idx < LEVEL_BANDS.length - 1 ? 'border-r border-gray-100' : ''
              }`}
            >
              {band.label}
            </div>
          ))}
        </div>
      </div>

      {/* 소분류 + 소소분류 행 */}
      {info.subscales.map((subscale, subIdx) => {
        const subscaleData = domainData.subscales[subscale.key];
        if (!subscaleData) return null;

        return (
          <div key={subscale.key}>
            {/* 소분류 행 */}
            <div className={`flex ${subIdx > 0 ? 'border-t border-gray-200' : ''}`}>
              <div className="w-36 px-3 py-3 flex items-center gap-1 border-r border-gray-200">
                <span className="text-sm font-semibold text-gray-800">{subscale.label}</span>
                {getDefinition(subscale.label) && (
                  <InfoTooltip
                    content={getDefinition(subscale.label)!}
                    iconSize={12}
                  />
                )}
              </div>
              <div className="flex-1 relative flex items-center">
                {/* 등급 구분선 */}
                {LEVEL_BANDS.slice(0, -1).map((_, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 w-px bg-gray-100"
                    style={{ left: `${((idx + 1) * 100) / 5}%` }}
                  />
                ))}
                {/* 막대 */}
                <div className="flex-1 px-2 py-3">
                  <div className="relative h-6 bg-gray-100 rounded overflow-visible">
                    {(() => {
                      const barWidth = getBarWidth(subscaleData.t);
                      const isNarrow = barWidth < 12; // 12% 미만이면 텍스트 바깥으로
                      return (
                        <>
                          <div
                            className="absolute left-0 top-0 h-full rounded"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: colors.primary,
                            }}
                          />
                          <span
                            className="absolute top-1/2 -translate-y-1/2 text-xs font-medium whitespace-nowrap"
                            style={isNarrow ? {
                              left: `calc(${barWidth}% + 6px)`,
                              color: '#4B5563', // gray-600
                            } : {
                              left: `calc(${barWidth}% - 8px)`,
                              transform: 'translateX(-100%) translateY(-50%)',
                              color: '#fff',
                            }}
                          >
                            {subscaleData.t}({subscaleData.percentile})
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* 소소분류 행들 */}
            {subscale.items.map((itemName) => {
              const itemData = subscaleData.items[itemName];
              if (!itemData) return null;

              return (
                <div key={itemName} className="flex border-t border-gray-100">
                  <div className="w-36 px-3 py-2.5 flex items-center gap-1 border-r border-gray-200">
                    <span className="text-xs text-gray-600">· {itemName}</span>
                    {getDefinition(itemName) && (
                      <InfoTooltip
                        content={getDefinition(itemName)!}
                        iconSize={10}
                        iconClassName="text-gray-300 hover:text-gray-500"
                      />
                    )}
                  </div>
                  <div className="flex-1 relative flex items-center">
                    {/* 등급 구분선 */}
                    {LEVEL_BANDS.slice(0, -1).map((_, idx) => (
                      <div
                        key={idx}
                        className="absolute top-0 bottom-0 w-px bg-gray-50"
                        style={{ left: `${((idx + 1) * 100) / 5}%` }}
                      />
                    ))}
                    {/* 막대 */}
                    <div className="flex-1 px-2 py-2.5">
                      <div className="relative h-5 bg-gray-50 rounded overflow-visible">
                        {(() => {
                          const barWidth = getBarWidth(itemData.t);
                          const isNarrow = barWidth < 12;
                          return (
                            <>
                              <div
                                className="absolute left-0 top-0 h-full rounded"
                                style={{
                                  width: `${barWidth}%`,
                                  backgroundColor: colors.light,
                                }}
                              />
                              <span
                                className="absolute top-1/2 -translate-y-1/2 text-[10px] font-medium whitespace-nowrap"
                                style={isNarrow ? {
                                  left: `calc(${barWidth}% + 6px)`,
                                  color: '#4B5563',
                                } : {
                                  left: `calc(${barWidth}% - 6px)`,
                                  transform: 'translateX(-100%) translateY(-50%)',
                                  color: '#374151', // gray-700
                                }}
                              >
                                {itemData.t}({itemData.percentile})
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export const SelfregOverviewChart: React.FC<SelfregOverviewChartProps> = ({
  studentName,
  selfregScores,
  isClassView = false,
  hasRound2 = false,
  round2Scores,
  selectedRound: externalRound,
  onRoundChange,
}) => {
  const [activeTab, setActiveTab] = useState<DomainKey>('motivation');
  const [internalRound, setInternalRound] = useState<1 | 2>(1);

  // 외부 제어 또는 내부 상태 사용
  const selectedRound = externalRound ?? internalRound;
  const setSelectedRound = (round: 1 | 2) => {
    if (onRoundChange) {
      onRoundChange(round);
    } else {
      setInternalRound(round);
    }
  };

  // 현재 선택된 회차의 점수
  const currentScores = selectedRound === 2 && round2Scores ? round2Scores : selfregScores;

  // Mock 데이터 생성 (실제는 백엔드에서 받음)
  const reportData = useMemo(
    () => generateMockReportData(studentName, currentScores),
    [studentName, currentScores]
  );

  // 소분류 점수 (레이더 차트용)
  const subscaleScores = useMemo(
    () => calculateSubscaleScores(currentScores),
    [currentScores]
  );

  const tabs: Array<{ key: DomainKey; label: string; color: string }> = [
    { key: 'motivation', label: '동기전략', color: DOMAIN_COLORS.motivation.primary },
    { key: 'cognitive', label: '인지전략', color: DOMAIN_COLORS.cognitive.primary },
    { key: 'behavioral', label: '행동전략', color: DOMAIN_COLORS.behavioral.primary },
  ];

  const activeDomain = activeTab;

  // 표시 이름 생성
  const displayName = isClassView ? studentName : `${studentName} 학생`;
  const descriptionText = isClassView
    ? `${studentName}의 자기조절학습 관련 동기·인지·행동전략의 평균 수준을 확인합니다.`
    : `${studentName} 학생의 자기조절학습 관련 동기·인지·행동전략의 수준을 확인합니다.`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-2">종합 결과</h3>
          <p className="text-sm text-gray-600">{descriptionText}</p>
        </div>

        {/* 회차 토글 (반 결과 뷰일 때만) */}
        {isClassView && (
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedRound(1)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                selectedRound === 1
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              1차 검사
            </button>
            <button
              onClick={() => setSelectedRound(2)}
              disabled={!hasRound2}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                selectedRound === 2
                  ? 'bg-teal-600 text-white'
                  : hasRound2
                    ? 'text-gray-600 hover:bg-gray-200'
                    : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              2차 검사 {!hasRound2 && '(예정)'}
            </button>
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab, idx) => (
          <div key={tab.key} className="flex items-center">
            {idx > 0 && <span className="text-gray-300 mx-1">|</span>}
            <TabButton
              label={tab.label}
              isActive={activeTab === tab.key}
              color={tab.color}
              onClick={() => setActiveTab(tab.key)}
            />
          </div>
        ))}
      </div>

      {/* 컨텐츠 */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 좌측: 레이더 차트 (45%) */}
        <div className="flex-shrink-0 flex justify-center lg:justify-start">
          <RadarChart
            subscaleScores={subscaleScores}
            activeDomain={activeDomain}
            size={420}
          />
        </div>

        {/* 우측: 설명 + 척도 테이블 (55%, 컨테이너 끝까지) */}
        <div className="flex-1 min-w-0">
          <DescriptionSection
            domainKey={activeTab}
            domainData={reportData.domains[activeTab]}
            studentName={displayName}
            isClassView={isClassView}
          />
          <ScaleTable
            domainKey={activeTab}
            domainData={reportData.domains[activeTab]}
          />
        </div>
      </div>
    </div>
  );
};

export default SelfregOverviewChart;
