/**
 * ProfileLineChart - HSJ Dashboard comp-charts.jsx에서 포팅
 * 38개 요인 또는 11개 중분류의 꺾은선 프로파일 차트
 *
 * 표 레이아웃 (행 = 요인):
 * - 대분류(1뎁스, 색상 블록 + 세로 병합)
 * - 중분류(2뎁스, 세로 병합)
 * - 소분류(3뎁스, 요인명) - 요인 38개 또는 중분류 11개
 * - 꺾은선 차트 영역 - T점수 위치에 점, 같은 대분류끼리 선 연결
 * - 점수 (현재 차수 T점수)
 * - 변화 (2차 보고 있고 1차 데이터 있으면 △ 표시, polarity 반영)
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { FACTOR_DEFINITIONS, DOMAIN_GROUPS } from '@/shared/data/factors';
import { SELFREG_DOMAIN_STRUCTURE, SELFREG_DOMAIN_COLORS, SELFREG_DOMAIN_SOFT_COLORS } from '@/shared/data/selfregFactors';

type TestId = 'comprehensive' | 'selfreg';

// 학습종합검사 대분류 정보 (정책서 기준 색상)
const AREA_META: Record<string, { color: string; colorSoft: string; polarity: 'positive' | 'negative' }> = {
  '자아강점': { color: '#00D282', colorSoft: '#E6FBF3', polarity: 'positive' },
  '학습디딤돌': { color: '#4BC1FF', colorSoft: '#E8F7FF', polarity: 'positive' },
  '긍정적공부마음': { color: '#67A7FF', colorSoft: '#EDF4FF', polarity: 'positive' },
  '학습걸림돌': { color: '#FF849F', colorSoft: '#FFF0F3', polarity: 'negative' },
  '부정적공부마음': { color: '#FF87D4', colorSoft: '#FFF0FA', polarity: 'negative' },
};

// 자기조절학습검사 대분류 정보 (모두 positive)
const SELFREG_AREA_META: Record<string, { color: string; colorSoft: string; polarity: 'positive' | 'negative' }> = {
  '동기전략': { color: SELFREG_DOMAIN_COLORS['동기전략'], colorSoft: SELFREG_DOMAIN_SOFT_COLORS['동기전략'], polarity: 'positive' },
  '인지전략': { color: SELFREG_DOMAIN_COLORS['인지전략'], colorSoft: SELFREG_DOMAIN_SOFT_COLORS['인지전략'], polarity: 'positive' },
  '행동전략': { color: SELFREG_DOMAIN_COLORS['행동전략'], colorSoft: SELFREG_DOMAIN_SOFT_COLORS['행동전략'], polarity: 'positive' },
};

// 대분류 순서
const AREA_ORDER = ['자아강점', '학습디딤돌', '긍정적공부마음', '학습걸림돌', '부정적공부마음'];
const SELFREG_AREA_ORDER = ['동기전략', '인지전략', '행동전략'];

interface ProfileLineChartProps {
  /** 요인별/중분류별 평균 T점수 */
  scores: Record<string, number>;
  /** 이전 차수 점수 (변화량 표시용) */
  prevScores?: Record<string, number> | null;
  /** 'factor' (38개/20개) | 'category' (11개/6개) */
  level: 'factor' | 'category';
  /** 현재 차수 번호 */
  sessionNo: number;
  /** 요인 행 클릭 핸들러 */
  onFactorClick?: (id: string, name: string) => void;
  /** 검사 유형: 학습종합 / 자기조절 */
  testId?: TestId;
}

// 컨테이너 너비 측정 훅
function useMeasureWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);

  useEffect(() => {
    let rafId = 0;
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const next = Math.round(el.getBoundingClientRect().width);
      setWidth(prev => (Math.abs(next - prev) > 2 ? next : prev));
    };
    measure();
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return [ref, width] as const;
}

