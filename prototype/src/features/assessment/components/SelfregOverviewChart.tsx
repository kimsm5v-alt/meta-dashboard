/**
 * 자기조절학습검사 종합결과 차트
 *
 * - 상단: 6축 레이더 차트 + 외곽 도넛 링 (3분할, 곡선 텍스트)
 * - 하단: 3개 전략별 카드 (도넛 게이지 + 해설문)
 *
 * 축 배치 (3시 방향 0°, 반시계 방향):
 * 0° 행동조절 / 60° 행동적학습기술 / 120° 학습원동력 / 180° 정서조절 / 240° 메타인지 / 300° 인지적학습기술
 *
 * 외곽 링 (경계각 90°/210°/330°):
 * 행동전략 330°~90° / 동기전략 90°~210° / 인지전략 210°~330°
 */

import { useMemo } from 'react';

interface SelfregOverviewChartProps {
  /** 학생 이름 */
  studentName: string;
  /** 20개 요인 T점수 (자기조절검사용으로 변환된 점수) */
  selfregScores: number[];
}

// ============================================================================
// 상수 정의
// ============================================================================

/** 대분류 (3개 전략) */
const DOMAINS = {
  motivation: {
    label: '동기전략',
    color: '#9F91F8',
    lightColor: 'rgba(159, 145, 248, 0.15)',
    characterDescription: '학습하는 이유와 목적을 발견하여, 학습 지속성을 갖게 하는 마음가짐 전략',
    factorIndices: [0, 1, 2, 3, 4, 5],
  },
  cognitive: {
    label: '인지전략',
    color: '#4AC1FF',
    lightColor: 'rgba(74, 193, 255, 0.15)',
    characterDescription: '학습 내용을 효과적으로 파악하고, 체계적으로 습득하도록 돕는 전략',
    factorIndices: [6, 7, 8, 9, 10, 11, 12, 13, 14],
  },
  behavioral: {
    label: '행동전략',
    color: '#FF8993',
    lightColor: 'rgba(255, 137, 147, 0.15)',
    characterDescription: '학습 활동을 최적화될 수 있게 하는 학습기술 및 실행력 향상 전략',
    factorIndices: [15, 16, 17, 18, 19],
  },
} as const;

type DomainKey = keyof typeof DOMAINS;

/**
 * 소분류 (6개 축) - 레이더 차트용
 * 각도: 0° = 3시 방향, 반시계 방향으로 증가
 * 같은 대분류의 두 축이 인접하도록 배치
 */
const SUBSCALES = {
  behaviorRegulation: {
    label: '행동조절',
    domain: 'behavioral' as DomainKey,
    angle: 0,
    factorIndices: [12, 13, 14],
  },
  behavioralSkill: {
    label: '행동적\n학습기술',
    domain: 'behavioral' as DomainKey,
    angle: 60,
    factorIndices: [15, 16, 17, 18, 19],
  },
  learningDrive: {
    label: '학습원동력',
    domain: 'motivation' as DomainKey,
    angle: 120,
    factorIndices: [0, 1, 2],
  },
  emotionRegulation: {
    label: '정서조절',
    domain: 'motivation' as DomainKey,
    angle: 180,
    factorIndices: [3, 4, 5],
  },
  metacognition: {
    label: '메타인지',
    domain: 'cognitive' as DomainKey,
    angle: 240,
    factorIndices: [6, 7, 8],
  },
  cognitiveSkill: {
    label: '인지적\n학습기술',
    domain: 'cognitive' as DomainKey,
    angle: 300,
    factorIndices: [9, 10, 11],
  },
} as const;

type SubscaleKey = keyof typeof SUBSCALES;

/** 소분류 순서 (각도 순, 반시계 방향) */
const SUBSCALE_ORDER: SubscaleKey[] = [
  'behaviorRegulation',   // 0°
  'behavioralSkill',      // 60°
  'learningDrive',        // 120°
  'emotionRegulation',    // 180°
  'metacognition',        // 240°
  'cognitiveSkill',       // 300°
];

