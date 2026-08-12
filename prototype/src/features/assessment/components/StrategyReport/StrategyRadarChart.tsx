/**
 * 학습전략검사 레이더 차트 컴포넌트
 *
 * - 6축, 60° 간격. 화면 오른쪽(3시)을 0°로 두고 반시계 방향
 * - 눈금: 0~80, 20 단위 동심원(원형 그리드)
 * - 외곽 링: 도넛 3분할, 각 120°
 * - 소분류 축 라벨은 링 안쪽, 글자색 = 소속 대분류 색상
 */

import { useMemo } from 'react';
import { DOMAIN_INFO, SUBSCALE_INFO, RING_SEGMENTS, RADAR_CONFIG } from './constants/strategy';
import type { ReportData, SubscaleKey } from './types';

interface StrategyRadarChartProps {
  /** 소분류 6개 점수 */
  subscales: ReportData['subscales'];
  /** 차트 크기 (px) */
  size?: number;
}

// 각도를 라디안으로 변환
const degToRad = (deg: number) => (deg * Math.PI) / 180;

// 극좌표 -> 직교좌표 (0° = 3시 방향, 반시계 방향)
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleDeg: number
) => {
  // 반시계 방향이므로 각도 부호 반전
  const rad = degToRad(-angleDeg);
  return {
    x: centerX + radius * Math.cos(rad),
    y: centerY - radius * Math.sin(rad),
  };
};

// 호(arc) 경로 생성
const describeArc = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  largeArcFlag: boolean = false
) => {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const arcFlag = largeArcFlag ? 1 : 0;
  // 반시계 방향이므로 sweep-flag = 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${arcFlag} 0 ${end.x} ${end.y}`;
};

// 소분류 키 순서 (각도 순)
const SUBSCALE_ORDER: SubscaleKey[] = [
  'behaviorRegulation',   // 0°
  'behavioralSkill',      // 60°
  'learningDrive',        // 120°
  'emotionRegulation',    // 180°
  'metacognition',        // 240°
  'cognitiveSkill',       // 300°
];