export const ProfileLineChart: React.FC<ProfileLineChartProps> = ({
  scores,
  prevScores = null,
  level = 'factor',
  sessionNo = 1,
  onFactorClick,
  testId = 'comprehensive',
}) => {
  const [wrapRef, containerW] = useMeasureWidth();

  // 현재 테스트 유형에 맞는 메타 정보
  const currentAreaMeta = testId === 'selfreg' ? SELFREG_AREA_META : AREA_META;

  // 행 데이터 구성 (대분류/중분류/요인 그룹핑)
  const items = useMemo(() => {
    const result: Array<{
      id: string;
      name: string;
      area: string;
      areaIdx: number;
      cat: string;
      catIdx: number;
      t: number;
      prev: number | null;
    }> = [];

    if (testId === 'selfreg') {
      // 자기조절학습검사: SELFREG_DOMAIN_STRUCTURE 사용
      SELFREG_DOMAIN_STRUCTURE.forEach((domain, areaIdx) => {
        const area = domain.id;
        domain.subCategories.forEach((subCat, catIdx) => {
          if (level === 'factor') {
            // 20개 요인 모드
            subCat.factors.forEach(f => {
              result.push({
                id: f.name,
                name: f.name,
                area,
                areaIdx,
                cat: subCat.name,
                catIdx,
                t: scores[f.name] ?? 50,
                prev: prevScores ? (prevScores[f.name] ?? null) : null,
              });
            });
          } else {
            // 6개 중분류 모드
            result.push({
              id: subCat.name,
              name: subCat.name,
              area,
              areaIdx,
              cat: subCat.name,
              catIdx,
              t: scores[subCat.name] ?? 50,
              prev: prevScores ? (prevScores[subCat.name] ?? null) : null,
            });
          }
        });
      });
    } else {
      // 학습종합검사: DOMAIN_GROUPS 사용
      const sortedGroups = [...DOMAIN_GROUPS].sort((a, b) => {
        const aIdx = AREA_ORDER.indexOf(a.domain);
        const bIdx = AREA_ORDER.indexOf(b.domain);
        return aIdx - bIdx;
      });

      sortedGroups.forEach((group, areaIdx) => {
        const area = group.domain;
        group.subCategories.forEach((cat, catIdx) => {
          if (level === 'factor') {
            // 38개 요인 모드
            const factors = FACTOR_DEFINITIONS.filter(f => f.subCategory === cat);
            factors.forEach(f => {
              result.push({
                id: f.name,
                name: f.name,
                area,
                areaIdx,
                cat,
                catIdx,
                t: scores[f.name] ?? scores[`factor_${f.index}`] ?? 50,
                prev: prevScores ? (prevScores[f.name] ?? prevScores[`factor_${f.index}`] ?? null) : null,
              });
            });
          } else {
            // 11개 중분류 모드
            result.push({
              id: cat,
              name: cat,
              area,
              areaIdx,
              cat,
              catIdx,
              t: scores[cat] ?? 50,
              prev: prevScores ? (prevScores[cat] ?? null) : null,
            });
          }
        });
      });
    }

    return result;
  }, [scores, prevScores, level, testId]);

  // 컬럼 geometry
  const areaW = 78;
  const catW = 104;
  const nameW = level === 'factor' ? 110 : 0;
  const scoreW = 46;
  const changeW = 54;
  const labelW = areaW + catW + nameW;
  const headerH = 34;
  const rowH = 28;
  const W = Math.max(620, containerW);
  const chartX = labelW;
  const chartW = W - labelW - scoreW - changeW;
  const tMin = 10;
  const tMax = 90;

  const xOf = (t: number) => chartX + ((Math.max(tMin, Math.min(tMax, t)) - tMin) / (tMax - tMin)) * chartW;
  const totalH = headerH + items.length * rowH + 6;
  const yOfRow = (i: number) => headerH + i * rowH;

  // 대분류 병합 셀 영역 계산
  const areaRuns = useMemo(() => {
    const runs: Array<{ start: number; end: number }> = [];
    let start = 0;
    for (let i = 1; i <= items.length; i++) {
      if (i === items.length || items[i].area !== items[start].area) {
        runs.push({ start, end: i - 1 });
        start = i;
      }
    }
    return runs;
  }, [items]);

  // 중분류 병합 셀 영역 계산
  const catRuns = useMemo(() => {
    const runs: Array<{ start: number; end: number }> = [];
    let start = 0;
    for (let i = 1; i <= items.length; i++) {
      if (i === items.length || items[i].cat !== items[start].cat) {
        runs.push({ start, end: i - 1 });
        start = i;
      }
    }
    return runs;
  }, [items]);

  // 대분류별 연결선 세그먼트 (containerW 변경 시 좌표 재계산)
  const segments = useMemo(() => {
    // xOf 함수를 클로저로 캡처하지 않고 직접 계산
    const calcX = (t: number) => chartX + ((Math.max(tMin, Math.min(tMax, t)) - tMin) / (tMax - tMin)) * chartW;

    return areaRuns.map(run => {
      const pts: Array<{ x: number; y: number; color: string }> = [];
      for (let i = run.start; i <= run.end; i++) {
        const item = items[i];
        const meta = currentAreaMeta[item.area];
        pts.push({
          x: calcX(item.t),
          y: yOfRow(i) + rowH / 2,
          color: meta?.color || '#666',
        });
      }
      return pts;
    });
  }, [items, areaRuns, chartX, chartW, tMin, tMax, rowH, currentAreaMeta]);

  // 보통 등급 밴드 (40-60)
  const grayBand = { from: 40, to: 60 };

  return (
    <div ref={wrapRef} className="overflow-x-auto">
      <svg width={W} height={totalH} className="block">
        {/* 보통 등급 회색 밴드 */}
        <rect
          x={xOf(grayBand.from)}
          y={0}
          width={xOf(grayBand.to) - xOf(grayBand.from)}
          height={totalH}
          fill="#F2F3F5"
        />

        {/* 헤더: 등급 라벨 + 눈금 숫자 */}
        <g>
          {[
            { l: '매우 낮음', c: 20 },
            { l: '낮음', c: 35 },
            { l: '보통', c: 50 },
            { l: '높음', c: 65 },
            { l: '매우 높음', c: 80 },
          ].map(b => (
            <text
              key={b.l}
              x={xOf(b.c)}
              y={13}
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="700"
              fill="#71717A"
            >
              {b.l}
            </text>
          ))}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(t => (
            <text key={t} x={xOf(t)} y={27} textAnchor="middle" fontSize="9" fill="#A1A1A8">
              {t}
            </text>
          ))}
          <text
            x={labelW + chartW + scoreW / 2}
            y={20}
            textAnchor="middle"
            fontSize="11"
            fontWeight="800"
            fill="#3F3F46"
          >
            {sessionNo}차
          </text>
          <text
            x={labelW + chartW + scoreW + changeW / 2}
            y={20}
            textAnchor="middle"
            fontSize="11"
            fontWeight="800"
            fill="#3F3F46"
          >
            변화
          </text>
        </g>

        {/* 등급 경계선 (30, 40, 60, 70) */}
        {[30, 40, 60, 70].map(t => (
          <line
            key={'gb' + t}
            x1={xOf(t)}
            y1={headerH}
            x2={xOf(t)}
            y2={totalH}
            stroke="#D4D4D8"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}

        {/* 행 구분선 */}
        {items.map((_, i) => (
          <line
            key={i}
            x1={areaW + catW}
            y1={yOfRow(i)}
            x2={W}
            y2={yOfRow(i)}
            stroke="#EFEFF1"
            strokeWidth="0.8"
          />
        ))}

        {/* 중분류 경계선 */}
        {catRuns.slice(1).map((run, i) => (
          <line
            key={'cb' + i}
            x1={0}
            y1={yOfRow(run.start)}
            x2={areaW + catW}
            y2={yOfRow(run.start)}
            stroke="#EFEFF1"
            strokeWidth="0.8"
          />
        ))}

        {/* 클릭 가능한 행 영역 (factor 모드) */}
        {level === 'factor' &&
          onFactorClick &&
          items.map((it, i) => (
            <rect
              key={'hit' + i}
              x={0}
              y={yOfRow(i)}
              width={W}
              height={rowH}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={() => onFactorClick(it.id, it.name)}
            >
              <title>{`${it.name} · 클릭하여 학생별 점수 보기`}</title>
            </rect>
          ))}

        <line x1={0} y1={totalH} x2={W} y2={totalH} stroke="#E5E5E7" />

        {/* 대분류 병합 셀 */}
        {areaRuns.map((run, i) => {
          const area = items[run.start].area;
          const meta = currentAreaMeta[area];
          const y0 = yOfRow(run.start);
          const y1 = yOfRow(run.end + 1);
          const cy = (y0 + y1) / 2;

          // 긴 이름 줄바꿈
          const WRAP: Record<string, string[]> = {
            학습디딤돌: ['학습', '디딤돌'],
            긍정적공부마음: ['긍정적', '공부마음'],
            학습걸림돌: ['학습', '걸림돌'],
            부정적공부마음: ['부정적', '공부마음'],
          };
          const lines = WRAP[area] || [area];

          return (
            <g key={'a' + i}>
              <rect x={0} y={y0} width={areaW} height={y1 - y0} fill={meta?.colorSoft || '#f5f5f5'} />
              <rect x={0} y={y0} width={3} height={y1 - y0} fill={meta?.color || '#666'} />
              <text
                x={areaW / 2 + 1}
                y={cy - (lines.length > 1 ? 7 : 0)}
                textAnchor="middle"
                fontSize="12"
                fontWeight="800"
                fill={meta?.color || '#666'}
              >
                {lines.map((ln, li) => (
                  <tspan key={li} x={areaW / 2 + 1} dy={li === 0 ? 0 : 14}>
                    {ln}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* 중분류 병합 셀 */}
        {catRuns.map((run, i) => {
          const cat = items[run.start].cat;
          const y0 = yOfRow(run.start);
          const y1 = yOfRow(run.end + 1);
          const cy = (y0 + y1) / 2;

          return (
            <g key={'c' + i}>
              <line x1={areaW} y1={y0} x2={areaW} y2={y1} stroke="#E5E5E7" />
              <text
                x={areaW + catW / 2}
                y={cy + 4}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight="700"
                fill="#52525B"
              >
                {cat}
              </text>
            </g>
          );
        })}
        <line x1={areaW + catW} y1={headerH} x2={areaW + catW} y2={totalH} stroke="#E5E5E7" />

        {/* 요인명 (factor 모드) */}
        {level === 'factor' &&
          items.map((it, i) => (
            <text
              key={'n' + i}
              x={areaW + catW + 10}
              y={yOfRow(i) + rowH / 2 + 4}
              fontSize="11.5"
              fill="#3F3F46"
            >
              {it.name}
            </text>
          ))}
        {level === 'factor' && (
          <line x1={labelW} y1={headerH} x2={labelW} y2={totalH} stroke="#E5E5E7" />
        )}

        {/* 연결선 */}
        {segments.map((pts, si) => {
          if (pts.length < 2) return null;
          const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
          return <path key={si} d={path} fill="none" stroke={pts[0].color} strokeWidth="2" />;
        })}

        {/* 점 */}
        {items.map((it, i) => {
          const meta = currentAreaMeta[it.area];
          return (
            <circle
              key={'d' + i}
              cx={xOf(it.t)}
              cy={yOfRow(i) + rowH / 2}
              r="4"
              fill={meta?.color || '#666'}
              stroke="#fff"
              strokeWidth="1.5"
            >
              <title>{`${it.name} T ${it.t}`}</title>
            </circle>
          );
        })}

        {/* 점수 컬럼 */}
        <line x1={labelW + chartW} y1={0} x2={labelW + chartW} y2={totalH} stroke="#E5E5E7" />
        {items.map((it, i) => (
          <text
            key={'s' + i}
            x={labelW + chartW + scoreW / 2}
            y={yOfRow(i) + rowH / 2 + 4}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="#27272A"
          >
            {it.t}
          </text>
        ))}

        {/* 변화 컬럼 */}
        <line
          x1={labelW + chartW + scoreW}
          y1={0}
          x2={labelW + chartW + scoreW}
          y2={totalH}
          stroke="#E5E5E7"
        />
        {items.map((it, i) => {
          if (it.prev == null) {
            return (
              <text
                key={'ch' + i}
                x={labelW + chartW + scoreW + changeW / 2}
                y={yOfRow(i) + rowH / 2 + 4}
                textAnchor="middle"
                fontSize="11"
                fill="#D4D4D8"
              >
                –
              </text>
            );
          }
          const d = it.t - it.prev;
          const meta = currentAreaMeta[it.area];
          const isNeg = meta?.polarity === 'negative';
          const good = isNeg ? d < 0 : d > 0;
          const color = d === 0 ? '#A1A1A8' : good ? '#2ECC71' : '#E74C3C';
          return (
            <text
              key={'ch' + i}
              x={labelW + chartW + scoreW + changeW / 2}
              y={yOfRow(i) + rowH / 2 + 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill={color}
            >
              {d > 0 ? '▲' : d < 0 ? '▼' : '–'}
              {d !== 0 ? Math.abs(d) : ''}
            </text>
          );
        })}
      </svg>

      {/* 안내 캡션 */}
      <div className="mt-3 px-2 py-2 bg-gray-50 rounded-lg text-xs text-gray-600 flex items-center gap-4">
        {testId === 'selfreg' ? (
          <span>
            <strong className="text-gray-700">참고!</strong> 자기조절학습검사의 모든 요인은{' '}
            <strong>정적 요인</strong>으로, 점수가 <strong>높을수록</strong> 좋습니다.
          </span>
        ) : (
          <span>
            <strong className="text-gray-700">참고!</strong> 학습걸림돌 · 부정적공부마음은{' '}
            <strong>부적 요인</strong>으로, 점수가 <strong>낮을수록</strong> 좋습니다.
          </span>
        )}
        <span className="text-gray-400">|</span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="text-green-500">▲</span> 긍정적 변화
          </span>
          <span className="flex items-center gap-1">
            <span className="text-red-500">▼</span> 부정적 변화
          </span>
        </span>
      </div>
    </div>
  );
};

export default ProfileLineChart;