/** 외곽 링 세그먼트 (경계각 90°/210°/330°) */
const RING_SEGMENTS: { domain: DomainKey; startAngle: number; endAngle: number }[] = [
  { domain: 'behavioral', startAngle: 330, endAngle: 90 },   // 330°~90° (120°)
  { domain: 'motivation', startAngle: 90, endAngle: 210 },   // 90°~210° (120°)
  { domain: 'cognitive', startAngle: 210, endAngle: 330 },   // 210°~330° (120°)
];

/** 등급별 색상 */
const LEVEL_COLORS: Record<string, string> = {
  '매우 낮음': '#FF5722',
  '낮음': '#FF9800',
  '보통': '#26C6A0',
  '높음': '#2196F3',
  '매우 높음': '#1565C0',
};

/** 레이더 차트 설정 */
const RADAR_CONFIG = {
  maxValue: 80,
  ticks: [0, 20, 40, 60, 80],
  polygonStroke: '#F5A623',
  polygonFill: 'rgba(245, 166, 35, 0.40)',
};

/** 동심원 밴드 색상 (바깥 → 안쪽 순서로 정의) */
const RING_BAND_COLORS = [
  { min: 60, max: 80, fill: '#FFFFFF' },  // 60~80: 흰색
  { min: 40, max: 60, fill: '#F7F7F7' },  // 40~60: 매우 연한 회색
  { min: 20, max: 40, fill: '#FFFFFF' },  // 20~40: 흰색
  { min: 0, max: 20, fill: '#FFFFFF' },   // 0~20: 흰색
];

// ============================================================================
// 유틸리티 함수
// ============================================================================

/** 등급 산정 */
const getLevel = (t: number): { label: string; color: string } => {
  if (t >= 70) return { label: '매우 높음', color: LEVEL_COLORS['매우 높음'] };
  if (t >= 60) return { label: '높음', color: LEVEL_COLORS['높음'] };
  if (t >= 41) return { label: '보통', color: LEVEL_COLORS['보통'] };
  if (t >= 31) return { label: '낮음', color: LEVEL_COLORS['낮음'] };
  return { label: '매우 낮음', color: LEVEL_COLORS['매우 낮음'] };
};

/** 각도 → 라디안 */
const degToRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * 극좌표 → 직교좌표
 * 0° = 3시 방향 (오른쪽), 반시계 방향으로 각도 증가
 * SVG 좌표계: y축이 아래로 증가하므로 sin에 -1을 곱함
 */
const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = degToRad(angleDeg);
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),  // SVG y축은 아래가 양수이므로 반전
  };
};

/** 소분류 점수 계산 */
const calculateSubscaleScore = (selfregScores: number[], indices: readonly number[]): number => {
  const sum = indices.reduce((acc, i) => acc + (selfregScores[i] ?? 50), 0);
  return Math.round(sum / indices.length);
};

/** 대분류 점수 계산 */
const calculateDomainScore = (selfregScores: number[], indices: readonly number[]): number => {
  const sum = indices.reduce((acc, i) => acc + (selfregScores[i] ?? 50), 0);
  return Math.round(sum / indices.length);
};

// ============================================================================
// 서브 컴포넌트
// ============================================================================