export const StrategyRadarChart: React.FC<StrategyRadarChartProps> = ({
  subscales,
  size = 340,
}) => {
  const center = size / 2;
  const outerRingRadius = size * 0.46;  // 외곽 링 반지름
  const innerRingRadius = size * 0.38;  // 링 안쪽 (레이더 영역)
  const dataMaxRadius = innerRingRadius * 0.95;  // 데이터 폴리곤 최대 반지름

  // 데이터 폴리곤 점 계산
  const polygonPoints = useMemo(() => {
    return SUBSCALE_ORDER.map((key) => {
      const info = SUBSCALE_INFO[key];
      const score = subscales[key]?.t ?? 0;
      // T점수 80 초과 케이스: clamp 처리 (축 상한 고정)
      const clampedScore = Math.min(score, RADAR_CONFIG.maxValue);
      const radius = (clampedScore / RADAR_CONFIG.maxValue) * dataMaxRadius;
      const point = polarToCartesian(center, center, radius, info.angle);
      return `${point.x},${point.y}`;
    }).join(' ');
  }, [subscales, center, dataMaxRadius]);

  // 동심원 그리드 점 (6각형이 아닌 원형)
  const gridCircles = RADAR_CONFIG.ticks.filter(t => t > 0);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
    >
      <defs>
        {/* 중심부 그라데이션 */}
        <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFDE7" />
          <stop offset="100%" stopColor="#F5F5F5" />
        </radialGradient>

        {/* 외곽 링 텍스트 경로 */}
        {RING_SEGMENTS.map((seg) => {
          const midRadius = (outerRingRadius + innerRingRadius) / 2;

          // 텍스트가 읽기 쉽도록 호 방향 조정
          // 아래쪽(90~270°)은 텍스트가 뒤집히지 않도록 반대 방향으로
          let pathStartAngle = seg.startAngle + 15;
          let pathEndAngle = seg.endAngle - 15;

          // behavioral (330~90): 정상 방향
          // motivation (90~210): 뒤집힘 방지 필요
          // cognitive (210~330): 뒤집힘 방지 필요
          const needsReverse = seg.domain !== 'behavioral';

          if (needsReverse) {
            [pathStartAngle, pathEndAngle] = [pathEndAngle, pathStartAngle];
          }

          const d = describeArc(center, center, midRadius, pathStartAngle, pathEndAngle, false);

          return (
            <path
              key={`textPath-${seg.domain}`}
              id={`textPath-${seg.domain}`}
              d={d}
              fill="none"
            />
          );
        })}
      </defs>

      {/* 배경 원 (중심 그라데이션) */}
      <circle
        cx={center}
        cy={center}
        r={innerRingRadius}
        fill="url(#centerGradient)"
      />

      {/* 동심원 그리드 (원형) */}
      {gridCircles.map((tick) => {
        const r = (tick / RADAR_CONFIG.maxValue) * dataMaxRadius;
        return (
          <circle
            key={tick}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="#E0E0E0"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        );
      })}

      {/* 축 라인 (6개) */}
      {SUBSCALE_ORDER.map((key) => {
        const info = SUBSCALE_INFO[key];
        const endPoint = polarToCartesian(center, center, innerRingRadius, info.angle);
        return (
          <line
            key={key}
            x1={center}
            y1={center}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="#E0E0E0"
            strokeWidth={1}
          />
        );
      })}

      {/* 눈금 숫자 (90° 축선 위, 정중앙 상단) */}
      {RADAR_CONFIG.ticks.map((tick) => {
        const r = (tick / RADAR_CONFIG.maxValue) * dataMaxRadius;
        const point = polarToCartesian(center, center, r, 90);
        return (
          <text
            key={tick}
            x={point.x + 8}
            y={point.y}
            fontSize={9}
            fill="#9E9E9E"
            dominantBaseline="middle"
          >
            {tick}
          </text>
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
        const info = SUBSCALE_INFO[key];
        const score = subscales[key]?.t ?? 0;
        const clampedScore = Math.min(score, RADAR_CONFIG.maxValue);
        const radius = (clampedScore / RADAR_CONFIG.maxValue) * dataMaxRadius;
        const point = polarToCartesian(center, center, radius, info.angle);
        return (
          <circle
            key={key}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={RADAR_CONFIG.polygonStroke}
            stroke="#FFF"
            strokeWidth={2}
          />
        );
      })}

      {/* 외곽 링 (3분할 도넛) */}
      {RING_SEGMENTS.map((seg) => {
        const domainInfo = DOMAIN_INFO[seg.domain];

        // 호 경로 (외곽)
        const outerStart = polarToCartesian(center, center, outerRingRadius, seg.startAngle);
        const outerEnd = polarToCartesian(center, center, outerRingRadius, seg.endAngle);
        const innerStart = polarToCartesian(center, center, innerRingRadius, seg.startAngle);
        const innerEnd = polarToCartesian(center, center, innerRingRadius, seg.endAngle);

        // 도넛 세그먼트 경로
        const d = `
          M ${outerStart.x} ${outerStart.y}
          A ${outerRingRadius} ${outerRingRadius} 0 0 0 ${outerEnd.x} ${outerEnd.y}
          L ${innerEnd.x} ${innerEnd.y}
          A ${innerRingRadius} ${innerRingRadius} 0 0 1 ${innerStart.x} ${innerStart.y}
          Z
        `;

        return (
          <path
            key={seg.domain}
            d={d}
            fill={domainInfo.color}
            opacity={0.9}
          />
        );
      })}

      {/* 외곽 링 대분류 텍스트 */}
      {RING_SEGMENTS.map((seg) => {
        return (
          <text
            key={`text-${seg.domain}`}
            fill="#FFFFFF"
            fontSize={13}
            fontWeight={700}
          >
            <textPath
              href={`#textPath-${seg.domain}`}
              startOffset="50%"
              textAnchor="middle"
            >
              {DOMAIN_INFO[seg.domain].label}
            </textPath>
          </text>
        );
      })}

      {/* 소분류 축 라벨 */}
      {SUBSCALE_ORDER.map((key) => {
        const info = SUBSCALE_INFO[key];
        const domainInfo = DOMAIN_INFO[info.domain];
        const labelRadius = innerRingRadius - 28;
        const point = polarToCartesian(center, center, labelRadius, info.angle);

        // 줄바꿈 처리
        const lines = info.label.split('\n');

        return (
          <g key={`label-${key}`}>
            {lines.map((line, idx) => (
              <text
                key={idx}
                x={point.x}
                y={point.y + (idx - (lines.length - 1) / 2) * 12}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={600}
                fill={domainInfo.color}
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

export default StrategyRadarChart;