/** 도넛 게이지 */
const DonutGauge: React.FC<{
  t: number;
  percentile: number;
  size?: number;
  strokeWidth?: number;
}> = ({ t, percentile, size = 100, strokeWidth = 10 }) => {
  const level = getLevel(t);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercentile = Math.max(0, Math.min(100, percentile));
  const progress = (safePercentile / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={level.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold" style={{ color: level.color }}>
          {level.label}
        </span>
        <span className="text-sm font-semibold text-gray-700">
          {t}({percentile})
        </span>
      </div>
    </div>
  );
};

/** 전략 카드 */
const StrategyCard: React.FC<{
  domainKey: DomainKey;
  t: number;
  percentile: number;
  description: string;
}> = ({ domainKey, t, percentile, description }) => {
  const domain = DOMAINS[domainKey];

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden h-full">
      <div className="px-4 py-3 text-center" style={{ backgroundColor: domain.color }}>
        <h4 className="text-sm font-bold text-white">
          {domain.label}
        </h4>
      </div>
      <div className="flex-1 p-4 flex flex-col items-center">
        <div className="mb-4">
          <DonutGauge t={t} percentile={percentile} size={100} strokeWidth={10} />
        </div>
        <p
          className="text-sm font-bold text-gray-800 text-center mb-3"
        >
          {domain.characterDescription}
        </p>
        <p
          className="text-xs text-gray-600 text-center leading-relaxed"
          style={{ whiteSpace: 'pre-line' }}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

/** 레이더 차트 (외곽 도넛 링 + 곡선 텍스트) */
const RadarChart: React.FC<{
  subscaleScores: Record<SubscaleKey, number>;
  size?: number;
  /** 디버깅: 꼭짓점에 T점수 표시 */
  showDebugValues?: boolean;
}> = ({ subscaleScores, size = 340, showDebugValues = false }) => {
  const center = size / 2;

  // 반지름 설정 (size 기준 비율) - 한 곳에서 조절 가능
  const RADIUS = {
    ringOuter: size * 0.46,      // 외곽 링 바깥쪽
    ringInner: size * 0.38,      // 외곽 링 안쪽 (= 라벨 영역 바깥쪽)
    label: size * 0.32,          // 소분류 라벨 위치
    data: size * 0.26,           // 데이터 영역 (눈금 80 지점)
  };

  const outerRingRadius = RADIUS.ringOuter;
  const innerRingRadius = RADIUS.ringInner;
  const dataMaxRadius = RADIUS.data;
  const labelRadius = RADIUS.label;

  // 대분류 경계 각도 (90° / 210° / 330°)
  const DOMAIN_BOUNDARY_ANGLES = [90, 210, 330];

  // 디버깅: 각 소분류 T점수 출력
  if (showDebugValues) {
    console.log('=== 레이더 차트 T점수 디버깅 ===');
    console.log(`dataMaxRadius=${dataMaxRadius.toFixed(1)}, 눈금40 radius=${((40/80)*dataMaxRadius).toFixed(1)}, 눈금60 radius=${((60/80)*dataMaxRadius).toFixed(1)}`);
    SUBSCALE_ORDER.forEach((key) => {
      const score = subscaleScores[key];
      const radius = (score / RADAR_CONFIG.maxValue) * dataMaxRadius;
      console.log(`${SUBSCALES[key].label.replace('\n', '')}: T=${score}, radius=${radius.toFixed(1)}`);
    });
  }

  // 데이터 폴리곤 점 계산
  const polygonPoints = SUBSCALE_ORDER.map((key) => {
    const score = subscaleScores[key] ?? 50;
    const clampedScore = Math.max(0, Math.min(score, RADAR_CONFIG.maxValue));
    const radius = (clampedScore / RADAR_CONFIG.maxValue) * dataMaxRadius;
    const point = polarToCartesian(center, center, radius, SUBSCALES[key].angle);
    return `${point.x},${point.y}`;
  }).join(' ');

  const gridCircles = RADAR_CONFIG.ticks.filter(t => t > 0);

  // 링 중앙 반지름 (텍스트 경로용)
  const ringMidRadius = (outerRingRadius + innerRingRadius) / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* 배경: 링 안쪽 전체 (라벨 영역 = 80~100 구간 포함) */}
      <circle cx={center} cy={center} r={innerRingRadius} fill="#FFFFFF" />

      {/* 동심원 밴드 (바깥 → 안쪽 순서로 겹쳐 그리기) */}
      {RING_BAND_COLORS.map((band) => {
        const outerR = (band.max / RADAR_CONFIG.maxValue) * dataMaxRadius;
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

      {/* 밴드 경계선 (20/40/60/80 - 연한 회색 실선) */}
      {[20, 40, 60, 80].map((tick) => {
        const r = (tick / RADAR_CONFIG.maxValue) * dataMaxRadius;
        return (
          <circle
            key={`boundary-${tick}`}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="#E0E0E0"
            strokeWidth={1}
          />
        );
      })}

      {/* 소분류 축 라인 (6개, 회색 점선) - 데이터 영역까지만 */}
      {SUBSCALE_ORDER.map((key) => {
        const info = SUBSCALES[key];
        const endPoint = polarToCartesian(center, center, dataMaxRadius, info.angle);
        return (
          <line
            key={key}
            x1={center}
            y1={center}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="#D0D0D0"
            strokeWidth={1}
            strokeDasharray="3,3"
            opacity={0.6}
          />
        );
      })}

      {/* 대분류 경계선 (3개, 검정 점선) - 링 안쪽까지 */}
      {DOMAIN_BOUNDARY_ANGLES.map((angle) => {
        const endPoint = polarToCartesian(center, center, innerRingRadius, angle);
        return (
          <line
            key={`boundary-${angle}`}
            x1={center}
            y1={center}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="#333333"
            strokeWidth={1.5}
            strokeDasharray="4,3"
            opacity={0.8}
          />
        );
      })}

      {/* 데이터 폴리곤 */}
      <polygon
        points={polygonPoints}
        fill={RADAR_CONFIG.polygonFill}
        stroke={RADAR_CONFIG.polygonStroke}
        strokeWidth={2}
      />

      {/* 데이터 꼭짓점 */}
      {SUBSCALE_ORDER.map((key) => {
        const score = subscaleScores[key] ?? 50;
        const clampedScore = Math.max(0, Math.min(score, RADAR_CONFIG.maxValue));
        const radius = (clampedScore / RADAR_CONFIG.maxValue) * dataMaxRadius;
        const point = polarToCartesian(center, center, radius, SUBSCALES[key].angle);
        return (
          <g key={key}>
            <circle
              cx={point.x}
              cy={point.y}
              r={4}
              fill={RADAR_CONFIG.polygonStroke}
              stroke="#FFF"
              strokeWidth={2}
            />
            {/* 디버깅: 꼭짓점 옆에 T점수 표시 */}
            {showDebugValues && (
              <text
                x={point.x}
                y={point.y - 10}
                fontSize={8}
                fill="#333"
                textAnchor="middle"
                fontWeight={600}
              >
                {score}
              </text>
            )}
          </g>
        );
      })}

      {/* 눈금 숫자 (12시 방향 = 90° 축선 위에만 1세트, 0 포함) - 폴리곤 위 레이어 */}
      {RADAR_CONFIG.ticks.map((tick) => {
        const r = (tick / RADAR_CONFIG.maxValue) * dataMaxRadius;
        // 90° = 12시 방향, 축선 오른쪽에 배치
        const point = polarToCartesian(center, center, r, 90);
        return (
          <text
            key={tick}
            x={point.x + 6}
            y={point.y}
            fontSize={9}
            fill="#666"
            textAnchor="start"
            dominantBaseline="middle"
            style={{
              paintOrder: 'stroke',
              stroke: '#FFFFFF',
              strokeWidth: 2,
            }}
          >
            {tick}
          </text>
        );
      })}

      {/* 외곽 도넛 링 (3분할) */}
      {RING_SEGMENTS.map((seg) => {
        const domain = DOMAINS[seg.domain];
        const outerStart = polarToCartesian(center, center, outerRingRadius, seg.startAngle);
        const outerEnd = polarToCartesian(center, center, outerRingRadius, seg.endAngle);
        const innerStart = polarToCartesian(center, center, innerRingRadius, seg.startAngle);
        const innerEnd = polarToCartesian(center, center, innerRingRadius, seg.endAngle);

        // 도넛 세그먼트 경로: 외곽 호 → 내곽 끝점 → 내곽 호(역방향) → 외곽 시작점
        const d = `
          M ${outerStart.x} ${outerStart.y}
          A ${outerRingRadius} ${outerRingRadius} 0 0 0 ${outerEnd.x} ${outerEnd.y}
          L ${innerEnd.x} ${innerEnd.y}
          A ${innerRingRadius} ${innerRingRadius} 0 0 1 ${innerStart.x} ${innerStart.y}
          Z
        `;
        return <path key={seg.domain} d={d} fill={domain.color} opacity={0.9} />;
      })}

      {/* 외곽 링 대분류명 (회전 텍스트) */}
      {RING_SEGMENTS.map((seg) => {
        // 각 세그먼트의 중앙 각도 계산
        let midAngle: number;
        if (seg.domain === 'behavioral') {
          // 330°~90° (120°) → 중앙 = (330 + 90 + 360) / 2 = 390° = 30° (우상단)
          midAngle = 30;
        } else if (seg.domain === 'motivation') {
          // 90°~210° (120°) → 중앙 = 150° (좌상단)
          midAngle = 150;
        } else {
          // cognitive: 210°~330° (120°) → 중앙 = 270° (하단)
          midAngle = 270;
        }

        const point = polarToCartesian(center, center, ringMidRadius, midAngle);

        // SVG rotate()는 시계방향이 양수
        // 텍스트가 호를 따라 바깥에서 정방향으로 읽히려면:
        // - 상단 (behavioral, motivation): 텍스트 기준선이 호의 접선 방향, 위에서 아래로 읽힘
        // - 하단 (cognitive): 텍스트가 뒤집혀야 바깥에서 읽힘
        //
        // 극좌표 각도 → SVG 회전각:
        // SVG에서 0°는 3시 방향(오른쪽), 시계방향 양수
        // 우리 극좌표는 0°가 3시 방향, 반시계 방향 양수
        // 따라서 SVG 회전각 = -midAngle (부호 반전)
        //
        // 텍스트가 접선 방향으로 놓이려면 추가로 90° 회전 필요
        // 상단: 바깥에서 읽으려면 텍스트 윗면이 바깥을 향해야 함
        // 하단: 바깥에서 읽으려면 텍스트 윗면이 안쪽(중심)을 향해야 함 → 180° 추가

        let rotation: number;
        if (seg.domain === 'cognitive') {
          // 하단: 270° → SVG회전 = -270 + 90 + 180 = 0°
          rotation = -midAngle + 90 + 180;
        } else {
          // 상단 (behavioral, motivation): 바깥에서 읽히도록
          // behavioral: 30° → SVG회전 = -30 + 90 = 60°
          // motivation: 150° → SVG회전 = -150 + 90 = -60°
          rotation = -midAngle + 90;
        }

        return (
          <text
            key={`text-${seg.domain}`}
            x={point.x}
            y={point.y}
            fill="#FFFFFF"
            fontSize={12}
            fontWeight={700}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${rotation}, ${point.x}, ${point.y})`}
          >
            {DOMAINS[seg.domain].label}
          </text>
        );
      })}

      {/* 소분류 축 라벨 (데이터 영역 바깥, 링 안쪽 사이 여백) */}
      {SUBSCALE_ORDER.map((key) => {
        const info = SUBSCALES[key];
        const domain = DOMAINS[info.domain];
        // labelRadius는 상단에서 계산됨 (dataMaxRadius * 1.18)
        const point = polarToCartesian(center, center, labelRadius, info.angle);
        const lines = info.label.split('\n');
        return (
          <g key={`label-${key}`}>
            {lines.map((line, idx) => (
              <text
                key={idx}
                x={point.x}
                y={point.y + (idx - (lines.length - 1) / 2) * 11}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fontWeight={600}
                fill={domain.color}
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

// ============================================================================
// 메인 컴포넌트
// ============================================================================

/** 등급별 해설문 생성 (백엔드에서 오기 전 임시) */
const generateDescription = (domainKey: DomainKey, t: number): string => {
  const level = getLevel(t);
  const domainLabel = DOMAINS[domainKey].label;

  if (domainKey === 'motivation') {
    if (level.label === '매우 낮음' || level.label === '낮음') {
      return `${domainLabel}이 ${level.label} 수준입니다. 학습동기와 공부 자신감을 키울 수 있도록 선생님 등 주변에 도움을 요청하면서 공부하는 나만의 이유와 목적을 찾기 위해 노력하는 것이 필요합니다.`;
    }
    if (level.label === '보통') {
      return `${domainLabel}이 ${level.label} 수준입니다. 학습에 대한 동기와 자신감이 적절한 수준이며, 조금 더 명확한 학습 목표를 설정하면 더 좋은 결과를 얻을 수 있습니다.`;
    }
    return `${domainLabel}이 ${level.label} 수준입니다. 학습에 대한 동기와 자신감이 높아 학습을 지속할 수 있는 좋은 마음가짐을 갖추고 있습니다.`;
  }

  if (domainKey === 'cognitive') {
    if (level.label === '매우 낮음' || level.label === '낮음') {
      return `${domainLabel}이 ${level.label} 수준입니다. 학습 계획을 세우고, 학습 내용을 점검하며, 공부 습관을 개선하는 메타인지 학습 능력을 키울 필요가 있습니다.`;
    }
    if (level.label === '보통') {
      return `${domainLabel}이 ${level.label} 수준입니다. 기본적인 학습 전략을 갖추고 있으며, 메타인지 학습을 더 강화하면 학습 효과를 높일 수 있습니다.`;
    }
    return `${domainLabel}이 ${level.label} 수준에 속합니다. 학습 효과를 높이기 위해 계획을 세우고, 학습한 내용을 점검하며, 개선이 필요한 공부습관은 바꾸는 메타인지 학습을 적절하게 수행합니다.`;
  }

  // behavioral
  if (level.label === '매우 낮음' || level.label === '낮음') {
    return `${domainLabel}이 ${level.label} 수준입니다. 노트필기, 수업듣기, 시간관리 등의 학습기술을 보완하고, 학습을 지속하려는 실행력을 높일 필요가 있습니다.`;
  }
  if (level.label === '보통') {
    return `${domainLabel}이 ${level.label} 수준입니다. 학습활동과 직접적으로 관련된 노트필기, 수업듣기, 시간관리 등의 학습기술을 조금 더 보완하고, 학습을 지속하려는 실행력을 높일 필요가 있습니다.`;
  }
  return `${domainLabel}이 ${level.label} 수준입니다. 학습활동에 필요한 학습기술과 실행력이 잘 갖춰져 있어 효과적인 학습이 가능합니다.`;
};

export const SelfregOverviewChart: React.FC<SelfregOverviewChartProps> = ({
  studentName,
  selfregScores,
}) => {
  // 소분류 점수 계산
  const subscaleScores = useMemo(() => {
    const scores: Record<SubscaleKey, number> = {} as Record<SubscaleKey, number>;
    for (const key of SUBSCALE_ORDER) {
      scores[key] = calculateSubscaleScore(selfregScores, SUBSCALES[key].factorIndices);
    }
    return scores;
  }, [selfregScores]);

  // 대분류 점수 및 백분위 계산
  const domainResults = useMemo(() => {
    const results: Record<DomainKey, { t: number; percentile: number; description: string }> =
      {} as Record<DomainKey, { t: number; percentile: number; description: string }>;

    for (const key of Object.keys(DOMAINS) as DomainKey[]) {
      const t = calculateDomainScore(selfregScores, DOMAINS[key].factorIndices);
      const percentile = Math.min(99, Math.max(0, Math.round(t * 0.9 + 10)));
      const description = generateDescription(key, t);
      results[key] = { t, percentile, description };
    }

    return results;
  }, [selfregScores]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-teal-500 rounded-full" />
          <h3 className="text-base font-bold text-gray-900">종합결과</h3>
        </div>
        <p className="text-sm text-gray-600">
          아래 그래프는 <span className="font-semibold text-gray-800">{studentName}</span>님의
          자기조절학습 관련 동기·인지·행동전략의 수준을 설명하고 있습니다. 아래 내용을 확인하면서
          부족한 점은 보완하고, 보통 영역 이상의 부분은 더욱 강화한다면 자기조절학습 능력을 향상시킬
          수 있을 것입니다.
        </p>
      </div>

      {/* 레이더 차트 */}
      <div className="flex justify-center mb-2">
        <RadarChart subscaleScores={subscaleScores} size={340} showDebugValues={false} />
      </div>

      {/* 범례 */}
      <div className="flex justify-end mb-4">
        <span className="text-xs text-gray-400">T점수(백분위)</span>
      </div>

      {/* 3개 전략 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['motivation', 'cognitive', 'behavioral'] as DomainKey[]).map((domainKey) => (
          <StrategyCard
            key={domainKey}
            domainKey={domainKey}
            t={domainResults[domainKey].t}
            percentile={domainResults[domainKey].percentile}
            description={domainResults[domainKey].description}
          />
        ))}
      </div>
    </div>
  );
};

export default SelfregOverviewChart;
